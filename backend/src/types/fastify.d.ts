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
