import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }

  interface FastifyRequest {
    // request.user is populated after jwtVerify()
    user?: {
      sub: number;
      iat?: number;
      exp?: number;
      [key: string]: unknown;
    };
  }
}


/*
  “Hey TypeScript, I promise that:
  Every FastifyInstance object will have a function called authenticate(request, reply).
  Every FastifyRequest might have a .user object with these fields.”
*/