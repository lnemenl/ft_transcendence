import { FastifyInstance } from "fastify";
import schemas from "./schema.json";

const gameRoutes = async (fastify: FastifyInstance) => {
  fastify.post(
    "/games",
    { schema: schemas.newGame },
    async (request, reply) => {
      try {
        const { winnerId, player1Id, player2Id, tournamentId } = request.body;
      } catch (err) {
        return reply.status(400).send({ error: (err as Error).message });
      }
    },
  );
}

export default gameRoutes;
