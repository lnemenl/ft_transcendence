import React from "react";
import { useState } from "react";
import { TournamentSize } from "./TournamentSize";
import { TournamentSetup } from "./TournamentSetup"

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

type Props = { 
  onBack: () => void;
  onSelectMode: (view: View) => void;
};
type Stage = "choose-size" | "login-players" | "ready"

export const Tournament: React.FC<Props> = ({ onBack, onSelectMode }) => {
  const [stage, setStage] = useState<Stage>("choose-size");
  const handleSetStage = (stage: Stage) => setStage(stage);
  const getBack = () => {
    setStage("choose-size")
  }
  const handleScroll = () => {
		document.getElementById("game")?.scrollIntoView({
			behavior: "smooth",
		});
	};

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
          <TournamentSetup onBack={getBack} onSetStage={handleSetStage} />
      </div>
    )
  }
  else if (stage === "ready")
  return (
    <div className="min-h-full flex justify-center items-center">
      <button onClick={() => {handleScroll(); onSelectMode("choice") } }className="ml-10 min-w-50 bg-[#6688cc] hover:bg-[#24273a] text-white rounded-2xl px-6 py-4">
        Lets's Play!
      </button>
    </div>
  )
}

//signin / login users 2, 3 and 4