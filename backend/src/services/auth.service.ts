import { prisma } from '../utils/prisma';
import bcrypt from 'bcrypt';
import { FastifyReply } from 'fastify';
import crypto from 'crypto';
import { getAccessTokenExpiresIn } from '../config';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

const SALT_ROUNDS = 10;

const generateRawRefreshToken = (bytes = 48) => {
  return crypto.randomBytes(bytes).toString('base64url');
};

const hashRefreshToken = (raw: string) => {
  return crypto.createHash('sha256').update(raw).digest('hex');
};

export const createRefreshToken = async (userId: string) => {
  const days = 14;
  const raw = generateRawRefreshToken();
  const tokenHash = hashRefreshToken(raw);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  await prisma.refreshToken.create({
    data: {
      tokenHash,
      userId,
      expiresAt,
    },
  });
  return raw;
};

export const verifyRefreshToken = async (raw: string) => {
  const tokenHash = hashRefreshToken(raw);
  const rec = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  /* istanbul ignore next */
  if (!rec || rec.revoked || rec.expiresAt < new Date()) {
    if (rec) await prisma.user.update({ where: { id: rec.id }, data: { isOnline: false } });
    return null;
  }
  return rec;
};

export const registerUser = async (email: string, password: string, username: string) => {
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  // Ensuring email or username isn't already taken.
  const existing = await prisma.user.findFirst({
    where: {
      OR: [{ email: normalizedEmail }, { username: normalizedUsername }],
    },
  });

  if (existing) {
    if (existing.email === normalizedEmail) {
      throw new Error('User with this email already exists');
    }
    throw new Error('Username already taken');
  }

  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

  // Create a new user in the database
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      username: normalizedUsername,
    },
  });

  // Do not return the hashed password in the response
  const { password: _userPasswordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

interface loginBody {
  email?: string;
  username?: string;
  password: string;
}

export const loginUser = async (body: loginBody, reply: FastifyReply) => {
  const email = body.email?.trim().toLowerCase();
  const username = body.username?.trim();

  if (!email && !username) throw new Error('Provide username or email');

  // Look up by email or username in a single query
  const whereConditions = [];
  if (email) whereConditions.push({ email });
  if (username) whereConditions.push({ username });

  const user = await prisma.user.findFirst({ where: { OR: whereConditions } });

  if (!user) throw new Error('Invalid email or password');

  const isPasswordValid = bcrypt.compareSync(body.password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');

  // If user has 2FA enabled, don't issue tokens yet
  if (user.isTwoFactorEnabled) {
    // User has 2FA enabled
    // Do NOT issue access/refresh tokens yet
    // Issue temporary token that proves password was correct
    const twoFactorToken = await reply.jwtSign(
      {
        id: user.id,
        twoFactor: true, // Special flag: This is NOT a regular access token
      },
      { expiresIn: '5m' }, // Short expiry: User must complete 2FA quickly
    );

    // Return special response indicating 2FA is required
    return { twoFactorRequired: true, twoFactorToken };
  }

  // User does NOT have 2FA enabled
  // Issue regular tokens immediately

  // Create access token (JWT, short-lived: 15 minutes)
  const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: getAccessTokenExpiresIn() });

  // Create refresh token (opaque token, long-lived: 14 days)
  const refreshToken = await createRefreshToken(user.id);

  const returnUser = {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    accessToken: accessToken,
    refreshToken: refreshToken,
  };

  return returnUser;
};

export const revokeRefreshTokenByRaw = async (raw: string) => {
  const tokenHash = hashRefreshToken(raw);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
};

// Handle Google OAuth user: find existing or create new
export const handleGoogleUser = async (code: string, oauth2Client: OAuth2Client) => {
  // Check if user already exists by googleId

  const response = await oauth2Client.getToken(code);
  const tokens = response.tokens;
  oauth2Client.setCredentials(tokens);

  // Now that we have valid tokens, call the People API to get the user's profile
  const people = google.people('v1');
  const userProfile = await people.people.get({
    auth: oauth2Client,
    resourceName: 'people/me',
    personFields: 'names,emailAddresses,photos',
  });

  // Extract the data we need from Google's response
  // data is where Google puts the JSON payload returned by the API
  const googleId = userProfile.data.resourceName?.split('/')?.pop() || '';
  const email = userProfile.data.emailAddresses?.[0]?.value || '';
  const name = userProfile.data.names?.[0]?.displayName || '';

  let user = await prisma.user.findUnique({
    where: { googleId },
  });

  // If user exists, return them
  if (user) {
    return user;
  }

  // User doesn't exist, create new one
  // Generate username from name: "John Doe" → "john_doe"
  const baseUsername = name.toLowerCase().replace(/\s+/g, '_');

  // Check if username exists, if yes add a number
  let username = baseUsername;
  let counter = 1;
  while (await prisma.user.findUnique({ where: { username } })) {
    username = `${baseUsername}_${counter}`;
    counter++;
  }

  // Generate random password (Google users won't use this)
  const randomPassword = crypto.randomBytes(32).toString('hex');
  const hashedPassword = bcrypt.hashSync(randomPassword, SALT_ROUNDS);

  // Create new user
  user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      password: hashedPassword,
      googleId,
    },
  });

  return user;
};
