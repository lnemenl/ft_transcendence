import request from "supertest";
import app from "../index";
import { prisma } from "../utils/prisma";
import { User } from "@prisma/client";

describe("User Profile Endpoints", () => {
  let user1Cookie: string[];
  let user1: User;
  let user2: User;

  // beforeAll should ONLY be used for setting up the app instance
  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    await app.ready();
  });

  // Use beforeEach to ensure a clean database and fresh test data for every single test
  // This prevents tests from interfering with each other
  beforeEach(async () => {
    // 1. Clean the database
    await prisma.user.deleteMany({});

    // 2. Create and log in user1 for this specific test
    const user1Data = { email: "user1@example.com", password: "Password123!" };
    await request(app.server).post("/api/register").send(user1Data);
    const loginRes = await request(app.server)
      .post("/api/login")
      .send(user1Data);
    user1Cookie = loginRes.headers["set-cookie"];
    user1 = (await prisma.user.findUnique({
      where: { email: user1Data.email },
    }))!;

    // 3. Create user2 for this specific test
    const user2Data = { email: "user2@example.com", password: "Password123!" };
    await request(app.server).post("/api/register").send(user2Data);
    user2 = (await prisma.user.findUnique({
      where: { email: user2Data.email },
    }))!;
  });

  // afterAll cleans up once all tests in this file are done.
  afterAll(async () => {
    await prisma.user.deleteMany({});
    await app.close();
    await prisma.$disconnect();
  });

  // tests for GET /api/users/me
  describe("GET /api/users/me", () => {
    it("should fail with 401 if not authenticated", async () => {
      await request(app.server).get("/api/users/me").expect(401);
    });

    it("should return the profile of the currently logged-in user", async () => {
      const res = await request(app.server)
        .get("/api/users/me")
        .set("Cookie", user1Cookie)
        .expect(200);

      expect(res.body.id).toBe(user1.id);
      expect(res.body.email).toBe(user1.email);
    });

    it("should return 404 if the authenticated user is deleted", async () => {
      // The user is logged in via beforeEach, so we just need to delete them.
      await prisma.user.delete({ where: { id: user1.id } });

      await request(app.server)
        .get("/api/users/me")
        .set("Cookie", user1Cookie)
        .expect(404);
    });
  });

  // Test for PATCH /api/users/me
  describe("PATCH /api/users/me", () => {
    it("should fail with 401 if not authenticated", async () => {
      await request(app.server)
        .patch("/api/users/me")
        .send({ displayName: "New name" })
        .expect(401);
    });

    it("should update both displayName and avatarUrl for the user", async () => {
      const res = await request(app.server)
        .patch("/api/users/me")
        .set("Cookie", user1Cookie)
        .send({
          displayName: "UserOneUpdated",
          avatarUrl: "https://example.com/avatar.png",
        })
        .expect(200);

      expect(res.body.displayName).toBe("UserOneUpdated");
      expect(res.body.avatarUrl).toBe("https://example.com/avatar.png");
    });

    it("should update only the displayName", async () => {
      const res = await request(app.server)
        .patch("/api/users/me")
        .set("Cookie", user1Cookie)
        .send({ displayName: "JustTheName" })
        .expect(200);
      expect(res.body.displayName).toBe("JustTheName");
    });

    it("should fail with 400 if displayName is too short", async () => {
      await request(app.server)
        .patch("/api/users/me")
        .set("Cookie", user1Cookie)
        .send({ displayName: "A" })
        .expect(400);
    });

    it("should fail with 400 if avatarUrl is not a valid URI", async () => {
      await request(app.server)
        .patch("/api/users/me")
        .set("Cookie", user1Cookie)
        .send({ avatarUrl: "not-a-valid-url" })
        .expect(400);
    });

    it("should fail with 400 if the body is empty", async () => {
      await request(app.server)
        .patch("/api/users/me")
        .set("Cookie", user1Cookie)
        .send({}) // required minProperties: 1
        .expect(400);
    });
  });

  describe("GET /api/users/:id", () => {
    it("should fail with 401 if not authenticated", async () => {
      await request(app.server).get(`/api/users/${user2.id}`).expect(401);
    });

    it("should return the public profile of another user", async () => {
      const res = await request(app.server)
        .get(`/api/users/${user2.id}`)
        .set("Cookie", user1Cookie)
        .expect(200);
      expect(res.body.id).toBe(user2.id);
      expect(res.body.email).toBeUndefined();
    });

    it("should return 404 if the requested user ID does not exist", async () => {
      const nonExistentId = 999999;
      await request(app.server)
        .get(`/api/users/${nonExistentId}`)
        .set("Cookie", user1Cookie)
        .expect(404);
    });

    it("should fail with 400 if the ID in the URL is not a number", async () => {
      await request(app.server)
        .get("/api/users/not-a-number")
        .set("Cookie", user1Cookie)
        .expect(400);
    });
  });
});
