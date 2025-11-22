import request from 'supertest';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { app, prisma } from '../setup';
import {
  cleanDatabase,
  createAuthenticatedUser,
  getCookies,
  loginUser,
  createUser2FAEnabledInDB,
  signTwoFactorToken,
} from '../helpers';
import { testUsers } from '../fixtures';
import {
  generateSecret,
  generate as totpGenerate,
  verify as totpVerify,
  getOTPAuthUrl,
  generateQRCode,
} from '../../src/services/totp.service';
import { TOTP } from 'otpauth';

beforeEach(cleanDatabase);

describe('Two-Factor Authentication (2FA)', () => {
  describe('generate', () => {
    it('generates a TOTP secret and QR code for logged-in user', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const res = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      expect(res.body.secret).toBeDefined();
      expect(res.body.otpauthUrl).toMatch(/^otpauth:\/\//);
      expect(res.body.qrCodeDataUrl).toMatch(/^data:image\//);
    });

    it('stores the secret in the database when generating', async () => {
      const { cookies, user } = await createAuthenticatedUser(testUsers.alice);
      const res = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret = res.body.secret;

      // Verify the secret is stored in the database
      const userAfterGenerate = await prisma.user.findUnique({ where: { id: user.id } });
      expect(userAfterGenerate?.twoFactorSecret).toBe(secret);
      expect(userAfterGenerate?.isTwoFactorEnabled).toBe(false); // Not enabled yet
    });

    it('returns an error if authenticated user no longer exists', async () => {
      const { cookies, user } = await createAuthenticatedUser(testUsers.alice);
      await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
      await prisma.user.delete({ where: { id: user.id } });
      const res = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies);
      expect([401, 404]).toContain(res.status);
      expect(res.body.error).toBeDefined();
    });

    it('returns 500 when database fails during generate', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const updateSpy = jest.spyOn(prisma.user, 'update').mockRejectedValueOnce(new Error('Database error'));
      const res = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
      updateSpy.mockRestore();
    });
  });

  describe('enable', () => {
    it('enables 2FA after verifying a valid TOTP code', async () => {
      // Step 1: Register and login to get authenticated cookies
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      // Step 2: Generate a 2FA secret and QR code (secret is stored in DB)
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret = genRes.body.secret;

      // Step 3: Enable 2FA by sending a valid TOTP code
      const validCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: validCode })
        .expect(200);

      // Step 4: Verify in the database that 2FA is now enabled with the secret stored
      const userAfterEnable = await prisma.user.findUnique({ where: { email: testUsers.alice.email } });
      expect(userAfterEnable?.isTwoFactorEnabled).toBe(true);
      expect(userAfterEnable?.twoFactorSecret).toBe(secret);
    });

    it('rejects invalid TOTP codes during enable', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);

      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: '000000' })
        .expect(401);
    });

    it('returns 400 if /generate was not called first', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);

      const res = await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: '123456' })
        .expect(400);

      expect(res.body.error).toMatch(/generate first/i);
    });

    it('returns 500 when database fails during enable', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret = genRes.body.secret;
      const updateSpy = jest.spyOn(prisma.user, 'update').mockRejectedValueOnce(new Error('Database error'));
      const code = totpGenerate(secret);
      const res = await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: code })
        .expect(500);
      expect(res.body).toHaveProperty('error');
      updateSpy.mockRestore();
    });
  });

  describe('verify', () => {
    it('requires 2FA on login and completes after verification', async () => {
      // Step 1: Enable 2FA for alice
      const { cookies: enableCookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', enableCookies).expect(200);
      const secret = genRes.body.secret;
      const enableCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', enableCookies)
        .send({ SixDigitCode: enableCode })
        .expect(200);

      // Step 2: Login alice - should require 2FA
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);
      expect(loginRes.body.twoFactorRequired).toBe(true);
      expect(loginRes.body.twoFactorToken).toBeDefined();

      // Step 3: Verify 2FA with valid code
      const verifyCode = totpGenerate(secret);
      const verifyRes = await request(app.server)
        .post('/api/2fa/verify')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: verifyCode })
        .expect(200);

      // Step 4: Check that authentication cookies are set
      const cookies = getCookies(verifyRes);
      expect(cookies.join(';')).toMatch(/accessToken=/);
      expect(cookies.join(';')).toMatch(/refreshToken=/);
      expect(verifyRes.body).toHaveProperty('id');
      expect(verifyRes.body).toHaveProperty('username');
      expect(verifyRes.body).toHaveProperty('avatarUrl');
    });

    it('rejects malformed twoFactorToken', async () => {
      await request(app.server)
        .post('/api/2fa/verify')
        .send({ twoFactorToken: 'not-a-jwt', SixDigitCode: '123456' })
        .expect(401);
    });

    it('rejects when twoFactor flag is missing in token', async () => {
      const { user } = await createAuthenticatedUser(testUsers.charlie);
      const jwt = await import('jsonwebtoken');
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '5m' });
      const res = await request(app.server)
        .post('/api/2fa/verify')
        .send({ twoFactorToken: token, SixDigitCode: '123456' })
        .expect(401);
      expect(res.body.error).toMatch(/invalid 2fa session/i);
    });

    it('rejects when 2FA not enabled even with twoFactor flag', async () => {
      const { user } = await createAuthenticatedUser(testUsers.charlie);
      const jwt = await import('jsonwebtoken');
      const token = jwt.sign({ id: user.id, twoFactor: true }, process.env.JWT_SECRET as string, {
        expiresIn: '5m',
      });
      await request(app.server)
        .post('/api/2fa/verify')
        .send({ twoFactorToken: token, SixDigitCode: '123456' })
        .expect(401);
    });

    it('rejects wrong TOTP code with valid session', async () => {
      // Enable 2FA for alice
      const { cookies: enableCookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', enableCookies).expect(200);
      const secret = genRes.body.secret;
      const enableCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', enableCookies)
        .send({ SixDigitCode: enableCode })
        .expect(200);

      // Login and try invalid code
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);
      await request(app.server)
        .post('/api/2fa/verify')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: '000000' })
        .expect(401);
    });

    it('returns 500 when database fails during verify', async () => {
      const secret = await createUser2FAEnabledInDB(testUsers.alice);
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);
      const findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('Database error'));
      const code = totpGenerate(secret);
      const res = await request(app.server)
        .post('/api/2fa/verify')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: code })
        .expect(500);
      expect(res.body).toHaveProperty('error');
      findUniqueSpy.mockRestore();
    });
  });

  describe('player2', () => {
    it('login flow for a user with 2FA enabled in database (guest login)', async () => {
      // Step 1: Create bob with 2FA enabled directly in database
      const secret = await createUser2FAEnabledInDB(testUsers.bob);

      // Step 2: Login bob - should require 2FA
      const loginRes = await loginUser(testUsers.bob.email, testUsers.bob.username, testUsers.bob.password);
      expect(loginRes.body.twoFactorRequired).toBe(true);
      expect(loginRes.body.twoFactorToken).toBeDefined();

      // Step 3: Verify 2FA with valid code
      const verifyCode = totpGenerate(secret);
      const verifyRes = await request(app.server)
        .post('/api/2fa/verify')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: verifyCode })
        .expect(200);

      // Step 4: Check authentication cookies are set
      const cookies = getCookies(verifyRes);
      expect(cookies.join(';')).toMatch(/accessToken=/);
      expect(cookies.join(';')).toMatch(/refreshToken=/);
    });

    it('verify/player2 sets player2_token cookie on success', async () => {
      // Step 1: Enable 2FA for alice
      const { cookies: enableCookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', enableCookies).expect(200);
      const secret = genRes.body.secret;
      const enableCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', enableCookies)
        .send({ SixDigitCode: enableCode })
        .expect(200);

      // Step 2: Login alice - get twoFactorToken
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);

      // Step 3: Verify 2FA with /player2 endpoint - should set Player2Token
      const verifyCode = totpGenerate(secret);
      const player2Res = await request(app.server)
        .post('/api/2fa/verify/player2')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: verifyCode })
        .expect(200);

      const cookies = getCookies(player2Res);
      expect(cookies.find((c) => c.startsWith('player2_token='))).toBeDefined();
      expect(player2Res.body).toHaveProperty('id');
      expect(player2Res.body).toHaveProperty('username');
      expect(cookies.find((c) => c.startsWith('refreshToken='))).toBeUndefined();
      expect(cookies.find((c) => c.startsWith('accessToken='))).toBeUndefined();
    });

    it('verify/player2 rejects invalid TOTP code', async () => {
      // Enable 2FA for alice
      const { cookies: enableCookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', enableCookies).expect(200);
      const secret = genRes.body.secret;
      const enableCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', enableCookies)
        .send({ SixDigitCode: enableCode })
        .expect(200);

      // Login and try invalid code
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);
      await request(app.server)
        .post('/api/2fa/verify/player2')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: '000000' })
        .expect(401);
    });

    it('verify/player2 rejects malformed token', async () => {
      await request(app.server)
        .post('/api/2fa/verify/player2')
        .send({ twoFactorToken: 'not-a-jwt', SixDigitCode: '123456' })
        .expect(401);
    });

    it('verify/player2 rejects when twoFactor flag is missing', async () => {
      const { user } = await createAuthenticatedUser(testUsers.charlie);
      const tokenMissingFlag = await signTwoFactorToken({ id: user.id });
      const res = await request(app.server)
        .post('/api/2fa/verify/player2')
        .send({ twoFactorToken: tokenMissingFlag, SixDigitCode: '123456' })
        .expect(401);
      expect(res.body.error).toMatch(/invalid 2fa session/i);
    });

    it('verify/player2 rejects when 2FA not enabled on user', async () => {
      const { user } = await createAuthenticatedUser(testUsers.charlie);
      const tokenWithFlag = await signTwoFactorToken({ id: user.id, twoFactor: true });
      await request(app.server)
        .post('/api/2fa/verify/player2')
        .send({ twoFactorToken: tokenWithFlag, SixDigitCode: '123456' })
        .expect(401);
    });

    it('returns 500 when database fails during verify/player2', async () => {
      const secret = await createUser2FAEnabledInDB(testUsers.alice);
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);
      const findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('Database error'));
      const code = totpGenerate(secret);
      const res = await request(app.server)
        .post('/api/2fa/verify/player2')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: code })
        .expect(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
      findUniqueSpy.mockRestore();
    });
  });

  describe('tournament', () => {
    it('login flow for a user with 2FA enabled in database (guest login)', async () => {
      // Step 1: Create bob with 2FA enabled directly in database
      const secret = await createUser2FAEnabledInDB(testUsers.bob);

      // Step 2: Login bob - should require 2FA
      const loginRes = await loginUser(testUsers.bob.email, testUsers.bob.username, testUsers.bob.password);
      expect(loginRes.body.twoFactorRequired).toBe(true);
      expect(loginRes.body.twoFactorToken).toBeDefined();

      // Step 3: Verify 2FA with valid code
      const verifyCode = totpGenerate(secret);
      const verifyRes = await request(app.server)
        .post('/api/2fa/verify')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: verifyCode })
        .expect(200);

      // Step 4: Check authentication cookies are set
      const cookies = getCookies(verifyRes);
      expect(cookies.join(';')).toMatch(/accessToken=/);
      expect(cookies.join(';')).toMatch(/refreshToken=/);
    });

    it('verify/tournament sends user information', async () => {
      // Step 1: Enable 2FA for alice
      const { cookies: enableCookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', enableCookies).expect(200);
      const secret = genRes.body.secret;
      const enableCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', enableCookies)
        .send({ SixDigitCode: enableCode })
        .expect(200);

      // Step 2: Login alice - get twoFactorToken
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);

      // Step 3: Verify 2FA with /player2 endpoint - should set Player2Token
      const verifyCode = totpGenerate(secret);
      const tournamentRes = await request(app.server)
        .post('/api/2fa/verify/tournament')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: verifyCode })
        .expect(200);

      const cookies = getCookies(tournamentRes);
      expect(cookies.find((c) => c.startsWith('refreshToken='))).toBeUndefined();
      expect(cookies.find((c) => c.startsWith('accessToken='))).toBeUndefined();
      expect(tournamentRes.body).toHaveProperty('id');
      expect(tournamentRes.body).toHaveProperty('username');
      expect(tournamentRes.body).toHaveProperty('avatarUrl');
    });

    it('verify/tournament rejects invalid TOTP code', async () => {
      // Enable 2FA for alice
      const { cookies: enableCookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', enableCookies).expect(200);
      const secret = genRes.body.secret;
      const enableCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', enableCookies)
        .send({ SixDigitCode: enableCode })
        .expect(200);

      // Login and try invalid code
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);
      await request(app.server)
        .post('/api/2fa/verify/tournament')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: '000000' })
        .expect(401);
    });

    it('verify/tournament rejects malformed token', async () => {
      await request(app.server)
        .post('/api/2fa/verify/tournament')
        .send({ twoFactorToken: 'not-a-jwt', SixDigitCode: '123456' })
        .expect(401);
    });

    it('verify/tournament rejects when twoFactor flag is missing', async () => {
      const { user } = await createAuthenticatedUser(testUsers.charlie);
      const tokenMissingFlag = await signTwoFactorToken({ id: user.id });
      const res = await request(app.server)
        .post('/api/2fa/verify/tournament')
        .send({ twoFactorToken: tokenMissingFlag, SixDigitCode: '123456' })
        .expect(401);
      expect(res.body.error).toMatch(/invalid 2fa session/i);
    });

    it('verify/tournament rejects when 2FA not enabled on user', async () => {
      const { user } = await createAuthenticatedUser(testUsers.charlie);
      const tokenWithFlag = await signTwoFactorToken({ id: user.id, twoFactor: true });
      await request(app.server)
        .post('/api/2fa/verify/tournament')
        .send({ twoFactorToken: tokenWithFlag, SixDigitCode: '123456' })
        .expect(401);
    });

    it('returns 500 when database fails during verify/tournament', async () => {
      const secret = await createUser2FAEnabledInDB(testUsers.alice);
      const loginRes = await loginUser(testUsers.alice.email, testUsers.alice.username, testUsers.alice.password);
      const findUniqueSpy = jest.spyOn(prisma.user, 'findUnique').mockRejectedValueOnce(new Error('Database error'));
      const code = totpGenerate(secret);
      const res = await request(app.server)
        .post('/api/2fa/verify/tournament')
        .send({ twoFactorToken: loginRes.body.twoFactorToken, SixDigitCode: code })
        .expect(500);
      expect(res.body).toHaveProperty('error', 'Internal server error');
      findUniqueSpy.mockRestore();
    });
  });

  describe('disable', () => {
    it('disables 2FA with valid TOTP code and updates database', async () => {
      // Step 1: Enable 2FA for alice
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret = genRes.body.secret;
      const enableCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: enableCode })
        .expect(200);

      // Step 2: Try disable with wrong code - should fail
      await request(app.server)
        .post('/api/2fa/disable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: '000000' })
        .expect(401);

      // Step 3: Disable with correct code - should succeed
      const disableCode = totpGenerate(secret);
      const disableRes = await request(app.server)
        .post('/api/2fa/disable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: disableCode })
        .expect(200);
      expect(disableRes.body.disabled).toBe(true);

      // Step 4: Verify in database that 2FA is now disabled
      const userAfterDisable = await prisma.user.findUnique({ where: { email: testUsers.alice.email } });
      expect(userAfterDisable?.isTwoFactorEnabled).toBe(false);
      expect(userAfterDisable?.twoFactorSecret).toBeNull();
    });

    it('returns 400 when trying to disable 2FA that is not enabled', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.charlie);
      const res = await request(app.server)
        .post('/api/2fa/disable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: '123456' })
        .expect(400);
      expect(res.body.error).toMatch(/not enabled/i);
    });

    it('returns 500 when database fails during disable', async () => {
      const { cookies } = await createAuthenticatedUser(testUsers.alice);
      const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
      const secret = genRes.body.secret;
      const enableCode = totpGenerate(secret);
      await request(app.server)
        .post('/api/2fa/enable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: enableCode })
        .expect(200);
      const updateSpy = jest.spyOn(prisma.user, 'update').mockRejectedValueOnce(new Error('Database error'));
      const code = totpGenerate(secret);
      const res = await request(app.server)
        .post('/api/2fa/disable')
        .set('Cookie', cookies)
        .send({ SixDigitCode: code })
        .expect(500);
      expect(res.body).toHaveProperty('error');
      updateSpy.mockRestore();
    });
  });
});

describe('TOTPService unit checks (small)', () => {
  it('basic generate/verify', () => {
    const secret = generateSecret();
    const code = totpGenerate(secret);
    expect(code).toMatch(/^[0-9]{6}$/);
    expect(totpVerify(secret, code)).toBe(true);
  });

  it('strict token validation with no window tolerance', () => {
    const secret = generateSecret();
    const totp = new TOTP({ secret });
    const now = totp.generate();
    expect(totpVerify(secret, now)).toBe(true);
    // With window=0, tokens from previous time-steps are rejected
    const prev = totp.generate({ timestamp: Date.now() - 30000 });
    expect(totpVerify(secret, prev)).toBe(false);
    const old = totp.generate({ timestamp: Date.now() - 90000 });
    expect(totpVerify(secret, old)).toBe(false);
    expect(totpVerify(secret, 'abc123')).toBe(false);
  });

  it('verify returns false for malformed/empty secret', () => {
    expect(totpVerify('', '123456')).toBe(false);
    expect(totpVerify('!!!!', '123456')).toBe(false);
  });

  it('otpauth URL and QR code generation', async () => {
    const secret = generateSecret();
    const url = getOTPAuthUrl('alice', secret);
    expect(url.startsWith('otpauth://totp/')).toBe(true);
    const dataUrl = await generateQRCode('alice', secret);
    expect(dataUrl.startsWith('data:image/')).toBe(true);
  });
});
