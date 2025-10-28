import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { getProfileSchema } from './schema.json';

// Defining schema as a constant
// The 'as const' is a TS trick that makes the onject readonly

const profileRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/profile',
    {
      schema: getProfileSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      // request.user is populated by request.jwtVerify()
      const userId = (request.user as { id: string }).id;
      if (!userId) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          isTwoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) return reply.status(404).send({ error: 'User not found' });
      return reply.status(200).send({ user });
    },
  );
};

export default profileRoutes;
