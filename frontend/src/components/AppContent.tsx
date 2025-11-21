import { useEffect, useState } from "react";
import { useGame } from "./GameContext";
import { LoginRegister } from "./LoginRegister";
import { Blobs } from "./Blobs";
import { Header } from "./Header";
import { Game } from "./Game";
import { Menu } from "./Menu";
import { Routes, Route } from "react-router-dom";
import { Profile } from "./Profile";
import { useAuth } from "./GetAuth";
import { useLanguage } from "./useLanguage";

const Content = ({ ready }: { ready: boolean }) => {
  return (
    <>
      <Blobs gameActive={ready} />
      <Header />
      {!ready && <LoginRegister />}
      {ready && <Game />}
    </>
  )
}

export function AppContent() {
  const { ready, saveCurrentPlayer, players } = useGame();
  const { login, isLoggedIn } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const t = useLanguage();

  // GLOBAL AUTH CHECK
  useEffect(() => {
    const checkAuth = async () => {
      // 1. Handle Google Redirect Clean up
      const params = new URLSearchParams(window.location.search);
      if (params.get("login") === "success") {
        window.history.replaceState({}, document.title, window.location.pathname);
      }

      // 2. Verify Session
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          // Only update game context if not already set
          if (players.length === 0) {
            const avatar = data.avatarUrl ?? "?";
            saveCurrentPlayer(data.username, data.id, avatar);
          }
          login();
        }
      } catch (err) {
        // Silently fail - user just stays logged out
        console.log("Auth check:", err);
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

  // Scroll handling
  useEffect(() => {
    if (window.location.pathname === "/section/login") {
      document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
    } else if (window.location.pathname === "/section/game") {
      document.getElementById("game")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (ready) {
      document.getElementById("game")?.scrollIntoView({ behavior: "smooth" });
      window.history.pushState({ section: "game" }, "", "/section/game");
    }
  }, [ready]);

  // Show a simple loader while checking auth (prevents flashing "Please Login")
  if (isChecking) {
    return (
      <div className="h-screen w-screen flex justify-center items-center bg-[#cad3f5] dark:bg-[#24273a]">
         <p className="text-xl font-bold text-[#2c3781] dark:text-[#cad3f5]">{t.loading}</p>
      </div>
    );
  }

  return (
    <>
      <Menu />
      <Routes>
        <Route path="/" element={<Content ready={ready} />} />
        <Route path="/section/login" element={<Content ready={ready} />} />
        <Route path="/section/game" element={<Content ready={ready} />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
};
