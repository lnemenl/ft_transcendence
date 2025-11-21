import React from "react";
import { type Game } from "./profileTypes";
import { generateAvatarUrl } from "./AvatarUtils";
import { useLanguage } from "./useLanguage";

interface GameHistoryCardProps {
  games: Game[];
  currentUserId: string;
}

export const GameHistoryCard: React.FC<GameHistoryCardProps> = ({
  games,
  currentUserId,
}) => {
  const t = useLanguage();

  // 1. Sort games by date (newest first)
  const sortedGames = [...games].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // 2. Calculate stats efficiently from the list
  const wins = games.filter((g) => g.winner?.id === currentUserId).length;
  const losses = games.length - wins;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-[#E0E2E7] dark:border-[#49454F] rounded-3xl overflow-hidden flex flex-col">
      {/* Header with Stats Pills */}
      <div className="px-6 py-4 border-b border-[#E0E2E7] dark:border-[#49454F] bg-gray-50 dark:bg-[#252525] flex justify-between items-center">
        <h3 className="text-xs font-bold text-[#444746] dark:text-[#C4C7C5] uppercase tracking-wider">
          {t.matchHistory}
        </h3>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold">
            {wins} {wins === 1 ? t.win : t.wins}
          </span>
          <span className="px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold">
            {losses} {losses === 1 ? t.loss : t.losses}
          </span>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="p-2 max-h-[320px] overflow-y-auto">
        {sortedGames.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-[#444746] dark:text-[#C4C7C5]">
              {t.noGamesYet}
            </p>
          </div>
        ) : (
          sortedGames.map((game) => {
            const isWinner = game.winner?.id === currentUserId;
            // Determine opponent: Find the player that isn't me
            const opponent = game.players.find((p) => p.id !== currentUserId) || game.players[0];

            return (
              <div
                key={game.id}
                className="group flex items-center justify-between p-3 mb-1 hover:bg-gray-50 dark:hover:bg-[#2A2A2A] rounded-2xl transition-all duration-200"
              >
                {/* Opponent Details */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={opponent?.avatarUrl || generateAvatarUrl(opponent?.username || "CPU")}
                      className="w-10 h-10 rounded-full border border-[#E0E2E7] dark:border-[#49454F] object-cover"
                      alt=""
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-[#6688cc] uppercase tracking-wider">VS</span>
                    <span className="text-sm font-medium text-[#1F1F1F] dark:text-[#E2E2E2]">
                      {opponent?.username || "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Result & Date */}
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${
                      isWinner
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                        : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    }`}
                  >
                    {isWinner ? t.victory : t.defeat}
                  </span>
                  <span className="text-[10px] text-[#444746] dark:text-[#C4C7C5]">
                    {new Date(game.createdAt).toISOString().split('T')[0]}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
