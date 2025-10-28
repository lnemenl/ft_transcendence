import request from 'supertest';
import { app, prisma } from '../setup';
import { User } from '@prisma/client';
import { expect, it, describe, beforeEach } from '@jest/globals';

describe('User Profile Endpoints', () => {
  let user1Cookie: string[];
  let user1: User;
  let user2: User;

  beforeEach(async () => {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});

    const user1Data = {
      email: 'user1@example.com',
      password: 'Password123!',
      username: 'user1',
    };
    await request(app.server).post('/api/register').send(user1Data);
    const loginRes = await request(app.server).post('/api/login').send(user1Data);

    const cookies = loginRes.headers['set-cookie'];
    if (!cookies) throw new Error('No cookies set on login');
    user1Cookie = Array.isArray(cookies) ? cookies : [cookies];

    user1 = (await prisma.user.findUnique({
      where: { email: user1Data.email },
    }))!;

    const user2Data = {
      email: 'user2@example.com',
      password: 'Password123!',
      username: 'user2',
    };
    await request(app.server).post('/api/register').send(user2Data);
    user2 = (await prisma.user.findUnique({
      where: { email: user2Data.email },
    }))!;
  });

  // tests for GET /api/users/me
  describe('GET /api/users/me', () => {
    it('should fail with 401 if not authenticated', async () => {
      await request(app.server).get('/api/users/me').expect(401);
    });

    it('should return the profile of the currently logged-in user', async () => {
      const res = await request(app.server).get('/api/users/me').set('Cookie', user1Cookie).expect(200);

      expect(res.body.id).toBe(user1.id);
      expect(res.body.email).toBe(user1.email);
      expect(res.body.username).toBe(user1.username);
    });

    it('should return 404 if the authenticated user is deleted', async () => {
      await prisma.$transaction([
        prisma.refreshToken.deleteMany({ where: { userId: user1.id } }),
        prisma.user.delete({ where: { id: user1.id } }),
      ]);

      const validToken = app.jwt.sign({ id: user1.id }, { expiresIn: '15min' });
      await request(app.server)
        .get('/api/users/me')
        .set('Cookie', [`accessToken=${validToken}`])
        .expect(404);
    });
  });

  // Test for PATCH /api/users/me
  describe('PATCH /api/users/me', () => {
    it('should fail with 401 if not authenticated', async () => {
      await request(app.server).patch('/api/users/me').send({ username: 'New name' }).expect(401);
    });

    it('should update both username and avatarUrl for the user', async () => {
      const res = await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', user1Cookie)
        .send({
          username: 'UserOneUpdated',
          avatarUrl: 'https://example.com/avatar.png',
        })
        .expect(200);

      expect(res.body.username).toBe('UserOneUpdated');
      expect(res.body.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('should update only the username', async () => {
      const res = await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', user1Cookie)
        .send({ username: 'JustTheName' })
        .expect(200);
      expect(res.body.username).toBe('JustTheName');
    });

    it('should fail with 400 if username is too short', async () => {
      await request(app.server).patch('/api/users/me').set('Cookie', user1Cookie).send({ username: 'A' }).expect(400);
    });

    it('should fail with 400 if avatarUrl is not a valid URI', async () => {
      await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', user1Cookie)
        .send({ avatarUrl: 'not-a-valid-url' })
        .expect(400);
    });

    it('should fail with 400 if the body is empty', async () => {
      await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', user1Cookie)
        .send({}) // required minProperties: 1
        .expect(400);
    });
  });

  // Test for GET /api/users/:id
  describe('GET /api/users/:id', () => {
    it('should fail with 401 if not authenticated', async () => {
      await request(app.server).get(`/api/users/${user2.id}`).expect(401);
    });

    it('should return the public profile of another user', async () => {
      const res = await request(app.server).get(`/api/users/${user2.id}`).set('Cookie', user1Cookie).expect(200);
      expect(res.body.id).toBe(user2.id);
      expect(res.body.username).toBe(user2.username);
      expect(res.body.email).toBeUndefined();
    });

    it('should return 404 if the requested user ID does not exist', async () => {
      const nonExistentId = 'clxkq0000000008l9d9e6g3h1';
      await request(app.server).get(`/api/users/${nonExistentId}`).set('Cookie', user1Cookie).expect(404);
    });
  });
});
