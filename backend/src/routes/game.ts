import { FastifyInstance } from "fastify";
import { createGame } from "../services/game.service";
import schemas from "./schema.json";

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
};

export default gameRoutes;
