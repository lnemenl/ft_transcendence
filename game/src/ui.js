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
        const playAgainButton = document.createElement("a");
        Object.assign(playAgainButton.style, {
            display: "none",
            background: "rgba(36, 39, 58, 0.95)",
            border: "2px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "20px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            color: "#cad3f5",
            fontWeight: "bold",
            left: "50%",
            letterSpacing: "0.05em",
            padding: "8px 16px",
            pointerEvents: "auto",
            position: "absolute",
            textAlign: "center",
            textShadow: "0 2px 8px rgba(0, 0, 0, 0.5)",
            transform: "translate(-50%,500%)",
            top: "20px",
        });
        playAgainButton.textContent = "Play Again";
        playAgainButton.href = "https://localhost:4430";

        canvas.parentNode.insertBefore(container, canvas);
        container.append(canvas, overlay);
        overlay.appendChild(scoreDisplay);
        overlay.appendChild(nextMatchDisplay);
        overlay.appendChild(playAgainButton);

        let lastNextMatchText = "";

        function showScore(G, tournament, ctx) {
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
            case STATES.TOURNAMENT_OVER:
                if (tournament && tournament.active) {
                    const championName = ctx.players[tournament.matches[2].winner].name;
                    return t().tournamentOver(championName);
                }
                return t().gameOver(G);
            case STATES.WAITING:
                return (
                    G.countdown > 0
                    ? `${G.countdown}`
                    : t().ready
                );
            }
        }

        return function updateUI(G, tournament, ctx) {
            scoreDisplay.textContent = showScore(G, tournament, ctx);

            if (G.state === STATES.TOURNAMENT_OVER) {
                playAgainButton.style.display = "block";
            } else if (G.state === STATES.GAME_OVER
                && ctx.mode !== "tournament") {
                playAgainButton.style.display = "block";
            }
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

                    const nextMatchText = `${t().next} ${p1Name} vs ${p2Name}`;
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
