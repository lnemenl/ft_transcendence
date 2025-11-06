type View = "multiplayer" | "choice" | "tournament";

type Props = {
  onSelectMode: (view: View) => void;
};

export const GameMode: React.FC<Props> = ({ onSelectMode }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center m-10">
      <h2 className="text-6xl font-bold mt-20 text-[#2c3781] dark:text-[#cad3f5]">
        How do you want to play?
      </h2>
      <div className="h-full flex justify-center mt-15">
        <div className="flex-col items-center justify-center">
          <button onClick={() => onSelectMode("multiplayer")} className="mr-10 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">
            <p className="text-2xl md:text-4xl text-white">
              1 vs 1
            </p>
          </button>
        </div>
        <div className="h-20 w-px bg-[#2c3781] dark:bg-[#cad3f5]" />
        <div className="flex-col items-center justify-center">
          <button onClick={() => onSelectMode("tournament")} className="ml-10 min-w-50 bg-[#6688cc] hover:bg-[#24273a] rounded-2xl px-6 py-4">
            <p className="text-2xl md:text-4xl text-white">
              Tournament
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};