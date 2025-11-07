import { FastifyInstance } from 'fastify';
import schemas from './schema.json';
import { prisma } from '../utils/prisma';
import { createTournament } from '../services/tournament.service';
import { createGame } from '../services/game.service';

const tournamentRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/tournament',
    {
      schema: schemas.createTournament,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { participants } = request.body as { participants: string[] };
      if (!participants || participants.length < 2) {
        return reply.status(400).send({ error: 'Invalid number of participants' });
      }

      try {
        const tournamentId = await createTournament(participants);
        return reply.status(201).send({ tournamentId: tournamentId });
      } catch (err) {
        if ((err as Error).message === 'Invalid ID') {
          return reply.status(404).send({ error: (err as Error).message });
        }
        return reply.status(500).send({ error: (err as Error).message });
      }
    },
  );

  fastify.post(
    '/tournament/game',
    {
      schema: schemas.newTournamentGame,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { winner, players, tournamentId } = request.body as {
          winner: number;
          players: string[];
          tournamentId: string;
        };
        if (!tournamentId) {
          return reply.status(400).send({ error: 'No tournament ID provided' });
        }
        if (!players || players.length !== 2) {
          return reply.status(400).send({ error: 'Invalid players' });
        }
        const game = await createGame(winner, players[0], players[1], tournamentId);
        return reply.status(201).send(game);
      } catch (err) {
        if ((err as Error).message === 'Invalid ID') {
          reply.status(404).send({ error: (err as Error).message });
        } else if ((err as Error).message === 'Internal server error') {
          return reply.status(500).send({ error: (err as Error).message });
        }
        return reply.status(400).send({ error: (err as Error).message });
      }
    },
  );

  fastify.get(
    '/tournament/:id',
    {
      schema: schemas.getTournamentById,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tournament = await prisma.tournament.findUnique({
          where: { id },
          select: {
            id: true,
            winner: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            participants: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            games: {
              select: {
                id: true,
                winner: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
                players: {
                  select: {
                    id: true,
                    username: true,
                    avatarUrl: true,
                  },
                },
                createdAt: true,
              },
            },
            startDate: true,
            endDate: true,
          },
        });

        if (!tournament) {
          return reply.status(400).send({ error: 'Invalid tournament id' });
        }
        return reply.status(200).send(tournament);
      } catch (err) {
        return reply.status(500).send({ error: (err as Error).message });
      }
    },
  );
};

export default tournamentRoutes;
