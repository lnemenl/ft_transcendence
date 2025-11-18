/*jslint browser */
import {t} from "./lang.js";

const createUI = Object.freeze(
    (canvas, STATES) => {
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

        // Game Over UI
        const gameOverContainer = document.createElement("div");
        Object.assign(gameOverContainer.style, {
            display: "none",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "auto",
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: "40px",
            borderRadius: "20px",
            gap: "20px"
        });

        const gameOverText = document.createElement("h2");
        Object.assign(gameOverText.style, {
            fontSize: "36px",
            margin: "0"
        });

        const buttonContainer = document.createElement("div");
        Object.assign(buttonContainer.style, {
            display: "flex",
            gap: "20px"
        });

        const playAgainButton = document.createElement("button");
        playAgainButton.textContent = "Play Again";
        Object.assign(playAgainButton.style, {
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontWeight: "bold"
        });
        playAgainButton.onmouseover = () => playAgainButton.style.backgroundColor = "#45a049";
        playAgainButton.onmouseout = () => playAgainButton.style.backgroundColor = "#4CAF50";

        const quitButton = document.createElement("button");
        quitButton.textContent = "Quit";
        Object.assign(quitButton.style, {
            padding: "15px 30px",
            fontSize: "18px",
            backgroundColor: "#f44336",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontFamily: "monospace",
            fontWeight: "bold"
        });
        quitButton.onmouseover = () => quitButton.style.backgroundColor = "#da190b";
        quitButton.onmouseout = () => quitButton.style.backgroundColor = "#f44336";

        buttonContainer.append(playAgainButton, quitButton);
        gameOverContainer.append(gameOverText, buttonContainer);

        canvas.parentNode.insertBefore(container, canvas);
        container.append(canvas, overlay);
        overlay.append(scoreDisplay, gameOverContainer);
        
        function showScore(G) {
            switch (G.state) {
            case STATES.GAME_OVER:
                return "";
            case STATES.START:
                return t().controls;
            case STATES.PLAYING:
                return `${G.p1.score} | ${G.p2.score}`;
            case STATES.WAITING:
                return (
                    G.countdown > 0
                    ? `${G.countdown}`
                    : t().ready
                );
            }
        }

        return function updateUI(G) {
            scoreDisplay.textContent = showScore(G);
            
            // Show/hide game over screen
            if (G.state === STATES.GAME_OVER) {
                gameOverContainer.style.display = "flex";
                gameOverText.textContent = t().score(G);
            } else {
                gameOverContainer.style.display = "none";
            }
            
            return { playAgainButton, quitButton };
        };
    }
);

export {createUI};
