import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export const createGame = async (winner: number, player1: string, player2: string, tournament: string | undefined) => {
  try {
    let winnerId: string;
    if (winner === 1) {
      winnerId = player1;
    } else if (winner === 2) {
      winnerId = player2;
    } else {
      throw new Error('Invalid winner');
    }
    const game = await prisma.game.create({
      data: {
        winner: {
          connect: { id: winnerId },
        },
        players: {
          connect: [{ id: player1 }, { id: player2 }],
        },
        tournament: tournament ? { connect: { id: tournament } } : undefined,
      },
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
    return game;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error('Invalid ID');
    }
    if ((err as Error).message === 'Invalid winner') {
      throw new Error('Invalid winner');
    }
    throw new Error('Internal server error');
  }
};
