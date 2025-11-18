import { useState } from "react";
import { handleRequest } from "./AuthRequest";
import { useLanguage, translateError } from "./useLanguage";
import { useGame } from "./GameContext";

type LoginFormProps = {
  onBack: () => void;
  onLogin: () => void;
  setMode: () => void;
  loginEndpoint: string;
};

export function LoginForm({ onBack, onLogin, setMode, loginEndpoint }: LoginFormProps) {
  const t = useLanguage();
  const [usernameOrEmail, setUsernameOrEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { setReady, saveCurrentPlayer, currentPlayerIndex, totalPlayers, players } = useGame();

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");

  const handleScroll = () => {
    document.getElementById("game")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGameContextAfterLogin = (id: number, username: string) => {
    // For initial login (not tournament/multiplayer), only call onLogin without adding to players
    if (loginEndpoint === "login") {
      onLogin();
      setUsernameOrEmail("");
      setPassword("");
      return;
    }
    
    // For game logins (tournament/player2), add to players array
    if (currentPlayerIndex === 0) {
      onLogin();
    }
    saveCurrentPlayer(username, String(id));
    if (currentPlayerIndex === totalPlayers - 1) {
      setReady(true);
      setMode();
    } else {
      onBack();
    }
    setUsernameOrEmail("");
    setPassword("");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Determine if input is email or username
    const isEmail = usernameOrEmail.includes('@');
    const loginData = isEmail 
      ? { email: usernameOrEmail, password }
      : { username: usernameOrEmail, password };

    handleRequest({
      e,
      endpoint: loginEndpoint,
      data: loginData,
      onSuccess: (result) => {
        // For tournament/multiplayer, check if this player is already in the game
        if (loginEndpoint !== "login") {
          const isDuplicate = players.some((player) => 
            player.name && player.name === result.username
          );

          if (isDuplicate) {
            setError(t.duplicateUser);
            return;
          }
        }

        // Check if 2FA is required
        if (result.twoFactorRequired && result.twoFactorToken) {
          setRequires2FA(true);
          setTwoFactorToken(result.twoFactorToken);
          setError("");
        } else {
          // Normal login without 2FA - handle game context
          handleGameContextAfterLogin(result.id, result.username);
        }
      },
      setError,
    });
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // Determine the correct 2FA endpoint based on login type
    const twoFAEndpoint = loginEndpoint === "login/player2" 
      ? "/api/2fa/verify/player2"
      : loginEndpoint === "login/tournament"
      ? "/api/2fa/verify/tournament"
      : "/api/2fa/verify";

    try {
      const res = await fetch(twoFAEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          twoFactorToken: twoFactorToken,
          SixDigitCode: twoFactorCode,
        }),
      });

      if (res.ok) {
        const result = await res.json();
        
        // Check for duplicates again after 2FA (in case user tried to add same player twice)
        if (loginEndpoint !== "login") {
          const isDuplicate = players.some((player) => 
            player.name && player.name === result.username
          );

          if (isDuplicate) {
            setError(t.duplicateUser);
            return;
          }
        }
        
        handleScroll();
        // After 2FA succeeds, handle game context with username from response
        handleGameContextAfterLogin(result.id, result.username);
      } else {
        const errorData = await res.json();
        const backendError = errorData.error;
        
        // Try to translate the backend error
        const translationKey = translateError(backendError);
        
        // Use translated error if available, otherwise fallback to invalidCode
        const errorMessage = translationKey ? t[translationKey] : (backendError || t.invalidCode);
        setError(errorMessage);
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      setError(t.couldNotConnectToServer);
    }
  };

  const handleBackFrom2FA = () => {
    setRequires2FA(false);
    setTwoFactorToken("");
    setTwoFactorCode("");
    setError("");
  };

  // Show 2FA verification form
  if (requires2FA) {
    return (
      <div className="min-w-90 h-full">
        <form onSubmit={handleTwoFactorSubmit} className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4">
          <h3 className="text-xl font-bold text-[#6688cc] dark:text-[#cad3f5] mb-4">
            {t.twoFactorAuth}
          </h3>
          <p className="text-sm text-gray-600 dark:text-[#cad3f5] mb-4">
            {t.enterSixDigitCode}
          </p>
          <div className="mb-4">
            <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="2fa-code">
              {t.verificationCode}
            </label>
            <input
              onChange={(e) => setTwoFactorCode(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline text-center text-2xl tracking-widest"
              id="2fa-code"
              type="text"
              placeholder="000000"
              maxLength={6}
              pattern="\d{6}"
              value={twoFactorCode}
              autoComplete="off"
              required
            />
          </div>
          <div className="flex flex-col items-center justify-center w-full max-w-sm">
            <div className="min-h-1 flex items-center justify-center mb-3">
              {error && (<p className="text-sm text-red-600 mt-2">{error}</p>)}
            </div>
            <button type="submit" className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4 w-full">
              {t.verify}
            </button>
            <button type="button" onClick={handleBackFrom2FA} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
              {t.back}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Show normal login form
  return (
  <div className="min-w-90 h-full">
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4">
        <div className="mb-4">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="usernameOrEmail">
            {t.usernameOrEmail}
          </label>
          <input 
            onChange={(e) => setUsernameOrEmail(e.target.value)} 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" 
            value={usernameOrEmail} 
            type="text" 
            placeholder={t.usernameOrEmail}
            required
          />
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
          <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
            {t.back}
          </button>
      </div>
      </form>
  </div>
  );
}
