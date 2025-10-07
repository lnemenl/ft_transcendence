import request from "supertest";
import { PrismaClient } from "@prisma/client";
import app from "../index";

// Mock the prisma utility module BEFORE any other imports that might use it.
// This tells Jest: "Any time a file tries to import from '../utils/prisma',
// give them this new, test-specific instance of PrismaClient instead."
jest.mock("../utils/prisma", () => ({
  __esModule: true,
  prisma: new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  }),
}));

// Now, we can import the mocked instance to use in our setup/teardown
import { prisma } from "../utils/prisma";

const testUser = { email: "ci_test@example.com", password: "Password123!" };

beforeAll(async () => {
  // The console log is no longer needed but is safe to keep
  console.log("DATABASE_URL in test:", process.env.DATABASE_URL);

  // Connect the test-specific prisma client
  await prisma.$connect();

  // Ensure the app is ready before running queries
  await app.ready();

  // This will now work because 'prisma' is the correct, connected client
  await prisma.user.deleteMany({ where: { email: testUser.email } });
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: testUser.email } });
  await app.close();
  await prisma.$disconnect();
});

describe("Auth cookie-based flow", () => {
  let cookie: string[] = [];

  it("registers user", async () => {
    const res = await request(app.server)
      .post("/api/register")
      .send(testUser)
      .expect(201);
    expect(res.body).toHaveProperty("email", testUser.email);
    expect(res.body).not.toHaveProperty("password");
  });

  it("logs in and sets cookie", async () => {
    const res = await request(app.server)
      .post("/api/login")
      .send(testUser)
      .expect(200);

    cookie = res.headers["set-cookie"];
    expect(cookie).toBeDefined();
    expect(res.body).toHaveProperty("accessToken");
  });

  it("accesses protected route using cookie", async () => {
    const res = await request(app.server)
      .get("/api/profile")
      .set("Cookie", cookie)
      .expect(200);
    expect(res.body).toHaveProperty("user");
    expect(res.body.user).toHaveProperty("email", testUser.email);
  });

  it("blocks without cookie", async () => {
    await request(app.server).get("/api/profile").expect(401);
  });
});
