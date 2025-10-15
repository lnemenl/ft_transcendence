import React from "react";
import { LoginFormP1 } from "./LoginFormP1";
import { LoginFormP2 } from "./LoginFormP2";

type Props = { 
  onBack: () => void;
};

export const MultiplayerLogin: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6 bg-blue-50/50">
      <h2 className="text-3xl font-extrabold text-[#6688cc] mb-6">Multiplayer Login</h2>
      <div className="flex flex-col items-center justify-center md:flex-row gap-6 w-full max-w-2xl">
        <LoginFormP1 onBack={ onBack } />
        <LoginFormP2 onBack={ onBack } />
      </div>
    </div>
  );
};

