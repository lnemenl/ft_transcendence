import { useGame } from "./GameContext";
import { LoginRegister } from "./LoginRegister";
import { Blobs } from "./Blobs";
import { Header } from "./Header";
import { Game } from "./Game";
import { useEffect } from "react";
import { Menu } from "./Menu";
import { Routes, Route } from "react-router-dom";
import { Profile } from "./Profile";

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
  const { ready } = useGame();


  useEffect(() => {
    if (window.location.pathname === "/section/login") {
      document.getElementById("login")?.scrollIntoView({
        behavior: "smooth",
      });
    }

    else if (window.location.pathname === "/section/game") {
      document.getElementById("game")?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, []);

  useEffect(() => {
    if (ready) {
      document.getElementById("game")?.scrollIntoView({
        behavior: "smooth",
      });
      window.history.pushState({ section: "game" }, "", "/section/game");
    }
  }, [ready]);

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
