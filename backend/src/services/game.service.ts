import { prisma } from "../utils/prisma";

export const createGame = async (
  winner: string,
  player1: string,
  player2: string,
  tournament: string | undefined,
) => {
  try {
    const game = await prisma.game.create({
      data: {
        winner: {
          connect: { id: winner },
        },
        players: {
          connect: [{ id: player1 }, { id: player2 }],
        },
        tournament: tournament ? { connect: { id: tournament } } : undefined,
      },
    });
    return game;
  } catch (_err) {
    throw new Error("Invalid ID");
  }
};
