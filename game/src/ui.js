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
            background: "rgba(36, 39, 58, 0.95)",
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
            background: "rgba(36, 39, 58, 0.95)",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "16px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            color: "#cad3f5",
            display: "none",
            fontSize: "18px",
            fontWeight: "bold",
            letterSpacing: "0.05em",
            padding: "8px 16px",
            position: "absolute",
            right: "20px",
            textAlign: "left",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
            top: "20px"
        });

        canvas.parentNode.insertBefore(container, canvas);
        container.append(canvas, overlay);
        overlay.appendChild(scoreDisplay);
        overlay.appendChild(nextMatchDisplay);

        let lastNextMatchText = "";

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

        return function updateUI(G, tournament, ctx) {
            scoreDisplay.textContent = showScore(G, tournament);

            if (tournament && tournament.active && tournament.currentMatch < 2) {
                const nextMatchIdx = tournament.currentMatch + 1;
                const nextMatch = tournament.matches[nextMatchIdx];

                if (nextMatch) {
                    let p1Name = "?";
                    let p2Name = "?";

                    if (nextMatch.p1Idx !== null) {
                        p1Name = ctx.players[nextMatch.p1Idx].name;
                    } else if (nextMatchIdx === 2 && tournament.matches[0].winner !== null) {
                        p1Name = ctx.players[tournament.matches[0].winner].name;
                    }

                    if (nextMatch.p2Idx !== null) {
                        p2Name = ctx.players[nextMatch.p2Idx].name;
                    } else if (nextMatchIdx === 2 && tournament.matches[1].winner !== null) {
                        p2Name = ctx.players[tournament.matches[1].winner].name;
                    }

                    const nextMatchText = `Next: ${p1Name} vs ${p2Name}`;
                    if (lastNextMatchText !== nextMatchText) {
                        nextMatchDisplay.style.display = "block";
                        nextMatchDisplay.textContent = nextMatchText;
                        lastNextMatchText = nextMatchText;
                    }
                } else {
                    if (lastNextMatchText !== "") {
                        nextMatchDisplay.style.display = "none";
                        lastNextMatchText = "";
                    }
                }
            } else {
                if (lastNextMatchText !== "") {
                    nextMatchDisplay.style.display = "none";
                    lastNextMatchText = "";
                }
            }
        };
    }
);

export {createUI};
