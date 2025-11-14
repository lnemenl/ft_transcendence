import React from "react";
import { useState } from "react";
import { TournamentSize } from "./TournamentSize";
import { TournamentSetup } from "./TournamentSetup"

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

type Props = { 
  onBack: () => void;
  onSelectMode: (view: View) => void;
};
type Stage = "choose-size" | "login-players"

export const Tournament: React.FC<Props> = ({ onBack, onSelectMode }) => {
  const [stage, setStage] = useState<Stage>("choose-size");
  const handleSetStage = (stage: Stage) => setStage(stage);
  const getBack = () => {
    setStage("choose-size")
  }

  if (stage === "choose-size") {
    return (
      <div className="min-h-full flex justify-center items-center">
        <TournamentSize onBack={onBack} onSetStage={handleSetStage} />
      </div>
    );
  }
  else if (stage === "login-players") {
    return (
      <div className="min-h-full flex justify-center items-center">
          <TournamentSetup onBack={getBack} onSelectMode={onSelectMode} />
      </div>
    )
  }
}

//signin / login users 2, 3 and 4