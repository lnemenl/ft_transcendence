import { useState, useEffect } from "react";
import { handleRequest } from "./AuthRequest";
import { useLanguage } from "./useLanguage";
import { useGame } from "./GameContext";
import { validateUsername, validateEmail, validatePassword } from "../utils/validation";

type SignUpFormProps = {
  onBack: () => void;
  setMode: () => void;
  onLogin: () => void;
  loginEndpoint: string;
};

export function SignUpForm({ onBack, onLogin, setMode, loginEndpoint }: SignUpFormProps) {
  const t = useLanguage();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameWarning, setUsernameWarning] = useState("");
  const [emailWarning, setEmailWarning] = useState("");
  const [passwordWarning, setPasswordWarning] = useState("");
  const { setReady, saveCurrentPlayer, currentPlayerIndex, totalPlayers, players } = useGame();

  // Update warnings when language changes
  useEffect(() => {
    if (username) {
      const validation = validateUsername(username);
      setUsernameWarning(validation.error ? t[validation.error as keyof typeof t] : "");
    }
    if (email) {
      const validation = validateEmail(email);
      setEmailWarning(validation.error ? t[validation.error as keyof typeof t] : "");
    }
    if (password) {
      const validation = validatePassword(password);
      setPasswordWarning(validation.error ? t[validation.error as keyof typeof t] : "");
    }
  }, [t, username, email, password]);

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    const validation = validateUsername(value);
    setUsernameWarning(validation.error ? t[validation.error as keyof typeof t] : "");
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const validation = validateEmail(value);
    setEmailWarning(validation.error ? t[validation.error as keyof typeof t] : "");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const validation = validatePassword(value);
    setPasswordWarning(validation.error ? t[validation.error as keyof typeof t] : "");
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate all fields before submission
    const usernameValidation = validateUsername(username);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!usernameValidation.isValid) {
      setError(t[usernameValidation.error as keyof typeof t]);
      return;
    }

    if (!emailValidation.isValid) {
      setError(t[emailValidation.error as keyof typeof t]);
      return;
    }

    if (!passwordValidation.isValid) {
      setError(t[passwordValidation.error as keyof typeof t]);
      return;
    }

    // For tournament/multiplayer, check if this username is already in the game
    if (loginEndpoint !== "login") {
      const isDuplicate = players.some((player) => 
        player.name && player.name === username
      );

      if (isDuplicate) {
        setError(t.duplicateUser);
        return;
      }
    }

    handleRequest({
      e,
      endpoint: "register",
      data: { username, email, password },
      onSuccess: () => {
        // Login with username OR email (backend accepts either)
        const loginData = email 
          ? { email, password }
          : { username, password };
        
        handleRequest({
          e,
          endpoint: loginEndpoint,
          data: loginData,
          onSuccess: (response) => {
            // For initial registration (not tournament/multiplayer), only call onLogin
            if (loginEndpoint === "login") {
              onLogin();
              setUsername("");
              setEmail("");
              setPassword("");
              return;
            }
            
            // For game registrations (tournament/player2), add to players array
            if (currentPlayerIndex === 0) {
              onLogin();
            }
            saveCurrentPlayer(username, String(response.id));
            if (currentPlayerIndex === totalPlayers - 1) {
              setReady(true);
              setMode();
            }
            else {
              onBack();
            }
            setUsername("");
            setEmail("");
            setPassword("");
          },
          setError,
        })
      },
      setError,
    })
  };

  return (
  <div className="min-w-90">
    <form onSubmit={handleSubmit} className="bg-white dark:bg-[#24273a] shadow-xl rounded-xl p-8 w-full max-w-sm space-y-4">
        <div className="mb-4">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="username-p1">
            {t.username}
          </label>
          <input 
            onChange={(e) => handleUsernameChange(e.target.value)} 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" 
            value={username} 
            type="text" 
            placeholder={t.username} 
            maxLength={15}
            required
          />
          {usernameWarning && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{usernameWarning}</p>}
        </div>
        <div className="mb-4">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="email-p1">
            {t.email}
          </label>
          <input 
            onChange={(e) => handleEmailChange(e.target.value)} 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" 
            value={email} 
            type="email" 
            placeholder={t.email}
            maxLength={30}
            required 
          />
          {emailWarning && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{emailWarning}</p>}
        </div>
        <div className="">
          <label className="block text-[#24273a] dark:text-white text-sm font-bold mb-2" htmlFor="password-p1">
            {t.password}
          </label>
          <input 
            onChange={(e) => handlePasswordChange(e.target.value)} 
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-900 dark:text-white leading-tight focus:outline-none focus:shadow-outline" 
            value={password} 
            type="password" 
            placeholder={t.password} 
            required
          />
          {passwordWarning && <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">{passwordWarning}</p>}
        </div>
        <div className="flex flex-col items-center justify-center w-full max-w-sm">
          <div className="min-h-1 flex items-center justify-center mb-3">
            {error && (<p className="text-sm text-red-600 mt-2">{error}</p>)}
          </div>
          <button type="submit" className="bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-4 py-2 text-white mb-4">
            {t.signUp}
          </button>
          <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
            {t.back}
          </button>
        </div>
      </form>
  </div>
  );
}
