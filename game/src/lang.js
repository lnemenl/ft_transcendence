/*jslint browser*/

function t() {
    const supportedLanguages = ["en", "fi", "fr", "ru"];
    let locale = document.documentElement.lang;
    if (!supportedLanguages.includes(locale)) {
        locale = "en";
    }
    return table[locale];
}

const table = Object.freeze(
    {
        "en": {
            controls: "Controls: WS, IK. Space to begin.",
            player1: "Player 1",
            player2: "Player 2",
            ready: "Get ready!",
            score: (G) => {
                if (G.p1.roundsWon < G.p2.roundsWon) {
                    return `${G.p2.name} wins! ${G.p2.roundsWon} to ${G.p1.roundsWon}.`;
                } else {
                    return `${G.p1.name} wins! ${G.p1.roundsWon} to ${G.p2.roundsWon}.`;
                }
            },
            gameOver: (G) => {
                const winner = G.p1.roundsWon > G.p2.roundsWon ? G.p1.name : G.p2.name;
                return `${winner} wins! ${Math.max(G.p1.roundsWon, G.p2.roundsWon)} to ${Math.min(G.p1.roundsWon, G.p2.roundsWon)}.`;
            }
        },
        "fr": {
            controls: "WS et IK pour bouger, espace lance le jeu.",
            player1: "Joueur 1",
            player2: "Joueur 2",
            ready: "C'est parti !",
            score: (G) => {
                if (G.p1.roundsWon < G.p2.roundsWon) {
                    return `${G.p2.name} l'emporte! ${G.p2.roundsWon} à ${G.p1.roundsWon}.`;
                } else {
                    return `${G.p1.name} l'emporte! ${G.p1.roundsWon} à ${G.p2.roundsWon}.`;
                }
            },
            gameOver: (G) => {
                const winner = G.p1.roundsWon > G.p2.roundsWon ? G.p1.name : G.p2.name;
                return `${winner} l'emporte! ${Math.max(G.p1.roundsWon, G.p2.roundsWon)} à ${Math.min(G.p1.roundsWon, G.p2.roundsWon)}.`;
            }
        },
        "fi": {
            controls: "Ohjaimet: WS, IK. Välilyönti aloittaa.",
            player1: "Pelaaja 1",
            player2: "Pelaaja 2",
            ready: "Valmistaudu!",
            score: (G) => {
                if (G.p1.roundsWon < G.p2.roundsWon) {
                    return `${G.p2.name} voittaa! ${G.p2.roundsWon}–${G.p1.roundsWon}.`;
                } else {
                    return `${G.p1.name} voittaa! ${G.p1.roundsWon}–${G.p2.roundsWon}.`;
                }
            },
            gameOver: (G) => {
                const winner = G.p1.roundsWon > G.p2.roundsWon ? G.p1.name : G.p2.name;
                return `${winner} voittaa! ${Math.max(G.p1.roundsWon, G.p2.roundsWon)}–${Math.min(G.p1.roundsWon, G.p2.roundsWon)}.`;
            }
        },
        "ru": {
            controls: "Управление: WS, IK. Пробел для начала.",
            player1: "Игрок 1",
            player2: "Игрок 2",
            ready: "Приготовьтесь!",
            score: (G) => {
                if (G.p1.roundsWon < G.p2.roundsWon) {
                    return `${G.p2.name} побеждает! ${G.p2.roundsWon}:${G.p1.roundsWon}.`;
                } else {
                    return `${G.p1.name} побеждает! ${G.p1.roundsWon}:${G.p2.roundsWon}.`;
                }
            },
            gameOver: (G) => {
                const winner = G.p1.roundsWon > G.p2.roundsWon ? G.p1.name : G.p2.name;
                return `${winner} побеждает! ${Math.max(G.p1.roundsWon, G.p2.roundsWon)}:${Math.min(G.p1.roundsWon, G.p2.roundsWon)}.`;
            }
        }
    }
);

export {t};
