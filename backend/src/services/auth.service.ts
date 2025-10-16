import { prisma } from "../utils/prisma";
import bcrypt from "bcrypt";
import { FastifyReply } from "fastify";

const SALT_ROUNDS = 10;

export const registerUser = async (email: string, password: string) => {
  // Checking if a user with this email already exists in the database
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    throw new Error("User with this email already exists");
  }

  // Hash the password for security. Never store plain-text passwords
  // To compare the password with plain text: compareSync(text, hash)
  const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);

  // Create a new user in the database
  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  // Do not return the hashed password in the response
  const { password: _userPasswordHash, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const loginUser = async (
  email: string,
  password: string,
  reply: FastifyReply,
) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const token = await reply.jwtSign(
    { sub: user.id }, // The playload. 'sub' is standard for 'subject' (the user's ID)
    { expiresIn: "1h" }, // The token will expire in 1h
  );

  return token;
};

//Payload = Request body (data sent by the client)
