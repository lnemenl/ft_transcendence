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


// CLIENT (Browser)                                    SERVER (Fastify App)
//         |                                                       |
//         |                                                       |
//    [1]  |----------- POST /api/login -------------------------->|
//         |      { email: "...", password: "..." }                |
//         |                                                       |
//         |                                                  [2]  | 1. Finds user in DB.
//         |                                                       | 2. Verifies password with bcrypt.
//         |                                                       | 3. Creates JWT with user ID in payload.
//         |                                                       |    (Token exists only in memory here)
//         |                                                       |
//    [3]  |<---------- Response (200 OK) -------------------------|
//         |      Header: "Set-Cookie: token=eyJ...; HttpOnly"      |
//         |                                                       |
//         |                                                       |
//    [4]  | Browser receives the "Set-Cookie" header.             |
//         | It automatically stores the cookie named "token".     |
//         | Because it's `HttpOnly`, JavaScript can't touch it.   |
//         |                                                       |
//    ... Some time later ...                                      |
//         |                                                       |
//    [5]  |----------- GET /api/profile ------------------------->|
//         |      (Browser automatically attaches the             |
//         |       "token=eyJ..." cookie to the request)           |
//         |                                                       |
//         |                                                  [6]  | The `authenticate` preHandler runs.
//         |                                                       | It finds the "token" cookie, verifies the
//         |                                                       | signature with JWT_SECRET, and checks the
//         |                                                       | expiration date.
//         |                                                       |
//         |                                                  [7]  | If valid, the user ID is extracted from
//         |                                                       | the token and put on `request.user`. The
//         |                                                       | main profile handler now runs.
//         |                                                       |
//    [8]  |<---------- Response (200 OK) -------------------------|
//         |      Body: { user: { id: 1, email: "..." } }          |
//         |                                                       |