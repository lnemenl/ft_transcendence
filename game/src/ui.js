export function createUI(canvas, STATES, onStartGame) {
  const container = Object.assign(document.createElement('div'), {
    style: 'position:relative; display:inline-block'
  });
  const overlay = Object.assign(document.createElement('div'), {
    style: 'position:absolute; top:0; left:0; width:100%;'
    + 'height:100%; pointer-events:none; color:white;'
    + 'font-family:monospace; font-size:24px; z-index:10'
  });
  const scoreDisplay = Object.assign(document.createElement('h1'), {
    style: 'position:absolute; top:20px; left:50%;'
    + 'transform:translateX(-50%); text-align:center'
  });
  const startButtonStyle = 'position:absolute; top:200px; left:50%;'
    + 'transform:translateX(-50%); text-align:center'
    + 'pointer-events: auto; background-color: transparent;'
    + 'color: white;'
    + 'border: none; font-size: 4em;'
    + 'font-family: monospace;'
  ;

  const startButton = Object.assign(document.createElement('button'), {
    style: startButtonStyle});
  startButton.innerHTML = `Click here`;
  startButton.onclick = () => {
    onStartGame();
    startButton.style = "display: none;";
  }

  canvas.parentNode.insertBefore(container, canvas);
  container.append(canvas, overlay);
  overlay.appendChild(scoreDisplay);
  container.appendChild(startButton);
  function showScore(G) {
    switch (G.state) {
      case STATES.GAME_OVER:
        {
          let winner = G.p1.score > G.p2.score ? G.p1 : G.p2;
          let loser  = G.p1.score < G.p2.score ? G.p1 : G.p2;
          return `${winner.name} wins! ${winner.score} to ${loser.score}`;
        }
      case STATES.START: return `Controls: WS, IK`;
      case STATES.PLAYING: return `${G.p1.score} | ${G.p2.score}`;
    }
  }

  return function updateUI(G) {
    scoreDisplay.textContent = showScore(G);
    if (G.state === STATES.GAME_OVER) startButton.style = "";
  }
}
