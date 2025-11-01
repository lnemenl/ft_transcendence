
import { Blobs } from "./components/Blobs";
import { Header } from "./components/Header";
import { Game } from "./components/Game";
import { DarkMode } from "./components/DarkMode";
import { LoginRegister } from "./components/LoginRegister";
import { LanguageSelect } from "./components/LanguageSelect";

function App() {
  return <>
    <Blobs />
    <Header />
    <DarkMode />
    <LoginRegister />
    <LanguageSelect />
    <Game />
  </>;
}

export default App
