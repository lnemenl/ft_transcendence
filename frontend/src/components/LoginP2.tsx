import React from "react";
import { LoginFormP2 } from "./LoginFormP2";
import { useGame } from "./GameContext";

type Props = { 
  onBack: () => void;
};

export const LoginP2: React.FC<Props> = ({ onBack }) => {
  const { currentPlayerIndex } = useGame();
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        Log In Player { currentPlayerIndex + 1 }
      </h2>
      <LoginFormP2 onBack={ onBack }/>
    </div>
  );
};