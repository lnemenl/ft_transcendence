import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { app, prisma } from '../setup';
import { testUsers } from '../fixtures';
import { cleanDatabase, createAuthenticatedUser, wait, createExpiredRefreshToken } from '../helpers';

beforeEach(cleanDatabase);

describe('Protected Routes', () => {
  // PROFILE ACCESS
  describe('GET /api/profile', () => {
    it('returns user info when authenticated', async () => {
      const { cookies, user } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server).get('/api/profile').set('Cookie', cookies).expect(200);

      expect(res.body.user).toMatchObject({
        email: user.email,
        username: user.username,
      });
    });

    it('rejects request without authentication', async () => {
      const res = await request(app.server).get('/api/profile').expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects malformed JWT token', async () => {
      const res = await request(app.server)
        .get('/api/profile')
        .set('Cookie', ['accessToken=invalid.jwt.token'])
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects JWT without user ID', async () => {
      const emptyToken = app.jwt.sign({}, { expiresIn: '1h' });

      const res = await request(app.server)
        .get('/api/profile')
        .set('Cookie', [`accessToken=${emptyToken}`])
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('returns 404 when authenticated user is deleted', async () => {
      const { cookies, user } = await createAuthenticatedUser(testUsers.alice);

      // Delete user from database
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });

      const res = await request(app.server).get('/api/profile').set('Cookie', cookies).expect(404);

      expect(res.body.error).toBe('User not found');
    });
  });

  // TOKEN REFRESH FLOW
  describe('Token Refresh', () => {
    it('refreshes access token when expired (using valid refresh token)', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      await wait(1500);

      // Request should succeed because refresh token is still valid
      const res = await request(app.server).get('/api/profile').set('Cookie', cookies).expect(200);

      // Should get new access token in response
      const setCookies = res.headers['set-cookie'];
      expect(setCookies).toBeDefined();
      expect(setCookies.toString()).toMatch(/accessToken=/);
      expect(res.body.user).toHaveProperty('email', testUsers.alice.email);
    });

    it('rejects request when access token expired and no refresh token', async () => {
      const { user } = await createAuthenticatedUser(testUsers.alice);

      // Create an expired access token
      const expiredToken = app.jwt.sign({ id: user.id }, { expiresIn: '1ms' });
      await wait(50);

      const res = await request(app.server)
        .get('/api/profile')
        .set('Cookie', [`accessToken=${expiredToken}`])
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects request when refresh token is revoked', async () => {
      const { cookies, user } = await createAuthenticatedUser(testUsers.alice);

      // Revoke refresh token
      await prisma.refreshToken.updateMany({
        where: { userId: user.id },
        data: { revoked: true },
      });

      // Wait for access token to expire
      await wait(1500);

      const res = await request(app.server).get('/api/profile').set('Cookie', cookies).expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects request when refresh token is expired', async () => {
      const { user } = await createAuthenticatedUser(testUsers.alice);

      // Create expired refresh token
      const expiredRefreshToken = await createExpiredRefreshToken(user.id);

      const res = await request(app.server)
        .get('/api/profile')
        .set('Cookie', [`accessToken=invalid`, `refreshToken=${expiredRefreshToken}`])
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });

    it('rejects request when refresh token is unknown', async () => {
      const res = await request(app.server)
        .get('/api/profile')
        .set('Cookie', [`accessToken=invalid`, `refreshToken=unknown_token_12345`])
        .expect(401);

      expect(res.body.error).toBe('Unauthorized');
    });
  });
});
