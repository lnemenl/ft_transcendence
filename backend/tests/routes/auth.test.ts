import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { app, prisma } from '../setup';
import { testUsers, invalidUsers } from '../fixtures';
import { cleanDatabase, getCookies, hasCookie, createAuthenticatedUser } from '../helpers';

beforeEach(cleanDatabase);

describe('Authentication System', () => {
  // REGISTRATION
  describe('Registration', () => {
    it('creates a new user with valid data', async () => {
      const res = await request(app.server).post('/api/register').send(testUsers.alice).expect(201);

      expect(res.body.email).toBe(testUsers.alice.email);
      expect(res.body.username).toBe(testUsers.alice.username);
      expect(res.body).not.toHaveProperty('password'); // Password should never be returned
    });

    it('rejects duplicate email', async () => {
      await request(app.server).post('/api/register').send(testUsers.alice).expect(201);

      const res = await request(app.server).post('/api/register').send(testUsers.alice).expect(400);

      expect(res.body.error).toMatch(/exists/i);
    });

    it('rejects duplicate username', async () => {
      await request(app.server).post('/api/register').send(testUsers.alice).expect(201);

      const duplicate = { ...testUsers.bob, username: testUsers.alice.username };
      const res = await request(app.server).post('/api/register').send(duplicate).expect(400);

      expect(res.body.error).toMatch(/username/i);
    });

    it('rejects invalid email format', async () => {
      const res = await request(app.server).post('/api/register').send(invalidUsers.invalidEmail).expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('rejects missing password', async () => {
      const res = await request(app.server).post('/api/register').send(invalidUsers.noPassword).expect(400);

      expect(res.body).toHaveProperty('error');
    });

    it('rejects short password', async () => {
      const res = await request(app.server).post('/api/register').send(invalidUsers.shortPassword).expect(400);

      expect(res.body.error).toMatch(/bad request/i);
    });
  });

  // LOGIN
  describe('Login', () => {
    beforeEach(async () => {
      await request(app.server).post('/api/register').send(testUsers.alice);
    });

    it('succeeds with valid email and password', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ email: testUsers.alice.email, password: testUsers.alice.password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('avatarUrl');
      expect(hasCookie(res, 'accessToken')).toBe(true);
      expect(hasCookie(res, 'refreshToken')).toBe(true);
    });

    it('succeeds with valid username and password', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ username: testUsers.alice.username, password: testUsers.alice.password })
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('avatarUrl');
      expect(hasCookie(res, 'accessToken')).toBe(true);
      expect(hasCookie(res, 'refreshToken')).toBe(true);
    });

    it('rejects wrong password', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ email: testUsers.alice.email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('rejects non-existent email', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ email: 'nobody@example.com', password: 'AnyPassword123!' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
    });

    it('rejects non-existent username', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ username: 'nobody', password: 'AnyPassword123!' })
        .expect(401);

      expect(res.body.error).toBe('Invalid email or password');
    });

    it('rejects login without email or username', async () => {
      const res = await request(app.server).post('/api/login').send({ password: testUsers.alice.password }).expect(401);

      expect(res.body.error).toMatch(/provide username or email/i);
    });

    it('Player 2 login if they have 2FA enabled', async () => {
      // Import TOTP for this test
      const { TOTP } = await import('otpauth');

      // Enable 2FA for bob
      const { cookies } = await createAuthenticatedUser(testUsers.bob);
      const gen = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret: string = gen.body.secret;
      const token = new TOTP({ secret }).generate();
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: token })
        .expect(200);

      // Now try to login as player2 with bob (who has 2FA enabled)
      const aliceCookies = (await createAuthenticatedUser(testUsers.alice)).cookies;
      const res = await request(app.server)
        .post('/api/login/player2')
        .set('Cookie', aliceCookies)
        .send({ email: testUsers.bob.email, password: testUsers.bob.password })
        .expect(200);

      expect(res.body.twoFactorRequired).toBe(true);
      expect(typeof res.body.twoFactorToken).toBe('string');
    });
  });

  // PLAYER 2 LOGIN
  describe('Player 2 Login', () => {
    it('POST /api/login/player2 should allow a second user to log in', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.charlie);
      await request(app.server).post('/api/register').send(testUsers.bob).expect(201);

      const result = await request(app.server).post('/api/login/player2').set('Cookie', cookies).send(testUsers.bob);

      expect(result.status).toBe(200);
      const cookieString = getCookies(result).find((c) => c.startsWith('player2_token='));
      const token = cookieString?.split(';')[0].split('=')[1]; // token value
      expect(token).toBeDefined();
    });

    it('POST /api/login/player2 without logged in to the app should fail', async () => {
      await request(app.server).post('/api/register').send(testUsers.bob).expect(201);
      const result = await request(app.server).post('/api/login/player2').send(testUsers.bob);

      expect(result.status).toBe(401);
      expect(result.body.error).toBeDefined();
    });

    it('POST /api/login/player2 with invalid credentials should fail', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.charlie);
      await request(app.server).post('/api/register').send(testUsers.bob).expect(201);
      const result = await request(app.server).post('/api/login/player2').set('Cookie', cookies).send({
        email: testUsers.bob.email,
        password: 'Invalid!',
      });

      expect(result.status).toBe(401);
      expect(result.body.error).toBeDefined();
    });
  });

  // LOGOUT
  describe('Logout', () => {
    it('clears both cookies when authenticated', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server).post('/api/logout').set('Cookie', cookies).expect(200);

      expect(res.body).toEqual({ ok: true });

      const setCookies = getCookies(res).join(';');
      expect(setCookies).toMatch(/accessToken=;/);
      expect(setCookies).toMatch(/refreshToken=;/);
    });

    it('revokes refresh token in database', async () => {
      const { user, cookies } = await createAuthenticatedUser(testUsers.alice);

      // Verify token is active
      const before = await prisma.refreshToken.findFirst({ where: { userId: user.id } });
      expect(before?.revoked).toBe(false);

      await request(app.server).post('/api/logout').set('Cookie', cookies).expect(200);

      // Verify token is revoked
      const after = await prisma.refreshToken.findFirst({ where: { userId: user.id } });
      expect(after?.revoked).toBe(true);
    });

    it('succeeds without cookies (clears access token only)', async () => {
      const res = await request(app.server).post('/api/logout').expect(200);

      expect(res.body).toEqual({ ok: true });

      const setCookies = getCookies(res).join(';');
      expect(setCookies).toMatch(/accessToken=;/);
      expect(setCookies).not.toMatch(/refreshToken=;/); // No refresh token to clear
    });
  });
});
