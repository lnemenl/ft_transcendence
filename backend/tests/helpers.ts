import request from 'supertest';
import { app, prisma } from './setup';
import crypto from 'crypto';
import { generateSecret, generate as totpGenerate } from '../src/services/totp.service';

// Extract cookies from response headers as an array. Handling both string and array formats from supertest
export const getCookies = (res: request.Response) => {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  return Array.isArray(cookies) ? cookies : [cookies];
};

//Get a specific cookie value by name, cookie[0] is the cookieName= and the splitting part...
// ...removes the '=' sign and gives us the cookie value without a name. (0 - name, 1 - value)
export const getCookie = (res: request.Response, name: string): string | undefined => {
  const cookies = getCookies(res);
  const cookie = cookies.find((c) => c.startsWith(`${name}=`));
  if (!cookie) return undefined;
  // For testing purposes. TO BE REMOVED LATER!
  // console.log(cookie);
  return cookie.split(';')[0].split('=')[1];
};

// Check if cookies contain a specific cookie name
export const hasCookie = (res: request.Response, name: string): boolean => {
  return getCookies(res).some((c) => c.startsWith(`${name}=`));
};

// Convenience test-only helper: get accessToken cookie value
export const getAccessToken = (res: request.Response): string | undefined => getCookie(res, 'accessToken');

// Register a new user and return the response
export const registerUser = async (userData: { email: string; password: string; username: string }) => {
  return request(app.server).post('/api/register').send(userData);
};

// Register and login a user, returning cookies and user data
export const createAuthenticatedUser = async (userData: { email: string; password: string; username: string }) => {
  // Register the test user. Tests may call this helper multiple times for the same
  // user, so allow the "already exists" case and fall through to login.
  // This keeps the helper simple while still being idempotent(an operation that can be repeated multiple times
  // without changing the result beyond the first time) for tests
  const regRes = await registerUser(userData);
  if (regRes.status !== 201) {
    const body = regRes.body as { error?: string } | undefined;
    // If body is null/undefined → stop and return undefined
    // Else if body.error is null/undefined → stop and return undefined
    if (!body?.error?.match(/already exists|username already taken/i)) {
      throw new Error(`Registration failed: ${regRes.status}`);
    }
  }

  // Login and return cookies + user record. Tests rely on cookie-based auth.
  const loginRes = await request(app.server).post('/api/login').send(userData);
  if (loginRes.status !== 200) throw new Error(`Login failed: ${loginRes.status}`);

  const user = await prisma.user.findUnique({ where: { email: userData.email } });
  if (!user) throw new Error('User not found after registration');

  return {
    user,
    cookies: getCookies(loginRes),
    accessToken: getCookie(loginRes, 'accessToken'),
    refreshToken: getCookie(loginRes, 'refreshToken'),
  };
};

export const enableUser2FA = async (userData: { email: string; password: string; username: string }) => {
  const { cookies } = await createAuthenticatedUser(userData);
  const genRes = await request(app.server).post('/api/2fa/generate').set('Cookie', cookies).expect(200);
  const secret: string = genRes.body.secret;
  const code = totpGenerate(secret);
  await request(app.server).post('/api/2fa/enable').set('Cookie', cookies).send({ SixDigitCode: code }).expect(200);
  return { cookies, secret };
};

export const loginUser = async (email: string, password: string) => {
  return request(app.server).post('/api/login').send({ email, password }).expect(200);
};

/**
 * Helper: Verify 2FA with a valid TOTP code (part of login flow after 2FA is enabled)
 * Takes the temporary twoFactorToken from login response and the user's secret
 * Returns authenticated response with accessToken and refreshToken cookies
 */
export const verify2FAToken = async (twoFactorToken: string, secret: string) => {
  const code = totpGenerate(secret);
  return request(app.server).post('/api/2fa/verify').send({ twoFactorToken, SixDigitCode: code }).expect(200);
};

/**
 * Helper: Create a user with 2FA already enabled in the database
 * Returns the secret so tests can generate valid TOTP codes
 */
export const createUser2FAEnabledInDB = async (userData: { email: string; password: string; username: string }) => {
  const { user } = await createAuthenticatedUser(userData);
  const secret = generateSecret();
  await prisma.user.update({
    where: { id: user.id },
    data: { isTwoFactorEnabled: true, twoFactorSecret: secret },
  });
  return secret;
};

// Sign a temporary two-factor JWT for tests (id + optional twoFactor flag)
export const signTwoFactorToken = async (payload: { id: string; twoFactor?: boolean }) => {
  const jwt = await import('jsonwebtoken');
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '5m' });
};

// export const cleanDatabase = async () => {
//   await prisma.refreshToken.deleteMany({});  // Delete child records first
//   await prisma.user.deleteMany({});          // Delete parent records second
// };

// Clean database between tests
export const cleanDatabase = async () => {
  try {
    // Use transaction to ensure atomicity
    await prisma.$transaction([
      prisma.friendRequest.deleteMany({}),
      prisma.tournament.deleteMany({}),
      prisma.game.deleteMany({}),
      prisma.refreshToken.deleteMany({}),
      prisma.user.deleteMany({}),
    ]);
  } catch (error) {
    // Re-throw with context to help debugging
    throw new Error(`Database cleanup failed: ${(error as Error).message}`);
  }
};

// Wait for a specified time (for token expiry tests)
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Create an expired refresh token in the database
export const createExpiredRefreshToken = async (userId: string): Promise<string> => {
  const raw = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(raw).digest('hex');

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt: new Date(Date.now() - 60_000), // Expired 1 minute ago
      revoked: false,
    },
  });

  return raw;
};
