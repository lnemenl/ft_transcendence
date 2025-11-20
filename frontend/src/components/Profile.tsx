import { Link } from "react-router-dom";
import { TwoFactorSettings } from "./TwoFactorSettings";
import { useAuth } from "./GetAuth";
import { useState, useEffect } from "react";

interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isTwoFactorEnabled: boolean;
  createdAt: string;
  friends: Array<{ id: string; username: string; avatarUrl: string | null; isOnline: boolean }>;
}

// DiceBear Adventurer pack - generate different characters with different seeds
const AVATAR_SEEDS = Array.from({ length: 30 }, (_, i) => `adventurer-${i + 1}`);

const generateAvatarUrl = (seed: string): string => {
  return `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}`;
};

export const Profile: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    const fetchUser = async () => {
      try {
        const response = await fetch("/api/users/me");
        if (!response.ok) throw new Error("Failed to fetch user");
        const data: User = await response.json();
        setUser(data);
        setNewUsername(data.username);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [isLoggedIn]);

  const handleSaveUsername = async () => {
    if (!newUsername.trim() || newUsername === user?.username) {
      setEditMode(false);
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: newUsername }),
      });
      if (response.ok) {
        const updated = await response.json();
        setUser((prev) => prev ? { ...prev, username: updated.username } : null);
        setEditMode(false);
      }
    } catch (error) {
      console.error("Error updating username:", error);
      setNewUsername(user?.username || "");
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAvatarStyle = async (seed: string) => {
    if (!user) return;
    
    const newAvatarUrl = generateAvatarUrl(seed);
    
    try {
      const response = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: newAvatarUrl }),
      });
      
      if (response.ok) {
        const updated = await response.json();
        setUser((prev) => prev ? { ...prev, avatarUrl: updated.avatarUrl } : null);
        setShowAvatarPicker(false);
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-screen bg-[#fafbfc] dark:bg-[#121212] flex flex-col items-center justify-center gap-4 font-inter">
        <p className="text-[#5f6368] dark:text-[#e8eaed]">Please log in to view your profile</p>
        <Link to="/" className="text-[#1f2937] dark:text-[#8ab4f8] text-sm hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#F8F9FA] dark:bg-[#121212] flex items-center justify-center font-inter">
        <p className="text-[#444746] dark:text-[#C4C7C5] text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full min-h-screen bg-[#fafbfc] dark:bg-[#121212] flex flex-col items-center justify-center gap-4 font-inter">
        <p className="text-[#5f6368] dark:text-[#e8eaed] text-sm">Failed to load profile</p>
        <Link to="/" className="text-[#1f2937] dark:text-[#8ab4f8] text-sm hover:underline">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8F9FA] dark:bg-[#121212] font-inter">
      <div className="flex items-center justify-center w-full min-h-screen px-6 py-12">
        <div className="w-full max-w-lg space-y-6">
          {/* Avatar Picker Modal */}
          {showAvatarPicker && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-[#FFFFFF] dark:bg-[#1E1E1E] rounded-3xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-500 text-[#1F1F1F] dark:text-[#E2E2E2]">Choose Avatar Style</h3>
                  <button
                    onClick={() => setShowAvatarPicker(false)}
                    className="text-[#444746] dark:text-[#C4C7C5] hover:text-[#1F1F1F] dark:hover:text-[#E2E2E2] text-xl"
                  >
                    ✕
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {AVATAR_SEEDS.map((seed) => (
                    <button
                      key={seed}
                      onClick={() => handleSelectAvatarStyle(seed)}
                      className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-[#F0F0F0] dark:hover:bg-[#292a2d] transition-colors"
                    >
                      <img
                        src={generateAvatarUrl(seed)}
                        alt={seed}
                        className="w-16 h-16 rounded-full border border-[#E0E2E7] dark:border-[#49454F]"
                      />
                      <span className="text-xs text-[#444746] dark:text-[#C4C7C5] text-center">{seed}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Avatar Section - At the very top */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="relative group flex-shrink-0 focus:outline-none"
              title="Click to choose avatar"
            >
              <img
                src={user?.avatarUrl || generateAvatarUrl(user?.username || "")}
                alt={user?.username}
                className="w-24 h-24 rounded-full border-2 border-[#E0E2E7] dark:border-[#49454F] cursor-pointer transition-opacity duration-200 group-hover:opacity-80"
              />
            </button>
          </div>

          {/* Credentials Section - Username and Email below avatar */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-500 text-[#1F1F1F] dark:text-[#E2E2E2]">{user?.username}</h1>
            <p className="text-sm text-[#444746] dark:text-[#C4C7C5]">{user?.email}</p>
          </div>

          {/* Edit Username Section */}
          <div className="border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl p-6 bg-[#FFFFFF] dark:bg-[#1E1E1E]">
            <div className="space-y-4">
              <label className="text-sm font-500 text-[#1F1F1F] dark:text-[#E2E2E2] block">Username</label>
              {editMode ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="flex-1 px-4 py-2 text-sm border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl bg-[#FFFFFF] dark:bg-[#2A2A2A] text-[#1F1F1F] dark:text-[#E2E2E2] placeholder-[#444746] dark:placeholder-[#C4C7C5] focus:outline-none focus:ring-2 focus:ring-[#6688cc] focus:border-transparent"
                    disabled={saving}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveUsername}
                    disabled={saving}
                    className="px-6 py-2 text-sm font-500 text-white bg-[#6688cc] rounded-3xl hover:bg-[#5577bb] disabled:opacity-50 transition-colors"
                  >
                    {saving ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setNewUsername(user?.username || "");
                    }}
                    className="px-6 py-2 text-sm font-500 text-[#1F1F1F] dark:text-[#E2E2E2] border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl hover:bg-[#F0F0F0] dark:hover:bg-[#2A2A2A] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between py-2">
                  <p className="text-[#1F1F1F] dark:text-[#E2E2E2]">{user?.username}</p>
                  <button
                    onClick={() => setEditMode(true)}
                    className="text-sm font-500 text-[#6688cc] hover:underline"
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Account Info Section */}
          <div className="border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl p-6 bg-[#FFFFFF] dark:bg-[#1E1E1E]">
            <div>
              <label className="text-sm font-500 text-[#1F1F1F] dark:text-[#E2E2E2] block mb-2">Account Created</label>
              <p className="text-[#1F1F1F] dark:text-[#E2E2E2]">
                {new Date(user?.createdAt || "").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>

          {/* 2FA Section */}
          <div className="border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl p-6 bg-[#FFFFFF] dark:bg-[#1E1E1E]">
            <h2 className="text-sm font-500 text-[#1F1F1F] dark:text-[#E2E2E2] mb-4">2FA</h2>
            <TwoFactorSettings />
          </div>

          {/* Back Link */}
          <div className="flex justify-center pt-4">
            <Link to="/" className="text-sm font-500 text-[#6688cc] hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
