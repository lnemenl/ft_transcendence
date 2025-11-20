import { useState } from "react";
import { handleRequest } from "./AuthRequest";
import { useLanguage } from "./useLanguage";
import { useGame } from "./GameContext";
import { GoogleLoginButton } from "./GoogleLoginButton";

type SignUpFormProps = {
  onBack: () => void;
  setMode: () => void;
  onLogin: () => void;
  loginEndpoint: string;
};

export function SignUpForm({ onBack, onLogin, setMode, loginEndpoint }: SignUpFormProps) {
  const t = useLanguage();
  const { setReady, saveCurrentPlayer, currentPlayerIndex, totalPlayers, players } = useGame();
  
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const googleType = loginEndpoint.includes("player2") ? "player2" : 
                     loginEndpoint.includes("tournament") ? "tournament" : "main";

  const handleSuccess = (id: string, name: string) => {
    if (currentPlayerIndex === 0) onLogin();
    
    saveCurrentPlayer(name, id);
    
    if (currentPlayerIndex === totalPlayers - 1) {
      setReady(true);
      setMode();
    } else {
      onBack();
    }
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isDuplicate = players.some((p, i) => i < currentPlayerIndex && p.name === username);
    if (isDuplicate) {
      setError(t.duplicateUser);
      return;
    }

    // 1. Register
    handleRequest({
      e,
      endpoint: "register",
      data: { username, email, password },
      onSuccess: () => {
        // 2. Auto-Login to get tokens
        handleRequest({
          e,
          endpoint: loginEndpoint,
          data: { username, email, password },
          onSuccess: (res) => handleSuccess(res.id, username),
          setError,
        });
      },
      setError,
    });
  };

  return (
    <div className="min-w-90">
      <div className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2">{t.username}</label>
                <input onChange={(e) => setUsername(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-gray-900 dark:text-white" value={username} type="text" placeholder={t.username} required />
            </div>
            <div>
                <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2">{t.email}</label>
                <input onChange={(e) => setEmail(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-gray-900 dark:text-white" value={email} type="email" placeholder={t.email} required />
            </div>
            <div>
                <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2">{t.password}</label>
                <input onChange={(e) => setPassword(e.target.value)} className="shadow border rounded w-full py-2 px-3 text-gray-900 dark:text-white" value={password} type="password" placeholder={t.password} required />
            </div>

            <div className="flex flex-col items-center w-full">
                <div className="min-h-6 mb-2">{error && <p className="text-sm text-red-600">{error}</p>}</div>
                <button type="submit" className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4 w-full">{t.signUp}</button>
            </div>
        </form>

        <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        <GoogleLoginButton 
            type={googleType}
            label={t.signUp + " with Google"}
            onSuccess={(res) => handleSuccess(res.id, res.username)}
            onError={setError}
        />

        <div className="flex justify-center mt-4">
            <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">{t.back}</button>
        </div>
      </div>
    </div>
  );
}
