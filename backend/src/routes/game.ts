import { FastifyError, FastifyInstance } from "fastify";
import { createGame } from "../services/game.service";
import schemas from "./schema.json";
import { prisma } from "../utils/prisma";

const gameRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/games",
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
          return reply.status(400).send({ error: "Player 2 Unauthorized" });
        }
      } else {
        return reply.status(200).send({ ok: true });
      }
      try {
        const player1 = (request.user as { sub: string }).sub;
        const { winnerId, tournamentId } = request.body as {
          winnerId: string;
          tournamentId: string;
        };
        const player2 = (player as { sub: string }).sub;
        const game = await createGame(winnerId, player1, player2, tournamentId);
        return reply.status(201).send(game);
      } catch (err) {
        if ((err as Error).message === "Invalid ID") {
          return reply.status(404).send({ error: (err as Error).message });
        }
        return reply.status(400).send({ error: (err as Error).message });
      }
    },
  );

  fastify.get(
    "/games/:id",
    {
      schema: schemas.getGameById,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
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

      console.log("Fetched game:", game);

      if (!game) {
        return reply.status(400).send({ error: "Invalid game id" });
      }
      return reply.status(200).send({ game: game });
    },
  );
};

export default gameRoutes;
