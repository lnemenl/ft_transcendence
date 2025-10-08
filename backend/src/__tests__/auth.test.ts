import request from "supertest";
import app from "../index";
import { prisma } from "../utils/prisma";
import * as authService from "../services/auth.service";

const testUser = { email: "ci_test@example.com", password: "Password123!" };

// Starting Fastify app in "test mode", making sure routes and plugins are loaded before any request is made
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await app.ready();
});

// Runs BEFORE EACH individual test case (each "it" block), ensures database isolation
// Every test starts with a clean state, no leftover users from previous runs
beforeEach(async () => {
  // Clean the database to ensure complete test isolation
  await prisma.user.deleteMany({});
});

// Runs ONCE after all tests, cleans up the DB, closes the F. instance, Disconnects Prisma
afterAll(async () => {
  await prisma.user.deleteMany({}); // Final cleanup
  await app.close();
  await prisma.$disconnect();
});

describe("Authentication flow (cookie-based JWT)", () => {
  let cookie: string[] = [];

  // --- Server health check ---
  it("GET / should return hello message", async () => {
    const res = await request(app.server).get("/");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("hello", "auth-service");
  });

  // --- Registration Flow ---
  it("POST /api/register should create a new user", async () => {
    const res = await request(app.server)
      .post("/api/register")
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty("email", testUser.email);
    expect(res.body).not.toHaveProperty("password");
  });

  it("POST /api/register with an existing email should fail", async () => {
    // 1. Create the user first so it exists in the DB for this test
    await request(app.server).post("/api/register").send(testUser).expect(201);

    // 2. Now, try to register again with the same email
    const res = await request(app.server)
      .post("/api/register")
      .send(testUser)
      .expect(400);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/exists/i);
  });

  it("POST /api/register with a missing password should fail", async () => {
    const res = await request(app.server)
      .post("/api/register")
      .send({ email: "anotheruser@example.com" }) // No password
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });

  it("POST /api/register with an invalid email should fail", async () => {
    const res = await request(app.server)
      .post("/api/register")
      .send({ email: "not-a-valid-email", password: "Password123!" })
      .expect(400);

    expect(res.body).toHaveProperty("error");
  });

  it("handles registerUser internal error gracefully", async () => {
    jest
      .spyOn(authService, "registerUser")
      .mockRejectedValueOnce(new Error("Simulated failure"));

    const res = await request(app.server)
      .post("/api/register")
      .send({ email: "fail@example.com", password: "Password123!" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Simulated failure");
    jest.restoreAllMocks();
  });

  // --- Login Flow ---
  it("POST /api/login with valid credentials should succeed", async () => {
    // 1. Register the user so we can log in
    await request(app.server).post("/api/register").send(testUser).expect(201);

    // 2. Log in
    const res = await request(app.server)
      .post("/api/login")
      .send(testUser)
      .expect(200);

    cookie = res.headers["set-cookie"];
    expect(cookie).toBeDefined();
    expect(res.body).toHaveProperty("accessToken");
  });

  it("POST /api/login with wrong password should fail", async () => {
    await request(app.server).post("/api/register").send(testUser).expect(201);

    const res = await request(app.server)
      .post("/api/login")
      .send({ email: testUser.email, password: "WrongPassword!" })
      .expect(401);

    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(res.body).toHaveProperty("error", "Invalid email or password");
  });

  it("POST /api/login with a non-existent user should fail", async () => {
    const res = await request(app.server)
      .post("/api/login")
      .send({ email: "nouser@example.com", password: "Password123!" })
      .expect(401);

    expect(res.headers["set-cookie"]).toBeUndefined();
    expect(res.body).toHaveProperty("error", "Invalid email or password");
  });

  // --- Protected Route and Logout Flow ---
  describe("when authenticated", () => {
    let authenticatedCookie: string[];

    // Before each test in this "authenticated" block, register and log in the user
    beforeEach(async () => {
      await request(app.server)
        .post("/api/register")
        .send(testUser)
        .expect(201);
      const res = await request(app.server)
        .post("/api/login")
        .send(testUser)
        .expect(200);
      authenticatedCookie = res.headers["set-cookie"];
    });

    it("GET /api/profile without cookie should be unauthorized", async () => {
      const res = await request(app.server).get("/api/profile").expect(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("GET /api/profile should return 404 when user is missing", async () => {
      // Log in normally to get cookie
      const user = { email: "ghost@example.com", password: "Password123!" };
      await request(app.server).post("/api/register").send(user);
      const loginRes = await request(app.server).post("/api/login").send(user);
      const cookie = loginRes.headers["set-cookie"];

      // Manually delete the user to simulate non-existent record
      await prisma.user.deleteMany({ where: { email: user.email } });

      const res = await request(app.server)
        .get("/api/profile")
        .set("Cookie", cookie);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "User not found");
    });

    it("GET /api/profile with a valid cookie should return user info", async () => {
      const res = await request(app.server)
        .get("/api/profile")
        .set("Cookie", authenticatedCookie)
        .expect(200);

      expect(res.body).toHaveProperty("user");
      expect(res.body.user).toHaveProperty("email", testUser.email);
    });

    it("POST /api/logout should clear the cookie", async () => {
      const res = await request(app.server)
        .post("/api/logout")
        .set("Cookie", authenticatedCookie)
        .expect(200);

      expect(res.body).toHaveProperty("ok", true);
    });
  });
});
