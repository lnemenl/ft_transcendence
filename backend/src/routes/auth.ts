import { FastifyInstance } from "fastify";
import { registerUser, loginUser } from "../services/auth.service";

const registerSchema = {
  description: "Register a new user",
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
    },
  },
  response: {
    201: {
      description: "User created successfully",
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string", format: "email" },
      },
    },
    400: {
      description: "Bad request, e.g., email already exists",
      type: "object",
      properties: {
        error: { type: "string" },
        message: { type: "string" },
      },
    },
  },
} as const;

const loginSchema = {
  description: "Log in a user and receive a JWT",
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["email", "password"],
    properties: {
      email: { type: "string", format: "email" },
      password: { type: "string" },
    },
  },
  response: {
    200: {
      description: "Login successful",
      type: "object",
      properties: { accessToken: { type: "string" } },
    },
    401: {
      description: "Invalid credentials",
      type: "object",
      properties: {
        error: { type: "string" },
        message: { type: "string" },
      },
    },
  },
} as const;

const logoutSchema = {
  description: "Log out a user by clearing their cookie",
  tags: ["Auth"],
  response: {
    200: {
      description: "Logout successful",
      type: "object",
      properties: { ok: { type: "boolean" } },
    },
  },
} as const;

const authRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/register",
    { schema: registerSchema },
    async (request, reply) => {
      try {
        const { email, password } = request.body as {
          email: string;
          password: string;
        };
        const user = await registerUser(email, password);
        return reply.status(201).send(user);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(400).send({ error: (err as Error).message });
      }
    },
  );

  // POST /api/login
  fastify.post("/login", { schema: loginSchema }, async (request, reply) => {
    try {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };
      const token = await loginUser(email, password, reply);

      reply.setCookie("token", token, {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60,
      });

      return reply.status(200).send({ accessToken: token });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(401).send({ error: (err as Error).message });
    }
  });

  fastify.post("/logout", { schema: logoutSchema }, async (_request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.status(200).send({ ok: true });
  });
};

export default authRoutes;

// CLIENT                                     SERVER (Your Fastify App)
//       |                                              |
//       |--- POST /api/login ------------------------->|
//       | (with email/password)                        |
//       |                                              |  1. `auth.ts` route handler calls `loginUser` service.
//       |                                              |  2. `auth.service.ts` validates password, then calls `reply.jwtSign()` to create a JWT.
//       |                                              |  3. `auth.ts` gets the token back.
//       |                                              |  4. It calls `reply.setCookie("token", token, { httpOnly: true, ... })`.
//       |                                              |
//       |<-- Response (200 OK) ------------------------|
//       | (with "Set-Cookie" header)                   |
//       |                                              |
//       | BROWSER STORES THE 'token' COOKIE            |
//       |                                              |
//    ... Time passes ...                               |
//       |                                              |
//       |--- GET /api/profile -----------------------> |  (Browser automatically includes the 'token' cookie)
//       |                                              |
//       |                                              |  5. The request hits the `/api/profile` route.
//       |                                              |  6. The `preHandler: [fastify.authenticate]` runs first.
//       |                                              |
//       |                                              |     `authenticate` decorator (from `jwt.ts`) is triggered.
//       |                                              |     It calls `request.jwtVerify()`.
//       |                                              |
//       |                                              |     `@fastify/jwt` automatically finds
//       |                                              |     and verifies the 'token' cookie.
//       |                                              |
//       |                                              |     If valid, it decodes the payload ({ sub: 123 }) and attaches it to `request.user`.
//       |                                              |
//       |                                              |  7. The main route handler for `/api/profile` now runs.
//       |                                              |  8. It can safely access `request.user.sub` to know which user is logged in.
//       |                                              |
//       |<-- Response (200 OK) ------------------------|
//       | (with user profile data)                     |
//       |
