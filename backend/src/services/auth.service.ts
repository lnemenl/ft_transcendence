import bcrypt from "bcrypt";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaBetterSQLite3({
  url: process.env.DATABASE_URL,
});
export const prisma = new PrismaClient({ adapter });

const SALT_ROUNDS = 10;

export const registerUser = async (email: string, password: string) => {
  // Checking if a user with this email already exists in the database
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash the password for security. Never store plain-text passwords
  // To compare the password with plain text: compareSync(text, hash)
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

  // Create a new user in the database
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  // Do not return the hashed password in the response
  const { password: _userPasswordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
