import { FastifyInstance } from "fastify";
import { registerUser, loginUser } from "../services/auth.service";

export default async function authRoutes(fastify: FastifyInstance) {
  // POST /api/register
  fastify.post(
    "/register",
    {
      schema: {
        body: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string", minLength: 8 },
          },
        },
      },
    },
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
        return reply
          .status(400)
          .send({ error: (err as Error).message || "Bad Request" });
      }
    },
  );

  // POST /api/login
  fastify.post("/login", async (request, reply) => {
    try {
      const { email, password } = request.body as {
        email: string;
        password: string;
      };
      const token = await loginUser(email, password, reply);

      // Setting cookie with appropriate flags
      const cookieOptions = {
        httpOnly: true,
        path: "/",
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        maxAge: 60 * 60, // 1 hour in seconds, to match token expiration
      };

      reply.setCookie("token", token, cookieOptions);
      return reply.status(200).send({ accessToken: token });
    } catch (err) {
      fastify.log.error(err);
      return reply
        .status(401)
        .send({ error: (err as Error).message || "Invalid credentials" });
    }
  });

  fastify.post("/logout", async (_request, reply) => {
    reply.clearCookie("token", { path: "/" });
    return reply.status(200).send({ ok: true });
  });
}
