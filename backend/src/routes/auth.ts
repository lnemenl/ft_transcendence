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
        fastify.log.error(err);
      }
      reply.clearCookie('refreshToken', { path: '/' });
    }

    reply.clearCookie('accessToken', { path: '/' });
    return reply.status(200).send({ ok: true });
  });
};

export default authRoutes;
