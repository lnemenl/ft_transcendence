// User types matching backend API
export interface User {
  id: string;
  email?: string;
  username: string;
  avatarUrl: string | null;
  isOnline?: boolean;
}

export interface UserWithFriends extends User {
  email: string;
  isTwoFactorEnabled?: boolean;
  createdAt?: string;
  friends: User[];
}

// Game types matching backend API
export interface Game {
  id: string;
  winner: User;
  players: [User, User];
  createdAt: string;
}

// Friend request types matching backend API
export interface FriendRequest {
  id: string;
  sender?: User;
  receiver?: User;
}

export interface FriendRequestsResponse {
  sentFriendRequests: Array<{
    id: string;
    receiver: User;
  }>;
  receivedFriendRequests: Array<{
    id: string;
    sender: User;
  }>;
}
