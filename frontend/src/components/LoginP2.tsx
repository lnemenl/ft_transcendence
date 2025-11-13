import React from "react";
import { LoginFormP2 } from "./LoginFormP2";
import { useGame } from "./GameContext";

type Form = "unknown" | "signup" | "login"
type View = "register" | "choice" | "login" | "multiplayer" | "gamemode" | "tournament";

type Props = { 
  getBack: (form: Form) => void;
  onSelectMode: (view: View) => void;
};

export const LoginP2: React.FC<Props> = ({ getBack, onSelectMode }) => {
  const { currentPlayerIndex } = useGame();
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        Log In Player { currentPlayerIndex + 1 }
      </h2>
      <LoginFormP2 getBack={ getBack } onSelectMode={ onSelectMode }/>
    </div>
  );
};