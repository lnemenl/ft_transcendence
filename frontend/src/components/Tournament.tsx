import React from "react";
import { useState } from "react";
import { TournamentSize } from "./TournamentSize";
import { TournamentLogin } from "./TournamentLogin";

type Props = { 
  onBack: () => void;
};
type Stage = "choose-size" | "login-players" | "ready"

export const Tournament: React.FC<Props> = ({ onBack }) => {
  const [stage, setStage] = useState<Stage>("choose-size");
  const handleSetStage = (stage: Stage) => setStage(stage);

  const handleScroll = () => {
		document.getElementById("game")?.scrollIntoView({
			behavior: "smooth",
		});
	};

  if (stage === "choose-size") {
    return (
      <div className="min-h-full flex justify-center items-center p-6">
        <TournamentSize onBack={onBack} onSetStage={handleSetStage} />
      </div>
    );
  }
  else if (stage === "login-players") {
    return (
      <div className="min-h-full flex justify-center items-center p-6">
          <TournamentLogin onBack={onBack} onSetStage={handleSetStage}/>
      </div>
    )
  }
  else if (stage === "ready")
  return (
    <div className="min-h-full flex justify-center items-center p-6">
      <button onClick={handleScroll} className="ml-10 min-w-50 bg-[#6688cc] hover:bg-[#24273a] text-white rounded-2xl px-6 py-4">
        Lets's Play!
      </button>
    </div>
  )
}

//signin / login users 2, 3 and 4