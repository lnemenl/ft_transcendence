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
            background: "rgba(36, 39, 58, 0.85)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            color: "#cad3f5",
            fontWeight: "bold",
            left: "50%",
            letterSpacing: "0.05em",
            padding: "16px 32px",
            position: "absolute",
            textAlign: "center",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
            top: "20px",
            transform: "translateX(-50%)"
        });

        const nextMatchDisplay = document.createElement("div");
        Object.assign(nextMatchDisplay.style, {
            background: "rgba(36, 39, 58, 0.85)",
            backdropFilter: "blur(10px)",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            color: "#cad3f5",
            display: "none",
            fontWeight: "bold",
            left: "50%",
            letterSpacing: "0.05em",
            padding: "12px 24px",
            position: "absolute",
            textAlign: "center",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
            top: "100px",
            transform: "translateX(-50%)"
        });

        canvas.parentNode.insertBefore(container, canvas);
        container.append(canvas, overlay);
        overlay.appendChild(scoreDisplay);
        overlay.appendChild(nextMatchDisplay);
        function showScore(G, tournament) {
            switch (G.state) {
            case STATES.GAME_OVER:
                return t().gameOver(G);
            case STATES.START:
                if (tournament && tournament.active) {
                    return `${G.p1.name} vs ${G.p2.name}`;
                }
                return t().controls;
            case STATES.PLAYING:
                return `${G.p1.name} ${G.p1.score} | ${G.p2.score} ${G.p2.name}`;
            case STATES.WAITING:
                return (
                    G.countdown > 0
                    ? `${G.countdown}`
                    : t().ready
                );
            }
        }

        return function updateUI(G, tournament) {
            scoreDisplay.textContent = showScore(G, tournament);

            if (tournament && tournament.active && tournament.nextMatch) {
                nextMatchDisplay.style.display = "block";
                nextMatchDisplay.textContent = `Next match: ${tournament.nextMatch.p1} vs ${tournament.nextMatch.p2}`;
            } else {
                nextMatchDisplay.style.display = "none";
            }
        };
    }
);

export {createUI};
