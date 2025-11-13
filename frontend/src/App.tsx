
import { Blobs } from "./components/Blobs";
import { Header } from "./components/Header";
//import { Game } from "./components/Game";
import { DarkMode } from "./components/DarkMode";
//import { LoginRegister } from "./components/LoginRegister";
//import { LanguageSelect } from "./components/LanguageSelect";
import { GetAuth } from "./components/GetAuth";
//import { LogButton } from "./components/LogButton"
import { GameProvider } from "./components/GameContext";
import { AppContent } from "./components/AppContent";

function App() {
  return <>
    <GetAuth>
      <Blobs />
      <Header />
      <DarkMode />
      <GameProvider>
        <AppContent />
      </GameProvider>
    </GetAuth>
  </>;
}

export default App
