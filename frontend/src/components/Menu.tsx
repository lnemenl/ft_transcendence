import { useState } from "react";
import { LogButton } from "./LogButton";
import { LanguageSelect } from "./LanguageSelect";
import { DarkMode } from "./DarkMode";
import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";
import { Link } from "react-router-dom";

export const Menu: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const { isLoggedIn } = useAuth();
  const { players } = useGame();
  const playerName = players[0]?.name ?? "Menu";

  const toggleMenu = () => {
    console.log("menu open!");
    setOpen((prev) => !prev);
  }

  return (
  <div className="flex flex-col fixed top-12 right-20 w-25 z-50 bg-[#6688cc] rounded-2xl">
    { !isLoggedIn ? (
      <button onClick={ toggleMenu } className="hover:bg-[#24273a] text-white font-bold w-full p-3 rounded-2xl">
        Menu
      </button>
    ) : (
      <button onClick={ toggleMenu } className="hover:bg-[#24273a] text-white font-bold w-full p-3 rounded-2xl">
          { playerName }
        </button>
    )}
    <div className="flex flex-col bg-[#6688cc] rounded-2xl">
      {open && (
        <div id="menu" className="text-white">
          <Link to="/profile" onClick={() => setOpen(false)} className="p-1 pt-2 hover:font-bold">
            Profile
          </Link>
          <div className="p-1 hover:font-bold">
            <LanguageSelect />
          </div>
          <div className="flex justify-center p-1 hover:font-bold">
            <DarkMode />
          </div>
          <div className="p-1 hover:font-bold">
            <LogButton />
          </div>
        </div>
      )}
    </div>
  </div>
  )
}