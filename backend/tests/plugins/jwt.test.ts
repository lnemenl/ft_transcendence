import Fastify from 'fastify';
import { describe, it, expect } from '@jest/globals';
import jwtPlugin from '../../src/plugins/jwt';

describe('JWT Plugin', () => {
  it('throws error when JWT_SECRET is missing', async () => {
    const oldSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    const app = Fastify();

    await expect(app.register(jwtPlugin)).rejects.toThrow('JWT_SECRET must be set in .env');

    process.env.JWT_SECRET = oldSecret;
  });

  it('rejects unauthenticated requests to protected routes', async () => {
    process.env.JWT_SECRET = 'test-secret';
    const app = Fastify();
    await app.register(jwtPlugin);

    // Create protected route
    // @ts-expect-error - authenticate is added by plugin
    app.get('/protected', { preHandler: app.authenticate }, async () => ({ ok: true }));

    const res = await app.inject({ method: 'GET', url: '/protected' });

    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({ error: 'Unauthorized' });
  });
});
