import { prisma } from "../utils/prisma";
import { Prisma } from "@prisma/client";

export const createGame = async (
  winner: string,
  player1: string,
  player2: string,
  tournament: string,
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
    console.log("Game created successfully");
    return game;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2025") {
        throw new Error("Invalid ID");
      }
    } else {
      throw new Error("Bad request");
    }
  }
};
