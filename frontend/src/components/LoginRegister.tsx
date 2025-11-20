import { useMemo, useState, useEffect } from "react";
import { Choice } from "./Choice";
import { Login } from "./Login";
import { SignUp } from "./SignUp";
import { GameMode } from "./GameMode";
import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";
import { Tournament } from "./Tournament";
import { LoginOrRegisterP2 } from "./LoginOrRegisterP2";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

export function LoginRegister() {
  const [currentView, setCurrentView] = useState<View>("choice");
  const handleSelectMode = (view: View) => setCurrentView(view);
  const { isLoggedIn, login } = useAuth();
  const { setMode, saveCurrentPlayer, players } = useGame();
  const [isChecking, setIsChecking] = useState(true);

  // Check if user is already authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      // 1. DETECT REDIRECT: Check if we just came back from Google
      const params = new URLSearchParams(window.location.search);
      const loginSuccess = params.get("login") === "success";

      // 2. CLEANUP: Remove the query param from the URL bar so it looks clean
      if (loginSuccess) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      try {
        // 3. FETCH: This request will now include the cookies set by the backend redirect
        const res = await fetch("/api/users/me", {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          console.log("Auth check - profile data:", data);
          if (players.length === 0) {
            saveCurrentPlayer(data.username, data.id);
          }
          login();
        }
      } catch (err) {
        console.error("Auth check failed:", err);
      } finally {
        setIsChecking(false);
      }
    };
    if (!isLoggedIn) {
      checkAuth();
    } else {
      setIsChecking(false);
    }
  }, [login, isLoggedIn, saveCurrentPlayer, players.length]);

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
