import { useState } from "react";
import { useLanguage } from "./useLanguage";
import { TwoFactorSettings } from "./TwoFactorSettings";

type Props = {
  onBack: () => void;
  onLogOut: () => void;
};

export const LogOut: React.FC<Props> = ({ onBack, onLogOut }) => {
  const t = useLanguage();
  const [showSettings, setShowSettings] = useState(false);

  const handleLogOut = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        console.log("Succesfull logout!");
        onBack();
        onLogOut();
      }
    } catch (err) {
      console.log("an error occurred:", err);
    }
  };

  if (showSettings) {
    return (
      <div className="h-full overflow-y-auto flex flex-col justify-center items-center p-10 bg-blue-50/50 dark:bg-[#24273a]/50">
        <TwoFactorSettings onClose={() => setShowSettings(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-10 bg-blue-50/50 dark:bg-[#24273a]/50">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        {t.wantToLogOut}
      </h2>
      <button
        onClick={() => setShowSettings(true)}
        className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4"
      >
        {t.settings}
      </button>
      <button onClick={handleLogOut} className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4">
            {t.logOut}
      </button>
      <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
        {t.back}
      </button>
    </div>
  );
};