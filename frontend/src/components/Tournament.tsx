import React from "react";

type Props = { 
  onBack: () => void;
};

export const Tournament: React.FC<Props> = ({ onBack }) => {
  return (
      <div className="min-h-full flex flex-col justify-center items-center p-6">
        <h2 className="text-3xl font-extrabold text-[#6688cc] dark:text-[#cad3f5] mb-6">
          COMING SOON...
        </h2>
        <button type="button" onClick={onBack} className="text-sm text-gray-500 dark:text-[#cad3f5] hover:text-gray-700">
            Back
          </button>
      </div>
    );
}