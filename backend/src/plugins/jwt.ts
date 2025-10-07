// Cookie-based JWT plugin + authenticate decorator

import fp from "fastify-plugin";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export default fp(async function (app: FastifyInstance) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET must be set in .env");
  }

  // Registering cookie plugin so Fastify can parse and set cookies
  app.register(fastifyCookie);

  // Registering fastify-jwt and configuring it to use cookies
  app.register(fastifyJwt, {
    secret: process.env.JWT_SECRET!,
    cookie: {
      cookieName: "token",
      signed: false,
    },
  });

  // Decorator: reusable preHandler to protect routes
  app.decorate(
    "authenticate",
    async function (request: FastifyRequest, reply: FastifyReply) {
      try {
        // request.jwtVerify() will look for Authorization header OR cookie (token)
        // When cookie option is configured, fastify-jwt reads token from cookie automatically
        await request.jwtVerify();
      } catch (_err) {
        reply.status(401).send({ error: "Unauthorized" });
      }
    },
  );
});
