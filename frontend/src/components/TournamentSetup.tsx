import { useState } from "react";
import { LoginForm } from "./LoginForm";
import { SignUpForm } from "./SignUpForm";
import { useGame } from "./GameContext";
import { useLanguage } from "./useLanguage";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" | "tournament";
type FormState = "unknown" | "signup" | "login";

interface Props {
  onBack: () => void;
  onSelectMode: (view: View) => void;
}

export const TournamentSetup: React.FC<Props> = ({ onBack, onSelectMode }) => {
  const t = useLanguage();
  const { currentPlayerIndex, totalPlayers } = useGame();
  const [form, setForm] = useState<FormState>("unknown");

  const noOpLogin = () => {};

  if (form === "unknown") {
    return (
      <div className="min-h-full flex flex-col justify-center items-center p-6">
        <h1 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
          {t.loginOrSignupPlayer} {currentPlayerIndex + 1} / {totalPlayers}
        </h1>
        <div className="flex justify-center items-center gap-4">
          <button onClick={() => setForm("signup")} className="text-white min-w-40 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4 transition-colors">
            {t.signUp}
          </button>
          <button onClick={() => setForm("login")} className="text-white min-w-40 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4 transition-colors">
            {t.logIn}
          </button>
        </div>
        <button onClick={onBack} className="mt-6 text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
          {t.back}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        {form === "signup" ? t.signUp : t.logIn}
      </h2>
      {form === "signup" ? (
        <SignUpForm 
          onBack={() => setForm("unknown")}
          onLogin={noOpLogin}
          setMode={() => onSelectMode("choice")}
          loginEndpoint="login/tournament"
        />
      ) : (
        <LoginForm 
          onBack={() => setForm("unknown")}
          onLogin={noOpLogin}
          setMode={() => onSelectMode("choice")}
          loginEndpoint="login/tournament"
        />
      )}
    </div>
  );
};
