import { GetAuth } from "./components/GetAuth";
import { GameProvider } from "./components/GameContext";
import { AppContent } from "./components/AppContent";
import { BrowserRouter as Router } from "react-router-dom";

function App() {
  return <>
    <Router>
      <GetAuth>
        <GameProvider>
          <AppContent />
        </GameProvider>
      </GetAuth>
    </Router>
  </>;
}

export default App
