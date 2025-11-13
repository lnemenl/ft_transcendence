import React from "react"
import { useState } from "react";
import { useGame } from "./GameContext";

type Stage = "choose-size" | "login-players"

type Props = {
  onBack: () => void;
  onSetStage: (stage: Stage) => void;
};

export const TournamentSize: React.FC<Props> = ({ onBack, onSetStage }) => {
  const { totalPlayers, setTotalPlayers } = useGame();
  const [selectedSize, setSelectedSize] = useState<number>(totalPlayers || 4);
  const handleNextFromSize = (e: React.FormEvent) => {
    e.preventDefault();
    // update global totalPlayers and go to login flow
    setTotalPlayers(selectedSize);
    onSetStage("login-players");
  };
  return (
    <div className="min-h-100 flex flex-col bg-blue-50-50 p-30">
      <form onSubmit={handleNextFromSize} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Tournament size
            </label>
            <select className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring" value={selectedSize} onChange={(e) => setSelectedSize(Number(e.target.value))}>
              <option value={4}>4 players</option>
              <option value={8}>8 players</option>
            </select>
          </div>
          <button type="submit" className="w-full py-2 rounded-xl font-semibold bg-black text-white hover:opacity-90">
            Next
          </button>
        </form>
      <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
        Back
      </button>
    </div>
  )
}