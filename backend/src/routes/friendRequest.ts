import { FastifyInstance } from 'fastify';
import { Prisma } from '@prisma/client';
import { newFriendRequest, acceptFriendRequest, declineFriendRequest } from './schema.json';
import { createFriendRequest, acceptFriend, deleteRequest } from '../services/friendRequest.service';

const friendRequestRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/friend-request/:id',
    {
      schema: newFriendRequest,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const senderId = (request.user as { id: string }).id;
        const receiverId = (request.params as { id: string }).id;

        const { receiver } = await createFriendRequest(senderId, receiverId);
        return reply.status(201).send(receiver);
      } catch (err) {
        fastify.log.error(err);

        if (err instanceof Prisma.PrismaClientKnownRequestError || (err as Error).message === 'User not found') {
          return reply.status(404).send({ error: 'User not found' });
        }
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  fastify.patch(
    '/friend-request/:id',
    {
      schema: acceptFriendRequest,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const friendRequestId = (request.params as { id: string }).id;

        const sender = await acceptFriend(friendRequestId);
        return reply.status(200).send(sender);
      } catch (err) {
        fastify.log.error(err);

        if ((err as Error).message === 'Invalid friend request') {
          return reply.status(404).send({ error: (err as Error).message });
        }
        if ((err as Error).message === 'Friend request already accepted') {
          return reply.status(400).send({ error: (err as Error).message });
        }
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  fastify.delete(
    '/friend-request/:id',
    {
      schema: declineFriendRequest,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const friendRequestId = (request.params as { id: string }).id;

        const _declined = await deleteRequest(friendRequestId);
        return reply.status(200).send({ ok: true });
      } catch (err) {
        fastify.log.error(err);

        if ((err as Error).message === 'Invalid id') {
          return reply.status(404).send({ error: (err as Error).message });
        }
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );
};

export default friendRequestRoutes;
