import React from "react"
import { useState, useEffect } from "react";
import { useGame } from "./GameContext";
import { useLanguage } from "./useLanguage";

type Stage = "choose-size" | "login-players"

type Props = {
  onBack: () => void;
  onSetStage: (stage: Stage) => void;
};

export const TournamentSize: React.FC<Props> = ({ onBack, onSetStage }) => {
  const t = useLanguage();
  const { setTotalPlayers, totalPlayers, saveCurrentPlayer } = useGame();
  const [selectedSize, setSelectedSize] = useState<number>(totalPlayers || 4);
  const [mainUser, setMainUser] = useState<{id: string, username: string} | null>(null);
  
  // Fetch the main logged-in user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setMainUser({ id: userData.id, username: userData.username });
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, []);
  
  const handleNextFromSize = (e: React.FormEvent) => {
    e.preventDefault();
    setTotalPlayers(selectedSize);
    
    // Add the main logged-in user as the first player
    if (mainUser) {
      saveCurrentPlayer(mainUser.username, mainUser.id);
    }
    
    onSetStage("login-players");
  };

  return (
    <div className="min-h-100 flex flex-col bg-blue-50-50 p-30">
      <form onSubmit={handleNextFromSize} className="space-y-4">
          <div>
            <label className="block text-2xl font-medium mb-3 text-[#2c3781] dark:text-[#cad3f5]">
              {t.tournamentSize}
            </label>
            <select className="w-full border text-[#2c3781] dark:text-[#cad3f5] rounded-lg px-3 py-2 focus:outline-none focus:ring" value={selectedSize} onChange={(e) => setSelectedSize(Number(e.target.value))} required>
              <option value="" hidden>{t.chooseSize}</option>
              <option value={4}>{t.fourPlayers}</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2 rounded-xl font-semibold bg-[#6688cc] hover:bg-[#24273a] text-white hover:opacity-90">
            {t.next}
          </button>
        </form>
      <button type="button" onClick={onBack} className="mt-3 text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
        {t.back}
      </button>
    </div>
  )
}
