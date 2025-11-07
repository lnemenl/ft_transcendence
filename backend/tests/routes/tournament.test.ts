import request from 'supertest';
import { expect } from '@jest/globals';
import { jest } from '@jest/globals';
import { app } from '../setup';
import { prisma } from '../../src/utils/prisma';
import { createAuthenticatedUser } from '../helpers';
import { testUsers } from '../fixtures';

describe('Tournament creation', () => {
  let tournamentId: string;
  let authCookies: string[];
  let bobId: string;
  let charlieId: string;
  let aliceId: string;
  let annaId: string;

  it('Creating a tournament with valid participants should pass', async () => {
    await request(app.server).post('/api/register').send(testUsers.bob).expect(201);
    await request(app.server).post('/api/register').send(testUsers.charlie).expect(201);
    await request(app.server).post('/api/register').send(testUsers.anna).expect(201);
    const { user, cookies } = await createAuthenticatedUser(testUsers.alice);
    aliceId = user.id;

    const regResBob = await request(app.server)
      .post('/api/login/tournament')
      .set('Cookie', cookies)
      .send(testUsers.bob);

    expect(regResBob.status).toBe(200);
    expect(regResBob.body).toHaveProperty('id');
    bobId = await regResBob.body.id;

    const regResCharlie = await request(app.server)
      .post('/api/login/tournament')
      .set('Cookie', cookies)
      .send(testUsers.charlie);

    expect(regResCharlie.status).toBe(200);
    expect(regResCharlie.body).toHaveProperty('id');
    charlieId = await regResCharlie.body.id;

    const regResAnna = await request(app.server)
      .post('/api/login/tournament')
      .set('Cookie', cookies)
      .send(testUsers.anna);

    expect(regResAnna.status).toBe(200);
    expect(regResAnna.body).toHaveProperty('id');
    annaId = await regResAnna.body.id;

    const requestBody = { participants: [bobId, charlieId, aliceId, annaId] };
    const res = await request(app.server).post('/api/tournament').set('Cookie', cookies).send(requestBody);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('tournamentId');
    tournamentId = res.body.tournamentId;
    authCookies = cookies;
  });

  it('Creating a tournament with invalid number of participants should fail', async () => {
    const requestBody = { participants: [charlieId, bobId, annaId] };
    const res = await request(app.server).post('/api/tournament').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid number of participants');
  });

  it('Creating a tournament with no participants should fail', async () => {
    const requestBody = { participants: [] };
    const res = await request(app.server).post('/api/tournament').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid number of participants');
  });

  it('Creating a tournament with invalid participant id should fail', async () => {
    const requestBody = { participants: [bobId, charlieId, aliceId, 'maoslfd12344'] };
    const res = await request(app.server).post('/api/tournament').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Invalid ID');
  });

  it('Creating a game to a tournament with valid credentials should pass', async () => {
    const requestBody = { winner: 1, players: [bobId, aliceId], tournamentId: tournamentId };
    const res = await request(app.server).post('/api/tournament/game').set('Cookie', authCookies).send(requestBody);

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
  });

  it('Creating a game with no tournament id should fail', async () => {
    const requestBody = { winner: 2, players: [aliceId, bobId], tournamentId: undefined };
    const res = await request(app.server).post('/api/tournament/game').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Bad Request');
  });

  it('Creating a game with invalid tournament id should fail', async () => {
    const requestBody = { winner: 2, players: [aliceId, bobId], tournamentId: 'wergj1234' };
    const res = await request(app.server).post('/api/tournament/game').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Invalid ID');
  });

  it('Creating a game with invalid number of players should fail', async () => {
    const requestBody = { winner: 2, players: [aliceId, bobId, aliceId], tournamentId: tournamentId };
    const res = await request(app.server).post('/api/tournament/game').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Invalid players');
  });

  it('Creating a game with no players should fail', async () => {
    const requestBody = { winner: 2, players: undefined, tournamentId: tournamentId };
    const res = await request(app.server).post('/api/tournament/game').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Bad Request');
  });

  it('Getting tournament data by tournament id', async () => {
    const res = await request(app.server).get(`/api/tournament/${tournamentId}`).set('Cookie', authCookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('winner');
    expect(res.body).toHaveProperty('participants');
    expect(res.body).toHaveProperty('games');
    expect(res.body).toHaveProperty('startDate');
    expect(res.body).toHaveProperty('endDate');
    expect(res.body.winner).toBe(null);
    expect(Array.isArray(res.body.participants)).toBe(true);
    expect(Array.isArray(res.body.games)).toBe(true);

    for (const participant of res.body.participants) {
      expect(participant).toHaveProperty('id');
      expect(participant).toHaveProperty('username');
      expect(participant).toHaveProperty('avatarUrl');
      expect(participant).not.toHaveProperty('password');
      expect(participant).not.toHaveProperty('email');
    }

    for (const game of res.body.games) {
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('winner');
      expect(game.winner).toHaveProperty('id');
      expect(game.winner).toHaveProperty('username');
      expect(game.winner).toHaveProperty('avatarUrl');
      expect(game.winner).not.toHaveProperty('email');
      expect(game.winner).not.toHaveProperty('password');
      expect(game).toHaveProperty('players');
      expect(game).toHaveProperty('createdAt');
      expect(Array.isArray(game.players)).toBe(true);

      for (const player of game.players) {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('username');
        expect(player).toHaveProperty('avatarUrl');
        expect(player).not.toHaveProperty('email');
        expect(player).not.toHaveProperty('password');
      }
    }
  });

  it('Adding a winner to the tournament', async () => {
    const requestBody = { winner: aliceId };
    const res = await request(app.server)
      .patch(`/api/tournament/${tournamentId}`)
      .set('Cookie', authCookies)
      .send(requestBody);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('winner');
    expect(res.body).toHaveProperty('participants');
    expect(res.body).toHaveProperty('games');
    expect(res.body).toHaveProperty('startDate');
    expect(res.body).toHaveProperty('endDate');
    expect(res.body.winner).toBeDefined();
    expect(res.body.winner).toHaveProperty('id');
    expect(res.body.winner).toHaveProperty('username');
    expect(res.body.winner).toHaveProperty('avatarUrl');
    expect(res.body.winner).not.toHaveProperty('password');
    expect(res.body.winner).not.toHaveProperty('email');
    expect(Array.isArray(res.body.participants)).toBe(true);
    expect(Array.isArray(res.body.games)).toBe(true);

    for (const participant of res.body.participants) {
      expect(participant).toHaveProperty('id');
      expect(participant).toHaveProperty('username');
      expect(participant).toHaveProperty('avatarUrl');
      expect(participant).not.toHaveProperty('password');
      expect(participant).not.toHaveProperty('email');
    }

    for (const game of res.body.games) {
      expect(game).toHaveProperty('id');
      expect(game).toHaveProperty('winner');
      expect(game.winner).toHaveProperty('id');
      expect(game.winner).toHaveProperty('username');
      expect(game.winner).toHaveProperty('avatarUrl');
      expect(game.winner).not.toHaveProperty('email');
      expect(game.winner).not.toHaveProperty('password');
      expect(game).toHaveProperty('players');
      expect(game).toHaveProperty('createdAt');
      expect(Array.isArray(game.players)).toBe(true);

      for (const player of game.players) {
        expect(player).toHaveProperty('id');
        expect(player).toHaveProperty('username');
        expect(player).toHaveProperty('avatarUrl');
        expect(player).not.toHaveProperty('email');
        expect(player).not.toHaveProperty('password');
      }
    }
  });

  it('Adding a winner with invalid id should fail', async () => {
    const requestBody = { winner: 'mowqmre1234' };
    const res = await request(app.server)
      .patch(`/api/tournament/${tournamentId}`)
      .set('Cookie', authCookies)
      .send(requestBody);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Invalid winner');
  });

  // The only way to test for a database call failure is to mock a test for that specifically
  it('Internal server error for getting tournament by id', async () => {
    jest.spyOn(prisma.tournament, 'findUnique').mockRejectedValue(new Error('Internal server error'));
    const res = await request(app.server).get(`/api/tournament/${tournamentId}`).set('Cookie', authCookies);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });

  it('Internal server error for creating a tournament', async () => {
    const requestBody = { participants: [bobId, charlieId, aliceId, annaId] };
    jest.spyOn(prisma.tournament, 'create').mockRejectedValue(new Error('Internal server error'));
    const res = await request(app.server).post('/api/tournament').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });

  it('Internal server error for adding tournament winner', async () => {
    const requestBody = { winner: bobId };
    jest.spyOn(prisma.tournament, 'update').mockRejectedValue(new Error('Internal server error'));
    const res = await request(app.server)
      .patch(`/api/tournament/${tournamentId}`)
      .set('Cookie', authCookies)
      .send(requestBody);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });
  it('Internal server error for creating a game', async () => {
    const requestBody = { winner: 1, players: [bobId, aliceId], tournamentId: tournamentId };
    jest.spyOn(prisma.game, 'create').mockRejectedValue(new Error('Internal server error'));
    const res = await request(app.server).post('/api/tournament/game').set('Cookie', authCookies).send(requestBody);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });
});
