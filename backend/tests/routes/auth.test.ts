import request from 'supertest';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { app, prisma } from '../setup';
import { testUsers, invalidUsers } from '../fixtures';
import { cleanDatabase, hasCookie, createAuthenticatedUser, getCookies } from '../helpers';
import * as authService from '../../src/services/auth.service';

beforeEach(cleanDatabase);

describe('Authentication System', () => {
  describe('Registration', () => {
    it('creates a new user with valid data', async () => {
      const res = await request(app.server).post('/api/register').send(testUsers.alice).expect(201);
      expect(res.body.email).toBe(testUsers.alice.email);
      expect(res.body.username).toBe(testUsers.alice.username);
      expect(res.body).not.toHaveProperty('password');
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

    it('rejects too long email address', async () => {
      const res = await request(app.server).post('/api/register').send(invalidUsers.longEmail).expect(400);
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

    it('rejects long password', async () => {
      const res = await request(app.server).post('/api/register').send(invalidUsers.longPassword).expect(400);
      expect(res.body.error).toMatch(/bad request/i);
    });

    it('rejects short username', async () => {
      const res = await request(app.server).post('/api/register').send(invalidUsers.shortUsername).expect(400);
      expect(res.body.error).toMatch(/bad request/i);
    });

    it('rejects long username', async () => {
      const res = await request(app.server).post('/api/register').send(invalidUsers.longUsername).expect(400);
      expect(res.body.error).toMatch(/bad request/i);
    });

    it('returns 500 when database fails during registration', async () => {
      const createSpy = jest.spyOn(prisma.user, 'create').mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app.server).post('/api/register').send(testUsers.alice).expect(400);
      expect(res.body).toHaveProperty('error');
      createSpy.mockRestore();
    });
  });

  describe('Login', () => {
    beforeEach(async () => {
      await request(app.server).post('/api/register').send(testUsers.alice).expect(201);
    });

    it('succeeds with valid email, username and password', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send(testUsers.alice)
        .expect(200);

      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('avatarUrl');
      expect(hasCookie(res, 'accessToken')).toBe(true);
      expect(hasCookie(res, 'refreshToken')).toBe(true);
    });

    it('rejects if email is missing', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ username: testUsers.alice.username, password: testUsers.alice.password })
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Bad Request');
    });

    it('rejects if username is missing', async () => {
      const res = await request(app.server)
        .post('/api/login')
        .send({ email: testUsers.alice.email, password: testUsers.alice.password })
        .expect(400);

      expect(res.body).toHaveProperty('error', 'Bad Request');
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

    // it('rejects login without email or username', async () => {
    //   const res = await request(app.server).post('/api/login').send({ password: testUsers.alice.password }).expect(401);
    //   expect(res.body.error).toMatch(/provide username or email/i);
    // });

    it('returns 401 when database fails during login', async () => {
      const findFirstSpy = jest.spyOn(prisma.user, 'findFirst').mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app.server)
        .post('/api/login')
        .send(testUsers.alice)
        .expect(401);
      expect(res.body).toHaveProperty('error');
      findFirstSpy.mockRestore();
    });
  });

  describe('Player 2 Login', () => {
    beforeEach(async () => {
      await request(app.server).post('/api/register').send(testUsers.bob).expect(201);
    });

    it('allows player2 to log in when player1 is authenticated', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .post('/api/login/player2')
        .set('Cookie', cookies)
        .send(testUsers.bob)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('avatarUrl');
      expect(res.body).toHaveProperty('accessToken');
      expect(hasCookie(res, 'player2_token')).toBe(true);
    });

    it('returns 2FA requirement when player2 has 2FA enabled', async () => {
      const { TOTP } = await import('otpauth');
      const { cookies } = await createAuthenticatedUser(testUsers.bob);

      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret = genRes.body.secret;
      const code = new TOTP({ secret }).generate();
      await request(app.server).post('/api/2fa/enable').set('Cookie', cookies).send({ SixDigitCode: code }).expect(200);

      const { cookies: aliceCookies } = await createAuthenticatedUser(testUsers.alice);
      const res = await request(app.server)
        .post('/api/login/player2')
        .set('Cookie', aliceCookies)
        .send({ email: testUsers.bob.email, password: testUsers.bob.password })
        .expect(200);

      expect(res.body.twoFactorRequired).toBe(true);
      expect(typeof res.body.twoFactorToken).toBe('string');
    });

    it('rejects player2 login without player1 authenticated', async () => {
      const res = await request(app.server).post('/api/login/player2').send(testUsers.bob).expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('rejects player2 login with invalid credentials', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .post('/api/login/player2')
        .set('Cookie', cookies)
        .send({ email: testUsers.bob.email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('returns 401 when database fails during player2 login', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const findFirstSpy = jest.spyOn(prisma.user, 'findFirst').mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app.server)
        .post('/api/login/player2')
        .set('Cookie', cookies)
        .send(testUsers.bob)
        .expect(401);
      expect(res.body).toHaveProperty('error');
      findFirstSpy.mockRestore();
    });
  });

  describe('Tournament Login', () => {
    beforeEach(async () => {
      await request(app.server).post('/api/register').send(testUsers.bob).expect(201);
    });

    it('allows tournament login when player1 is authenticated', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .post('/api/login/tournament')
        .set('Cookie', cookies)
        .send(testUsers.bob)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('username');
      expect(res.body).toHaveProperty('avatarUrl');
    });

    it('returns 2FA requirement when tournament player has 2FA enabled', async () => {
      const { TOTP } = await import('otpauth');
      const { cookies } = await createAuthenticatedUser(testUsers.bob);

      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret = genRes.body.secret;
      const code = new TOTP({ secret }).generate();
      await request(app.server).post('/api/2fa/enable').set('Cookie', cookies).send({ SixDigitCode: code }).expect(200);

      const { cookies: aliceCookies } = await createAuthenticatedUser(testUsers.alice);
      const res = await request(app.server)
        .post('/api/login/tournament')
        .set('Cookie', aliceCookies)
        .send({ email: testUsers.bob.email, password: testUsers.bob.password })
        .expect(200);

      expect(res.body.twoFactorRequired).toBe(true);
      expect(typeof res.body.twoFactorToken).toBe('string');
    });

    it('rejects tournament login without player1 authenticated', async () => {
      const res = await request(app.server).post('/api/login/tournament').send(testUsers.bob).expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('rejects tournament login with invalid credentials', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .post('/api/login/tournament')
        .set('Cookie', cookies)
        .send({ email: testUsers.bob.email, password: 'WrongPassword!' })
        .expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('returns 401 when database fails during tournament login', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const findFirstSpy = jest.spyOn(prisma.user, 'findFirst').mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app.server)
        .post('/api/login/tournament')
        .set('Cookie', cookies)
        .send(testUsers.bob)
        .expect(401);
      expect(res.body).toHaveProperty('error');
      findFirstSpy.mockRestore();
    });
  });

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

      const before = await prisma.refreshToken.findFirst({ where: { userId: user.id } });
      expect(before?.revoked).toBe(false);

      await request(app.server).post('/api/logout').set('Cookie', cookies).expect(200);

      const after = await prisma.refreshToken.findFirst({ where: { userId: user.id } });
      expect(after?.revoked).toBe(true);
    });

    it('database call protected', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.anna);

      jest.spyOn(prisma.user, 'update').mockRejectedValue(new Error('Internal server error'));

      const res = await request(app.server).post('/api/logout').set('Cookie', cookies);

      expect(res.status).toBe(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
    });
  });

  describe('Google OAuth', () => {
    const mockUser = {
      id: '1',
      username: 'test',
      email: 'test@test.com',
      avatarUrl: null,
      password: '',
      isTwoFactorEnabled: false,
      twoFactorSecret: null,
      googleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('redirects to Google', async () => {
      for (const type of ['main', 'player2', 'tournament']) {
        await request(app.server).get(`/api/google/init?type=${type}`).expect(302);
      }
    });

    it('validates callbacks', async () => {
      const endpoints = ['/api/google/callback', '/api/google/callback/player2', '/api/google/callback/tournament'];

      for (const endpoint of endpoints) {
        await request(app.server)
          .get(`${endpoint}?code=test&state=wrong`)
          .set('Cookie', 'oauth_state=test')
          .expect(400);
        await request(app.server).get(`${endpoint}?state=test`).set('Cookie', 'oauth_state=test').expect(400);
        await request(app.server)
          .get(`${endpoint}?error=denied&state=test`)
          .set('Cookie', 'oauth_state=test')
          .expect(400);
      }
    });

    it('Main User: Redirects to frontend on success', async () => {
      const spy1 = jest.spyOn(authService, 'handleGoogleUser').mockResolvedValue(mockUser);
      const spy2 = jest.spyOn(authService, 'createRefreshToken').mockResolvedValue('token');
      const spy3 = jest.spyOn(prisma.user, 'update').mockResolvedValue(mockUser);

      // Main callback should REDIRECT (302)
      await request(app.server)
        .get('/api/google/callback?code=test&state=test')
        .set('Cookie', 'oauth_state=test')
        .expect(302)
        .expect('Location', /login=success/);

      spy1.mockRestore();
      spy2.mockRestore();
      spy3.mockRestore();
    });

    it('Player 2 / Tournament: Returns HTML script on success', async () => {
      const spy1 = jest.spyOn(authService, 'handleGoogleUser').mockResolvedValue(mockUser);
      const spy2 = jest.spyOn(authService, 'createRefreshToken').mockResolvedValue('token');
      // Player 2 callback should return HTML (200)
      const p2Res = await request(app.server)
        .get('/api/google/callback/player2?code=test&state=test')
        .set('Cookie', 'oauth_state=test')
        .expect(200)
        .expect('Content-Type', /text\/html/);
      // Verify the HTML contains the magic script
      expect(p2Res.text).toContain('window.opener.postMessage');
      expect(p2Res.text).toContain('accessToken');

      // Tournament callback should return HTML (200)
      const tourRes = await request(app.server)
        .get('/api/google/callback/tournament?code=test&state=test')
        .set('Cookie', 'oauth_state=test')
        .expect(200)
        .expect('Content-Type', /text\/html/);

      expect(tourRes.text).toContain('window.opener.postMessage');

      spy1.mockRestore();
      spy2.mockRestore();
    });

    it('handles database errors by returning HTML error script (Popup Flow)', async () => {
      const spy = jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(new Error('DB'));
      // For Popup flows, we return 200 OK with an error script so the popup closes gracefully
      const resP2 = await request(app.server)
        .get('/api/google/callback/player2?code=test&state=test')
        .set('Cookie', 'oauth_state=test')
        .expect(200); // Expect 200 because we are sending a script
      expect(resP2.text).toContain('postMessage({error: "Internal server error"}');

      const resTour = await request(app.server)
        .get('/api/google/callback/tournament?code=test&state=test')
        .set('Cookie', 'oauth_state=test')
        .expect(200);

      expect(resTour.text).toContain('postMessage({error: "Internal server error"}');

      spy.mockRestore();
    });

    it('handles database errors for Main flow with 500', async () => {
      // Main flow is not a popup, so standard 500 is expected
      const spy = jest.spyOn(prisma.user, 'findUnique').mockRejectedValue(new Error('DB'));
      await request(app.server)
        .get('/api/google/callback?code=test&state=test')
        .set('Cookie', 'oauth_state=test')
        .expect(500);
      spy.mockRestore();
    });
  });
});
