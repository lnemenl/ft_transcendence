import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { TwoFactorSettings } from "./TwoFactorSettings";
import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";
import { type FriendRequestData, type PublicUser, type UserProfile } from "./profileTypes"
import { ProfileHeader } from "./ProfileHeader";
import { DisplayNameCard } from "./DisplayNameCard";
import { PeopleCard } from "./PeopleCard";
import { AddFriendModal } from "./AddFriendModal";
import { AvatarPickerModal } from "./AvatarPickerModal";
import { generateAvatarUrl, AVATAR_SEEDS } from "./AvatarUtils";

export const Profile: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const { updateUsername, updateAvatar } = useGame();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [requests, setRequests] = useState<FriendRequestData>({
    sentFriendRequests: [],
    receivedFriendRequests: [],
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addableUsers, setAddableUsers] = useState<PublicUser[]>([]);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Fetch user + friend-requests
  const fetchData = useCallback(async () => {
    try {
      const [userRes, reqRes] = await Promise.all([
        fetch("/api/users/me"),
        fetch("/api/friend-request/me"),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setUser(userData);
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

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [isLoggedIn, fetchData]);

  // Friend actions
  const openAddModal = async () => {
    setShowAddModal(true);
    try {
      const res = await fetch("/api/users/");
      if (res.ok) {
        const allUsers: PublicUser[] = await res.json();

        const excludeIds = new Set<string | undefined>([
          user?.id,
          ...(user?.friends.map((f) => f.id) || []),
          ...requests.sentFriendRequests.map((r) => r.receiver?.id),
          ...requests.receivedFriendRequests.map((r) => r.sender?.id),
        ]);

        setAddableUsers(allUsers.filter((u) => !excludeIds.has(u.id)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const sendRequest = async (userId: string) => {
    const res = await fetch(`/api/friend-request/${userId}`, {
      method: "POST",
    });
    if (res.ok) {
      setShowAddModal(false);
      fetchData();
    }
  };

  const acceptRequest = async (requestId: string) => {
    const res = await fetch(`/api/friend-request/${requestId}`, {
      method: "PATCH",
    });
    if (res.ok) fetchData();
  };

  const removeRequest = async (requestId: string) => {
    const res = await fetch(`/api/friend-request/${requestId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  };

  const removeFriend = async (friendId: string) => {
    if (!confirm("Remove this friend?")) return;
    const res = await fetch(`/api/users/me/friends/${friendId}`, {
      method: "DELETE",
    });
    if (res.ok) fetchData();
  };

  // Profile actions
  const handleSaveUsername = async (newUsername: string) => {
    if (!user) return;
    const trimmed = newUsername.trim();
    if (!trimmed || trimmed === user.username) return;

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: trimmed }),
    });

    if (res.ok) {
      await fetchData();
      updateUsername(trimmed);
    }
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
      updateAvatar(newUrl);
      setShowAvatarPicker(false);
    }
  };

  const handleSelectAvatarUrl = async (url: string) => {
    const trimmed = url.trim();
    if (!trimmed) return;

    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ avatarUrl: trimmed }),
    });

    if (res.ok) {
      await fetchData();
      updateAvatar(trimmed);
      setShowAvatarPicker(false);
    }
  };

  // Render states
  if (!isLoggedIn) {
    return (
      <div className="w-full min-h-screen bg-[#fafbfc] dark:bg-[#121212] flex flex-col items-center justify-center gap-4 font-inter">
        <p className="text-[#5f6368] dark:text-[#e8eaed]">
          Please log in to view your profile
        </p>
        <Link
          to="/"
          className="text-[#1f2937] dark:text-[#8ab4f8] text-sm hover:underline"
        >
          Back to Home
        </Link>
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
          {/* Header */}
          <ProfileHeader
            user={user}
            onAvatarClick={() => setShowAvatarPicker(true)}
          />

          {/* Display Name */}
          <DisplayNameCard
            username={user.username}
            onSave={handleSaveUsername}
          />

          {/* People (friends + requests) */}
          <PeopleCard
            user={user}
            requests={requests}
            onOpenAddModal={openAddModal}
            onRemoveFriend={removeFriend}
            onAcceptRequest={acceptRequest}
            onRemoveRequest={removeRequest}
          />

          {/* 2FA Section */}
          <div className="bg-white dark:bg-[#1E1E1E] border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl p-6">
            <h2 className="text-xs font-bold text-[#444746] dark:text-[#C4C7C5] uppercase tracking-wider mb-4">
              Security (2FA)
            </h2>
            <TwoFactorSettings />
          </div>

          {/* Footer */}
          <div className="text-center pt-2">
            <p className="text-xs text-[#444746] dark:text-[#C4C7C5]">
              Member since{" "}
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="mt-6">
              <Link
                to="/"
                className="text-sm font-medium text-[#6688cc] hover:underline px-4 py-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddFriendModal
        isOpen={showAddModal}
        users={addableUsers}
        onClose={() => setShowAddModal(false)}
        onSendRequest={sendRequest}
      />

      <AvatarPickerModal
        isOpen={showAvatarPicker}
        seeds={AVATAR_SEEDS}
        onClose={() => setShowAvatarPicker(false)}
        onSelectSeed={handleSelectAvatarStyle}
        onSelectUrl={handleSelectAvatarUrl}
      />
    </div>
  );
};
