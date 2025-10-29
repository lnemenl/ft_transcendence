/*jslint browser */
const createUI = Object.freeze(
    function (canvas, STATES, onStartGame) {
        const container = document.createElement("div");
        Object.assign(container.style, {
            display: "inline-block",
            position: "relative"
        });
        const overlay = document.createElement("div");
        Object.assign(overlay.style, {
            color: "white",
            fontFamily: "monospace",
            fontSize: "24px",
            height: "100%",
            left: "0",
            pointerEvents: "none",
            position: "absolute",
            top: "0",
            width: "100%",
            zIndex: "10"
        });
        const scoreDisplay = document.createElement("h1");
        Object.assign(scoreDisplay.style, {
            left: "50%",
            position: "absolute",
            textAlign: "center",
            top: "20px",
            transform: "translateX(-50%)"
        });
        const startButton = document.createElement("button");
        Object.assign(startButton.style, {
            backgroundColor: "grey",
            border: "1px solid white",
            borderRadius: "7%",
            color: "white",
            fontFamily: "monospace",
            fontSize: "4em",
            left: "50%",
            pointerEvents: "auto",
            position: "absolute",
            textAlign: "center",
            top: "200px",
            transform: "translateX(-50%)"
        });
        startButton.innerHTML = `Begin`;
        startButton.onclick = function () {
            onStartGame();
        };

        canvas.parentNode.insertBefore(container, canvas);
        container.append(canvas, overlay);
        overlay.appendChild(scoreDisplay);
        container.appendChild(startButton);
        function showScore(G) {
            switch (G.state) {
            case STATES.GAME_OVER:
                return showScoreString(G);
            case STATES.START:
                return `Controls: WS, IK`;
            case STATES.PLAYING:
                return `${G.p1.score} | ${G.p2.score}`;
            case STATES.WAITING:
                return (
                    G.countdown > 0
                    ? `${G.countdown}`
                    : "Get ready!"
                );
            }
        }

        return function updateUI(G) {
            scoreDisplay.textContent = showScore(G);
            if (G.state === STATES.START || G.state === STATES.GAME_OVER) {
                startButton.style.display = "block";
            } else {
                startButton.style.display = "none";
            }
            startButton.onclick = () => onStartGame(G);
        };
    }
);

export {createUI};

function showScoreString(G) {
    let winner = G.p1;
    let loser = G.p2;
    if (winner.score < loser.score) {
        [winner, loser] = [loser, winner];
    }
    return `${winner.name} wins! ${winner.score} to ${loser.score}`;
}
