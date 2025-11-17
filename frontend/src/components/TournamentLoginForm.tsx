import { useState } from "react";
import { handleRequest } from "./AuthRequest";
import { useLanguage } from "./useLanguage";
import { useGame } from "./GameContext";

type LoginFormProps = {
  getBack: () => void;
  setMode: () => void;
};

export function TournamentLoginForm({ getBack, setMode }: LoginFormProps) {
  const t = useLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const { saveCurrentPlayer, currentPlayerIndex, totalPlayers, setReady } = useGame();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleRequest({
      e,
      endpoint: "login/tournament",
      data: { username, email, password },
      onSuccess: (response) => {
        saveCurrentPlayer(response.username, response.id);
        if (currentPlayerIndex === totalPlayers - 1) {
          setMode();
          setReady(true);
        }
        else {
          getBack();
        }
        setUsername("");
        setEmail("");
        setPassword("");
      },
      setError,
    });
  };
  
  return (
  <div className="min-w-90">
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4">
        <div className="mb-4">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="username">
            {t.username}
          </label>
          <input onChange={(e) => setUsername(e.target.value)} className="shadow xappearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" value={username} type="text" placeholder={t.username} required/>
        </div>
        <div className="mb-4">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="email-p1">
            {t.email}
          </label>
          <input onChange={(e) => setEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" value={email} type="email" placeholder={t.email} required />
        </div>
        <div className="">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="password">
            {t.password}
          </label>
          <input onChange={(e) => setPassword(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" value={password} type="password" placeholder={t.password} required/>
        </div>
        <div className="flex flex-col items-center justify-center w-full max-w-sm">
          <div className="min-h-1 flex items-center justify-center mb-3">
            {error && (<p className="text-sm text-red-600 mt-2">{error}</p>)}
          </div>
          <button type="submit" className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4">
            {t.logIn}
          </button>
          <button type="button" onClick={getBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
            {t.back}
          </button>
      </div>
      </form>
  </div>
  );
}