// GameContext.tsx
import React, { createContext, useContext, useState } from "react";

export type Player = {
  id: number;
  name: string;
  //avatar etc here
};

export type GameMode = "unknown" | "multiplayer" | "tournament";

type GameContextType = {
  mode: GameMode;
  setMode: (mode: GameMode) => void;

  totalPlayers: number;           // 2 or 4 or 8
  setTotalPlayers: (n: number) => void;

  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;

  currentPlayerIndex: number;
  setCurrentPlayerIndex: React.Dispatch<React.SetStateAction<number>>;

  saveCurrentPlayer: (name: string) => void;

  resetGame: () => void;

  ready: boolean;
  setReady: (r: boolean) => void;
};

const GameContext = createContext<GameContextType | null>(null);

type GameProviderProps = {
  children: React.ReactNode;
};

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<GameMode>("unknown");
  const [totalPlayers, setTotalPlayersState] = useState<number>(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [ready, setReady] = useState<boolean>(false);

  const setTotalPlayers = (n: number) => {
    setTotalPlayersState(n);

    setPlayers((prev) => {
      const copy = [...prev];

      if (copy.length < n) {
        for (let i = copy.length; i < n; i++) {
          copy.push({ id: i + 1, name: "" });
        }
      } else if (copy.length > n) {
        copy.length = n;
      }

      return copy;
    });
  };

  const saveCurrentPlayer = (name: string) => {
    setPlayers((prev) => {
      const updated = [...prev];
      if (updated.length <= currentPlayerIndex) {
        for (let i = updated.length; i <= currentPlayerIndex; i++) {
          updated.push({ id: i + 1, name: "" });
        }
      }
      updated[currentPlayerIndex] = {
        id: currentPlayerIndex + 1,
        name,
      };
      return updated;
    });
    setCurrentPlayerIndex((prev => prev + 1));
  };

  const resetGame = () => {
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setTotalPlayersState(2);
    setMode("unknown");
    console.log(currentPlayerIndex);
  };


  return (
    <GameContext.Provider
      value={{
        mode,
        setMode,
        totalPlayers,
        setTotalPlayers,
        players,
        setPlayers,
        currentPlayerIndex,
        setCurrentPlayerIndex,
        saveCurrentPlayer,
        resetGame,
        ready,
        setReady,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used inside GameProvider");
  return context;
};
