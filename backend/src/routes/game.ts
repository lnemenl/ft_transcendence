import { FastifyInstance } from 'fastify';
import { createGame } from '../services/game.service';
import schemas from './schema.json';
import { prisma } from '../utils/prisma';

const gameRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    '/games',
    {
      schema: schemas.newGame,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      let player: unknown;
      const { player2_token } = request.cookies;
      if (player2_token) {
        try {
          player = fastify.jwt.verify(player2_token);
        } catch (_err) {
          return reply.status(400).send({ error: 'Player 2 Unauthorized' });
        }
      } else {
        return reply.status(200).send({ ok: true });
      }
      try {
        const player1 = (request.user as { id: string }).id;
        const { winner } = request.body as { winner: number };
        const player2 = (player as { id: string }).id;
        const game = await createGame(winner, player1, player2, undefined);
        return reply.status(201).send(game);
      } catch (err) {
        if ((err as Error).message === 'Invalid ID') {
          return reply.status(404).send({ error: (err as Error).message });
        } else if ((err as Error).message === 'Internal server error') {
          return reply.status(500).send({ error: (err as Error).message });
        }
        return reply.status(400).send({ error: (err as Error).message });
      }
    },
  );

  fastify.get(
    '/games',
    {
      schema: schemas.getGames,
      preHandler: [fastify.authenticate],
    },
    async (_request, reply) => {
      try {
        const games = await prisma.game.findMany({
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
        });
        return reply.status(200).send(games);
      } catch (err) {
        return reply.status(500).send({ error: (err as Error).message });
      }
    },
  );

  fastify.get(
    '/games/:id',
    {
      schema: schemas.getGameById,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const game = await prisma.game.findUnique({
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
            players: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
            createdAt: true,
          },
        });

        if (!game) {
          return reply.status(400).send({ error: 'Invalid game id' });
        }
        return reply.status(200).send(game);
      } catch (err) {
        return reply.status(500).send({ error: (err as Error).message });
      }
    },
  );

  fastify.get(
    '/games/me',
    {
      schema: schemas.getGames,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = (request.user as { id: string }).id;
        const games = await prisma.user.findUnique({
          where: { id: userId },
          select: {
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
          },
        });
        if (!games) {
          return reply.status(404).send({ error: 'User not found' });
        }
        return reply.status(200).send(games.games);
      } catch (_err) {
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );

  fastify.get(
    '/games/me/won',
    {
      schema: schemas.getGames,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      try {
        const userId = (request.user as { id: string }).id;
        const games = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            gamesWon: {
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
          },
        });
        if (!games) {
          return reply.status(404).send({ error: 'User not found' });
        }
        return reply.status(200).send(games.gamesWon);
      } catch (_err) {
        return reply.status(500).send({ error: 'Internal server error' });
      }
    },
  );
};

export default gameRoutes;
