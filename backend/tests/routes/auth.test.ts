import request from "supertest";
import app from "../../src/index";
import { prisma } from "../../src/utils/prisma";

const testUser = {
  email: "ci_test@example.com",
  password: "Password123!",
  username: "ci_tester",
};

// Starting Fastify app in "test mode", making sure routes and plugins are loaded before any request is made
beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await prisma.$connect();
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
  await prisma.$disconnect();
  await app.close();
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
    expect(res.body).toHaveProperty("username", testUser.username);
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

  it("POST /api/register with an existing username should fail", async () => {
    // create a first user
    await request(app.server).post("/api/register").send(testUser).expect(201);

    // attempt to create a different user with the same username
    const other = {
      email: "other@example.com",
      password: "Password123!",
      username: testUser.username,
    };
    const res = await request(app.server)
      .post("/api/register")
      .send(other)
      .expect(400);

    expect(res.body).toHaveProperty("error");
    expect(res.body.error).toMatch(/username/i);
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

  it("POST /api/register with a short password should fail", async () => {
    const userWithShortPassword = {
      email: "shortpass@example.com",
      password: "123",
      username: "dammy",
    };
    const res = await request(app.server)
      .post("/api/register")
      .send(userWithShortPassword)
      .expect(400);
    expect(res.body.error).toBe("Bad Request");
    expect(res.body.message).toMatch(/password/i);
  });

  it("GET /api/profile should return 401 for expired token", async () => {
    // Create user + token with 1-second expiration
    await request(app.server).post("/api/register").send(testUser);

    // Find the user we just created to get their actual ID
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
    });

    // Now, sign a token with the REAL user ID and a short expiration
    const token = app.jwt.sign({ sub: user!.id }, { expiresIn: "1s" });

    // Wait for token to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));

    const res = await request(app.server)
      .get("/api/profile")
      .set("Cookie", [`token=${token}`])
      .expect(401);

    expect(res.body).toHaveProperty("error", "Unauthorized");
  });

  it("GET /api/profile should also accept Authorization header", async () => {
    // Register + login user to get JWT token directly
    await request(app.server).post("/api/register").send(testUser);
    const loginRes = await request(app.server)
      .post("/api/login")
      .send(testUser)
      .expect(200);

    const { accessToken } = loginRes.body;

    // Use Authorization Bearer token instead of cookie
    const res = await request(app.server)
      .get("/api/users/me")
      .set("Authorization", `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("email", testUser.email);
    expect(res.body.email).toBe(testUser.email);
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

  it("POST /api/login with a missing password should fail", async () => {
    const playload = { email: testUser.email };
    const res = await request(app.server)
      .post("/api/login")
      .send(playload)
      .expect(400);

    expect(res.body.message).toMatch(/password/i);
  });

  it("POST /api/login/player2 should allow a second user to log in", async () => {
    const player2 = {
      email: "player2@example.com",
      password: "Password123!",
      username: "Player2",
    };
    await request(app.server).post("/api/register").send(player2).expect(201);

    const result = await request(app.server)
      .post("/api/login/player2")
      .set("Cookie", cookie)
      .send(player2);

    expect(result.status).toBe(200);
    const setCookieHeader = result.headers["set-cookie"];
    const cookieString = setCookieHeader.find((c: string) =>
      c.startsWith("player2_token="),
    );
    const token = cookieString?.split(";")[0].split("=")[1]; // token value
    expect(token).toBeDefined();
  });

  it("POST /api/login/player2 without logged in to the app should fail", async () => {
    const player2 = { email: "player2@example.com", password: "Password123!" };
    const result = await request(app.server)
      .post("/api/login/player2")
      .send(player2);

    expect(result.status).toBe(401);
    expect(result.body.error).toBeDefined();
  });

  it("POST /api/login/player2 with invalid credentials should fail", async () => {
    const player2 = { email: "player2@example.com", password: "Invalid!" };
    const result = await request(app.server)
      .post("/api/login/player2")
      .set("Cookie", cookie)
      .send(player2);

    expect(result.status).toBe(401);
    expect(result.body.error).toBeDefined();
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
      const user = {
        email: "ghost@example.com",
        password: "Password123!",
        username: "ghostuser",
      };
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

    it("GET /api/profile with an invalid cookie should be unauthorized", async () => {
      const fakeToken = "this.is.a.fake.token";
      const res = await request(app.server)
        .get("/api/profile")
        .set("Cookie", `token=${fakeToken}`)
        .expect(401);

      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("POST /api/logout should clear the cookie", async () => {
      const res = await request(app.server)
        .post("/api/logout")
        .set("Cookie", authenticatedCookie)
        .expect(200);

      expect(res.body).toHaveProperty("ok", true);
    });

    it("GET /api/profile should reject malformed JWT", async () => {
      const malformedToken = "abc.def.ghi";
      const res = await request(app.server)
        .get("/api/profile")
        .set("Cookie", [`token=${malformedToken}`])
        .expect(401);

      expect(res.body).toHaveProperty("error", "Unauthorized");
    });

    it("POST /api/logout should expire cookie immediately", async () => {
      // Register + login user to get cookie
      await request(app.server).post("/api/register").send(testUser);
      const loginRes = await request(app.server)
        .post("/api/login")
        .send(testUser)
        .expect(200);

      const cookie = loginRes.headers["set-cookie"];

      // Logout
      const logoutRes = await request(app.server)
        .post("/api/logout")
        .set("Cookie", cookie)
        .expect(200);

      expect(logoutRes.body).toEqual({ ok: true });
      const setCookieHeader = logoutRes.headers["set-cookie"][0];
      expect(setCookieHeader).toMatch(/token=;/); // token cleared
      expect(setCookieHeader).toMatch(/Expires=/); // expired date present
    });
  });
});
