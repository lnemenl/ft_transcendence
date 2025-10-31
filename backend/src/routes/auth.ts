import { FastifyInstance } from 'fastify';
import { registerUser, loginUser, revokeRefreshTokenByRaw } from '../services/auth.service';
import { loginSchema, logoutSchema, registerSchema } from './schema.json';

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

  // POST /api/login
  fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
    try {
      const body = request.body as {
        email?: string;
        username?: string;
        password: string;
      };

      const { accessToken, refreshToken } = await loginUser(body, reply);

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

      return reply.status(200).send({ accessToken });
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
