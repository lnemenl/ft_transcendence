import React, { useState } from "react";
import { FaUserPlus, FaCheck, FaTimes, FaTrash, FaCircle } from "react-icons/fa";
import { type FriendRequestData, type UserProfile } from "./profileTypes";
import { generateAvatarUrl } from "./AvatarUtils";

interface PeopleCardProps {
  user: UserProfile;
  requests: FriendRequestData;
  onOpenAddModal: () => void;
  onRemoveFriend: (friendId: string) => void;
  onAcceptRequest: (requestId: string) => void;
  onRemoveRequest: (requestId: string) => void;
}

export const PeopleCard: React.FC<PeopleCardProps> = ({
  user,
  requests,
  onOpenAddModal,
  onRemoveFriend,
  onAcceptRequest,
  onRemoveRequest,
}) => {
  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  const totalRequests =
    requests.receivedFriendRequests.length +
    requests.sentFriendRequests.length;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#E0E2E7] dark:border-[#49454F] flex justify-between items-center bg-gray-50 dark:bg-[#252525]">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("friends")}
            className={`text-sm font-medium transition-colors ${
              activeTab === "friends"
                ? "text-[#6688cc]"
                : "text-[#444746] dark:text-[#C4C7C5] hover:text-black dark:hover:text-white"
            }`}
          >
            Friends ({user.friends.length})
          </button>
          <button
            onClick={() => setActiveTab("requests")}
            className={`text-sm font-medium transition-colors ${
              activeTab === "requests"
                ? "text-[#6688cc]"
                : "text-[#444746] dark:text-[#C4C7C5] hover:text-black dark:hover:text-white"
            }`}
          >
            Requests ({totalRequests})
          </button>
        </div>
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#6688cc] hover:bg-[#5577bb] text-white text-xs font-medium rounded-full transition-colors"
        >
          <FaUserPlus /> Add
        </button>
      </div>

      {/* Content */}
      <div className="p-2 max-h-[300px] overflow-y-auto">
        {activeTab === "friends" ? (
          user.friends.length === 0 ? (
            <p className="text-center text-sm text-[#444746] py-6">
              No friends yet
            </p>
          ) : (
            user.friends.map((f) => (
              <div
                key={f.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-2xl group transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={f.avatarUrl || generateAvatarUrl(f.username)}
                      className="w-8 h-8 rounded-full bg-gray-200"
                      alt=""
                    />
                    <FaCircle
                      size={10}
                      className={`absolute -bottom-0.5 -right-0.5 border-2 border-white dark:border-[#1E1E1E] rounded-full ${
                        f.isOnline ? "text-green-500" : "text-gray-300"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
                    {f.username}
                  </span>
                </div>
                <button
                  onClick={() => onRemoveFriend(f.id)}
                  className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            ))
          )
        ) : (
          <div className="space-y-2">
            {requests.receivedFriendRequests.length === 0 &&
              requests.sentFriendRequests.length === 0 && (
                <p className="text-center text-sm text-[#444746] py-6">
                  No requests
                </p>
              )}

            {/* Received Requests */}
            {requests.receivedFriendRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={
                      req.sender?.avatarUrl ||
                      generateAvatarUrl(req.sender?.username || "")
                    }
                    className="w-8 h-8 rounded-full"
                    alt=""
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-[#6688cc] font-bold">
                      Incoming
                    </span>
                    <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
                      {req.sender?.username}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAcceptRequest(req.id)}
                    className="p-2 bg-white dark:bg-[#2A2A2A] text-green-600 rounded-full shadow-sm hover:bg-green-50"
                  >
                    <FaCheck size={10} />
                  </button>
                  <button
                    onClick={() => onRemoveRequest(req.id)}
                    className="p-2 bg-white dark:bg-[#2A2A2A] text-red-500 rounded-full shadow-sm hover:bg-red-50"
                  >
                    <FaTimes size={10} />
                  </button>
                </div>
              </div>
            ))}

            {/* Sent Requests */}
            {requests.sentFriendRequests.map((req) => (
              <div
                key={req.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-2xl"
              >
                <div className="flex items-center gap-3 opacity-60">
                  <img
                    src={
                      req.receiver?.avatarUrl ||
                      generateAvatarUrl(req.receiver?.username || "")
                    }
                    className="w-8 h-8 rounded-full"
                    alt=""
                  />
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-400 font-bold">
                      Outgoing
                    </span>
                    <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
                      {req.receiver?.username}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveRequest(req.id)}
                  className="text-xs text-[#444746] hover:text-red-500 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 hover:border-red-200"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
