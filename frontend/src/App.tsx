
import { Blobs } from "./components/Blobs";
import { Header } from "./components/Header";
import { Game } from "./components/Game";
import { DarkMode } from "./components/DarkMode";
import { LanguageSelect } from "./components/LanguageSelect";

function App() {
  return <>
    <Blobs />
    <Header />
    <DarkMode />
    <LanguageSelect />
    <Game />
  </>;
}

export default App
