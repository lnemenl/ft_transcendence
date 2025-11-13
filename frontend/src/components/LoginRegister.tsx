import { useMemo, useState } from "react";
import { Choice } from "./Choice";
import { Login } from "./Login";
import { SignUp } from "./SignUp";
import { GameMode } from "./GameMode";
import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";
import { Tournament } from "./Tournament";
import { LoginOrRegister } from "./LoginOrRegisterP2";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";


export function LoginRegister() {
  const [currentView, setCurrentView] = useState<View>("choice");
  const handleSelectMode = (view: View) => setCurrentView(view);
  const { isLoggedIn, login } = useAuth();
  const { setMode } = useGame();
  const handleBack = () => {
    setCurrentView("choice");
    setMode("unknown");
  }

  const transformPage = useMemo(() => {
      if (["register", "multiplayer"].includes(currentView)) {
        return "translateX(0%)";
      }
      if (["login", "tournament"].includes(currentView)) {
        return "translateX(-66.6666%)";
      }
      return "translateX(-33.3333%)"; 
    }, [currentView]);

  return (
  <div id="login" className="h-screen w-screen flex justify-center items-center">
    <div className="w-full max-w-4xl h-[550px] bg-blue-50/50 dark:bg-[#24273a]/50 rounded-2xl shadow-2xl overflow-hidden">
      {!isLoggedIn ? (
        <>
        <div className="flex w-[300%] h-full transition-transform duration-500 ease-in-out" style={{ transform: transformPage }}>
          <div className="w-[33.3333%] flex-shrink-0">
            <SignUp onBack={handleBack} onLogin={login} onSelectMode={handleSelectMode} loginEndpoint="login"/>
          </div>
          <div className="w-[33.3333%] flex-shrink-0">
            <Choice onSelectMode={handleSelectMode} />
          </div>
          <div className="w-[33.3333%] flex-shrink-0">
            <Login onBack={handleBack} onLogin={login} onSelectMode={handleSelectMode} loginEndpoint="login" />
          </div>
        </div>
        </>
      ) : (
        <div className="flex w-[300%] h-full transition-transform duration-500 ease-in-out" style={{ transform: transformPage }}>
          <div className="w-[33.3333%] flex-shrink-0">
            <LoginOrRegister onBack={handleBack} onSelectMode={handleSelectMode}/>
          </div>
          <div className="w-[33.3333%] flex-shrink-0">
            <GameMode onSelectMode={handleSelectMode} />
          </div>
          <div className="w-[33.3333%] flex-shrink-0">
            <Tournament onBack={handleBack} onSelectMode={handleSelectMode} />
          </div>
        </div>
      )}
    </div>
  </div>
  );
}
