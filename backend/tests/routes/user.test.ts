import request from 'supertest';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { app, prisma } from '../setup';
import { testUsers } from '../fixtures';
import { cleanDatabase, createAuthenticatedUser } from '../helpers';

beforeEach(cleanDatabase);

describe('User Profile Management', () => {
  // GET CURRENT USER
  describe('GET /api/users/me', () => {
    it('returns current user profile when authenticated', async () => {
      const { cookies, user } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server).get('/api/users/me').set('Cookie', cookies).expect(200);

      expect(res.body).toMatchObject({
        id: user.id,
        email: user.email,
        username: user.username,
      });
    });

    it('rejects request without authentication', async () => {
      await request(app.server).get('/api/users/me').expect(401);
    });

    it('returns 404 when authenticated user is deleted', async () => {
      const { user } = await createAuthenticatedUser(testUsers.alice);

      // Create a fresh token and delete user
      const validToken = app.jwt.sign({ id: user.id }, { expiresIn: '15min' });
      await cleanDatabase();

      await request(app.server)
        .get('/api/users/me')
        .set('Cookie', [`accessToken=${validToken}`])
        .expect(404);
    });
  });

  // UPDATE CURRENT USER
  describe('PATCH /api/users/me', () => {
    it('updates username successfully', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({ username: 'alice_updated' })
        .expect(200);

      expect(res.body.username).toBe('alice_updated');
    });

    it('updates avatarUrl successfully', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({ avatarUrl: 'https://example.com/avatar.png' })
        .expect(200);

      expect(res.body.avatarUrl).toBe('https://example.com/avatar.png');
    });

    it('updates both username and avatarUrl', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({
          username: 'alice_new',
          avatarUrl: 'https://example.com/new.jpg',
        })
        .expect(200);

      expect(res.body.username).toBe('alice_new');
      expect(res.body.avatarUrl).toBe('https://example.com/new.jpg');
    });

    it('rejects request without authentication', async () => {
      await request(app.server).patch('/api/users/me').send({ username: 'test' }).expect(401);
    });

    it('rejects empty update', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      await request(app.server).patch('/api/users/me').set('Cookie', cookies).send({}).expect(400);
    });

    it('rejects short username', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      await request(app.server).patch('/api/users/me').set('Cookie', cookies).send({ username: 'a' }).expect(400);
    });

    it('rejects invalid avatarUrl', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({ avatarUrl: 'not-a-url' })
        .expect(400);
    });
  });

  describe('GET /api/users/', () => {
    it('returns public profile of all registered users', async () => {
      await request(app.server).post('/api/register').send(testUsers.anna).expect(201);
      await request(app.server).post('/api/register').send(testUsers.bob).expect(201);
      await request(app.server).post('/api/register').send(testUsers.charlie).expect(201);
      const { user, cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server).get('/api/users/').set('Cookie', cookies).expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      for (const profile of res.body) {
        expect(profile).toHaveProperty('id');
        expect(profile.id).not.toBe(user.id);
        expect(profile).toHaveProperty('username');
        expect(profile.username).not.toBe(user.username);
        expect(profile).toHaveProperty('avatarUrl');
        expect(profile).not.toHaveProperty('email');
        expect(profile).not.toHaveProperty('password');
      }
    });

    it('Internal server error for database call failure', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      jest.spyOn(prisma.user, 'findMany').mockRejectedValue(new Error('Internal server error'));

      const res = await request(app.server).get('/api/users/').set('Cookie', cookies);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
    });
  });

  // VIEW OTHER USER
  describe('GET /api/users/:id', () => {
    it('returns public profile of another user', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const { user: bob } = await createAuthenticatedUser(testUsers.bob);

      const res = await request(app.server).get(`/api/users/${bob.id}`).set('Cookie', cookies).expect(200);

      expect(res.body.id).toBe(bob.id);
      expect(res.body.username).toBe(bob.username);
      expect(res.body.email).toBeUndefined(); // Email should not be public
    });

    it('rejects request without authentication', async () => {
      const { user } = await createAuthenticatedUser(testUsers.alice);

      await request(app.server).get(`/api/users/${user.id}`).expect(401);
    });

    it('returns 404 for non-existent user', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const nonExistentId = 'clxkq0000000008l9d9e6g3h1';
      await request(app.server).get(`/api/users/${nonExistentId}`).set('Cookie', cookies).expect(404);
    });
  });
});
