import React from "react";
import { useState } from "react";
import { generateAvatarUrl } from "./AvatarUtils";

interface AvatarPickerModalProps {
  isOpen: boolean;
  seeds: string[];
  onClose: () => void;
  onSelectSeed: (seed: string) => void;
  onSelectUrl: (url: string) => void;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  seeds,
  onClose,
  onSelectSeed,
  onSelectUrl,
}) => {
  const [customUrl, setCustomUrl] = useState("");
  
  if (!isOpen) return null;

  const handleUrlSubmit = () => {
    if (!customUrl.trim()) return;
    onSelectUrl(customUrl.trim());
  };

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

        <div className="mb-6">
          <label className="block text-sm font-medium text-[#444746] dark:text-[#C4C7C5] mb-2">
            Enter an Image URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://example.com/my-avatar.png"
              className="flex-1 px-3 py-2 text-sm border border-[#E0E2E7] dark:border-[#49454F] rounded-xl bg-transparent text-[#1F1F1F] dark:text-[#E2E2E2] focus:outline-none"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
            />
            <button onClick={handleUrlSubmit} disabled={!customUrl.trim()} className="px-4 py-2 bg-[#6688cc] hover:bg-[#5577bb] text-white rounded-xl text-sm disabled:opacity-50">
              Use
            </button>
          </div>
        </div>
        <hr className="my-4 border-[#E0E2E7] dark:border-[#49454F]" />
        <div className="grid grid-cols-3 gap-3">
          {seeds.map((seed) => (
            <button
              key={seed}
              onClick={() => { onSelectSeed(seed); setCustomUrl("") }}
              className="p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#292a2d] transition-colors">
              <img src={generateAvatarUrl(seed)}
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