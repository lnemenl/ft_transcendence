import { useEffect } from 'react';

export function Game() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = '/game/src/game.js';
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
