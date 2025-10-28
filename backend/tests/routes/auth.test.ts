import request from 'supertest';
import { app, prisma } from '../setup';
import { expect, it, describe, beforeEach } from '@jest/globals';
import { User } from '@prisma/client';

const testUser = {
  email: `test@example.com`,
  password: 'Password123!',
  username: `tester`,
};

// Runs BEFORE EACH individual test case
beforeEach(async () => {
  try {
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (err) {
    console.log(err);
  }
});

// Main test suite for authentication
// E2E tests for authentication
describe('Authentication System', () => {
  // Server health check
  it('GET / should return hello message', async () => {
    const res = await request(app.server).get('/');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('hello', 'auth-service');
  });

  // Registration Flow
  describe('Registration (POST /api/register)', () => {
    it('should create a new user', async () => {
      const res = await request(app.server).post('/api/register').send(testUser).expect(201);
      expect(res.body).toHaveProperty('email', testUser.email);
      expect(res.body).toHaveProperty('username', testUser.username);
      expect(res.body).not.toHaveProperty('password');
    });

    it('with an existing email should fail', async () => {
      await request(app.server).post('/api/register').send(testUser).expect(201);
      const res = await request(app.server).post('/api/register').send(testUser).expect(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/exists/i);
    });

    it('with an existing username should fail', async () => {
      await request(app.server).post('/api/register').send(testUser).expect(201);
      const other = {
        email: 'other@example.com',
        password: 'Password123!',
        username: testUser.username,
      };
      const res = await request(app.server).post('/api/register').send(other).expect(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toMatch(/username/i);
    });

    it('POST /api/register with a missing password should fail', async () => {
      const res = await request(app.server)
        .post('/api/register')
        .send({ email: 'anotheruser@example.com', username: 'another' }) // No password
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('POST /api/register with an invalid email should fail', async () => {
      const res = await request(app.server)
        .post('/api/register')
        .send({ email: 'not-a-valid-email', password: 'Password123!', username: 'invalid' })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('POST /api/register with a short password should fail', async () => {
      const userWithShortPassword = {
        email: 'shortpass@example.com',
        password: '123',
        username: 'dammy',
      };
      const res = await request(app.server).post('/api/register').send(userWithShortPassword).expect(400);
      expect(res.body.error).toMatch('Bad Request');
    });
  });

  // Login Flow
  describe('Login (POST /api/login)', () => {
    beforeEach(async () => {
      // Register the user so we can log in
      await request(app.server).post('/api/register').send(testUser).expect(201);
    });

    it('with valid credentials should succeed and set cookies', async () => {
      const res = await request(app.server).post('/api/login').send(testUser).expect(200);
      const cookie = res.headers['set-cookie'];
      expect(cookie).toBeDefined();
      // This check handles both single string and array
      const cookieHeader = Array.isArray(cookie) ? cookie.join(';') : cookie;
      expect(cookieHeader).toMatch(/accessToken=/);
      expect(cookieHeader).toMatch(/refreshToken=/);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('with wrong password should fail', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ email: testUser.email, password: 'WrongPassword!' })
        .expect(401);
      expect(res.headers['set-cookie']).toBeUndefined();
      expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('with a non-existent user should fail', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ email: 'nouser@example.com', password: 'Password123!' })
        .expect(401);
      expect(res.headers['set-cookie']).toBeUndefined();
      expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });
  });

  // Protected Route and Logout Flow
  describe('Authenticated Flows (Profile & Logout)', () => {
    let authenticatedCookie: string[];
    let authenticatedUser: User;

    beforeEach(async () => {
      await request(app.server).post('/api/register').send(testUser).expect(201);
      const res = await request(app.server).post('/api/login').send(testUser).expect(200);

      const cookies = res.headers['set-cookie'];
      if (!cookies) throw new Error('No cookies set on login');
      authenticatedCookie = Array.isArray(cookies) ? cookies : [cookies];

      const userFromDb = await prisma.user.findUnique({ where: { email: testUser.email } });
      if (!userFromDb) throw new Error('Test user not found in DB after login');
      authenticatedUser = userFromDb;
    });

    it('GET /api/profile without cookie should be unauthorized', async () => {
      const res = await request(app.server).get('/api/profile').expect(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });

    it('GET /api/profile with a valid cookie should return user info', async () => {
      const res = await request(app.server).get('/api/profile').set('Cookie', authenticatedCookie).expect(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('GET /api/profile should return 404 when user is missing from DB', async () => {
      await prisma.refreshToken.deleteMany({ where: { userId: authenticatedUser.id } });
      await prisma.user.delete({ where: { id: authenticatedUser.id } });

      const res = await request(app.server).get('/api/profile').set('Cookie', authenticatedCookie).expect(404);
      expect(res.body).toHaveProperty('error', 'User not found');
    });

    it('POST /api/logout should clear cookies', async () => {
      const res = await request(app.server).post('/api/logout').set('Cookie', authenticatedCookie).expect(200);
      expect(res.body).toHaveProperty('ok', true);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const setCookieHeader = Array.isArray(cookies) ? cookies.join(';') : cookies!;

      expect(setCookieHeader).toMatch(/accessToken=;/);
      expect(setCookieHeader).toMatch(/refreshToken=;/);
    });

    it('GET /api/profile should reject malformed JWT', async () => {
      const res = await request(app.server).get('/api/profile').set('Cookie', [`accessToken=abc.def.ghi`]).expect(401);
      expect(res.body).toHaveProperty('error', 'Unauthorized');
    });
  });

  // Token Lifecycle & Refresh Flow
  describe('Token Lifecycle & Refresh', () => {
    const expiryUser = {
      email: `expirytest@example.com`,
      password: 'Password123!',
      username: `expiryuser`,
    };

    beforeEach(async () => {
      await request(app.server).post('/api/register').send(expiryUser).expect(201);
    });

    it('GET /api/profile should return 401 for an expired access token (no refresh token)', async () => {
      const user = await prisma.user.findUnique({ where: { email: expiryUser.email } });
      const token = app.jwt.sign({ id: user!.id }, { expiresIn: '1ms' });
      await new Promise((r) => setTimeout(r, 50));

      await request(app.server)
        .get('/api/profile')
        .set('Cookie', [`accessToken=${token}`])
        .expect(401);
    });

    it('should refresh access token when expired but refresh token is valid', async () => {
      const loginRes = await request(app.server).post('/api/login').send(expiryUser).expect(200);
      await new Promise((r) => setTimeout(r, 1500));

      const profileRes = await request(app.server)
        .get('/api/profile')
        .set('Cookie', loginRes.headers['set-cookie'])
        .expect(200);

      const cookies = profileRes.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const setCookieHeader = Array.isArray(cookies) ? cookies.join(';') : cookies!;
      expect(setCookieHeader).toMatch(/accessToken=/);
      expect(profileRes.body).toHaveProperty('user');
      expect(profileRes.body.user.email).toBe(expiryUser.email);
    });

    it('should return 401 if refresh token is invalid/revoked', async () => {
      const loginRes = await request(app.server).post('/api/login').send(expiryUser).expect(200);

      const user = await prisma.user.findUnique({ where: { email: expiryUser.email } });
      await prisma.refreshToken.updateMany({
        where: { userId: user!.id },
        data: { revoked: true },
      });
      await new Promise((r) => setTimeout(r, 1500));

      await request(app.server).get('/api/profile').set('Cookie', loginRes.headers['set-cookie']).expect(401);
    });
  });
});
