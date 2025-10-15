import { useMemo, useState } from "react";
import { PlayMode } from "./PlayMode";
import { SinglePlayerLogin } from "./SinglePlayer";
import { MultiplayerLogin } from "./Multiplayer";

type View = "multiplayer" | "playermode" | "singleplayer";

export function Login() {
  const [currentView, setCurrentView] = useState<View>("playermode");

  const handleSelectMode = (view: View) => setCurrentView(view);
  const handleBack = () => setCurrentView("playermode");

  const transformPage = useMemo(() => {
    switch (currentView) {
      case "multiplayer":
        return "translateX(0%)";          // show left panel
      case "singleplayer":
        return "translateX(-66.6666%)";   // show right panel
      case "playermode":
      default:
        return "translateX(-33.3333%)";   // show middle panel
    }
  }, [currentView]);

  return (
  <div id="login" className="flex justify-center items-center">
    <div className="w-full max-w-4xl bg-blue-50/50 rounded-2xl shadow-2xl overflow-hidden m-20">
        <div
          className="flex w-[300%] transition-transform duration-500 ease-in-out"
          style={{ transform: transformPage }}
        >
          <div className="w-[33.3333%] flex-shrink-0">
            <MultiplayerLogin onBack={handleBack} />
          </div>
          <div className="w-[33.3333%] flex-shrink-0">
            <PlayMode onSelectMode={handleSelectMode} />
          </div>
          <div className="w-[33.3333%] flex-shrink-0">
            <SinglePlayerLogin onBack={handleBack} />
          </div>
        </div>
      </div>
  </div>
  );
}
