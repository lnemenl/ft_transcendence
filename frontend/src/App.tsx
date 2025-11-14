
import { Blobs } from "./components/Blobs";
import { Header } from "./components/Header";
//import { DarkMode } from "./components/DarkMode";
import { GetAuth } from "./components/GetAuth";
import { GameProvider } from "./components/GameContext";
import { AppContent } from "./components/AppContent";

function App() {
  return <>
    <GetAuth>
      <Blobs />
      <Header />
      <GameProvider>
        <AppContent />
      </GameProvider>
    </GetAuth>
  </>;
}

export default App
