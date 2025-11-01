/*jslint browser*/
function t() {
    let locale = document.documentElement.lang;
    return table[locale];
}

const table = Object.freeze(
    {
        "en": {
            controls: "Controls: WS, IK. Space to begin.",
            player1: "Player 1",
            player2: "Player 2",
            ready: "Get ready!",
            score: function (G) {
                if (G.p1.roundsWon < G.p2.roundsWon) {
                    return `${G.p2.name} wins! ${G.p2.roundsWon} to ${G.p1.roundsWon}.`;
                } else {
                    return `${G.p1.name} wins! ${G.p1.roundsWon} to ${G.p2.roundsWon}.`;
                }
            }
        },
        "fr": {
            controls: "WS et IK pour bouger, espace lance le jeu.",
            player1: "Joueur 1",
            player2: "Joueur 2",
            ready: "C'est parti !",
            score: function (G) {
                if (G.p1.roundsWon < G.p2.roundsWon) {
                    return `${G.p2.name} l'emporte! ${G.p2.roundsWon} à ${G.p1.roundsWon}.`;
                } else {
                    return `${G.p1.name} l'emporte! ${G.p1.roundsWon} à ${G.p2.roundsWon}.`;
                }
            }
        }
    }
);

export {t};
