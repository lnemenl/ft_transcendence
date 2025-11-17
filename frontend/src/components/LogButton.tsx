import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";

export function LogButton() {
  const { isLoggedIn, logout } = useAuth();
  const { resetGame, setReady } = useGame();
  
  const handleScroll = () => {
    document.getElementById("login")?.scrollIntoView({ 
      behavior: "smooth",
    });
  };
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
