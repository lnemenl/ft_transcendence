import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { updateUserSchema, getAllUsersSchema, getUserSchema, getMeSchema } from './schema.json';

const userRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/me',
    {
      schema: getMeSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = (request.user as { id: string }).id;
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
            isTwoFactorEnabled: true,
            createdAt: true,
          },
        });

        if (!user) return reply.status(404).send({ error: 'User not found' });
        return reply.status(200).send(user);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  fastify.patch(
    '/me',
    {
      schema: updateUserSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = (request.user as { id: string }).id;
        const dataToUpdate = request.body as {
          username?: string;
          avatarUrl?: string;
        };

        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: dataToUpdate,
          select: {
            id: true,
            email: true,
            username: true,
            avatarUrl: true,
          },
        });
        return reply.status(200).send(updatedUser);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  fastify.get(
    '/',
    {
      schema: getAllUsersSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = (request.user as { id: string }).id;
        const users = await prisma.user.findMany({
          where: { id: { not: userId } },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        });

        return reply.status(200).send(users);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  fastify.get(
    '/:id',
    {
      schema: getUserSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const user = await prisma.user.findUnique({
          where: { id },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        });

        if (!user) return reply.status(404).send({ error: 'User not found' });
        return reply.status(200).send(user);
      } catch (err) {
        fastify.log.error(err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );
};

export default userRoutes;
