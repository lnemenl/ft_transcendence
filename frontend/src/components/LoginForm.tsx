import { useState } from "react";
import { handleRequest } from "./AuthRequest";
import { useLanguage } from "./useLanguage";
import { useGame } from "./GameContext";
import { GoogleLoginButton } from "./GoogleLoginButton";

type LoginFormProps = {
  onBack: () => void;
  onLogin: () => void;
  setMode: () => void;
  loginEndpoint: string;
};

type LoginResponse = {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  twoFactorRequired?: boolean;
  twoFactorToken?: string;
  isTwoFactorEnabled?: boolean;
  createdAt?: string;
  friends?: Array<{
    id: string;
    username: string;
    avatarUrl: string;
    isOnline: boolean;
  }>;
};

export function LoginForm({ onBack, onLogin, setMode, loginEndpoint }: LoginFormProps) {
  const t = useLanguage();
  const { setReady, saveCurrentPlayer, currentPlayerIndex, totalPlayers, players } = useGame();

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  // 2FA State
  const [requires2FA, setRequires2FA] = useState<boolean>(false);
  const [twoFactorToken, setTwoFactorToken] = useState<string>("");
  const [twoFactorCode, setTwoFactorCode] = useState<string>("");
  const [tempUserId, setTempUserId] = useState<string | null>(null);

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
    
    // Reset form
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const handleLoginResponse = (response: LoginResponse) => {
    const isDuplicate = players.some((p) => p.id === response.id);
    if (isDuplicate) {
      setError(t.duplicateUser); // "This user is already logged in..."
      return;
    }
    // Handle both login endpoint response AND Google response
    if (response.twoFactorRequired && response.twoFactorToken) {
      setRequires2FA(true);
      setTwoFactorToken(response.twoFactorToken);
      setTempUserId(response.id);
      setError("");
    } else {
      // Google response comes with id and username already set
      handleSuccess(response.id, response.username);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const isDuplicate = players.some((p, i) => i < currentPlayerIndex && p.name === username);
    if (isDuplicate) {
      setError(t.duplicateUser);
      return;
    }

    handleRequest({
      e,
      endpoint: loginEndpoint,
      data: { username, email, password },
      onSuccess: handleLoginResponse,
      setError,
    });
  };

  const handle2FASubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const endpointMap: Record<string, string> = {
      "main": "/api/2fa/verify",
      "player2": "/api/2fa/verify/player2",
      "tournament": "/api/2fa/verify/tournament"
    };
    const verifyUrl = endpointMap[googleType];

    try {
      const res = await fetch(verifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ twoFactorToken, SixDigitCode: twoFactorCode }),
      });

      if (res.ok) {
        const data = await res.json();
        // If 2FA response includes user data (tournament/p2), use it. Else use stored state.
        handleSuccess(data.id || tempUserId, data.username || username);
      } else {
        const errData = await res.json();
        setError(errData.error || t.invalidCode);
      }
    } catch {
      setError(t.couldNotConnectToServer);
    }
  };

  if (requires2FA) {
    return (
      <div className="min-w-90 h-full">
        <form onSubmit={handle2FASubmit} className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4">
          <h3 className="text-xl font-bold text-[#6688cc] dark:text-[#cad3f5] mb-4">{t.twoFactorAuth}</h3>
          <p className="text-sm text-gray-600 dark:text-[#cad3f5] mb-4">{t.enterSixDigitCode}</p>
          
          <div className="mb-4">
            <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2">{t.verificationCode}</label>
            <input
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="shadow border rounded w-full py-2 px-3 text-gray-900 dark:text-white text-center text-2xl tracking-widest"
              type="text" maxLength={6} pattern="\d{6}" value={twoFactorCode} required autoFocus
            />
          </div>

          <div className="flex flex-col items-center w-full">
            <div className="min-h-6 mb-2">{error && <p className="text-sm text-red-600">{error}</p>}</div>
            <button type="submit" className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4 w-full">{t.verify}</button>
            <button type="button" onClick={() => setRequires2FA(false)} className="text-sm text-gray-500 hover:text-gray-700">{t.back}</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-w-90 h-full">
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
            <button type="submit" className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4 w-full">{t.logIn}</button>
          </div>
        </form>

        <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
            <div className="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
        </div>

        <GoogleLoginButton 
            type={googleType} 
            onSuccess={handleLoginResponse} 
            onError={setError}
        />

        <div className="flex justify-center mt-4">
            <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">{t.back}</button>
        </div>
      </div>
    </div>
  );
}
