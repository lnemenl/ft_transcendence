import { FastifyInstance } from 'fastify';
import { createGame } from '../services/game.service';
import schemas from './schema.json';
import { prisma } from '../utils/prisma';

const tournamentRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/tournament',
    {
      schema: schemas.createTournament,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { participants } = request.body as { participants: string[] };
      if (!participants || participants.length === 0) {
        return reply.status(400).send({ error: 'No participants provided' });
      }
    },
  );
};

export default tournamentRoutes;
