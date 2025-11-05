/**
 * Two-Factor Authentication Routes
 *
 * This file handles all 2FA operations using TOTP (Time-based One-Time Password).
 *
 * TOTP Overview:
 * - Server and user's phone share a SECRET (Base32 encoded string)
 * - Both generate the SAME 6-digit code based on:
 *   * The shared SECRET
 *   * Current TIME (Unix timestamp / 30 seconds)
 * - Code changes every 30 seconds
 * - If codes match, authentication succeeds
 *
 * Flow:
 * 1. /generate  -> Create secret, show QR code to user
 * 2. /enable    -> User scans QR, enters code to confirm
 * 3. /verify    -> During login, user enters code from phone
 * 4. /disable   -> User can turn off 2FA (requires code)
 *
 */

import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { getAccessTokenExpiresIn, getSecureCookies } from '../config';
import { twoFAGenerateSchema, twoFAEnableSchema, twoFAVerifySchema, twoFADisableSchema } from './schema.json';
import { createRefreshToken } from '../services/auth.service';
import { generateSecret, getOTPAuthUrl, generateQRCode, verify } from '../services/totp.service';

const twoFARoutes = async (fastify: FastifyInstance) => {
  /**
   * POST /api/2fa/generate
   *
   * Purpose: Generate a new TOTP secret and QR code for setup
   *
   * Authentication: Required (must be logged in)
   *
   * Flow:
   * 1. User clicks "Enable 2FA" in settings
   * 2. This endpoint generates a RANDOM secret
   * 3. Secret is NOT saved to database yet (user must confirm first)
   * 4. QR code is created containing: secret + username + app name
   * 5. Frontend displays QR code to user
   * 6. User scans QR with Google Authenticator (or similar app)
   * 7. App saves the secret and starts generating codes
   *
   * Response contains:
   * - secret: Base32-encoded string (e.g., "JBSWY3DPEHPK3PXP")
   *           Frontend must keep this temporarily to send in /enable
   * - otpauthUrl: The full URI (e.g., "otpauth://totp/ft_transcendence:alice?secret=...")
   *               This is what's encoded in the QR code
   * - qrCodeDataUrl: Image data URL (e.g., "data:image/png;base64,iVBORw0KG...")
   *                  Can be used directly in <img src="...">
   *
   * Why secret is NOT saved yet:
   * - User might not complete setup (close window, cancel, etc.)
   * - We need to verify user successfully scanned the QR
   * - This happens in the /enable endpoint
   */
  fastify.post(
    '/generate',
    { schema: twoFAGenerateSchema, preHandler: [fastify.authenticate] },
    async (request, reply) => {
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

      // Return to frontend
      // Frontend will:
      // 1. Show the QR code image (qrCodeDataUrl)
      // 2. Keep the secret in memory/sessionStorage temporarily
      // 3. Ask user to scan QR with authenticator app
      // 4. Ask user to enter the 6-digit code they see
      // 5. Send secret + code to /enable endpoint
      return reply.status(200).send({
        secret, // Must be sent back in /enable
        otpauthUrl, // Optional, for debugging
        qrCodeDataUrl, // Display this to user as <img src="...">
      });
    },
  );

  /**
   * POST /api/2fa/enable
   *
   * Purpose: Enable 2FA by verifying user successfully scanned the QR code
   *
   * Authentication: Required (must be logged in)
   *
   * Flow:
   * 1. User has scanned QR code from /generate endpoint
   * 2. User's authenticator app now shows 6-digit codes (changing every 30s)
   * 3. User enters the current code they see in the app
   * 4. Frontend sends: secret (from /generate) + code (from user input)
   * 5. Server verifies the code matches what it would generate with that secret
   * 6. If valid, save secret to database and enable 2FA
   *
   * Request body:
   * - secret: The secret from /generate response (Base32 string)
   * - token: The 6-digit code user sees in authenticator app (string, e.g., "123456")
   *
   * Why verify before saving?
   * - Ensures user successfully scanned the QR code
   * - Confirms their device is generating correct codes
   * - Prevents user from being locked out if setup failed
   *
   * What happens after success:
   * - secret is saved to user.twoFactorSecret in database
   * - user.isTwoFactorEnabled is set to true
   * - Next login will require 2FA code
   */
  fastify.post('/enable', { schema: twoFAEnableSchema, preHandler: [fastify.authenticate] }, async (request, reply) => {
    const userId = (request.user as { id: string }).id;

    // Extract secret and token from request
    const body = request.body as { secret: string; token: string };

    // Verify the 6-digit code using otpauth
    // This checks if the code matches what would be generated right now (or 30 seconds ago/ahead)
    const isValid = verify(body.secret, body.token);

    if (!isValid) {
      return reply.status(401).send({ error: 'Invalid 2FA token' });
    }

    // If code is valid -> save the secret to database and enable 2FA
    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorSecret: body.secret, // Save the secret for future verifications
        isTwoFactorEnabled: true, // Enable 2FA flag
      },
    });

    return reply.status(200).send({ enabled: true });
  });

  /**
   * POST /api/2fa/verify
   *
   * Purpose: Complete login by verifying 2FA code
   *
   * Authentication: NOT required (user is not logged in yet)
   *                 Uses temporary twoFactorToken instead
   *
   * Context: This endpoint is called DURING login when user has 2FA enabled
   *
   * Login Flow (when 2FA enabled):
   * 1. User enters email + password at /api/login
   * 2. Server validates credentials
   * 3. Instead of issuing access token, server issues temporary twoFactorToken
   *    - This token contains: { id: userId, twoFactor: true }
   *    - Expires in 5 minutes
   *    - Cannot be used to access protected routes
   * 4. Frontend shows "Enter 2FA Code" screen
   * 5. User opens authenticator app, sees current 6-digit code
   * 6. User enters code, frontend calls this endpoint
   * 7. Server verifies code against user's saved secret
   * 8. If valid, issue REAL access + refresh tokens
   * 9. Set authentication cookies
   * 10. User is now fully logged in
   *
   * Request body:
   * - twoFactorToken: Temporary token from /api/login (JWT string)
   * - code: 6-digit code from authenticator app (string, e.g., "789012")
   *
   * Security features:
   * - twoFactorToken has short expiry (5 min) - must complete 2FA quickly
   * - Token contains twoFactor flag - cannot be confused with regular access token
   * - Code is verified against secret stored in database
   * - Time window allows ±30 seconds for clock drift
   *
   * Why separate token?
   * - User hasn't fully authenticated yet (only passed password check)
   * - Prevents attacker with password from accessing account
   * - twoFactorToken is single-use (cannot access any API endpoints)
   */
  fastify.post('/verify', { schema: twoFAVerifySchema }, async (request, reply) => {
    const body = request.body as { twoFactorToken: string; code: string };

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
    const isValid = verify(user.twoFactorSecret, body.code);

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

    return reply.status(200).send({ ok: true });
  });

  /**
   * POST /api/2fa/disable
   *
   * Purpose: Disable 2FA for the authenticated user
   *
   * Authentication: Required (must be logged in)
   *
   * Flow:
   * 1. User wants to disable 2FA
   * 2. User clicks "Disable 2FA" in settings
   * 3. Frontend prompts: "Enter your current 2FA code to confirm"
   * 4. User opens authenticator app, sees current 6-digit code
   * 5. User enters code, frontend calls this endpoint
   * 6. Server verifies code against user's saved secret
   * 7. If valid, remove secret and disable 2FA
   *
   * Request body:
   * - code: 6-digit code from authenticator app (string, e.g., "456789")
   *
   * Why require code to disable?
   * - Security: Prevents attacker with stolen session from disabling 2FA
   * - Confirmation: Ensures user really wants to disable (not accidental click)
   * - Proof of ownership: User must have access to their authenticator device
   *
   * What happens after success:
   * - user.twoFactorSecret set to null (secret deleted)
   * - user.isTwoFactorEnabled set to false (2FA disabled)
   * - Next login will NOT require 2FA code
   * - User can re-enable 2FA anytime (will get new secret)
   *
   * Security note:
   * - User's authenticator app still has the old secret
   * - Old codes will NOT work anymore (secret deleted from server)
   * - User should manually remove the entry from their authenticator app
   */
  fastify.post(
    '/disable',
    { schema: twoFADisableSchema, preHandler: [fastify.authenticate] },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const body = request.body as { code: string };

      // Fetch user and verify 2FA is currently enabled
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.twoFactorSecret || !user.isTwoFactorEnabled) {
        return reply.status(400).send({ error: '2FA is not enabled' });
      }

      // Verify the 6-digit code using otpauth
      const isValid = verify(user.twoFactorSecret, body.code);

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
    },
  );
};

export default twoFARoutes;
