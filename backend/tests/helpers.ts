import request from 'supertest';
import { app, prisma } from './setup';

// Extract cookies from response headers as an array. Handling both string and array formats from supertest
export const getCookies = (res: request.Response): string[] => {
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

// Register a new user and return the response
export const registerUser = async (userData: { email: string; password: string; username: string }) => {
  return request(app.server).post('/api/register').send(userData);
};

// Register and login a user, returning cookies and user data
export const createAuthenticatedUser = async (userData: { email: string; password: string; username: string }) => {
  // Register
  const regRes = await registerUser(userData);
  if (regRes.status !== 201) throw new Error(`Registration failed: ${regRes.status}`);

  // Login
  const loginRes = await request(app.server).post('/api/login').send(userData);
  if (loginRes.status !== 200) throw new Error(`Login failed: ${loginRes.status}`);

  // Get user from DB
  const user = await prisma.user.findUnique({ where: { email: userData.email } });
  if (!user) throw new Error('User not found after registration');

  return {
    user,
    cookies: getCookies(loginRes),
    accessToken: getCookie(loginRes, 'accessToken'),
    refreshToken: getCookie(loginRes, 'refreshToken'),
  };
};

// export const cleanDatabase = async () => {
//   await prisma.refreshToken.deleteMany({});  // Delete child records first
//   await prisma.user.deleteMany({});          // Delete parent records second
// };

// Clean database between tests
export const cleanDatabase = async () => {
  try {
    // Use transaction to ensure atomicity
    await prisma.$transaction([prisma.refreshToken.deleteMany({}), prisma.user.deleteMany({})]);
  } catch (error) {
    // Re-throw with context to help debugging
    throw new Error(`Database cleanup failed: ${(error as Error).message}`);
  }
};

// Wait for a specified time (for token expiry tests)
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Create an expired refresh token in the database
export const createExpiredRefreshToken = async (userId: string): Promise<string> => {
  const crypto = await import('crypto');
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
