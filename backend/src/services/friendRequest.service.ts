import { prisma } from '../utils/prisma';

export const createFriendRequest = async (senderId: string, receiverId: string) => {
  const exists = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    },
  });

  if (exists) throw new Error('Friend request already exists');

  const friendRequest = await prisma.friendRequest.create({
    data: {
      sender: { connect: { id: senderId } },
      receiver: { connect: { id: receiverId } },
    },
    select: {
      id: true,
      receiver: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  return friendRequest;
};

export const getUserFriendRequests = async (userId: string) => {
  const friendRequests = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sentFriendRequests: {
        select: {
          id: true,
          receiver: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
      receivedFriendRequests: {
        select: {
          id: true,
          sender: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
        },
      },
    },
  });

  return friendRequests;
};

export const acceptFriend = async (userId: string, friendRequestId: string) => {
  const friendRequest = await prisma.friendRequest.findUnique({ where: { id: friendRequestId } });

  if (!friendRequest) throw new Error('Invalid friend request');

  if (friendRequest.accepted) throw new Error('Friend request already accepted');

  if (friendRequest.senderId === userId) throw new Error('User cannot accept friend request');

  const [_updatedRequest, friend] = await prisma.$transaction([
    // Update the friend request status
    prisma.friendRequest.update({
      where: { id: friendRequest.id },
      data: { accepted: true },
    }),

    // Add the friend
    prisma.user.update({
      where: { id: friendRequest.senderId },
      data: {
        friends: { connect: { id: friendRequest.receiverId } },
      },
      select: { id: true, username: true, avatarUrl: true },
    }),
  ]);

  return friend;
};

export const deleteRequest = async (id: string) => {
  const friendRequest = await prisma.friendRequest.delete({ where: { id } });

  return friendRequest;
};
