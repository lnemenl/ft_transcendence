/*jslint browser */
const createUI = Object.freeze(
    function (canvas, STATES) {
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

        canvas.parentNode.insertBefore(container, canvas);
        container.append(canvas, overlay);
        overlay.appendChild(scoreDisplay);
        function showScore(G) {
            switch (G.state) {
            case STATES.GAME_OVER:
                return showScoreString(G);
            case STATES.START:
                return `Controls: WS, IK. Space to begin.`;
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
        };
    }
);

export {createUI};

function showScoreString(G) {
    if (G.p1.roundsWon < G.p2.roundsWon) {
        return `${G.p2.name} wins! ${G.p2.roundsWon} to ${G.p1.roundsWon}`;
    } else {
        return `${G.p1.name} wins! ${G.p1.roundsWon} to ${G.p2.roundsWon}`;
    }
}
