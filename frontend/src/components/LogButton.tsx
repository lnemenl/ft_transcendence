import { useAuth } from "./GetAuth";

export function LogButton() {
  const { isLoggedIn, logout } = useAuth();
  const handleScroll = () => {
    document.getElementById("login")?.scrollIntoView({ 
      behavior: "smooth" 
    });
  };
  return (
    <div className="fixed top-28 right-22 flex items-center gap-3 z-50">
      {isLoggedIn ? (
        <button type="button" onClick={logout} className="bg-[#6688cc] hover:bg-[#24273a] text-white font-bold p-3 fixed rounded-2xl">
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
