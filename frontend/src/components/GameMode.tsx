import { useGame } from "./GameContext";
import { useLanguage } from "./useLanguage";
import { useEffect, useState } from "react";

type View = "multiplayer" | "choice" | "tournament";

type Props = {
  onSelectMode: (view: View) => void;
};

export const GameMode: React.FC<Props> = ({ onSelectMode }) => {
  const t = useLanguage();
  const { setMode, setTotalPlayers, saveCurrentPlayer } = useGame();
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

  const handleModeChange = (newMode: "multiplayer" | "tournament") => {
    setMode(newMode);
    
    // For multiplayer, set 2 players and add main user as player 1
    if (newMode === "multiplayer") {
      setTotalPlayers(2);
      if (mainUser) {
        saveCurrentPlayer(mainUser.username, mainUser.id);
      }
    }
    
    onSelectMode(newMode);
  };
  return (
    <div className="h-full flex flex-col items-center justify-center m-10">
      <h2 className="text-6xl font-bold mt-20 text-[#2c3781] dark:text-[#cad3f5]">
        {t.howDoYouWantToPlay}
      </h2>
      <div className="h-full flex justify-center mt-15">
        <div className="flex-col items-center justify-center">
          <button onClick={() => handleModeChange("multiplayer") } className="mr-10 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">
            <p className="text-2xl md:text-4xl text-white">
              {t.oneVsOne}
            </p>
          </button>
        </div>
        <div className="h-20 w-px bg-[#2c3781] dark:bg-[#cad3f5]" />
        <div className="flex-col items-center justify-center">
          <button onClick={() => handleModeChange("tournament")} className="ml-10 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">
            <p className="text-2xl md:text-4xl text-white">
              {t.tournament}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
