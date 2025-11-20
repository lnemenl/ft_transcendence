import { useState } from "react";
import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";
import { LogOut } from "./LogOut";

export function LogButton() {
  const { isLoggedIn, logout } = useAuth();
  const { resetGame, setReady } = useGame();
  const [showLogoutScreen, setShowLogoutScreen] = useState<boolean>(false);

  const handleScroll = () => {
    document.getElementById("login")?.scrollIntoView({
      behavior: "smooth"
    });
  };

  const handleLogout = () => {
    logout();
    resetGame();
    handleScroll();
    setReady(false);
    setShowLogoutScreen(false);
  };

  if (showLogoutScreen && isLoggedIn) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-[#24273a] rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <LogOut onBack={() => setShowLogoutScreen(false)} onLogOut={handleLogout} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {isLoggedIn ? (
        <button type="button" onClick={() => { logout(); resetGame(); handleScroll(); setReady(false) }} className="p-1 w-full rounded-2xl">
          Logout
        </button>
      ) : (
        <button type="button" onClick={handleScroll} className="p-1 w-full rounded-2xl">
          Login
        </button>
      )}
    </div>
  );
}
