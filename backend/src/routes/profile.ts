// Protected route using preHandler: [fastify.authenticate]

import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma";

export default async function profileRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/profile",
    { preHandler: [fastify.authenticate] },
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
