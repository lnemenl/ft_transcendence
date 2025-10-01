import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

export async function registerUser(email, password) {
  // Checking if a user with this email already exists in the database
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash the password for security. Never store plain-text passwords
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // Create a new user in the database
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
    },
  });

  // Do not return the hashed password in the response
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
