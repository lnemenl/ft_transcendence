import { useMemo, useState, useEffect } from "react";
import { Choice } from "./Choice";
import { Login } from "./Login";
import { SignUp } from "./SignUp";
import { GameMode } from "./GameMode";
import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";
import { Tournament } from "./Tournament";
import { LoginOrRegisterP2 } from "./LoginOrRegisterP2";
import type { View } from "./types";


export function LoginRegister() {
  const [currentView, setCurrentView] = useState<View>("choice");
  const handleSelectMode = (view: View) => setCurrentView(view);
  const { isLoggedIn, login } = useAuth();
  const { setMode, setPlayers, setCurrentPlayerIndex } = useGame();
  const [isChecking, setIsChecking] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/users/me", {
          credentials: "include",
        });

        if (res.ok) {
          await res.json(); // Consume response
          login();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [login]);

  const handleBack = () => {
    setCurrentView(isLoggedIn ? "gamemode" : "choice");
    setMode("unknown");
    setPlayers([]);
    setCurrentPlayerIndex(0);
  }

  // After login/registration, automatically switch to gamemode view
  useEffect(() => {
    if (isLoggedIn && !["gamemode", "multiplayer", "tournament"].includes(currentView)) {
      setCurrentView("gamemode");
    }
  }, [isLoggedIn, currentView]);

  const transformPage = useMemo(() => {
      if (["register", "multiplayer"].includes(currentView)) {
        return "translateX(0%)";
      }
      if (["login", "tournament"].includes(currentView)) {
        return "translateX(-66.6666%)";
      }
      return "translateX(-33.3333%)"; 
    }, [currentView]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div id="login" className="h-screen w-screen flex justify-center items-center">
        <div className="w-full max-w-4xl h-[550px] bg-blue-50/50 dark:bg-[#24273a]/50 rounded-2xl shadow-2xl overflow-hidden flex items-center justify-center">
          <p className="text-gray-500 dark:text-[#cad3f5]">Loading...</p>
        </div>
      </div>
    );
  }

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
            <LoginOrRegisterP2 onBack={handleBack} onSelectMode={handleSelectMode}/>
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
