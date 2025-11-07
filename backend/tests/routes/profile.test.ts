import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { app, prisma } from '../setup';
import { testUsers } from '../fixtures';
import { cleanDatabase, createAuthenticatedUser } from '../helpers';

beforeEach(cleanDatabase);

describe('Profile Routes', () => {
  describe('GET /api/profile', () => {
    it('returns the authenticated user profile with 2FA status', async () => {
      const { cookies, user } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server).get('/api/profile').set('Cookie', cookies).expect(200);

      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(user.id);
      expect(res.body.user.email).toBe(testUsers.alice.email);
      expect(res.body.user.username).toBe(testUsers.alice.username);
      expect(res.body.user.isTwoFactorEnabled).toBe(false);
      expect(res.body.user.createdAt).toBeDefined();
      expect(res.body.user.updatedAt).toBeDefined();
      expect(res.body.user).not.toHaveProperty('password');
      expect(res.body.user).not.toHaveProperty('twoFactorSecret');
    });

    it('returns 401 when not authenticated', async () => {
      const res = await request(app.server).get('/api/profile').expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('returns 404 when user is deleted', async () => {
      const { cookies, user } = await createAuthenticatedUser(testUsers.alice);

      // Delete the user after getting the token
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });

      const res = await request(app.server).get('/api/profile').set('Cookie', cookies).expect(404);

      expect(res.body.error).toMatch(/not found/i);
    });

    it('shows 2FA enabled status after enabling 2FA', async () => {
      const { TOTP } = await import('otpauth');
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      // Enable 2FA
      const gen = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret: string = gen.body.secret;
      const token = new TOTP({ secret }).generate();
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', cookies)
        .send({ secret, SixDigitCode: token })
        .expect(200);

      // Check profile now shows 2FA enabled
      const res = await request(app.server).get('/api/profile').set('Cookie', cookies).expect(200);

      expect(res.body.user.isTwoFactorEnabled).toBe(true);
      expect(res.body.user).not.toHaveProperty('twoFactorSecret');
    });
  });
});
