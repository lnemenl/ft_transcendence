import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  getCurrentUser,
  updateCurrentUser,
  deleteFriend,
  getMyGames,
  getAllUsers,
  sendFriendRequest,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
} from "../utils/api";
import type { User, Game, UserWithFriends, FriendRequestsResponse } from "../types";
import { Blobs } from "./Blobs";
import { TwoFactorSettings } from "./TwoFactorSettings";

export const Profile: React.FC = () => {
  const [user, setUser] = useState<UserWithFriends | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Avatar upload state
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Friend management state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequestsResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddFriend, setShowAddFriend] = useState(false);

  // Load user data and game history
  useEffect(() => {
    loadUserData();
    loadGameHistory();
    loadFriendRequests();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await getCurrentUser();
      setUser(userData);
      setError("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load user data";
      setError(errorMessage);
      console.error("Failed to load user:", errorMessage);
      // If unauthorized, user should be redirected to login
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadGameHistory = async () => {
    try {
      const gamesData = await getMyGames();
      setGames(gamesData);
      console.log('Games loaded:', gamesData.length, gamesData);
    } catch (err) {
      console.error("Failed to load games:", err);
      setGames([]); // Set empty array on error
    }
  };

  const loadFriendRequests = async () => {
    try {
      const requests = await getFriendRequests();
      setFriendRequests(requests);
    } catch (err) {
      console.error("Failed to load friend requests:", err);
      setFriendRequests({ sentFriendRequests: [], receivedFriendRequests: [] });
    }
  };

  const loadAllUsers = async () => {
    try {
      const users = await getAllUsers();
      setAllUsers(users);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  };

  const handleAvatarUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Handle file upload by converting to base64 or uploading to a service
    if (avatarFile) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          setUploadingAvatar(true);
          const base64String = reader.result as string;
          await updateCurrentUser({ avatarUrl: base64String });
          // Reload full user data with friends
          await loadUserData();
          setAvatarFile(null);
          setAvatarUrl("");
          setError("");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to update avatar");
        } finally {
          setUploadingAvatar(false);
        }
      };
      reader.readAsDataURL(avatarFile);
    } else if (avatarUrl.trim()) {
      // Handle URL upload
      try {
        setUploadingAvatar(true);
        await updateCurrentUser({ avatarUrl: avatarUrl.trim() });
        // Reload full user data with friends
        await loadUserData();
        setAvatarUrl("");
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update avatar");
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarUrl(""); // Clear URL input when file is selected
    }
  };

  const handleDeleteFriend = async (friendId: string, friendName: string) => {
    if (!window.confirm(`Remove ${friendName} from your friends?`)) return;

    try {
      await deleteFriend(friendId);
      await loadUserData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete friend");
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    try {
      await sendFriendRequest(userId);
      await loadFriendRequests();
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send friend request");
    }
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    try {
      await acceptFriendRequest(requestId);
      await loadUserData();
      await loadFriendRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept friend request");
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    try {
      await declineFriendRequest(requestId);
      await loadFriendRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to decline friend request");
    }
  };

  const toggleAddFriend = () => {
    setShowAddFriend(!showAddFriend);
    if (!showAddFriend && allUsers.length === 0) {
      loadAllUsers();
    }
  };

  // Filter users for friend search
  const filteredUsers = allUsers.filter((u) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query)
    );
  });

  // Check if user is already a friend or has pending request
  const isFriend = (userId: string) => user?.friends.some((f) => f.id === userId);
  const hasPendingRequest = (userId: string) =>
    friendRequests?.sentFriendRequests.some((r) => r.receiver.id === userId);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center w-full min-h-screen">
        <div className="text-2xl text-[#24273a] dark:text-[#cad3f5]">Loading...</div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="flex flex-col justify-center items-center w-full min-h-screen gap-4">
        <div className="text-2xl text-red-500">Error: {error}</div>
        <Link to="/" className="p-4 dark:text-[#cad3f5] hover:font-bold">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    return (
    <>
      <Blobs />
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <span className="mr-2">←</span> Back
        </Link>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300">
            {error}
          </div>
        )}

        {user && (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Left Column - Profile Info */}
            <div className="md:col-span-1 space-y-6">
              {/* User Card */}
              <div className="bg-white dark:bg-[#1e2030] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-col items-center text-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-4">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-gray-400">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-1">
                    {user.username}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>

                {/* Avatar Upload */}
                <form onSubmit={handleAvatarUpload} className="mt-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Update Avatar
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 dark:hover:file:bg-blue-900/50"
                      disabled={uploadingAvatar}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-2 bg-white dark:bg-[#1e2030] text-gray-500">or use URL</span>
                    </div>
                  </div>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#24273a] text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={uploadingAvatar}
                  />
                  <button
                    type="submit"
                    disabled={uploadingAvatar || (!avatarUrl.trim() && !avatarFile)}
                    className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    {uploadingAvatar ? "Uploading..." : "Update"}
                  </button>
                </form>
              </div>

              {/* Stats Card */}
              <div className="bg-white dark:bg-[#1e2030] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Friends</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{user.friends.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Games Played</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{games.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Wins</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {games.filter(g => g.winner.id === user.id).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* 2FA Settings Card */}
              <div className="bg-white dark:bg-[#1e2030] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Security</h3>
                <TwoFactorSettings />
              </div>
            </div>

            {/* Right Column - Friends & Games */}
            <div className="md:col-span-2 space-y-6">{/* Friend Requests */}
              {/* Friend Requests */}
              {friendRequests && friendRequests.receivedFriendRequests.length > 0 && (
                <div className="bg-white dark:bg-[#1e2030] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Friend Requests ({friendRequests.receivedFriendRequests.length})
                  </h2>
                  <div className="space-y-2">
                    {friendRequests.receivedFriendRequests.map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#24273a] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                            {request.sender.avatarUrl ? (
                              <img src={request.sender.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                {request.sender.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {request.sender.username}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptFriendRequest(request.id)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineFriendRequest(request.id)}
                            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends */}
              <div className="bg-white dark:bg-[#1e2030] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Friends ({user.friends.length})
                  </h2>
                  <button
                    onClick={toggleAddFriend}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {showAddFriend ? "Close" : "+ Add"}
                  </button>
                </div>

                {/* Add Friend Search */}
                {showAddFriend && (
                  <div className="mb-4 p-4 bg-gray-50 dark:bg-[#24273a] rounded-lg space-y-3">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search users..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-[#1e2030] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredUsers.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                          {searchQuery ? "No users found" : "Loading..."}
                        </p>
                      ) : (
                        filteredUsers.map((u) => (
                          <div key={u.id} className="flex items-center justify-between p-2 bg-white dark:bg-[#1e2030] rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600">
                                {u.avatarUrl ? (
                                  <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                                    {u.username.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-gray-900 dark:text-white">{u.username}</span>
                            </div>
                            {isFriend(u.id) ? (
                              <span className="text-xs text-green-600 dark:text-green-400">Friends</span>
                            ) : hasPendingRequest(u.id) ? (
                              <span className="text-xs text-yellow-600 dark:text-yellow-400">Pending</span>
                            ) : (
                              <button
                                onClick={() => handleSendFriendRequest(u.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* Friends List */}
                {user.friends.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No friends yet</p>
                ) : (
                  <div className="space-y-2">
                    {user.friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#24273a] rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-300 dark:bg-gray-600 relative">
                            {friend.avatarUrl ? (
                              <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-500">
                                {friend.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                            {friend.isOnline && (
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-[#24273a]"></div>
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{friend.username}</div>
                            {friend.isOnline && (
                              <div className="text-xs text-green-600 dark:text-green-400">Online</div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteFriend(friend.id, friend.username)}
                          className="px-3 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Game History */}
              <div className="bg-white dark:bg-[#1e2030] rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Game History ({games.length})
                </h2>
                {games.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No games yet</p>
                ) : (
                  <div className="space-y-2">
                    {games.map((game) => {
                      const won = user && game.winner.id === user.id;
                      return (
                        <div
                          key={game.id}
                          className={`p-4 rounded-lg border-l-4 ${
                            won
                              ? "border-green-500 bg-green-50 dark:bg-green-900/10"
                              : "border-red-500 bg-red-50 dark:bg-red-900/10"
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {game.players[0].username} vs {game.players[1].username}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Winner: {game.winner.username} {won && "🏆"}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(game.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};
