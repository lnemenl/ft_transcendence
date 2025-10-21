import request from "supertest";
import app from "../../src/index";
import { prisma } from "../../src/utils/prisma";
import { createGame } from "../../src/services/game.service";

const registerTestUser1 = {
  email: "ci_test_game@example.com",
  password: "Password123!",
  username: "TestUSer1",
};

const registerTestUser2 = {
  email: "ci_test1_game@example.com",
  password: "Password123!",
  username: "TestUser2",
};

const testUser1 = {
  email: "ci_test_game@example.com",
  password: "Password123!",
};
const testUSer2 = {
  email: "ci_test1_game@example.com",
  password: "Password123!",
};

beforeAll(async () => {
  process.env.NODE_ENV = "test";
  await app.ready();
  await prisma.$connect();
  await prisma.user.deleteMany({});
  await prisma.game.deleteMany({});
});

afterAll(async () => {
  await prisma.user.deleteMany({});
  await app.close();
  await prisma.$disconnect();
});

describe("Game tests", () => {
  let cookie1: string;
  let cookie2: string;
  let cookie: string[] = [];
  let playerToken: string | undefined;
  let testUser1Id: string;
  let testUser2Id: string;

  it("Registering both users", async () => {
    const res1 = await request(app.server)
      .post("/api/register")
      .send(registerTestUser1)
      .expect(201);
    const res2 = await request(app.server)
      .post("/api/register")
      .send(registerTestUser2)
      .expect(201);

    testUser1Id = res1.body.id;
    testUser2Id = res2.body.id;
    expect(testUser1Id).toBeDefined();
    expect(testUser2Id).toBeDefined();
  });

  it("Logging in the main user", async () => {
    const res = await request(app.server).post("/api/login").send(testUser1);

    expect(res.status).toBe(200);
    cookie1 = res.headers["set-cookie"];
    expect(cookie).toBeDefined();
    expect(res.body).toHaveProperty("accessToken");
  });

  it("Logging in the player", async () => {
    const res = await request(app.server)
      .post("/api/login/player2")
      .set("Cookie", cookie1)
      .send(testUSer2);

    expect(res.status).toBe(200);
    cookie2 = res.headers["set-cookie"];
    expect(cookie2).toBeDefined();
    const cookieString = cookie2.find((c: string) =>
      c.startsWith("player2_token="),
    );
    playerToken = cookieString?.split(";")[0].split("=")[1];
    expect(playerToken).toBeDefined();
  });

  it("POST /games with valid credentials should pass", async () => {
    const requestBody = { winnerId: testUser1Id, tournamentId: undefined };
    cookie = [cookie1, cookie2];
    const res = await request(app.server)
      .post("/api/games")
      .set("Cookie", cookie.join("; "))
      .send(requestBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty(
      "id",
      "winnerId",
      "winner",
      "players",
      "tounamentId",
      "tournament",
      "createdAt",
    );
  });

  it("POST /games with no winnerId should fail", async () => {
    const requestBody = { winnerId: undefined, tournamentId: undefined };
    const res = await request(app.server)
      .post("/api/games")
      .set("Cookie", cookie)
      .send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Bad Request");
  });

  it("POST /games with no token for player 2 should pass", async () => {
    const requestBody = { winnerId: testUser1Id, tournamentId: undefined };
    const res = await request(app.server)
      .post("/api/games")
      .set("Cookie", cookie1)
      .send(requestBody);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });

  it("POST /games with an expired token for player 2 should fail", async () => {
    const token = app.jwt.sign({ sub: testUser2Id! }, { expiresIn: "1s" });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const badCookie = [cookie1, `player2_token=${token}`];
    const requestBody = { winnerId: testUser1Id, tournamentId: undefined };
    const res = await request(app.server)
      .post("/api/games")
      .set("Cookie", badCookie)
      .send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error", "Player 2 Unauthorized");
  });

  it("POST /games with invalid winnerId should fail", async () => {
    const requestBody = { winnerId: "123", tournamentId: undefined };
    const res = await request(app.server)
      .post("/api/games")
      .set("Cookie", cookie.join("; "))
      .send(requestBody);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Invalid ID");
  });

  it("Testing the last else branch of catch in createGame()", async () => {
    const spy = jest.spyOn(prisma.game, "create").mockImplementation(() => {
      throw new Error("Some unexpected error");
    });

    await expect(
      createGame("winnerId", "player1Id", "player2Id", "tournamentId"),
    ).rejects.toThrow("Bad request");

    spy.mockRestore();
  });

  it("POST /games with invalid tournamentId should fail", async () => {
    const requestBody = { winnerId: testUser1Id, tournamentId: "123" };
    const res = await request(app.server)
      .post("/api/games")
      .set("Cookie", cookie.join("; "))
      .send(requestBody);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Invalid ID");
  });
});
