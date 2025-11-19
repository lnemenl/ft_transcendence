import { useEffect } from 'react';
import { useGame } from './GameContext';

export function Game() {
  const gameContext = useGame();

  useEffect(() => {
    (window as any).gameContext = gameContext;
  }, [gameContext]);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = `/game/src/game.js?t=${Date.now()}`;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div id="game" className="relative flex h-screen justify-center items-center z-10">
      <canvas width="1280" height="720" id="canvas" ></canvas>
    </div>
  );
}
