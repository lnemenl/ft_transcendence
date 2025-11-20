import React, { createContext, useContext, useState } from "react";

export type Player = {
  id: string;
  name: string;
  //avatar etc here
};

export type GameMode = "unknown" | "multiplayer" | "tournament";

type GameContextType = {
  mode: GameMode;
  setMode: (mode: GameMode) => void;

  totalPlayers: number;
  setTotalPlayers: (n: number) => void;

  players: Player[];
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>;

  currentPlayerIndex: number;
  setCurrentPlayerIndex: React.Dispatch<React.SetStateAction<number>>;

  saveCurrentPlayer: (name: string, playerId: string) => void;

  updateUsername: (newName: string) => void;

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
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState<number>(0);
  const [ready, setReadyState] = useState<boolean>(false);

  const setReady = (r: boolean) => {
    setReadyState(r);
  };

  const setTotalPlayers = (n: number) => {
    setTotalPlayersState(n);

    setPlayers((prev) => {
      const copy = [...prev];

      if (copy.length < n) {
        for (let i = copy.length; i < n; i++) {
          copy.push({ id: "", name: "" });
        }
      } else if (copy.length > n) {
        copy.length = n;
      }

      return copy;
    });
  };

  const saveCurrentPlayer = (name: string, playerId: string) => {
    setPlayers((prev) => {
      const updated = [...prev];
      if (updated.length <= currentPlayerIndex) {
        for (let i = updated.length; i <= currentPlayerIndex; i++) {
          updated.push({ id: "", name: "" });
        }
      }
      updated[currentPlayerIndex] = {
        id: playerId,
        name,
      };
      return updated;
    });
    setCurrentPlayerIndex((prev => prev + 1));
  };

  const updateUsername = (newName: string) => {
  setPlayers(prev => {
    if (prev.length === 0) return prev;

    const copy = [...prev];
    copy[0] = { ...copy[0], name: newName };

    return copy;
  });
};


  const resetGame = () => {
    setPlayers([]);
    setCurrentPlayerIndex(0);
    setTotalPlayersState(2);
    setMode("unknown");
    setReady(false);
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
        updateUsername,
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
