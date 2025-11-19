function getGameContext() {
    return window.gameContext || null;
}

function initTournament(ctx) {
    console.log('Game mode:', ctx.mode);  // 'tournament' or 'multiplayer'
    console.log('Players:', ctx.players);  // Array of {id, name}
    console.log('Total players:', ctx.totalPlayers);
    console.log('Current player index:', ctx.currentPlayerIndex);
    console.log('Ready:', ctx.ready);

    // Initialize tournament if needed
    if (ctx.mode === "tournament" && !ctx.tournamentId && ctx.players.length === 4) {
        const participantIds = ctx.players.map(p => p.id);
        fetch("/api/tournament", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ participants: participantIds })
        })
            .then(res => res.json())
            .then(data => {
                ctx.tournamentId = data.tournamentId;
                console.log('Tournament created:', ctx.tournamentId);
            })
            .catch(err => console.error('Failed to create tournament:', err));
    }
}

function reportGameResult(winner) {
    const ctx = getGameContext();
    if (!ctx) return;

    if (ctx.mode === "tournament") {
        fetch("/api/tournament/game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                winner,
                players: [ctx.players[0].id, ctx.players[1].id],
                tournamentId: ctx.tournamentId
            })
        })
            .then(res => res.json())
            .then(data => console.log('Tournament game result reported:', data))
            .catch(err => console.error('Failed to report tournament result:', err));
    } else {
        fetch("/api/games", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ winner })
        })
            .then(res => res.json())
            .then(data => console.log('Game result reported:', data))
            .catch(err => console.error('Failed to report game result:', err));
    }
}

export {getGameContext,initTournament,reportGameResult};
