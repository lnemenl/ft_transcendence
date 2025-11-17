import React from "react";
import { LoginForm } from "./LoginForm";
import { useLanguage } from "./useLanguage";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

type Props = {
  onBack: () => void;
  onLogin: () => void;
  onSelectMode: (view: View) => void;
  loginEndpoint: string;
};

export const Login: React.FC<Props> = ({ onBack, onLogin, onSelectMode, loginEndpoint }) => {
  const handleSetMode = () => {
    onSelectMode("choice");
  }
  const t = useLanguage();
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        {t.logIn}
      </h2>
      <LoginForm onBack={ onBack } onLogin={ onLogin } setMode={ handleSetMode } loginEndpoint={ loginEndpoint} />
    </div>
  );
};
