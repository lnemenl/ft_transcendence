
import { Blobs } from "./components/Blobs";
import { Header } from "./components/Header";
import { Game } from "./components/Game";
import { DarkMode } from "./components/DarkMode";
import { LoginRegister } from "./components/LoginRegister";
import { LanguageSelect } from "./components/LanguageSelect";
import { GetAuth } from "./components/GetAuth";
import { LogButton } from "./components/LogButton"
import { GameProvider } from "./components/GameContext";

function App() {
  return <>
    <GetAuth>
      <Blobs />
      <Header />
      <DarkMode />
      <GameProvider>
        <LogButton />
        <LoginRegister />
        <LanguageSelect />
        <Game />
      </GameProvider>
    </GetAuth>
  </>;
}

export default App
