
import { Blobs } from "./components/Blobs";
import { Header } from "./components/Header";
import { Game } from "./components/Game";
import { DarkMode } from "./components/DarkMode";
import { Login } from "./components/Login";

function App() {
  return <>
    <Blobs />
    <Header />
    <DarkMode />
    <Login />
    <Game />
  </>;
}

export default App