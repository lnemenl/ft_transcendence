import { Link } from "react-router-dom";
import { TwoFactorSettings } from "./TwoFactorSettings";
import { useAuth } from "./GetAuth";
import { useState, useEffect, useCallback } from "react";
// We use 'react-icons' (FontAwesome variant) for the Google-style minimal icons
import { FaUserPlus, FaCheck, FaTimes, FaTrash, FaCircle } from "react-icons/fa";

// Types (Synced with Backend)

interface Friend {
  id: string;
  username: string;
  avatarUrl: string | null;
  isOnline: boolean;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  friends: Friend[];
}

interface RequestUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface FriendRequest {
  id: string;
  sender?: RequestUser;
  receiver?: RequestUser;
}

interface FriendRequestData {
  sentFriendRequests: FriendRequest[];
  receivedFriendRequests: FriendRequest[];
}

interface PublicUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

// Constants & Helpers

const AVATAR_SEEDS = Array.from({ length: 30 }, (_, i) => `adventurer-${i + 1}`);

const generateAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
};

// Component

export const Profile: React.FC = () => {
  const { isLoggedIn } = useAuth();

  // State Management
  const [user, setUser] = useState<UserProfile | null>(null);
  // We initialize with empty arrays to prevent "undefined" errors during first render
  const [requests, setRequests] = useState<FriendRequestData>({ sentFriendRequests: [], receivedFriendRequests: [] });
  const [loading, setLoading] = useState<boolean>(true);

  // UI State
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addableUsers, setAddableUsers] = useState<PublicUser[]>([]);

  // Edit Profile State
  const [editMode, setEditMode] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Data Fetching Strategy
  // We fetch both Profile and Requests in parallel for efficiency
  // This ensures the UI doesn't "pop" in sequentially
  const fetchData = useCallback(async () => {
    try {
      const [userRes, reqRes] = await Promise.all([
        fetch("/api/users/me"),
        fetch("/api/friend-request/me")
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
        setNewUsername(userData.username);
      }

      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn, fetchData]);

  // Friend Actions

  // Prepares the "Add Friend" modal by fetching all users and filtering locally
  // to exclude people who are already connected
  const openAddModal = async () => {
    setShowAddModal(true);
    try {
      const res = await fetch("/api/users/");
      if (res.ok) {
        const allUsers: PublicUser[] = await res.json();
        
        // Filter Logic: Remove Self, Friends, Sent Requests, Received Requests
        const excludeIds = new Set([
          user?.id,
          ...(user?.friends.map(f => f.id) || []),
          ...requests.sentFriendRequests.map(r => r.receiver?.id),
          ...requests.receivedFriendRequests.map(r => r.sender?.id)
        ]);
        
        setAddableUsers(allUsers.filter(u => !excludeIds.has(u.id)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Send a request
  const sendRequest = async (userId: string) => {
    const res = await fetch(`/api/friend-request/${userId}`, { method: "POST" });
    if (res.ok) {
      setShowAddModal(false); // Close modal immediately for better UX
      fetchData(); // Refresh data to show the new sent request
    }
  };

  // Accept a request
  const acceptRequest = async (requestId: string) => {
    const res = await fetch(`/api/friend-request/${requestId}`, { method: "PATCH" });
    if (res.ok) fetchData();
  };

  // Delete/Decline/Cancel a request
  const removeRequest = async (requestId: string) => {
    const res = await fetch(`/api/friend-request/${requestId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  // Remove a friend
  const removeFriend = async (friendId: string) => {
    if (!confirm("Remove this friend?")) return;
    const res = await fetch(`/api/users/me/friends/${friendId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  // Profile Actions

  const handleSaveUsername = async () => {
    if (!newUsername.trim() || newUsername === user?.username) {
      setEditMode(false);
      return;
    }
    setSaving(true);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: newUsername }),
    });
    if (res.ok) {
      // Optimistic update or full refresh? Full refresh is safer
      await fetchData();
      setEditMode(false);
    }
    setSaving(false);
  };

  const handleSelectAvatarStyle = async (seed: string) => {
    const newUrl = generateAvatarUrl(seed);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: newUrl }),
    });
    if (res.ok) {
      await fetchData();
      setShowAvatarPicker(false);
    }
  };

  // Render

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-screen bg-[#fafbfc] dark:bg-[#121212] flex flex-col items-center justify-center gap-4 font-inter">
        <p className="text-[#5f6368] dark:text-[#e8eaed]">Please log in to view your profile</p>
        <Link to="/" className="text-[#1f2937] dark:text-[#8ab4f8] text-sm hover:underline">Back to Home</Link>
      </div>
    );
  }

  if (loading || !user) {
    return (
      <div className="w-full min-h-screen bg-[#F8F9FA] dark:bg-[#121212] flex items-center justify-center font-inter">
        <p className="text-[#444746] dark:text-[#C4C7C5] text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] dark:bg-[#121212] font-inter">
      <div className="flex items-center justify-center w-full min-h-screen px-6 py-12">
        <div className="w-full max-w-lg space-y-6">

          {/* Avatar & Header */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="relative group flex-shrink-0 focus:outline-none"
              title="Change Avatar"
            >
              <img
                src={user.avatarUrl || generateAvatarUrl(user.username)}
                alt={user.username}
                className="w-24 h-24 rounded-full border-4 border-[#E0E2E7] dark:border-[#49454F] bg-white cursor-pointer transition-opacity hover:opacity-80"
              />
            </button>
            <div className="text-center">
              <h1 className="text-2xl font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">{user.username}</h1>
              <p className="text-sm text-[#444746] dark:text-[#C4C7C5]">{user.email}</p>
            </div>
          </div>

          {/* Username Edit Card */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl p-6">
            <div className="space-y-4">
              <label className="text-xs font-bold text-[#444746] dark:text-[#C4C7C5] uppercase tracking-wider block">Display Name</label>
              {editMode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm border border-[#E0E2E7] dark:border-[#49454F] rounded-full bg-transparent text-[#1F1F1F] dark:text-[#E2E2E2] focus:outline-none focus:border-[#6688cc]"
                    disabled={saving}
                    autoFocus
                  />
                  <button onClick={handleSaveUsername} disabled={saving} className="px-5 py-2 text-sm font-medium text-white bg-[#6688cc] rounded-full hover:bg-[#5577bb]">
                    {saving ? "..." : "Save"}
                  </button>
                  <button onClick={() => { setEditMode(false); setNewUsername(user.username); }} className="px-4 py-2 text-sm font-medium text-[#444746] dark:text-[#C4C7C5] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full">
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-base text-[#1F1F1F] dark:text-[#E2E2E2] ml-1">{user.username}</span>
                  <button onClick={() => setEditMode(true)} className="text-sm font-medium text-[#6688cc] hover:underline px-2">Edit</button>
                </div>
              )}
            </div>
          </div>

          {/* PEOPLE CARD (Friends & Requests) */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#E0E2E7] dark:border-[#49454F] flex justify-between items-center bg-gray-50 dark:bg-[#252525]">
              <div className="flex gap-4">
                <button 
                  onClick={() => setActiveTab("friends")}
                  className={`text-sm font-medium transition-colors ${activeTab === "friends" ? "text-[#6688cc]" : "text-[#444746] dark:text-[#C4C7C5] hover:text-black dark:hover:text-white"}`}
                >
                  Friends ({user.friends.length})
                </button>
                <button 
                  onClick={() => setActiveTab("requests")}
                  className={`text-sm font-medium transition-colors ${activeTab === "requests" ? "text-[#6688cc]" : "text-[#444746] dark:text-[#C4C7C5] hover:text-black dark:hover:text-white"}`}
                >
                  {/* Sum both sent and received requests so you see (1) when you send a request */}
                  Requests ({requests.receivedFriendRequests.length + requests.sentFriendRequests.length})
                </button>
              </div>
              <button onClick={openAddModal} className="flex items-center gap-2 px-3 py-1.5 bg-[#6688cc] hover:bg-[#5577bb] text-white text-xs font-medium rounded-full transition-colors">
                <FaUserPlus /> Add
              </button>
            </div>

            {/* List Content */}
            <div className="p-2 max-h-[300px] overflow-y-auto">
              
              {/* FRIENDS TAB */}
              {activeTab === "friends" ? (
                user.friends.length === 0 ? (
                  <p className="text-center text-sm text-[#444746] py-6">No friends yet</p>
                ) : (
                  user.friends.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-2xl group transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <img src={f.avatarUrl || generateAvatarUrl(f.username)} className="w-8 h-8 rounded-full bg-gray-200" alt=""/>
                          {/* Online Status Dot: Green if true, Gray if false */}
                          <FaCircle size={10} className={`absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-[#1E1E1E] rounded-full ${f.isOnline ? "text-green-500" : "text-gray-300"}`} />
                        </div>
                        <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">{f.username}</span>
                      </div>
                      {/* Delete Icon: Visible only on hover */}
                      <button onClick={() => removeFriend(f.id)} className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <FaTrash size={12} />
                      </button>
                    </div>
                  ))
                )
              ) : (
                /* REQUESTS TAB */
                <div className="space-y-2">
                  {requests.receivedFriendRequests.length === 0 && requests.sentFriendRequests.length === 0 && (
                    <p className="text-center text-sm text-[#444746] py-6">No requests</p>
                  )}
                  
                  {/* Received Requests */}
                  {requests.receivedFriendRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl">
                      <div className="flex items-center gap-3">
                         <img src={req.sender?.avatarUrl || generateAvatarUrl(req.sender?.username || "")} className="w-8 h-8 rounded-full" alt=""/>
                         <div className="flex flex-col">
                           <span className="text-xs text-[#6688cc] font-bold">Incoming</span>
                           <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">{req.sender?.username}</span>
                         </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => acceptRequest(req.id)} className="p-2 bg-white dark:bg-[#2A2A2A] text-green-600 rounded-full shadow-sm hover:bg-green-50"><FaCheck size={10} /></button>
                        <button onClick={() => removeRequest(req.id)} className="p-2 bg-white dark:bg-[#2A2A2A] text-red-500 rounded-full shadow-sm hover:bg-red-50"><FaTimes size={10} /></button>
                      </div>
                    </div>
                  ))}

                  {/* Sent Requests */}
                  {requests.sentFriendRequests.map(req => (
                    <div key={req.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-2xl">
                      <div className="flex items-center gap-3 opacity-60">
                         <img src={req.receiver?.avatarUrl || generateAvatarUrl(req.receiver?.username || "")} className="w-8 h-8 rounded-full" alt=""/>
                         <div className="flex flex-col">
                            <span className="text-xs text-gray-400 font-bold">Outgoing</span>
                            <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">{req.receiver?.username}</span>
                         </div>
                      </div>
                      <button onClick={() => removeRequest(req.id)} className="text-xs text-[#444746] hover:text-red-500 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:border-red-200">Cancel</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2FA Section */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl p-6">
            <h2 className="text-xs font-bold text-[#444746] dark:text-[#C4C7C5] uppercase tracking-wider mb-4">Security (2FA)</h2>
            <TwoFactorSettings />
          </div>

          {/* Footer Info */}
          <div className="text-center pt-2">
            <p className="text-xs text-[#444746] dark:text-[#C4C7C5]">
              Member since {new Date(user?.createdAt || "").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </p>
            <div className="mt-6">
              <Link to="/" className="text-sm font-medium text-[#6688cc] hover:underline px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors">
                Back to Home
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* MODALS */}

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-6 max-w-sm w-full max-h-[60vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4 pl-2">
              <h3 className="text-lg font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">Find People</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#444746] hover:text-black dark:text-[#C4C7C5] dark:hover:text-white p-2">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {addableUsers.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-8">No new users found.</p>
              ) : (
                addableUsers.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-2xl transition-colors">
                    <div className="flex items-center gap-3">
                       <img src={u.avatarUrl || generateAvatarUrl(u.username)} className="w-9 h-9 rounded-full bg-gray-100" alt=""/>
                       <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">{u.username}</span>
                    </div>
                    <button onClick={() => sendRequest(u.id)} className="p-2 text-[#6688cc] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors">
                      <FaUserPlus />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Avatar Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-6 max-w-md max-h-[70vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 pl-2">
              <h3 className="text-lg font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">Choose Avatar</h3>
              <button onClick={() => setShowAvatarPicker(false)} className="text-xl text-[#444746] hover:text-black dark:text-[#C4C7C5] dark:hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {AVATAR_SEEDS.map((seed) => (
                <button key={seed} onClick={() => handleSelectAvatarStyle(seed)} className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#292a2d] transition-colors">
                  <img src={generateAvatarUrl(seed)} alt={seed} className="w-full rounded-full border border-[#E0E2E7] dark:border-[#49454F]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
