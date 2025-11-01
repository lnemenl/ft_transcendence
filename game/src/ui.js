/*jslint browser */
import {t} from "./lang.js";

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
                return t().score(G);
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
        };
    }
);

export {createUI};
