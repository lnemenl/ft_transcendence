import { useGame } from "./GameContext";
import { LanguageSelect } from "./LanguageSelect";
import { LoginRegister } from "./LoginRegister";
import { LogButton } from "./LogButton"
import { Game } from "./Game";

export function AppContent() {
  const { ready } = useGame();

  return (
    <>
      <LogButton />
      <LoginRegister />
      <LanguageSelect />
      {ready && <Game />}
    </>
  );
};