import { useState, useEffect, useRef } from "react";
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
  const playerName = players[0]?.name ?? "";
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setOpen((prev) => !prev);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative" ref={menuRef}>
        <button onClick={toggleMenu} className="flex items-center gap-2 rounded-full bg-[#6688cc] hover:bg-[#24273a] text-white font-semibold px-4 py-2 shadow-lg transition">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            {isLoggedIn ? playerName.charAt(0).toUpperCase() : "?"}
          </span>
          <span>
            {isLoggedIn ? playerName : "Menu"}
          </span>
          <span className={`ml-1 transition-transform ${open ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#6688cc] text-white shadow-xl border border-white/10 py-2 flex flex-col">
            <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-white/10">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white font-bold">
                {playerName ? playerName.charAt(0).toUpperCase() : "?"}
              </div>
              <span>
                Profile
              </span>
            </Link>
            <div className="w-full px-4 py-2 text-sm hover:bg-white/10">
              <div className="flex w-full gap-2">
                <LanguageSelect />
              </div>
            </div>
            <div className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-white/10">
              <DarkMode />
            </div>
            <div className="my-1 border-t border-white/10" />
            <div className="w-full px-4 py-2 text-sm hover:bg-white/10">
              <LogButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
