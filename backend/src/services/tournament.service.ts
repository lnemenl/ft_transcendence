import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export const createTournament = async (participants: string[]) => {
  try {
    const players = participants.map((participant) => ({ id: participant }));
    const { id } = await prisma.tournament.create({
      data: {
        participants: {
          connect: players,
        },
      },
      select: {
        id: true,
      },
    });
    return id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      throw new Error('Invalid ID');
    }
    throw new Error('Internal server error');
  }
};
