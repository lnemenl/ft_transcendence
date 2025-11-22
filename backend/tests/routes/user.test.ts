import request from 'supertest';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { app, prisma } from '../setup';
import { testUsers, invalidUsers } from '../fixtures';
import { cleanDatabase, createAuthenticatedUser, getCookies } from '../helpers';

beforeEach(cleanDatabase);

describe('User Profile Management', () => {
  // GET CURRENT USER
  describe('GET /api/users/me', () => {
    it('returns current user profile when authenticated', async () => {
      const { user: bob } = await createAuthenticatedUser(testUsers.bob);
      const { user: alice, cookies } = await createAuthenticatedUser(testUsers.alice);

      const friendRequest = await request(app.server)
        .post(`/api/friend-request/${bob.id}`)
        .set('Cookie', cookies)
        .expect(201);

      expect(friendRequest.body).toHaveProperty('id');
      const friendRequestId = friendRequest.body.id;
      const loginBob = await request(app.server).post('/api/login').send(testUsers.bob).expect(200);
      const authCookies = getCookies(loginBob);
      await request(app.server).patch(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies).expect(200);

      const res = await request(app.server).get('/api/users/me').set('Cookie', authCookies).expect(200);

      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('id', bob.id);
      expect(res.body).toHaveProperty('email', testUsers.bob.email);
      expect(res.body).toHaveProperty('username', testUsers.bob.username);
      expect(res.body).toHaveProperty('isTwoFactorEnabled', false);
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('friends');
      expect(Array.isArray(res.body.friends)).toBe(true);
      expect(res.body.friends[0]).toHaveProperty('id', alice.id);
      expect(res.body.friends[0]).toHaveProperty('username', alice.username);
      expect(res.body.friends[0]).toHaveProperty('avatarUrl');
      expect(res.body.friends[0]).toHaveProperty('isOnline', true);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('twoFactorSecret');
    });

    it('updates online status upon logout', async () => {
      const { user: bob } = await createAuthenticatedUser(testUsers.bob);
      const { user: alice, cookies } = await createAuthenticatedUser(testUsers.alice);

      const friendRequest = await request(app.server)
        .post(`/api/friend-request/${bob.id}`)
        .set('Cookie', cookies)
        .expect(201);

      expect(friendRequest.body).toHaveProperty('id');
      const friendRequestId = friendRequest.body.id;
      const loginBob = await request(app.server).post('/api/login').send(testUsers.bob).expect(200);
      let authCookies = getCookies(loginBob);
      await request(app.server).patch(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies).expect(200);

      await request(app.server).post('/api/logout').set('Cookie', authCookies).expect(200);
      const loginAlice = await request(app.server).post('/api/login').send(testUsers.alice).expect(200);
      authCookies = getCookies(loginAlice);
      const res = await request(app.server).get('/api/users/me').set('Cookie', authCookies).expect(200);

      expect(res.body).toBeDefined();
      expect(res.body).toHaveProperty('id', alice.id);
      expect(res.body).toHaveProperty('email', testUsers.alice.email);
      expect(res.body).toHaveProperty('username', testUsers.alice.username);
      expect(res.body).toHaveProperty('isTwoFactorEnabled', false);
      expect(res.body).toHaveProperty('createdAt');
      expect(res.body).toHaveProperty('friends');
      expect(Array.isArray(res.body.friends)).toBe(true);
      expect(res.body.friends[0]).toHaveProperty('id', bob.id);
      expect(res.body.friends[0]).toHaveProperty('username', testUsers.bob.username);
      expect(res.body.friends[0]).toHaveProperty('avatarUrl');
      expect(res.body.friends[0]).toHaveProperty('isOnline', false);
      expect(res.body).not.toHaveProperty('password');
      expect(res.body).not.toHaveProperty('twoFactorSecret');
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

    it('returns 500 when database fails during GET /me', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app.server).get('/api/users/me').set('Cookie', cookies).expect(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
      findUniqueSpy.mockRestore();
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
        .send({ avatarUrl: 'https://cdn.pixabay.com/photo/2025/10/23/05/43/bird-9910830_1280.jpg' })
        .expect(200);

      expect(res.body.avatarUrl).toBe('https://cdn.pixabay.com/photo/2025/10/23/05/43/bird-9910830_1280.jpg');
    });

    it('updates both username and avatarUrl', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({
          username: 'alice_new',
          avatarUrl: 'https://cdn.pixabay.com/photo/2025/10/23/05/43/bird-9910830_1280.jpg',
        })
        .expect(200);

      expect(res.body.username).toBe('alice_new');
      expect(res.body.avatarUrl).toBe('https://cdn.pixabay.com/photo/2025/10/23/05/43/bird-9910830_1280.jpg');
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

      await request(app.server).patch('/api/users/me').set('Cookie', cookies).send({ username: invalidUsers.shortUsername.username }).expect(400);
    });

    it('rejects long username', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      await request(app.server).patch('/api/users/me').set('Cookie', cookies).send({ username: invalidUsers.longUsername.username }).expect(400);
    });

    it('rejects invalid avatarUrl format', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({ avatarUrl: 'not-a-url' })
        .expect(400);
    });

    it('rejects invalid avatarUrl URL', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({ avatarUrl: 'https://google.com' })
        .expect(400);
    });

    it('rejects already existing username', async () => {
      await request(app.server).post('/api/register').send(testUsers.bob).expect(201);
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server).patch('/api/users/me').set('Cookie', cookies).send({ username: 'bob' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'User with this name already exists');
    });

    it('returns 500 when database fails during PATCH /me', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const updateSpy = jest.spyOn(prisma.user, 'update').mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app.server)
        .patch('/api/users/me')
        .set('Cookie', cookies)
        .send({ username: 'test_new' })
        .expect(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
      updateSpy.mockRestore();
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

    it('returns 500 when database fails during GET /api/users/:id', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const { user: bob } = await createAuthenticatedUser(testUsers.bob);
      const findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app.server).get(`/api/users/${bob.id}`).set('Cookie', cookies).expect(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
      findUniqueSpy.mockRestore();
    });
  });

  describe('DELETE /api/users/me/friends/:id', () => {
    let authCookies: string[];
    let aliceId: string;
    let bobId: string;

    it('Deleting a valid user from friends should pass', async () => {
      const { user: bob } = await createAuthenticatedUser(testUsers.bob);
      bobId = bob.id;
      const { user: alice, cookies } = await createAuthenticatedUser(testUsers.alice);
      aliceId = alice.id;
      authCookies = cookies;

      const friendRequest = await request(app.server)
        .post(`/api/friend-request/${bobId}`)
        .set('Cookie', authCookies)
        .expect(201);

      expect(friendRequest.body).toHaveProperty('id');
      const friendRequestId = friendRequest.body.id;
      const loginBob = await request(app.server).post('/api/login').send(testUsers.bob).expect(200);
      authCookies = getCookies(loginBob);
      await request(app.server).patch(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies).expect(200);

      const res = await request(app.server).delete(`/api/users/me/friends/${aliceId}`).set('Cookie', authCookies);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id', aliceId);
      expect(res.body).toHaveProperty('username', testUsers.alice.username);
      expect(res.body).toHaveProperty('avatarUrl');
    });

    it('Trying to delete a non existing friend should fail', async () => {
      const res = await request(app.server).delete(`/api/users/me/friends/${aliceId}`).set('Cookie', authCookies);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('error', 'Friend record not found');
    });

    it('Status should be 500 if database call is protected', async () => {
      jest.spyOn(prisma.friendRequest, 'findFirst').mockRejectedValue('Internal server error');

      const res = await request(app.server).delete(`/api/users/me/friends/${aliceId}`).set('Cookie', authCookies);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
    });
  });
});
