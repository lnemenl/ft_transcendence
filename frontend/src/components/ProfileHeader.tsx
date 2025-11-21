import React from "react";
import {type UserProfile } from "./profileTypes";
//import { generateAvatarUrl } from "./AvatarUtils";

interface ProfileHeaderProps {
  user: UserProfile;
  onAvatarClick: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  user,
  onAvatarClick,
}) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={onAvatarClick}
        className="relative group flex-shrink-0 focus:outline-none"
        title="Change Avatar"
      >
        <img
          src={user.avatarUrl || "?"}
          alt={user.username}
          className="w-24 h-24 rounded-full border-4 border-[#E0E2E7] dark:border-[#49454F] bg-white cursor-pointer transition-opacity hover:opacity-80"
        />
      </button>
      <div className="text-center">
        <h1 className="text-2xl font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
          {user.username}
        </h1>
        <p className="text-sm text-[#444746] dark:text-[#C4C7C5]">
          {user.email}
        </p>
      </div>
    </div>
  );
};
