import { prisma } from '../utils/prisma';

export const createFriendRequest = async (senderId: string, receiverId: string) => {
  const friendRequest = await prisma.friendRequest.create({
    data: {
      sender: { connect: { id: senderId } },
      receiver: { connect: { id: receiverId } },
    },
    select: {
      receiver: { select: { id: true, username: true, avatarUrl: true } },
    },
  });

  if (!friendRequest) throw new Error('User not found');

  return friendRequest;
};

export const acceptFriend = async (id: string) => {
  const friendRequest = await prisma.friendRequest.findUnique({ where: { id } });

  if (!friendRequest) throw new Error('Invalid friend request');

  if (friendRequest.accepted) throw new Error('Friend request already accepted');

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

  if (!friendRequest) throw new Error('Invalid id');

  return friendRequest;
};
