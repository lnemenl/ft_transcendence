import Fastify from 'fastify';
import jwtPlugin from '../../src/plugins/jwt';
import { expect, it, describe } from '@jest/globals';

// Unit tests for JWT plugin
// These verify plugin config and authentication decorator in isolation
describe('JWT plugin', () => {
  it('throws error if JWT_SECRET is not set', async () => {
    const oldSecret = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    const app = Fastify();
    await expect(app.register(jwtPlugin)).rejects.toThrow('JWT_SECRET must be set in .env');
    process.env.JWT_SECRET = oldSecret;
  });

  it('responds 401 when authenticate is called without token', async () => {
    process.env.JWT_SECRET = 'secret';
    const app = Fastify();
    await app.register(jwtPlugin);

    // Create a test route that requires authentication
    app.get('/secure', { preHandler: app.authenticate }, async () => ({
      ok: true,
    }));

    // Make a request without a token
    const res = await app.inject({ method: 'GET', url: '/secure' });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toHaveProperty('error', 'Unauthorized');
  });
});
