import React, { useEffect, useState } from "react";

interface DisplayNameCardProps {
  username: string;
  onSave: (newUsername: string) => Promise<void>;
}

export const DisplayNameCard: React.FC<DisplayNameCardProps> = ({
  username,
  onSave,
}) => {
  const [editMode, setEditMode] = useState(false);
  const [value, setValue] = useState(username);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(username);
  }, [username]);

  const handleSave = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === username) {
      setEditMode(false);
      setValue(username);
      return;
    }

    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setValue(username);
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl p-6">
      <div className="space-y-4">
        <label className="text-xs font-bold text-[#444746] dark:text-[#C4C7C5] uppercase tracking-wider block">
          Display Name
        </label>
        {editMode ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="flex-1 px-4 py-2 text-sm border border-[#E0E2E7] dark:border-[#49454F] rounded-full bg-transparent text-[#1F1F1F] dark:text-[#E2E2E2] focus:outline-none focus:border-[#6688cc]"
              disabled={saving}
              autoFocus
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 text-sm font-medium text-white bg-[#6688cc] rounded-full hover:bg-[#5577bb]"
            >
              {saving ? "..." : "Save"}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-[#444746] dark:text-[#C4C7C5] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] rounded-full"
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-base text-[#1F1F1F] dark:text-[#E2E2E2] ml-1">
              {username}
            </span>
            <button
              onClick={() => setEditMode(true)}
              className="text-sm font-medium text-[#6688cc] hover:underline px-2"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
