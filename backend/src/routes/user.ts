import { FastifyInstance } from "fastify";
import { prisma } from "../utils/prisma";

const getMeSchema = {
  description: "Return the currently authenticated user's profile",
  tags: ["User"],
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        email: { type: "string", format: "email" },
        displayName: { type: ["string", "null"] },
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
      displayName: { type: "string", minLength: 2 },
      avatarUrl: { type: "string", format: "uri" },
    },
    minProperties: 1,
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        email: { type: "string", format: "email" },
        displayName: { type: ["string", "null"] },
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
      id: { type: "number" },
    },
    required: ["id"],
  },
  response: {
    200: {
      type: "object",
      properties: {
        id: { type: "number" },
        displayName: { type: ["string", "null"] },
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

export default async function userRoutes(fastify: FastifyInstance) {
  fastify.get(
    "/me",
    {
      schema: getMeSchema,
      preHandler: [fastify.authenticate],
    },
    async (request, reply) => {
      const userId = (request.user as { sub: number }).sub;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          displayName: true,
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
      const userId = (request.user as { sub: number }).sub;
      const dataToUpdate = request.body as {
        displayName?: string;
        avatarUrl?: string;
      };

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        select: {
          id: true,
          email: true,
          displayName: true,
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
      const { id } = request.params as { id: number };
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
        },
      });

      if (!user) return reply.status(404).send({ error: "User not found" });
      return reply.status(200).send(user);
    },
  );
}
