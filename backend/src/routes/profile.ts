// Protected route using preHandler: [fastify.authenticate]

import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma";

// Defining schema as a constant
// The 'as const' is a TS trick that makes the onject readonly

const getProfileSchema = {
  description: "Return current authenticated user's profile",
  tags: ["User"],
  response: {
    200: {
      description: "Successful response with user profile",
      type: "object",
      properties: {
        user: {
          type: "object",
          properties: {
            id: { type: "number" },
            email: { type: "string", format: "email" },
            isTwoFactorEnabled: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
          required: [
            "id",
            "email",
            "isTwoFactorEnabled",
            "createdAt",
            "updatedAt",
          ],
        },
      },
      required: ["user"],
    },
    401: {
      description: "Unauthorized",
      type: "object",
      properties: { error: { type: "string" } },
    },
    404: {
      description: "User not found",
      type: "object",
      properties: { error: { type: "string" } },
    },
  },
} as const;

export default async function profileRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/profile",
    {
      schema: getProfileSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      // request.user is populated by request.jwtVerify()
      const userId = (request.user as { sub: number }).sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          isTwoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) return reply.status(404).send({ error: "User not found" });
      return reply.status(200).send({ user });
    },
  );
}
