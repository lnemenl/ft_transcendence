import { useGame } from "./GameContext";
import { LoginRegister } from "./LoginRegister";
import { Blobs } from "./Blobs";
import { Header } from "./Header";
import { Game } from "./Game";
import { useEffect } from "react";
import { Menu } from "./Menu";
import { Routes, Route } from "react-router-dom";
import { Profile } from "./Profile";

export function AppContent() {
  const { ready } = useGame();

  useEffect(() => {
    if (ready) {
      document.getElementById("game")?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [ready]);
  return (
    <>
      <Menu />
      <Routes>
        <Route 
          path="/" 
          element={
            <>
              <Blobs />
              <Header />
              <LoginRegister />
              {ready && <Game />}
            </>
          } />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </>
  );
};