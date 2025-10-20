import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma";

const getMeSchema = {
  description: "Return the currently authenticated user's profile",
  tags: ["User"],
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string", format: "email" },
        username: { type: ["string", "null"] },
        avatarUrl: { type: ["string", "null"], format: "uri" },
      },
    },
    404: {
      type: "object",
      properties: { error: { type: "string" } },
    },
    401: {
      type: "object",
      properties: { error: { type: "string" } },
    },
  },
} as const;

const updateUserSchema = {
  description: "Update the currently authenticated user's profile",
  tags: ["User"],
  body: {
    type: "object",
    properties: {
      username: { type: "string", minLength: 2 },
      avatarUrl: { type: "string", format: "uri" },
    },
    minProperties: 1,
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
        email: { type: "string", format: "email" },
        username: { type: ["string", "null"] },
        avatarUrl: { type: ["string", "null"], format: "uri" },
      },
    },
    404: {
      type: "object",
      properties: { error: { type: "string" } },
    },
    401: {
      type: "object",
      properties: { error: { type: "string" } },
    },
  },
} as const;

const getUserSchema = {
  description: "Fetch a public user profile by ID",
  tags: ["User"],
  params: {
    type: "object",
    properties: {
      id: { type: "string" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "string" },
        username: { type: ["string", "null"] },
        avatarUrl: { type: ["string", "null"], format: "uri" },
      },
    },
    404: {
      type: "object",
      properties: { error: { type: "string" } },
    },
    401: {
      type: "object",
      properties: { error: { type: "string" } },
    },
  },
} as const;

const userRoutes = async (fastify: FastifyInstance) => {
  fastify.get(
    "/me",
    {
      schema: getMeSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
        },
      });

      if (!user) return reply.status(404).send({ error: "User not found" });
      return reply.status(200).send(user);
    },
  );

  fastify.patch(
    "/me",
    {
      schema: updateUserSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = (request.user as { sub: string }).sub;
      const dataToUpdate = request.body as {
        username?: string;
        avatarUrl?: string;
      };

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
        },
      });
      return reply.status(200).send(updatedUser);
    },
  );

  fastify.get(
    "/:id",
    {
      schema: getUserSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });

      if (!user) return reply.status(404).send({ error: "User not found" });
      return reply.status(200).send(user);
    },
  );
};

export default userRoutes;
