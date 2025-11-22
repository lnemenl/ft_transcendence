function getGameContext() {
    return window.gameContext || null;
}

function initTournament(ctx) {
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
        })
        .catch(err => console.error('Failed to create tournament:', err));
}

function reportGameResult(winner, tournament) {
    const ctx = getGameContext();
    if (!ctx) return;

    if (tournament.active) {
        const m = tournament.matches[tournament.currentMatch];
        fetch("/api/tournament/game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
                winner,
                players: [ctx.players[m.p1Idx].id, ctx.players[m.p2Idx].id],
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

function finalizeTournament(winnerId) {
    const ctx = getGameContext();
    if (!ctx || !ctx.tournamentId) return;

    fetch(`/api/tournament/${ctx.tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ winner: winnerId })
    })
        .then(res => res.json())
        .then(data => console.log('Tournament finalized:', data))
        .catch(err => console.error('Failed to finalize tournament:', err));
}

export {getGameContext,initTournament,reportGameResult,finalizeTournament};
