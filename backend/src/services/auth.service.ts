import { prisma } from '../utils/prisma';
import bcrypt from 'bcrypt';
import { FastifyReply } from 'fastify';
import crypto from 'crypto';

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
  const expiresAt = new Date(Date.now() + days * 24 * 3600 * 1000);

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
  if (!rec) return null;
  if (rec.revoked) return null;
  if (rec.expiresAt < new Date()) return null;
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

  // Hash the password for security. Never store plain-text passwords
  // To compare the password with plain text: compareSync(text, hash)
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

  let user = null;

  if (email) {
    user = await prisma.user.findUnique({ where: { email } });
  } else if (username) {
    user = await prisma.user.findUnique({ where: { username } });
  } else {
    throw new Error('Provide username or email');
  }

  if (!user) throw new Error('Invalid email or password');

  const isPasswordValid = bcrypt.compareSync(body.password, user.password);
  if (!isPasswordValid) throw new Error('Invalid email or password');

  const accessToken = await reply.jwtSign(
    { id: user.id }, // The playload. 'sub' is standard for 'subject' (the user's ID)
    { expiresIn: process.env.NODE_ENV === 'test' ? '1s' : '15min' }, // The token will expire in 1h
  );

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
