import { FastifyInstance } from 'fastify';
import {
  registerUser,
  loginUser,
  revokeRefreshTokenByRaw,
  handleGoogleUser,
  createRefreshToken,
} from '../services/auth.service';
import { loginSchema, logoutSchema, registerSchema, googleInitSchema } from './schema.json';
import { oauth2TournamentClient, oauth2Player2Client, oauth2MainClient } from '../services/google.service';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { getAccessTokenExpiresIn } from '../config';

const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post('/register', { schema: registerSchema }, async (request, reply) => {
    try {
      const { email, password, username } = request.body as {
        email: string;
        password: string;
        username: string;
      };
      const user = await registerUser(email, password, username);
      return reply.status(201).send(user);
    } catch (err) {
      fastify.log.error(err);
      const msg = (err as Error).message;
      return reply.status(400).send({ error: msg });
    }
  });

  fastify.post(
    '/login/player2',
    {
      schema: loginSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const loginBody = request.body as {
          email?: string;
          username?: string;
          password: string;
        };
        const returnUser = await loginUser(loginBody, reply);

        if ('twoFactorRequired' in returnUser) {
          return reply.status(200).send({ twoFactorRequired: true, twoFactorToken: returnUser.twoFactorToken });
        }

        reply.setCookie('player2_token', returnUser.accessToken, {
          httpOnly: true,
          path: '/',
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60,
        });

        revokeRefreshTokenByRaw(returnUser.refreshToken);

        const { refreshToken: _revokedToken, ...user } = returnUser;
        return reply.status(200).send(user);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(401).send({ error: (err as Error).message });
      }
    },
  );

  fastify.post(
    '/login/tournament',
    {
      schema: loginSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const loginBody = request.body as {
          email?: string;
          username?: string;
          password: string;
        };
        const returnUser = await loginUser(loginBody, reply);

        if ('twoFactorRequired' in returnUser) {
          return reply.status(200).send({ twoFactorRequired: true, twoFactorToken: returnUser.twoFactorToken });
        }

        revokeRefreshTokenByRaw(returnUser.refreshToken);

        const { refreshToken: _revokedToken, accessToken: _revokedAccessToken, ...user } = returnUser;
        return reply.status(200).send(user);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(401).send({ error: (err as Error).message });
      }
    },
  );

  // POST /api/login
  fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
    try {
      const body = request.body as {
        email?: string;
        username?: string;
        password: string;
      };

      const loginResult = await loginUser(body, reply);

      if ('twoFactorRequired' in loginResult) {
        return reply.status(200).send({ twoFactorRequired: true, twoFactorToken: loginResult.twoFactorToken });
      }

      const { accessToken, refreshToken } = loginResult;

      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60, // 15 minutes
      });

      reply.setCookie('refreshToken', refreshToken, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 14 * 24 * 60 * 60, // 14 days
      });

      const { refreshToken: _revokedToken, ...user } = loginResult;
      return reply.status(200).send(user);
    } catch (err) {
      fastify.log.error(err);
      return reply.code(401).send({ error: (err as Error).message });
    }
  });

  fastify.post('/logout', { schema: logoutSchema }, async (request, reply) => {
    const refresh = request.cookies?.refreshToken;
    if (refresh) {
      try {
        await revokeRefreshTokenByRaw(refresh);
      } catch (err) {
        /* istanbul ignore next */
        fastify.log.error(err);
      }
      reply.clearCookie('refreshToken', { path: '/' });
    }

    reply.clearCookie('accessToken', { path: '/' });
    return reply.status(200).send({ ok: true });
  });

  fastify.get('/google/init', { schema: googleInitSchema }, async (request, reply) => {
    const state = crypto.randomBytes(32).toString('hex');

    const { type } = request.query as { type: string };
    let oauthClient: OAuth2Client;

    if (type === 'main') oauthClient = oauth2MainClient;
    else if (type === 'player2') oauthClient = oauth2Player2Client;
    else oauthClient = oauth2TournamentClient;

    reply.setCookie('oauth_state', state, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 10 * 60, // State expires in 10 minutes
    });

    const scopes = [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ];

    const authorizationUrl = oauthClient.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      state: state,
    });

    return reply.redirect(authorizationUrl);
  });

  fastify.get('/google/callback', async (request, reply) => {
    // Parse the query parameters that Google sends back
    const { code, error, state } = request.query as { code?: string; error?: string; state?: string };

    // Check if there was an error (user denied access)
    if (error) {
      return reply.send({ error: error });
    }

    // Check if state matches (CSRF protection - verify the state we sent matches what Google returns)
    const storedState = request.cookies.oauth_state;
    if (state !== storedState) {
      return reply.send({ error: 'State mismatch' });
    }

    // Exchange authorization code for refresh and access tokens
    if (!code) {
      return reply.send({ error: 'No code provided' });
    }

    // Get or create the user in our database
    const user = await handleGoogleUser(code, oauth2MainClient);

    // Create JWT access token (15 minutes)
    const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: getAccessTokenExpiresIn() });

    // Create opaque refresh token (14 days)
    const refreshToken = await createRefreshToken(user.id);

    reply.setCookie('accessToken', accessToken, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    });

    reply.setCookie('refreshToken', refreshToken, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 14 * 24 * 60 * 60, // 14 days
    });

    // Return user info with tokens
    return reply.send({
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      accessToken,
      refreshToken,
    });
  });

  fastify.get('/google/callback/player2', async (request, reply) => {
    // Parse the query parameters that Google sends back
    const { code, error, state } = request.query as { code?: string; error?: string; state?: string };

    // Check if there was an error (user denied access)
    if (error) {
      return reply.send({ error: error });
    }

    // Check if state matches (CSRF protection - verify the state we sent matches what Google returns)
    const storedState = request.cookies.oauth_state;
    if (state !== storedState) {
      return reply.send({ error: 'State mismatch' });
    }

    // Exchange authorization code for refresh and access tokens
    if (!code) {
      return reply.send({ error: 'No code provided' });
    }

    // Get or create the user in our database
    const user = await handleGoogleUser(code, oauth2Player2Client);

    // Create JWT access token (15 minutes)
    const accessToken = await reply.jwtSign({ id: user.id }, { expiresIn: getAccessTokenExpiresIn() });

    reply.setCookie('player2_token', accessToken, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
    });

    // Return user info with tokens
    return reply.send({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      accessToken,
    });
  });

  fastify.get('/google/callback/tournament', async (request, reply) => {
    // Parse the query parameters that Google sends back
    const { code, error, state } = request.query as { code?: string; error?: string; state?: string };

    // Check if there was an error (user denied access)
    if (error) {
      return reply.send({ error: error });
    }

    // Check if state matches (CSRF protection - verify the state we sent matches what Google returns)
    const storedState = request.cookies.oauth_state;
    if (state !== storedState) {
      return reply.send({ error: 'State mismatch' });
    }

    // Exchange authorization code for refresh and access tokens
    if (!code) {
      return reply.send({ error: 'No code provided' });
    }

    // Get or create the user in our database
    const user = await handleGoogleUser(code, oauth2TournamentClient);

    // Return user info with tokens
    return reply.send({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });
  });
};

export default authRoutes;

/*
    - httpOnly: true  // JavaScript in browser CANNOT access this cookie
      Prevents XSS (Cross-Site Scripting) attacks
      Only the server can read/write this cookie
    - path: '/'  // Cookie is sent with requests to ALL paths on this domain
      '/' → Cookie sent to /, /api/login, /profile, etc. (everywhere)
    - secure
      secure: true   // Cookie ONLY sent over HTTPS (encrypted connections)
      secure: false  // Cookie sent over HTTP or HTTPS

      In production (live website):
      NODE_ENV = 'production' → secure: true → Only HTTPS

      In development (localhost):
      NODE_ENV = 'development' → secure: false → HTTP is OK

    - sameSite: 'lax'  // Balances security and usability
      'strict': Cookie NEVER sent to cross-site requests (most secure, breaks some workflows)
      'lax': Cookie sent on top-level navigation (GET requests), but not from other sites' forms/AJAX
      'none': Cookie always sent (must also set secure: true)

      User clicks link from external-site.com to your-site.com
      ✓ Cookie IS sent (safe top-level navigation)

      external-site.com has a form that POSTs to your-site.com
      ✗ Cookie NOT sent (CSRF protection)

      external-site.com makes AJAX call to your-site.com
      ✗ Cookie NOT sent (CSRF protection)

*/
