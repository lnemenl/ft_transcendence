/*jslint browser */
/*global requestAnimationFrame */

import {createRenderer} from "./render.js";
import {createUI} from "./ui.js";

let g_LAST_TIME_MS = 0;

const canvas = document.getElementById("canvas");
const STATES = Object.freeze({
    GAME_OVER: Symbol("game_over"),
    PLAYING: Symbol("playing"),
    START: Symbol("start"),
    WAITING: Symbol("waiting")
});

const G = {
    ball: {
        acceleration: 0.5,
        diameter: 0.7,
        dir: {
            x: 1,
            z: 0
        },
        speed: 0,
        topSpeed: 15,
        x: 0,
        z: 0
    },
    bestOf: 3,
    countdown: 0,
    height: 15,
    p1: {
        height: 2.6,
        name: "Player 1",
        roundsWon: 0,
        score: 0,
        speed: 20,
        width: 0.2,
        x: 8.5,
        z: 0
    },
    p2: {
        height: 2.6,
        name: "Player 2",
        roundsWon: 0,
        score: 0,
        speed: 20,
        width: 0.2,
        x: -8.5,
        z: 0
    },
    state: STATES.START,
    width: 20,
    winningScore: 11
};

function move(v, u, speed, dt) {
    if (u.x === undefined) {
        u.x = 0;
    }
    if (u.z === undefined) {
        u.z = 0;
    }
    v.x += u.x * speed * dt;
    v.z += u.z * speed * dt;
    return (v);
}

function intersect(ball, p) {
    const W = p.width;
    const H = p.height / 2;
    const x = Math.max(p.x - W, Math.min(ball.x, p.x + W));
    const z = Math.max(p.z - H, Math.min(ball.z, p.z + H));
    const distance = (x - ball.x)**2 + (z - ball.z)**2;
    return distance < (G.ball.diameter / 2) ** 2;
}

function collide(ball, p) {
    if (intersect(ball, p)) {
        ball.dir.x *= -1;
        ball.dir.z = (2 / p.height) * (ball.z - p.z);
        if (ball.speed < ball.topSpeed * 3) {
            ball.speed += ball.acceleration;
        }
    }
}

const keys_down = new Set();
document.addEventListener("keydown", (e) => keys_down.add(e.code));
document.addEventListener("keyup", (e) => keys_down.delete(e.code));

function movePlayers(G, delta_ms, keys_down) {
    if (keys_down.has("KeyW") && G.p1.z > -5) {
        move(G.p1, {z: -1}, G.p1.speed, delta_ms);
    }
    if (keys_down.has("KeyS") && G.p1.z < 5) {
        move(G.p1, {z: 1}, G.p1.speed, delta_ms);
    }
    if (keys_down.has("KeyI") && G.p2.z > -5) {
        move(G.p2, {z: -1}, G.p2.speed, delta_ms);
    }
    if (keys_down.has("KeyK") && G.p2.z < 5) {
        move(G.p2, {z: 1}, G.p2.speed, delta_ms);
    }
}

function update(G, delta_ms, keys_down) {
    switch (G.state) {
    case STATES.WAITING:
        G.p1.roundsWon = 0;
        G.p2.roundsWon = 0;
        G.p1.score = 0;
        G.p2.score = 0;
        movePlayers(G, delta_ms, keys_down);
        break;
    case STATES.PLAYING:
        movePlayers(G, delta_ms, keys_down);
        if (G.ball.dir.x > 0) {
            collide(G.ball, G.p1);
        }
        if (G.ball.dir.x < 0) {
            collide(G.ball, G.p2);
        }
        if (G.ball.speed < G.ball.topSpeed) {
            G.ball.speed += G.ball.acceleration;
        }
        move(G.ball, G.ball.dir, G.ball.speed, delta_ms);
        if (Math.abs(G.ball.z) > 6.3) {
            if (G.ball.dir.z < 0 && G.ball.z < 0) {
                G.ball.dir.z *= -1;
            }
            if (G.ball.dir.z > 0 && G.ball.z > 0) {
                G.ball.dir.z *= -1;
            }
        }
        if (Math.abs(G.ball.x) > G.width / 2) {
            if (G.ball.x < 0) {
                G.p1.score += 1;
            }
            if (G.ball.x > 0) {
                G.p2.score += 1;
            }
            G.ball.speed = 0;
            G.ball.z = 0;
            G.ball.x = 0;
            G.ball.dir.x = (-1) ** (G.p1.score + G.p2.score);
            G.ball.dir.z = 0;
        }
        if (Math.max(G.p1.score, G.p2.score) >= G.winningScore) {
            if (G.p1.score > G.p2.score) {
                G.p1.roundsWon += 1;
            } else {
                G.p2.roundsWon += 1;
            }
            G.p1.score = 0;
            G.p2.score = 0;
        }
        // This logic needs to move to a transition state
        if (Math.max(G.p1.roundsWon, G.p2.roundsWon) >= G.bestOf / 2) {
            G.state = STATES.GAME_OVER;
            // setTimeout(() => G.state = STATES.START, 3000);
            xhrPost("https://echo.free.beeceptor.com", {
                P1: G.p1.roundsWon,
                P2: G.p2.roundsWon
            });
        }
        break;
    case STATES.GAME_OVER:
        break;
    }
}

const render = createRenderer(canvas, G);

function onThree(G) {
    function countdown(G) {
        if (G.countdown === 0) {
            G.state = STATES.PLAYING;
            G.p1.score = 0;
            G.p2.score = 0;
        } else {
            G.countdown -= 1;
            setTimeout(() => countdown(G), 1000);
        }
    }
    G.countdown = 4;
    G.state = STATES.WAITING;
    countdown(G);
}
const updateUI = createUI(canvas, STATES, onThree);
function loop(current_time_ms) {
    const delta_ms = (current_time_ms - g_LAST_TIME_MS) / 1000;
    g_LAST_TIME_MS = current_time_ms;
    update(G, delta_ms, keys_down);
    updateUI(G);
    render(G);
    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);

function xhrPost(url, body) {
    const req = new XMLHttpRequest();
    req.open("POST", url); // Nonblocking by default these days
    req.send(JSON.stringify(body));
}
