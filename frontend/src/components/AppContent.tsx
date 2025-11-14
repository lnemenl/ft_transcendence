import { useGame } from "./GameContext";
//import { LanguageSelect } from "./LanguageSelect";
import { LoginRegister } from "./LoginRegister";
//import { LogButton } from "./LogButton"
import { Game } from "./Game";
import { useEffect } from "react";
import { Menu } from "./Menu";

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
      <LoginRegister />
      {ready && <Game />}
    </>
  );
};