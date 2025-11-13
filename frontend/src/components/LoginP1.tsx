import React from "react";
import { LoginFormP1 } from "./LoginFormP1";
import { t } from "./lang";
import { useLanguage } from "./useLanguage";

type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" |"tournament";

type Props = {
  onBack: () => void;
  onLogin: () => void;
  onSelectMode: (view: View) => void;
};

export const LoginP1: React.FC<Props> = ({ onBack, onLogin, onSelectMode }) => {
  useLanguage();
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        {t().logIn}
      </h2>
      <LoginFormP1 onBack={ onBack } onLogin={ onLogin } onSelectMode={ onSelectMode } />
    </div>
  );
};
