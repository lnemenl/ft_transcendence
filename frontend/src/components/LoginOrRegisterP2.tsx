import { useState } from "react";
import { SignUp } from "./SignUp";
import { Login } from "./Login"
import { useGame } from "./GameContext";
import { useAuth } from "./GetAuth";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

type Props = {
  onBack: () => void;
  onSelectMode: (view: View) => void;
}

type Form = "unknown" | "signup" | "login"

export const LoginOrRegister: React.FC<Props> = ({ onBack, onSelectMode }) => {
  const { currentPlayerIndex } = useGame();
  const { login } = useAuth();
  const [form, setForm] = useState<Form>("unknown");
  const handleForm = (form: Form) => setForm(form);
  const getBack = () => {
    setForm("unknown");
  }

  if (form === "unknown") {
    return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h1 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">Login or Signup Player {currentPlayerIndex + 1}</h1>
      <div className="flec justify-center items-center"> 
        <button onClick={() => handleForm("signup")} className="text-white m-5 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">SignUp</button>
        <button onClick={() => handleForm("login")} className="text-white m-5 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">LogIn</button>
      </div>
      <button onClick={ onBack } className="m-5 text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">Back</button>
    </div>
    )
  }
  else if (form === "signup") {
    return (
      <div className="min-h-full flex justify-center items-center p-6">
        <SignUp onBack={ getBack } onLogin={login} onSelectMode={( onSelectMode )} loginEndpoint="login/player2"/>
      </div>
    )
  }
  else if (form === "login") {
    return (
      <div className="min-h-full flex justify-center items-center p-6">
        <Login onBack={ getBack } onLogin={ login } onSelectMode={ onSelectMode } loginEndpoint="login/player2"/>
      </div>
    )
  }
}