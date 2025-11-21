import React from "react";
import { type PublicUser } from "./profileTypes";
import { generateAvatarUrl } from "./AvatarUtils";
import { FaUserPlus } from "react-icons/fa";

interface AddFriendModalProps {
  isOpen: boolean;
  users: PublicUser[];
  onClose: () => void;
  onSendRequest: (userId: string) => void;
}

export const AddFriendModal: React.FC<AddFriendModalProps> = ({
  isOpen,
  users,
  onClose,
  onSendRequest,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-6 max-w-sm w-full max-h-[60vh] flex flex-col shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-4 pl-2">
          <h3 className="text-lg font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
            Find People
          </h3>
          <button
            onClick={onClose}
            className="text-[#444746] hover:text-black dark:text-[#C4C7C5] dark:hover:text-white p-2"
          >
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 pr-1">
          {users.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-8">
              No new users found.
            </p>
          ) : (
            users.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatarUrl || generateAvatarUrl(u.username)}
                    className="w-9 h-9 rounded-full bg-gray-100"
                    alt=""
                  />
                  <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
                    {u.username}
                  </span>
                </div>
                <button
                  onClick={() => onSendRequest(u.id)}
                  className="p-2 text-[#6688cc] hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors"
                >
                  <FaUserPlus />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
