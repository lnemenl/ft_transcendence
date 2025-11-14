import { useState } from "react";
import { LogButton } from "./LogButton";
import { LanguageSelect } from "./LanguageSelect";
import { DarkMode } from "./DarkMode";
import { useAuth } from "./GetAuth";

export const Menu: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const { isLoggedIn } = useAuth();

  const toggleMenu = () => setOpen((prev) => !prev);

  return (
    <div className="fixed flex-col top-12 right-30 flex items-start gap-3 z-50">
      <button type="button" onClick={toggleMenu} className="bg-[#6688cc] hover:bg-[#24273a] text-white font-bold p-3 rounded-2xl">
      { !isLoggedIn &&
        <p>Menu</p>
      }
      </button>
      {open && (
        <div className="mt-2 flex flex-col bg-white dark:bg-[#24273a] shadow-lg rounded-xl p-4 gap-3">
            <LogButton />
            <LanguageSelect />
            <DarkMode />
        </div>
      )}      
    </div>
  )
}