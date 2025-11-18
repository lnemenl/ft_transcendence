import { useState, useEffect, useRef } from "react";
import { LogButton } from "./LogButton";
import { LanguageSelect } from "./LanguageSelect";
import { DarkMode } from "./DarkMode";
import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";
import { Link, useLocation } from "react-router-dom";

export const Menu: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const { isLoggedIn } = useAuth();
  const { players } = useGame();
  const menuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const isOnProfile = location.pathname === '/profile';

  // Fetch username and avatar from API when logged in
  useEffect(() => {
    if (!isLoggedIn) {
      setUsername("");
      setAvatarUrl("");
      return;
    }

    // First try to get from GameContext (for game flow)
    const gameUsername = players[0]?.name;
    if (gameUsername) {
      setUsername(gameUsername);
      // Note: GameContext doesn't store avatarUrl, so we still fetch it
    }

    // Fetch from API
    const fetchUserData = async () => {
      try {
        const res = await fetch("/api/users/me", { credentials: "include" });
        if (res.ok) {
          const userData = await res.json();
          setUsername(userData.username || "");
          setAvatarUrl(userData.avatarUrl || "");
        }
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };

    fetchUserData();

    // Listen for profile updates from Profile component
    const handleProfileUpdate = () => {
      fetchUserData();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => window.removeEventListener('profileUpdated', handleProfileUpdate);
  }, [isLoggedIn, players]);

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

  const userInitial = username ? username.charAt(0).toUpperCase() : "?";

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className="relative" ref={menuRef}>
        <button onClick={toggleMenu} className="flex items-center gap-2 rounded-full bg-[#6688cc] hover:bg-[#24273a] text-white font-semibold px-4 py-2 shadow-lg transition">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-sm font-bold overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
            ) : (
              userInitial
            )}
          </span>
          <span className="truncate max-w-[120px]">
            {isLoggedIn && username ? username : "Menu"}
          </span>
          <span className={`ml-1 transition-transform ${open ? "rotate-180" : ""}`}>
            ▼
          </span>
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#6688cc] text-white shadow-xl border border-white/10 py-2 flex flex-col">
            {isLoggedIn && (
              <>
                {isOnProfile ? (
                  <Link to="/" onClick={() => setOpen(false)} className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-white/10">
                    <span className="text-lg">🏠</span>
                    <span>Home</span>
                  </Link>
                ) : (
                  <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-3 w-full px-4 py-2 text-sm hover:bg-white/10">
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-white/20 text-white font-bold overflow-hidden">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                      ) : (
                        userInitial
                      )}
                    </div>
                    <span>Profile</span>
                  </Link>
                )}
              </>
            )}
            <div className="w-full px-4 py-2 text-sm hover:bg-white/10">
              <div className="flex w-full gap-2">
                <LanguageSelect />
              </div>
            </div>
            <div className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-white/10">
              <DarkMode />
            </div>
            <div className="my-1 border-t border-white/10" />
            <div className="w-full px-4 py-2 text-sm hover:bg-white/10" onClick={() => setOpen(false)}>
              <LogButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
