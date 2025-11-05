/**
 * How TOTP works in tests:
 * - Generate secret with authenticator.generateSecret()
 * - Create 6-digit code with authenticator.generate(secret)
 * - Code changes every 30 seconds
 * - Server verifies code matches its calculation
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from '@jest/globals';
import { app, prisma } from '../setup';
import { cleanDatabase, createAuthenticatedUser, getCookies } from '../helpers';
import { testUsers } from '../fixtures';
import { TOTP } from 'otpauth';
import {
  generateSecret,
  generate as totpGenerate,
  verify as totpVerify,
  getOTPAuthUrl,
  generateQRCode,
} from '../../src/services/totp.service';

beforeEach(cleanDatabase);

describe('Two-Factor Authentication (2FA)', () => {
  it('generates a TOTP secret and QR code for logged-in user', async () => {
    const { cookies } = await createAuthenticatedUser(testUsers.alice);

    const res = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);

    expect(res.body.secret).toBeDefined();
    expect(res.body.otpauthUrl).toMatch(/^otpauth:\/\//);
    expect(res.body.qrCodeDataUrl).toMatch(/^data:image\//);
  });

  it('enables 2FA after verifying a valid token', async () => {
    const { cookies } = await createAuthenticatedUser(testUsers.alice);

    const gen = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
    const secret: string = gen.body.secret;

    // Generate current TOTP code (what Google Authenticator would show)
    const token = new TOTP({ secret }).generate();

    const enable = await request(app.server)
      .post('/api/2fa/enable')
      .set('Cookie', cookies)
      .send({ secret, token })
      .expect(200);

    expect(enable.body.enabled).toBe(true);

    const dbUser = await prisma.user.findUnique({ where: { email: testUsers.alice.email } });
    expect(dbUser?.isTwoFactorEnabled).toBe(true);
    expect(dbUser?.twoFactorSecret).toBe(secret);
  });

  /**
   * Test: Complete login flow with 2FA
   *
   * 1. User enables 2FA (generate + enable)
   * 2. User logs out (implicitly)
   * 3. User logs in with password
   * 4. Server requires 2FA (returns twoFactorToken, NOT access token)
   * 5. User enters TOTP code
   * 6. Server verifies code and issues real tokens
   * 7. User is fully logged in
   *
   * Cookies should ONLY be set after step 6 (2FA verified)
   */
  it('requires 2FA on login when enabled and completes after verify', async () => {
    // Step 1: Enable 2FA
    const { cookies } = await createAuthenticatedUser(testUsers.alice);
    const gen = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
    const secret: string = gen.body.secret;
    const token1 = new TOTP({ secret }).generate();
    await request(app.server)
      .post('/api/2fa/enable')
      .set('Cookie', cookies)
      .send({ secret, token: token1 })
      .expect(200);

    // Verify 2FA is enabled in database
    const dbUser2 = await prisma.user.findUnique({ where: { email: testUsers.alice.email } });
    expect(dbUser2?.isTwoFactorEnabled).toBe(true);

    // Step 2: Attempt login (only password)
    const loginRes = await request(app.server)
      .post('/api/login')
      .send({ email: testUsers.alice.email, password: testUsers.alice.password })
      .expect(200);

    // Step 3: Verify no cookies set yet (2FA not completed)
    const setCookiesHeader = loginRes.headers['set-cookie'];
    expect(setCookiesHeader).toBeUndefined();

    // Step 4: Verify response indicates 2FA required
    expect(loginRes.body.accessToken).toBeUndefined();
    expect(loginRes.body.twoFactorRequired).toBe(true);
    expect(loginRes.body.twoFactorToken).toBeDefined();

    // Step 5: Complete 2FA verification
    const code = new TOTP({ secret }).generate();

    const verifyRes = await request(app.server)
      .post('/api/2fa/verify')
      .send({ twoFactorToken: loginRes.body.twoFactorToken, code })
      .expect(200);

    // Step 6: Verify cookies ARE set now (2FA completed)
    const cookiesAfter = getCookies(verifyRes);
    expect(cookiesAfter.join(';')).toMatch(/accessToken=/);
    expect(cookiesAfter.join(';')).toMatch(/refreshToken=/);

    expect(verifyRes.body.ok).toBe(true);
  });

  it('rejects invalid 2FA token during enable and verify', async () => {
    const { cookies } = await createAuthenticatedUser(testUsers.alice);

    const gen = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
    const secret: string = gen.body.secret;

    // Try to enable with wrong code
    const wrongToken = '000000';
    await request(app.server)
      .post('/api/2fa/enable')
      .set('Cookie', cookies)
      .send({ secret, token: wrongToken })
      .expect(401);

    // Try to verify with invalid twoFactorToken
    await request(app.server).post('/api/2fa/verify').send({ twoFactorToken: 'bheeee', code: '123456' }).expect(401);
  });

  it('returns 400 on missing fields for enable/verify/disable', async () => {
    const { cookies } = await createAuthenticatedUser(testUsers.alice);

    // enable without secret/token
    await request(app.server).post('/api/2fa/enable').set('Cookie', cookies).send({}).expect(400);

    // verify without twoFactorToken/code
    await request(app.server).post('/api/2fa/verify').send({}).expect(400);

    // disable without code
    await request(app.server).post('/api/2fa/disable').set('Cookie', cookies).send({}).expect(400);
  });

  it('verify rejects when 2FA not enabled even with a twoFactorToken', async () => {
    const { user } = await createAuthenticatedUser(testUsers.alice);
    // create a twoFactorToken manually
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign({ id: user.id, twoFactor: true }, process.env.JWT_SECRET as string, { expiresIn: '5m' });

    await request(app.server).post('/api/2fa/verify').send({ twoFactorToken: token, code: '123456' }).expect(401);
  });

  it('generate returns 404 if authenticated user is deleted before request', async () => {
    const { cookies, user } = await createAuthenticatedUser(testUsers.alice);
    // delete the user after login (remove dependent tokens first)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

    const res = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(404);

    expect(res.body.error).toMatch(/user not found/i);
  });

  it('disables 2FA with valid code and rejects invalid code', async () => {
    const { cookies } = await createAuthenticatedUser(testUsers.alice);
    const gen = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
    const secret: string = gen.body.secret;
    const okCode = new TOTP({ secret }).generate();

    // enable first
    await request(app.server)
      .post('/api/2fa/enable')
      .set('Cookie', cookies)
      .send({ secret, token: okCode })
      .expect(200);

    // try to disable with wrong code
    await request(app.server).post('/api/2fa/disable').set('Cookie', cookies).send({ code: '000000' }).expect(401);

    // now disable with correct code
    const correctCode = new TOTP({ secret }).generate();
    const disableRes = await request(app.server)
      .post('/api/2fa/disable')
      .set('Cookie', cookies)
      .send({ code: correctCode })
      .expect(200);
    expect(disableRes.body.disabled).toBe(true);

    // DB should reflect disabled
    const dbUser = await prisma.user.findFirst({ where: { email: testUsers.alice.email } });
    expect(dbUser?.isTwoFactorEnabled).toBe(false);
    expect(dbUser?.twoFactorSecret).toBeNull();
  });

  it('verify returns 401 when twoFactor flag missing in token', async () => {
    const { user } = await createAuthenticatedUser(testUsers.alice);
    const jwt = await import('jsonwebtoken');
    // Create token without twoFactor flag
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '5m' });

    const res = await request(app.server)
      .post('/api/2fa/verify')
      .send({ twoFactorToken: token, code: '123456' })
      .expect(401);
    expect(res.body.error).toMatch(/invalid 2fa session/i);
  });

  it('verify returns 401 for wrong TOTP code with valid session', async () => {
    // Set up user with 2FA enabled
    const { cookies } = await createAuthenticatedUser(testUsers.alice);
    const gen = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
    const secret: string = gen.body.secret;
    const ok = new TOTP({ secret }).generate();
    await request(app.server).post('/api/2fa/enable').set('Cookie', cookies).send({ secret, token: ok }).expect(200);

    // Start login to get twoFactorToken
    const loginRes = await request(app.server)
      .post('/api/login')
      .send({ email: testUsers.alice.email, password: testUsers.alice.password })
      .expect(200);

    // wrong code on verify
    const res = await request(app.server)
      .post('/api/2fa/verify')
      .send({ twoFactorToken: loginRes.body.twoFactorToken, code: '000000' })
      .expect(401);
    expect(res.body.error).toMatch(/invalid 2fa token/i);
  });

  it('disable returns 400 when 2FA is not enabled', async () => {
    const { cookies } = await createAuthenticatedUser(testUsers.bob);
    const res = await request(app.server)
      .post('/api/2fa/disable')
      .set('Cookie', cookies)
      .send({ code: '123456' })
      .expect(400);
    expect(res.body.error).toMatch(/not enabled/i);
  });
});

/**
 * Small set of unit/edge tests for the TOTP service
 */
describe('TOTPService unit checks (embedded)', () => {
  it('generateSecret/generate/verify basic flow', () => {
    const secret = generateSecret();
    const code = totpGenerate(secret);
    expect(code).toMatch(/^\d{6}$/);
    expect(totpVerify(secret, code)).toBe(true);
    expect(totpVerify(secret, '000000')).toBe(false);
  });

  it('window tolerance and malformed tokens', () => {
    const secret = generateSecret();
    const totp = new TOTP({ secret });
    const now = totp.generate();
    expect(totpVerify(secret, now)).toBe(true);
    const prev = totp.generate({ timestamp: Date.now() - 30000 });
    expect(totpVerify(secret, prev)).toBe(true);
    const old = totp.generate({ timestamp: Date.now() - 90000 });
    expect(totpVerify(secret, old)).toBe(false);
    expect(totpVerify(secret, 'abc123')).toBe(false);
  });

  it('otpauth URL and QR code generation', async () => {
    const secret = generateSecret();
    const url = getOTPAuthUrl('alice', secret);
    expect(url.startsWith('otpauth://totp/')).toBe(true);
    const dataUrl = await generateQRCode('alice', secret);
    expect(dataUrl.startsWith('data:image/')).toBe(true);
  });

  it('verify returns false for malformed/empty secret', () => {
    expect(totpVerify('', '123456')).toBe(false);
    expect(totpVerify('!!!!', '123456')).toBe(false);
  });
});
