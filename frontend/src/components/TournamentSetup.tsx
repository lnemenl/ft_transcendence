import { useState } from "react";
import { Login } from "./Login"
import { SignUp } from "./SignUp";
import { useGame } from "./GameContext";
import { useAuth } from "./GetAuth";
import { useLanguage } from "./useLanguage";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

type Props = {
  onBack: () => void;
  onSelectMode: (view: View) => void;
}

type Form = "unknown" | "signup" | "login"

export const TournamentSetup: React.FC<Props> = ({ onBack, onSelectMode }) => {
  const t = useLanguage();
  const { currentPlayerIndex, totalPlayers } = useGame();
  const { login } = useAuth();
  const [form, setForm] = useState<Form>("unknown");
  const handleForm = (form: Form) => setForm(form);
  const getBack = () => {
    setForm("unknown");
  }

  if (form === "unknown") {
    return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h1 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">{t.loginOrSignupPlayer} {currentPlayerIndex + 1} / {totalPlayers}</h1>
      <div className="flec justify-center items-center">
        <button onClick={() => handleForm("signup")} className="text-white m-5 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">{t.signUp}</button>
        <button onClick={() => handleForm("login")} className="text-white m-5 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">{t.logIn}</button>
      </div>
      <button onClick={ onBack } className="m-5 text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">{t.back}</button>
    </div>
    )
  }
  else if (form === "signup") {
    return (
      <div className="min-h-full flex justify-center items-center p-6">
        <SignUp onBack={ getBack } onLogin={ login }onSelectMode={ onSelectMode } loginEndpoint="login/tournament"/>
      </div>
    )
  }
  else if (form === "login") {
    return (
      <div className="min-h-full flex justify-center items-center p-6">
        <Login onBack={ getBack } onLogin={ login } onSelectMode={ onSelectMode } loginEndpoint="login/tournament"/>
      </div>
    )
  }
}