import { prisma } from '../utils/prisma';
import bcrypt from 'bcrypt';
import { FastifyReply } from 'fastify';
import crypto from 'crypto';
import { getAccessTokenExpiresIn } from '../config';

const SALT_ROUNDS = 10;

const generateRawRefreshToken = (bytes = 48) => {
  return crypto.randomBytes(bytes).toString('base64url');
};

const hashRefreshToken = (raw: string) => {
  return crypto.createHash('sha256').update(raw).digest('hex');
};

const createRefreshToken = async (userId: string) => {
  const days = 14;
  const raw = generateRawRefreshToken();
  const tokenHash = hashRefreshToken(raw);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60);

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
  if (!rec || rec.revoked || rec.expiresAt < new Date()) return null;
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

  const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: getAccessTokenExpiresIn() });

  const refreshToken = await createRefreshToken(user.id);

  return { accessToken, refreshToken };
};

export const revokeRefreshTokenByRaw = async (raw: string) => {
  const tokenHash = hashRefreshToken(raw);
  await prisma.refreshToken.updateMany({
    where: { tokenHash },
    data: { revoked: true },
  });
};
