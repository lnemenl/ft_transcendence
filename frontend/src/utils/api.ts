import type { User, UserWithFriends, Game, FriendRequestsResponse } from '../types';

/**
 * Base fetch wrapper with error handling
 * Automatically includes credentials (cookies) with every request
 */
async function apiFetch<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Always include cookies for authentication
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== USER ENDPOINTS ====================

/**
 * GET /api/users/me
 * Fetch the authenticated user's information with friends
 */
export async function getCurrentUser(): Promise<UserWithFriends> {
  return apiFetch<UserWithFriends>('/api/users/me');
}

/**
 * PATCH /api/users/me
 * Update the authenticated user's profile
 */
export async function updateCurrentUser(data: {
  username?: string;
  avatarUrl?: string;
}): Promise<UserWithFriends> {
  return apiFetch<UserWithFriends>('/api/users/me', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

// ==================== FRIEND ENDPOINTS ====================

/**
 * DELETE /api/users/me/friends/:id
 * Delete a friend by their user ID
 */
export async function deleteFriend(friendId: string): Promise<User> {
  // Backend expects no body, so we remove Content-Type header
  const response = await fetch(`/api/users/me/friends/${friendId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * POST /api/friend-request/:id
 * Send a friend request to another user
 */
export async function sendFriendRequest(userId: string): Promise<{
  id: string;
  receiver: User;
}> {
  // Backend expects no body, so we remove Content-Type header
  const response = await fetch(`/api/friend-request/${userId}`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * GET /api/friend-request/me
 * Get all friend requests (sent and received)
 */
export async function getFriendRequests(): Promise<FriendRequestsResponse> {
  return apiFetch<FriendRequestsResponse>('/api/friend-request/me');
}

/**
 * PATCH /api/friend-request/:id
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId: string): Promise<User> {
  // Backend expects no body, so we remove Content-Type header
  const response = await fetch(`/api/friend-request/${requestId}`, {
    method: 'PATCH',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

/**
 * DELETE /api/friend-request/:id
 * Decline a friend request or cancel a sent request
 */
export async function declineFriendRequest(requestId: string): Promise<{ ok: boolean }> {
  // Backend expects no body, so we remove Content-Type header
  const response = await fetch(`/api/friend-request/${requestId}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// ==================== GAME ENDPOINTS ====================

/**
 * GET /api/games/me
 * Get all games the user has participated in
 */
export async function getMyGames(): Promise<Game[]> {
  return apiFetch<Game[]>('/api/games/me');
}

/**
 * GET /api/games/me/won
 * Get all games the user has won
 */
export async function getMyWonGames(): Promise<Game[]> {
  return apiFetch<Game[]>('/api/games/me/won');
}

/**
 * GET /api/users/:id
 * Get a user's public profile by ID
 */
export async function getUserById(userId: string): Promise<User> {
  return apiFetch<User>(`/api/users/${userId}`);
}

/**
 * GET /api/users
 * Get all users (excluding current user)
 */
export async function getAllUsers(): Promise<User[]> {
  return apiFetch<User[]>('/api/users');
}
