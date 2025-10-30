import React from "react";
import { LoginFormP1 } from "./LoginFormP1";

type Props = { 
  onBack: () => void;
  onLogin: () => void;
};

export const LoginP1: React.FC<Props> = ({ onBack, onLogin }) => {
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-6">
      <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
        Log In
      </h2>
      <LoginFormP1 onBack={ onBack } onLogin={ onLogin }/>
    </div>
  );
};
