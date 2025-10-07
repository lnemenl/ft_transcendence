// Central place to import Prisma; keeps adapter config in one spot. Services import prisma from here

import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaBetterSQLite3({
  url: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({ adapter });
