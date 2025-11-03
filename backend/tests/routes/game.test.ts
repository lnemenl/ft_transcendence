import request from 'supertest';
import { expect } from '@jest/globals';
import app from '../../src/index';
import { prisma } from '../../src/utils/prisma';
import { getCookies } from '../helpers';

const registerTestUser1 = {
  email: 'ci_test_game@example.com',
  password: 'Password123!',
  username: 'TestUser1',
};

const registerTestUser2 = {
  email: 'ci_test1_game@example.com',
  password: 'Password123!',
  username: 'TestUser2',
};

const testUser1 = {
  email: 'ci_test_game@example.com',
  password: 'Password123!',
};
const testUSer2 = {
  email: 'ci_test1_game@example.com',
  password: 'Password123!',
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
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

describe('Game tests', () => {
  let cookie1: string[];
  let playerToken: string | undefined;
  let testUser1Id: string;
  let testUser2Id: string;
  let gameId: string;

  it('Registering both users', async () => {
    const res1 = await request(app.server).post('/api/register').send(registerTestUser1).expect(201);
    const res2 = await request(app.server).post('/api/register').send(registerTestUser2).expect(201);

    testUser1Id = res1.body.id;
    testUser2Id = res2.body.id;
    expect(testUser1Id).toBeDefined();
    expect(testUser2Id).toBeDefined();
  });

  it('Logging in the main user', async () => {
    const res = await request(app.server).post('/api/login').send(testUser1);

    expect(res.status).toBe(200);
    cookie1 = getCookies(res);
  });

  it('Logging in the player', async () => {
    const res = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(res.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(res)];
    expect(cookie).toBeDefined();
    const cookieString = cookie.find((c: string) => c.startsWith('player2_token='));
    playerToken = cookieString?.split(';')[0].split('=')[1];
    expect(playerToken).toBeDefined();
  });

  it('POST /games with valid credentials should pass', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const requestBody = { winner: 1, tournamentId: undefined };
    const res = await request(app.server).post('/api/games').set('Cookie', cookie).send(requestBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('winner');
    expect(res.body.winner).toHaveProperty('id');
    expect(res.body.winner).toHaveProperty('username');
    expect(res.body.winner).toHaveProperty('avatarUrl');
    expect(res.body.winner).not.toHaveProperty('email');
    expect(res.body.winner).not.toHaveProperty('password');
    expect(res.body).toHaveProperty('players');
    expect(res.body).toHaveProperty('createdAt');
    expect(Array.isArray(res.body.players)).toBe(true);

    for (const player of res.body.players) {
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('username');
      expect(player).toHaveProperty('avatarUrl');
      expect(player).not.toHaveProperty('email');
      expect(player).not.toHaveProperty('password');
    }
    const { id: id, ..._restBody } = res.body;
    gameId = id;
  });

  it('POST /games with no winnerId should fail', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const requestBody = { winner: undefined, tournamentId: undefined };
    const res = await request(app.server).post('/api/games').set('Cookie', cookie).send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Bad Request');
  });

  it('POST /games with no token for player 2 should pass', async () => {
    const requestBody = { winner: 2, tournamentId: undefined };
    const res = await request(app.server).post('/api/games').set('Cookie', cookie1).send(requestBody);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  it('POST /games with an expired token for player 2 should fail', async () => {
    const token = app.jwt.sign({ id: testUser2Id! }, { expiresIn: '1s' });

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const cookie = [...cookie1,`player2_token=${token}`];
    const requestBody = { winner: 2, tournamentId: undefined };
    const res = await request(app.server).post('/api/games').set('Cookie', cookie).send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Player 2 Unauthorized');
  });

  it('POST /games with invalid winnerId should fail', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const requestBody = { winner: 3, tournamentId: undefined };
    const res = await request(app.server).post('/api/games').set('Cookie', cookie).send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid winner');
  });

  it('POST /games with invalid tournamentId should fail', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const requestBody = { winner: 2, tournamentId: '123' };
    const res = await request(app.server).post('/api/games').set('Cookie', cookie).send(requestBody);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Invalid ID');
  });

  it('POST /games with invalid player 2 should fail', async () => {
    const badToken = app.jwt.sign({ id: 'e124512wwdas' }, { expiresIn: '1m' });
    const cookie = [...cookie1, `player2_token=${badToken}`];
    const requestBody = { winner: 2, tournamentId: undefined };
    const res = await request(app.server).post('/api/games').set('Cookie', cookie).send(requestBody);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Invalid ID');
  });

  it('GET /games/:id with a valid game id should pass', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const res = await request(app.server).get(`/api/games/${gameId}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('winner');
    expect(res.body.winner).toHaveProperty('id');
    expect(res.body.winner).toHaveProperty('username');
    expect(res.body.winner).toHaveProperty('avatarUrl');
    expect(res.body.winner).not.toHaveProperty('email');
    expect(res.body.winner).not.toHaveProperty('password');
    expect(res.body).toHaveProperty('players');
    expect(res.body).toHaveProperty('createdAt');
    expect(Array.isArray(res.body.players)).toBe(true);

    for (const player of res.body.players) {
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('username');
      expect(player).toHaveProperty('avatarUrl');
      expect(player).not.toHaveProperty('email');
      expect(player).not.toHaveProperty('password');
    }
  });

  it('GET /games/:id with invalid game id should fail', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const res = await request(app.server).get('/api/games/123').set('Cookie', cookie);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid game id');
  });

  it('POST /games Creating more games for the next test', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const requestBody = { winner: 2, tournamentId: undefined };
    const res = await request(app.server).post('/api/games').set('Cookie', cookie).send(requestBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('winner');
    expect(res.body.winner).toHaveProperty('id');
    expect(res.body.winner).toHaveProperty('username');
    expect(res.body.winner).toHaveProperty('avatarUrl');
    expect(res.body.winner).not.toHaveProperty('email');
    expect(res.body.winner).not.toHaveProperty('password');
    expect(res.body).toHaveProperty('players');
    for (const player of res.body.players) {
      expect(player).toHaveProperty('id');
      expect(player).toHaveProperty('username');
      expect(player).toHaveProperty('avatarUrl');
      expect(player).not.toHaveProperty('email');
      expect(player).not.toHaveProperty('password');
    }
    expect(res.body).toHaveProperty('createdAt');
  });

  it('GET /games should return all games', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const res = await request(app.server).get('/api/games').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    for (const game of res.body) {
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('winner');
      expect(game).toHaveProperty('players');
      expect(game).toHaveProperty('createdAt');
      expect(game.winner).toHaveProperty('id');
      expect(game.winner).toHaveProperty('username');
      expect(game.winner).toHaveProperty('avatarUrl');
      expect(game.winner).not.toHaveProperty('email');
      expect(game.winner).not.toHaveProperty('password');
      for (const player of game.players) {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('username');
        expect(player).toHaveProperty('avatarUrl');
        expect(player).not.toHaveProperty('email');
        expect(player).not.toHaveProperty('password');
      }
    }
  });

  it('GET /games/me with a valid user should return all games the user has participated in', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const res = await request(app.server).get('/api/games/me').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const game of res.body) {
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('winner');
      expect(game).toHaveProperty('players');
      expect(game).toHaveProperty('createdAt');
      expect(game.winner).toHaveProperty('id');
      expect(game.winner).toHaveProperty('username');
      expect(game.winner).toHaveProperty('avatarUrl');
      expect(game.winner).not.toHaveProperty('email');
      expect(game.winner).not.toHaveProperty('password');
      for (const player of game.players) {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('username');
        expect(player).toHaveProperty('avatarUrl');
        expect(player).not.toHaveProperty('email');
        expect(player).not.toHaveProperty('password');
      }
    }
  });

  it('GET /games/me with an invalid user should fail', async () => {
    const badToken = app.jwt.sign({ id: 'e124512wwdas' }, { expiresIn: '1m' });

    const res = await request(app.server).get('/api/games/me').set('Cookie', `accessToken=${badToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });

  it('GET /games/me/won with a valid user should return all games the user has won', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    const res = await request(app.server).get('/api/games/me/won').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const game of res.body) {
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('winner');
      expect(game).toHaveProperty('players');
      expect(game).toHaveProperty('createdAt');
      expect(game.winner).toHaveProperty('id');
      expect(game.winner).toHaveProperty('username');
      expect(game.winner).toHaveProperty('avatarUrl');
      expect(game.winner).not.toHaveProperty('email');
      expect(game.winner).not.toHaveProperty('password');
      for (const player of game.players) {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('username');
        expect(player).toHaveProperty('avatarUrl');
        expect(player).not.toHaveProperty('email');
        expect(player).not.toHaveProperty('password');
      }
    }
  });

  it('GET /games/me/won with an invalid user should fail', async () => {
    const badToken = app.jwt.sign({ id: 'e124512wwdas' }, { expiresIn: '1m' });

    const res = await request(app.server).get('/api/games/me/won').set('Cookie', `accessToken=${badToken}`);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });

  it('GET /games when there are no games stored should return an empty array', async () => {
    const loginRes = await request(app.server).post('/api/login/player2').set('Cookie', cookie1).send(testUSer2);

    expect(loginRes.status).toBe(200);
    const cookie = [...cookie1, ...getCookies(loginRes)];
    await prisma.game.deleteMany({});
    const res = await request(app.server).get('/api/games').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
