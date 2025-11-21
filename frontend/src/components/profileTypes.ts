export interface Friend {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  friends: Friend[];
}

export interface RequestUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export interface FriendRequest {
  id: string;
  sender?: RequestUser;
  receiver?: RequestUser;
}

export interface FriendRequestData {
  sentFriendRequests: FriendRequest[];
  receivedFriendRequests: FriendRequest[];
}

export interface PublicUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}
