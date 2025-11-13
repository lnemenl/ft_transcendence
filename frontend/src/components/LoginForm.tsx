import { useState } from "react";
import { handleRequest } from "./AuthRequest";
import { useLanguage } from "./useLanguage";
import { useGame } from "./GameContext";

type LoginFormProps = {
  onBack: () => void;
  onLogin: () => void;
  setMode: () => void;
  loginEndpoint: string;
};

export function LoginForm({ onBack, onLogin, setMode, loginEndpoint }: LoginFormProps) {
  const t = useLanguage();
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const { setReady, saveCurrentPlayer, currentPlayerIndex, totalPlayers, players } = useGame();

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  const handleScroll = () => {
    document.getElementById("game")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGameContextAfterLogin = (id: number) => {
    if (currentPlayerIndex === 0) {
      onLogin();
    }
    saveCurrentPlayer(username, id);
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

    // Check if username is already used by another player (case-sensitive to match backend)
    const isDuplicate = players.some((player, index) =>
      index < currentPlayerIndex && player.name === username
    );

    if (isDuplicate) {
      setError(t.duplicateUser);
      return;
    }

    handleRequest({
      e,
      endpoint: loginEndpoint,
      data: { username, email, password },
      onSuccess: (result) => {
        // Check if 2FA is required
        if (result.twoFactorRequired && result.twoFactorToken) {
          setRequires2FA(true);
          setTwoFactorToken(result.twoFactorToken);
          setUserId(result.id);
          setError("");
        } else {
          // Normal login without 2FA - handle game context
          handleGameContextAfterLogin(result.id);
        }
      },
      setError,
    });
  };

  const handleTwoFactorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          twoFactorToken: twoFactorToken,
          SixDigitCode: twoFactorCode,
        }),
      });

      if (res.ok) {
        console.log("2FA verification successful!");
        handleScroll();
        // After 2FA succeeds, handle game context
        if (userId !== null) {
          handleGameContextAfterLogin(userId);
        } else {
          onLogin();
        }
      } else {
        const errorData = await res.json();
        setError(errorData.error || t.invalidCode);
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
    setUserId(null);
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
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="username">
            {t.username}
          </label>
          <input onChange={(e) => setUsername(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" value={username} type="text" placeholder={t.username} required/>
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
          <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
            {t.back}
          </button>
      </div>
      </form>
  </div>
  );
}
