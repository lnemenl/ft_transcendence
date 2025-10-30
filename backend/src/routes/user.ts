import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { updateUserSchema, getUserSchema, getMeSchema } from './schema.json';

const userRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    '/me',
    {
      schema: getMeSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = (request.user as { id: string }).id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
        },
      });

      if (!user) return reply.status(404).send({ error: 'User not found' });
      return reply.status(200).send(user);
    },
  );

  fastify.patch(
    '/me',
    {
      schema: updateUserSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
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
    },
  );

  fastify.get(
    '/:id',
    {
      schema: getUserSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
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
    },
  );
};

export default userRoutes;
