import request from 'supertest';
import app from '../../src/test'

beforeAll(async () => {
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('API works', () => {

  it('Testing that the API works', async () => {
    const res = await request(app.server).get('/');
    expect(res.statusCode).toBe(200);
  });

  it('Registering a new user', async () => {
    const email = 'test@test.com';
    const res = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: {
        email: email,
        password: 'hello123'
      },
      headers: {
        'Content-Type': 'application/json'
      },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.email).toBe(email);
  });

  it('Registering the same user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/register',
      payload: {
        email: 'test@test.com',
        password: 'hello123'
      },
      headers: {
        'Content-Type': 'application/json'
      },
    });
    expect(res.statusCode).toBe(400);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('User already exists');
  });

  it('User login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: {
        email: 'test@test.com',
        password: 'hello123'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.accessToken).toBeDefined();
  });

  it('Invalid user email login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: {
        email: 'invalid@test.com',
        password: 'hello123'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Invalid email or password');
  });

  it('Invalid user password login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/login',
      payload: {
        email: 'test@test.com',
        password: 'invalid'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });
    expect(res.statusCode).toBe(401);
    const body = JSON.parse(res.body);
    expect(body.error).toBe('Invalid email or password');
  });

});

