import { FastifyReply } from 'fastify';
import { prisma } from '../../src/utils/prisma';
import bcrypt from 'bcrypt';
import * as authService from '../../src/services/auth.service';
import { expect, it, describe, beforeEach, jest } from '@jest/globals';

// 1. MOCK THE DEPENDENCIES
// Tell Jest to replace these modules with fakes
jest.mock('../../src/utils/prisma', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('bcrypt', () => ({
  hashSync: jest.fn(),
  compareSync: jest.fn(),
}));

jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({ toString: jest.fn(() => 'mocked-refresh-token') })),
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mocked-token-hash'),
    })),
  })),
}));

// 2. HELPER MOCKS
// A helper to create a fake reply object with a fake jwtSign function
const getMockReply = () => {
  const reply: Partial<FastifyReply> = {
    jwtSign: jest.fn(() => Promise.resolve('mocked-access-token')),
  };
  return reply as FastifyReply;
};

// A helper to clear all mock function calls before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// 3. TESTS

describe('Auth Service (Unit Tests)', () => {
  describe('registerUser', () => {
    it('should create a new user successfully (happy path)', async () => {
      const userData = { email: 'test@example.com', password: 'Password123!', username: 'tester' };

      // Setup Mocks:
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null); // No existing user
      (bcrypt.hashSync as jest.Mock).mockReturnValue('hashed-password');
      (prisma.user.create as jest.Mock).mockResolvedValue({ id: '1', ...userData, password: 'hashed-password' });

      // Run the function
      const user = await authService.registerUser(userData.email, userData.password, userData.username);

      // Asserts:
      expect(prisma.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ email: 'test@example.com' }, { username: 'tester' }] },
        }),
      );
      expect(bcrypt.hashSync).toHaveBeenCalledWith('Password123!', 10);
      expect(prisma.user.create).toHaveBeenCalled();
      expect(user).toHaveProperty('id', '1');
      expect(user).not.toHaveProperty('password');
    });

    it('should throw if email already exists', async () => {
      const userData = { email: 'test@example.com', password: 'Password123!', username: 'tester' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await expect(authService.registerUser(userData.email, userData.password, userData.username)).rejects.toThrow(
        'User with this email already exists',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('should throw if username already exists', async () => {
      const userData = { email: 'test@example.com', password: 'Password123!', username: 'tester' };
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ username: 'tester' });

      await expect(authService.registerUser(userData.email, userData.password, userData.username)).rejects.toThrow(
        'Username already taken',
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('loginUser', () => {
    it('should login successfully and return tokens (happy path)', async () => {
      const mockReply = getMockReply();
      const mockUser = { id: '1', email: 'test@example.com', password: 'hashed-password' };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(true);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue({});

      const result = await authService.loginUser({ email: 'test@example.com', password: '123' }, mockReply);

      expect(bcrypt.compareSync).toHaveBeenCalledWith('123', 'hashed-password');
      expect(mockReply.jwtSign).toHaveBeenCalled();
      expect(prisma.refreshToken.create).toHaveBeenCalled();
      expect(result).toEqual({
        accessToken: 'mocked-access-token',
        refreshToken: 'mocked-refresh-token',
      });
    });

    it('should throw if no email or username is provided', async () => {
      await expect(authService.loginUser({ password: '123' }, getMockReply())).rejects.toThrow(
        'Provide username or email',
      );
    });

    it('should throw if user is not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        authService.loginUser({ email: 'test@example.com', password: '123' }, getMockReply()),
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw if password is invalid', async () => {
      const mockUser = { id: '1', email: 'test@example.com', password: 'hashed-password' };
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compareSync as jest.Mock).mockReturnValue(false); // Password fails

      await expect(
        authService.loginUser({ email: 'test@example.com', password: '123' }, getMockReply()),
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('verifyRefreshToken', () => {
    it('should return token record if valid (happy path)', async () => {
      const mockToken = {
        id: '1',
        tokenHash: 'mocked-token-hash',
        revoked: false,
        expiresAt: new Date(Date.now() + 10000),
        userId: 'user-1',
        createdAt: new Date(),
      };
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockToken);

      const result = await authService.verifyRefreshToken('mocked-refresh-token');

      expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash: 'mocked-token-hash' } });
      expect(result).toBe(mockToken);
    });

    it('should return null if token not found', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await authService.verifyRefreshToken('mocked-refresh-token');
      expect(result).toBe(null);
    });

    it('should return null if token is revoked', async () => {
      const mockToken = {
        id: '1',
        tokenHash: 'mocked-token-hash',
        revoked: true,
        expiresAt: new Date(Date.now() + 10000),
        userId: 'user-1',
        createdAt: new Date(),
      };
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockToken);

      const result = await authService.verifyRefreshToken('mocked-refresh-token');
      expect(result).toBe(null);
    });

    it('should return null if token is expired', async () => {
      const mockToken = {
        id: '1',
        tokenHash: 'mocked-token-hash',
        revoked: false,
        expiresAt: new Date(Date.now() - 10000),
        userId: 'user-1',
        createdAt: new Date(),
      };
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockToken);

      const result = await authService.verifyRefreshToken('mocked-refresh-token');
      expect(result).toBe(null);
    });
  });

  describe('revokeRefreshTokenByRaw', () => {
    it('should call updateMany with the correct hash', async () => {
      await authService.revokeRefreshTokenByRaw('mocked-refresh-token');

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: 'mocked-token-hash' },
        data: { revoked: true },
      });
    });
  });
});
