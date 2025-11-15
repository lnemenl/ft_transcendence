import request from 'supertest';
import { expect, it, describe } from '@jest/globals';
import { jest } from '@jest/globals';
import { app } from '../setup';
import { prisma } from '../../src/utils/prisma';
import { cleanDatabase, getCookies, createAuthenticatedUser } from '../helpers';
import { testUsers } from '../fixtures';

describe('Friend request tests', () => {
  let bobId: string;
  let aliceId: string;
  let charlieId: string;
  let friendRequestId: string;
  let authCookies: string[];

  cleanDatabase();

  it('Sendig a friend request to a valid user should pass', async () => {
    const regAlice = await request(app.server).post('/api/register').send(testUsers.alice).expect(201);
    expect(regAlice.body).toHaveProperty('id');
    aliceId = regAlice.body.id;
    const { user, cookies } = await createAuthenticatedUser(testUsers.bob);
    expect(user).toHaveProperty('id');
    bobId = user.id;

    const res = await request(app.server).post(`/api/friend-request/${aliceId}`).set('Cookie', cookies);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body).toHaveProperty('receiver');
    expect(res.body.receiver).toHaveProperty('id');
    expect(res.body.receiver).toHaveProperty('username');
    expect(res.body.receiver).toHaveProperty('avatarUrl');

    friendRequestId = res.body.id;
    authCookies = cookies;
  });

  it('Sending another friend request to the same user should fail', async () => {
    const res = await request(app.server).post(`/api/friend-request/${aliceId}`).set('Cookie', authCookies);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Friend request already exists');
  });

  it('Sending a friend request to an invalid user should fail', async () => {
    const res = await request(app.server).post('/api/friend-request/abc213').set('Cookie', authCookies);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'User not found');
  });

  it('Sending a friend request to yourself should fail', async () => {
    const res = await request(app.server).post(`/api/friend-request/${bobId}`).set('Cookie', authCookies);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Bad Request');
  });

  it('Sender: Friend request should be returned and match the id created', async () => {
    const res = await request(app.server).get('/api/friend-request/me').set('Cookie', authCookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sentFriendRequests');
    expect(res.body).toHaveProperty('receivedFriendRequests');
    expect(Array.isArray(res.body.sentFriendRequests)).toBe(true);
    expect(Array.isArray(res.body.receivedFriendRequests)).toBe(true);
    expect(res.body.sentFriendRequests[0]).toHaveProperty('id', friendRequestId);
    expect(res.body.sentFriendRequests[0]).toHaveProperty('receiver');
    expect(res.body.sentFriendRequests[0].receiver).toHaveProperty('id', aliceId);
    expect(res.body.sentFriendRequests[0].receiver).toHaveProperty('username', testUsers.alice.username);
    expect(res.body.sentFriendRequests[0].receiver).toHaveProperty('avatarUrl');
  });

  it('Receiver: Friend request should be returned and match the id created', async () => {
    const regBob = await request(app.server).post('/api/login').send(testUsers.alice).expect(200);
    authCookies = getCookies(regBob);
    expect(authCookies).toBeDefined();
    expect(Array.isArray(authCookies)).toBe(true);
    const res = await request(app.server).get('/api/friend-request/me').set('Cookie', authCookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sentFriendRequests');
    expect(res.body).toHaveProperty('receivedFriendRequests');
    expect(Array.isArray(res.body.sentFriendRequests)).toBe(true);
    expect(Array.isArray(res.body.receivedFriendRequests)).toBe(true);
    expect(res.body.receivedFriendRequests[0]).toHaveProperty('id', friendRequestId);
    expect(res.body.receivedFriendRequests[0]).toHaveProperty('sender');
    expect(res.body.receivedFriendRequests[0].sender).toHaveProperty('id', bobId);
    expect(res.body.receivedFriendRequests[0].sender).toHaveProperty('username', testUsers.bob.username);
    expect(res.body.receivedFriendRequests[0].sender).toHaveProperty('avatarUrl');
  });

  it('Sender: Accepting the friend request should fail', async () => {
    const regAlice = await request(app.server).post('/api/login').send(testUsers.bob).expect(200);
    authCookies = getCookies(regAlice);
    expect(authCookies).toBeDefined();
    expect(Array.isArray(authCookies)).toBe(true);
    const res = await request(app.server).patch(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'User cannot accept friend request');
  });

  it('Receiver: Accepting the friend request should pass', async () => {
    const regBob = await request(app.server).post('/api/login').send(testUsers.alice).expect(200);
    authCookies = getCookies(regBob);
    expect(authCookies).toBeDefined();
    expect(Array.isArray(authCookies)).toBe(true);
    const res = await request(app.server).patch(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id', bobId);
    expect(res.body).toHaveProperty('username', testUsers.bob.username);
    expect(res.body).toHaveProperty('avatarUrl');
  });

  it('Receiver: Accepting an already accepted friend request should fail', async () => {
    const res = await request(app.server).patch(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error', 'Friend request already accepted');
  });

  it('Accepting an invalid friend request should fail', async () => {
    const res = await request(app.server).patch('/api/friend-request/abcdefg123456').set('Cookie', authCookies);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Invalid friend request');
  });

  it('Declining a valid friend request should pass', async () => {
    const regCharlie = await request(app.server).post('/api/register').send(testUsers.charlie).expect(201);
    expect(regCharlie.body).toHaveProperty('id');
    charlieId = regCharlie.body.id;

    const friendRequest = await request(app.server)
      .post(`/api/friend-request/${charlieId}`)
      .set('Cookie', authCookies)
      .expect(201);

    expect(friendRequest.body).toHaveProperty('id');
    friendRequestId = friendRequest.body.id;
    const loginCharlie = await request(app.server).post('/api/login').send(testUsers.charlie).expect(200);
    authCookies = getCookies(loginCharlie);

    const res = await request(app.server).delete(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('ok', true);
  });

  it('Declining an invalid friend request should fail', async () => {
    await request(app.server).post(`/api/friend-request/${aliceId}`).set('Cookie', authCookies).expect(201);

    const loginAlice = await request(app.server).post('/api/login').send(testUsers.alice).expect(200);
    authCookies = getCookies(loginAlice);

    const res = await request(app.server).delete(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies);

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error', 'Invalid id');
  });

  it('Database call is protected when checking for an existing friend request', async () => {
    jest.spyOn(prisma.friendRequest, 'findFirst').mockRejectedValue('Internal server error');

    const res = await request(app.server).post(`/api/friend-request/${bobId}`).set('Cookie', authCookies);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });

  it('Database call is protected when creating a friend request', async () => {
    jest.spyOn(prisma.friendRequest, 'create').mockRejectedValue('Internal server error');

    const res = await request(app.server).post(`/api/friend-request/${bobId}`).set('Cookie', authCookies);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });

  it('Database call is protected when fetching friend requests', async () => {
    jest.spyOn(prisma.user, 'findUnique').mockRejectedValue('Internal server error');

    const res = await request(app.server).get(`/api/friend-request/me`).set('Cookie', authCookies);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });

  it('Database call is protected when accepting a friend request', async () => {
    jest.spyOn(prisma.friendRequest, 'findUnique').mockRejectedValue('Internal server error');

    const res = await request(app.server).patch(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });

  it('Database call is protected when declining a friend request', async () => {
    jest.spyOn(prisma.friendRequest, 'delete').mockRejectedValue('Internal server error');

    const res = await request(app.server).delete(`/api/friend-request/${friendRequestId}`).set('Cookie', authCookies);

    expect(res.status).toBe(500);
    expect(res.body).toHaveProperty('error', 'Internal server error');
  });
});
