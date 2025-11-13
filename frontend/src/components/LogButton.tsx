import { useAuth } from "./GetAuth";
import { useGame } from "./GameContext";

export function LogButton() {
  const { isLoggedIn, logout } = useAuth();
  const { resetGame, setReady, players } = useGame();
  
  const handleScroll = () => {
    document.getElementById("login")?.scrollIntoView({ 
      behavior: "smooth" 
    });
  };
  return (
    <div className="fixed top-12 right-38 flex items-center gap-3 z-50">
      {isLoggedIn ? (
        <button type="button" onClick={() => { logout(); resetGame(); handleScroll(); setReady(false) }} className="bg-[#6688cc] hover:bg-[#24273a] text-white font-bold p-3 fixed rounded-2xl">
          Logout
        </button>
      ) : (
        <button type="button" onClick={handleScroll} className="bg-[#6688cc] hover:bg-[#24273a] text-white font-bold p-3 fixed rounded-2xl">
          Login
        </button>
      )}
    </div>
  );
}
