import React from "react";
import { TournamentLoginForm } from "./TournamentLoginForm";
import { useGame } from "./GameContext";

type Stage = "choose-size" | "login-players" | "ready"

type Props = {
  onBack: () => void;
  onSetStage: (stage: Stage) => void;
};

export const TournamentLogin: React.FC<Props> = ({ onBack, onSetStage }) => {
  const { currentPlayerIndex, totalPlayers } = useGame();

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        Login Player { currentPlayerIndex + 1 } / { totalPlayers}
      </h2>
      <TournamentLoginForm onBack={ onBack } onSetStage={ onSetStage }/>
    </div>
  );
};