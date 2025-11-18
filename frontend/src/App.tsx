import { GetAuth } from "./components/GetAuth";
import { GameProvider } from "./components/GameContext";
import { AppContent } from "./components/AppContent";
import { BrowserRouter as Router } from "react-router-dom";
import { ThemeProvider } from "./hooks/useTheme";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <GetAuth>
          <GameProvider>
            <AppContent />
          </GameProvider>
        </GetAuth>
      </Router>
    </ThemeProvider>
  );
}

export default App
