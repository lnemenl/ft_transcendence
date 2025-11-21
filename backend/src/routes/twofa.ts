import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { getAccessTokenExpiresIn, getSecureCookies } from '../config';
import {
  twoFAGenerateSchema,
  twoFAEnableSchema,
  twoFAVerifySchema,
  twoFAVerifyTournamentSchema,
  twoFADisableSchema,
} from './schema.json';
import { createRefreshToken } from '../services/auth.service';
import { generateSecret, getOTPAuthUrl, generateQRCode, verify } from '../services/totp.service';

const twoFARoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/generate',
    { schema: twoFAGenerateSchema, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        // Extract user ID from JWT (set by authenticate middleware)
        const userId = (request.user as { id: string }).id;

        // Fetch user from database to get username
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return reply.status(404).send({ error: 'User not found' });

        // Generate a new TOTP secret using otpauth
        const secret = generateSecret();

        // Create the otpauth:// URL that contains the secret and user info
        const otpauthUrl = getOTPAuthUrl(user.username, secret);

        // Convert the otpauth URL into a QR code image (as data URL)
        const qrCodeDataUrl = await generateQRCode(user.username, secret);

        // Store the secret in the DB
        await prisma.user.update({
          where: { id: userId },
          data: {
            twoFactorSecret: secret,
          },
        });

        return reply.status(200).send({
          secret, // Send secret so frontend can display it for manual entry
          otpauthUrl, // Optional, for debugging
          qrCodeDataUrl, // Display this to user as <img src="...">
        });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  fastify.post('/enable', { schema: twoFAEnableSchema, preHandler: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = (request.user as { id: string }).id;

      const body = request.body as { SixDigitCode: string };

      // Fetch user and their 2FA secret from database
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.twoFactorSecret) {
        return reply.status(400).send({ error: 'No 2FA secret found. Please call /generate first.' });
      }

      // Verify the 6-digit code using the stored secret
      const isValid = verify(user.twoFactorSecret, body.SixDigitCode);

      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid 2FA token' });
      }

      // If code is valid -> enable 2FA (secret is already saved from /generate)
      await prisma.user.update({
        where: { id: userId },
        data: {
          isTwoFactorEnabled: true, // Enable 2FA flag
        },
      });

      return reply.status(200).send({ enabled: true });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/verify', { schema: twoFAVerifySchema }, async (request, reply) => {
    try {
      const body = request.body as { twoFactorToken: string; SixDigitCode: string };

      // Step 1: Verify the temporary 2FA token
      let payload: { id?: string; twoFactor?: boolean } | null = null;
      try {
        payload = fastify.jwt.verify(body.twoFactorToken) as { id?: string; twoFactor?: boolean };
      } catch (_e) {
        // Token is invalid, expired, or malformed
        return reply.status(401).send({ error: 'Invalid or expired 2FA session' });
      }

      // Step 2: Validate token payload
      // Must contain user ID and twoFactor flag
      if (!payload?.id || !payload?.twoFactor) {
        return reply.status(401).send({ error: 'Invalid 2FA session' });
      }

      // Step 3: Fetch user and their 2FA secret from database
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
        // User doesn't exist, or 2FA was disabled since login started
        return reply.status(401).send({ error: '2FA not enabled' });
      }

      // Step 4: Verify the 6-digit code using otpauth
      const isValid = verify(user.twoFactorSecret, body.SixDigitCode);

      if (!isValid) {
        // Code is wrong, expired, or user entered it incorrectly
        return reply.status(401).send({ error: 'Invalid 2FA token' });
      }

      // If code is valid, then user has successfully completed 2FA
      // Now issue REAL authentication tokens

      // Step 5: Create access token (JWT, short-lived: 15 minutes)
      const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: getAccessTokenExpiresIn() });

      // Step 6: Create refresh token
      const raw = await createRefreshToken(user.id);

      // Step 7: Set authentication cookies

      // Access token cookie (15 minutes)
      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        secure: getSecureCookies(),
        sameSite: 'lax',
        maxAge: 15 * 60,
      });

      // Refresh token cookie (14 days)
      reply.setCookie('refreshToken', raw, {
        httpOnly: true,
        path: '/',
        secure: getSecureCookies(),
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60, // 14 days in seconds
      });

      await prisma.user.update({ where: { id: user.id }, data: { isOnline: true } });

      return reply.status(200).send({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/verify/player2', { schema: twoFAVerifySchema }, async (request, reply) => {
    try {
      const body = request.body as { twoFactorToken: string; SixDigitCode: string };

      // Step 1: Verify the temporary 2FA token
      let payload: { id?: string; twoFactor?: boolean } | null = null;
      try {
        payload = fastify.jwt.verify(body.twoFactorToken) as { id?: string; twoFactor?: boolean };
      } catch (_e) {
        return reply.status(401).send({ error: 'Invalid or expired 2FA session' });
      }

      // Validate token payload
      if (!payload?.id || !payload?.twoFactor) {
        return reply.status(401).send({ error: 'Invalid 2FA session' });
      }

      // Fetch user and secret
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
        return reply.status(401).send({ error: '2FA not enabled' });
      }

      // Verify code
      const isValid = verify(user.twoFactorSecret, body.SixDigitCode);
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid 2FA token' });
      }

      // Issue short-lived access token for player2 (no refresh token persisted)
      const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: getAccessTokenExpiresIn() });

      reply.setCookie('player2_token', accessToken, {
        httpOnly: true,
        path: '/',
        secure: getSecureCookies(),
        sameSite: 'lax',
        maxAge: 15 * 60,
      });

      return reply.status(200).send({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
      });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post('/verify/tournament', { schema: twoFAVerifyTournamentSchema }, async (request, reply) => {
    try {
      const body = request.body as { twoFactorToken: string; SixDigitCode: string };

      // Step 1: Verify the temporary 2FA token
      let payload: { id?: string; twoFactor?: boolean } | null = null;
      try {
        payload = fastify.jwt.verify(body.twoFactorToken) as { id?: string; twoFactor?: boolean };
      } catch (_e) {
        return reply.status(401).send({ error: 'Invalid or expired 2FA session' });
      }

      // Validate token payload
      if (!payload?.id || !payload?.twoFactor) {
        return reply.status(401).send({ error: 'Invalid 2FA session' });
      }

      // Fetch user and secret
      const user = await prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || !user.isTwoFactorEnabled || !user.twoFactorSecret) {
        return reply.status(401).send({ error: '2FA not enabled' });
      }

      // Verify code
      const isValid = verify(user.twoFactorSecret, body.SixDigitCode);
      if (!isValid) {
        return reply.status(401).send({ error: 'Invalid 2FA token' });
      }

      // Tournament players will not get an access/refresh token
      return reply.status(200).send({ id: user.id, username: user.username, avatarUrl: user.avatarUrl });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  });

  fastify.post(
    '/disable',
    { schema: twoFADisableSchema, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      try {
        const userId = (request.user as { id: string }).id;
        const body = request.body as { SixDigitCode: string };

        // Fetch user and verify 2FA is currently enabled
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
          return reply.status(400).send({ error: '2FA is not enabled' });
        }

        // Verify the 6-digit code using otpauth
        const isValid = verify(user.twoFactorSecret, body.SixDigitCode);

        if (!isValid) {
          return reply.status(401).send({ error: 'Invalid 2FA token' });
        }

        // If code is valid -> disable 2FA
        await prisma.user.update({
          where: { id: userId },
          data: {
            twoFactorSecret: null, // Delete the secret
            isTwoFactorEnabled: false, // Disable the flag
          },
        });

        return reply.status(200).send({ disabled: true });
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );
};

export default twoFARoutes;
