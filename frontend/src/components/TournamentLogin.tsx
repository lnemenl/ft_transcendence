import React from "react";
import { TournamentLoginForm } from "./TournamentLoginForm";
import { useGame } from "./GameContext";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

type Props = {
  onSelectMode: (view: View) => void;
  getBack: () => void;
};

export const TournamentLogin: React.FC<Props> = ({ getBack, onSelectMode }) => {
  const { currentPlayerIndex, totalPlayers } = useGame();
  const handleSetMode = () => {
    onSelectMode("choice");
  }

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        Login Player { currentPlayerIndex + 1 } / { totalPlayers}
      </h2>
      <TournamentLoginForm getBack={ getBack } setMode={ handleSetMode }/>
    </div>
  );
};