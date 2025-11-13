import { beforeAll, afterAll } from '@jest/globals';
import app from '../src/index';
import { prisma } from '../src/utils/prisma';

const resetDb = async () => {
  try {
    await prisma.friendRequest.deleteMany({});
    await prisma.game.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({});
  } catch (err) {
    console.log('Error during DB reset:', err);
  }
};

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_ACCESS_EXPIRES_IN = '1s';
  await app.ready();
  await prisma.$connect();
  await resetDb();
});

afterAll(async () => {
  // Final cleanup: remove dependent rows first, then users
  try {
    await prisma.friendRequest.deleteMany({});
    await prisma.game.deleteMany({});
    await prisma.tournament.deleteMany({});
    await prisma.refreshToken.deleteMany({});
    await prisma.user.deleteMany({}); // Final cleanup
  } catch (err) {
    console.log('Error during final DB cleanup:', err);
  }
  await prisma.$disconnect();
  await app.close();
});

export { app, prisma };
