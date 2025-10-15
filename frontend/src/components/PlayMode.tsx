type View = "multiplayer" | "playermode" | "singleplayer";

type Props = {
  onSelectMode: (view: View) => void;
};

export const PlayMode: React.FC<Props> = ({ onSelectMode }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center m-10">
      <h2 className="text-4xl font-bold">How do you want to play?</h2>
      <div className="flex m-10">
        <button
        onClick={() => onSelectMode("multiplayer")}
        className="m-10 min-w-50 bg-[#24273a] hover:bg-[#8aadf4] rounded-2xl px-6 py-4">
        <p className="text-2xl md:text-4xl text-white">Multiplayer</p>
        </button>
        <button
        onClick={() => onSelectMode("singleplayer")}
        className="m-10 min-w-50 bg-[#24273a] hover:bg-[#8aadf4] rounded-2xl px-6 py-4">
        <p className="text-2xl md:text-4xl text-white">Single Player</p>
      </button>
      </div>
    </div>
  );
};
