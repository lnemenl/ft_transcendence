import React from "react";
import { generateAvatarUrl } from "./AvatarUtils";

interface AvatarPickerModalProps {
  isOpen: boolean;
  seeds: string[];
  onClose: () => void;
  onSelectSeed: (seed: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  seeds,
  onClose,
  onSelectSeed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-[2rem] p-6 max-w-md max-h-[70vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 pl-2">
          <h3 className="text-lg font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
            Choose Avatar
          </h3>
          <button
            onClick={onClose}
            className="text-xl text-[#444746] hover:text-black dark:text-[#C4C7C5] dark:hover:text-white"
          >
            ✕
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {seeds.map((seed) => (
            <button
              key={seed}
              onClick={() => onSelectSeed(seed)}
              className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#292a2d] transition-colors"
            >
              <img
                src={generateAvatarUrl(seed)}
                alt={seed}
                className="w-full rounded-full border border-[#E0E2E7] dark:border-[#49454F]"
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};