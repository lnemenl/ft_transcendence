import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

process.env.NODE_ENV = 'test';

const testDbPath = path.resolve(__dirname, '../database/test.db');
const testDbDir = path.dirname(testDbPath);

if (!fs.existsSync(testDbDir)) {
  fs.mkdirSync(testDbDir, { recursive: true });
}

process.env.DATABASE_URL = `file:${testDbPath}`;

let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  global.prisma = prisma;
})

afterAll(async () => {
  if (global.prisma) {
    await global.prisma.$disconnect();
  }
})
