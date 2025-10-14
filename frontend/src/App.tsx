
import { Blobs } from "./components/Blobs";
import { Header } from "./components/Header";
import { Game } from "./components/Game";
import { DarkMode } from "./components/DarkMode";
import { PlayMode } from "./components/PlayMode";

function App() {
  return <>
    <Blobs />
    <Header />
    <DarkMode />
    <PlayMode />
    <Game />
  </>;
}

export default App