import React from "react";
import { LoginFormP1 } from "./LoginFormP1";

type Props = { 
  onBack: () => void;
};

export const SinglePlayerLogin: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="min-h-full flex flex-col justify-center items-center p-10 bg-blue-50/50">
      <h2 className="text-3xl font-extrabold text-[#6688cc] mb-6">Single player login</h2>
        <LoginFormP1 onBack={ onBack }/>
    </div>
  );
};
