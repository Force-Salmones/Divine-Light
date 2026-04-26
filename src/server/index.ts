import express from "express";
import type { Request, Response } from "express";
import { config } from "../config";
import { handlerMovePlayer } from "../api/handlerMovePlayer";
import { handlerAttackEnemy } from "../api/handlerAttackEnemy";
import { updateServerMovement, updateAutomaticAttack } from "./updateServerMovement";
import { gameState } from "../api/gamestate";

import { loadPlayer } from "../api/loadPlayer";
import { loadEnemy } from "../api/loadEnemy";
import { conn } from "../db/index.js";
import { middlewareLogResponses } from "./middleware";
import { handlerCreateUser } from "../api/handlerCreateUser";

const app = express();

const TICK_INTERVAL_MS = 100;
let lastTick = Date.now();

function startTickLoop() {
    setInterval(() => {
        const now = Date.now();
        const deltaSeconds = (now - lastTick) / 1000;
        lastTick = now;
        updateServerMovement(deltaSeconds);
        updateAutomaticAttack();
    }, TICK_INTERVAL_MS);
}

async function initializeGameState() {
    const player = await loadPlayer("536b2e83-2a1a-4b80-b264-d18be01be7c5");
    if (!player) {
        throw new Error("Failed to load the default player from the database");
    }

    const enemy = await loadEnemy(0);

    // Initialize multiplayer-aware state
    gameState.players[player.id] = player;
    gameState.selfId = player.id; // dev only; single session controls this player
    gameState.enemies = [enemy];

    // Back-compat aliases for current client
    gameState.player = player;
    gameState.selectedTargets[player.id] = null;
    gameState.selectedEnemyId = null;
}

async function startServer() {
    await initializeGameState();
    startTickLoop();
    app.listen(+config.server_port, () => {
        console.log(`Server is running on port ${config.server_port}`);
    });
}

app.use(middlewareLogResponses);
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
    res.set('Content-Type', 'text/plain');
    res.send("ok");
});

app.get("/api/game-state", (req: Request, res: Response) => {
    res.json({
        gameState
    });
});

app.post("/api/create-user", handlerCreateUser);

app.post("/api/move-player", handlerMovePlayer);

app.post("/api/attack-enemy", handlerAttackEnemy);

app.use("/app", express.static("./public/app"));
app.use("/home", express.static("./public/home"));
app.use("/signup", express.static("./public/home/signup"));
app.use("/assets", express.static("./assets"));

// For convenience, redirect root to /app (serves index.html)
app.get("/", (req: Request, res: Response) => {
    res.redirect(302, "/app/");
});

void startServer().catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
});