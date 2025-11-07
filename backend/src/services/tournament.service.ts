import { prisma } from '../utils/prisma';
import { Prisma } from '@prisma/client';

export const createTournament = async (participants: string[]) => {
  try {
    const players = participants.map((participant) => ({ id: participant }));
    const tournament = await prisma.tournament.create({ data: { participants: { connect: players } } });
    console.log(tournament);
    return tournament.id;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2025') {
        throw new Error('Invalid ID');
      }
    }
    throw new Error('Internal server error');
  }
};
