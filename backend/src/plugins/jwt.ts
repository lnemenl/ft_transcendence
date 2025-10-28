// Cookie-based JWT plugin + authenticate decorator

import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { verifyRefreshToken } from '../services/auth.service';

const jwtPlugin = fp(async (app: FastifyInstance) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in .env');
  }

  // Registering cookie plugin so Fastify can parse and set cookies
  app.register(fastifyCookie);

  // Registering fastify-jwt and configuring it to use cookies
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
    cookie: {
      cookieName: 'accessToken',
      signed: false,
    },
  });

  //Decorator: reusable preHandler to protect routes
  app.decorate('authenticate', async function (request: FastifyRequest, reply: FastifyReply) {
    try {
      // First try to verify the access token cookie
      await request.jwtVerify();
    } catch (_err) {
      // Access token failed, try refresh token
      const refreshToken = request.cookies.refreshToken;
      if (!refreshToken) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const isValid = await verifyRefreshToken(refreshToken);
      if (!isValid) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Issue new access token
      const accessToken = await reply.jwtSign(
        { id: isValid.userId },
        { expiresIn: process.env.NODE_ENV === 'test' ? '1s' : '15min' },
      );

      // Set new access token cookie
      reply.setCookie('accessToken', accessToken, {
        httpOnly: true,
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 15,
      });

      // Set user for this request
      request.user = { id: isValid.userId };
    }
  });
});

export default jwtPlugin;
