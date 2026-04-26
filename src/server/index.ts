import express from "express";
import type { Request, Response } from "express";
import { config } from "../config";
import { handlerMovePlayer } from "../api/handlerMovePlayer";
import { handlerAttackEnemy } from "../api/handlerAttackEnemy";
import { updateServerMovement, updateAutomaticAttack } from "./updateServerMovement";
import { gameState } from "../api/gamestate";
import { middlewareLogResponses } from "./middleware";
import { handlerCreateUser } from "../api/handlerCreateUser";

const app = express();

const TICK_INTERVAL_MS = 100;
let lastTick = Date.now();

setInterval(() => {
    const now = Date.now();
    const deltaSeconds = (now - lastTick) / 1000;
    lastTick = now;
    updateServerMovement(deltaSeconds);
    updateAutomaticAttack();
}, TICK_INTERVAL_MS);

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

app.listen(+config.server_port, () => {
    console.log(`Server is running on port ${config.server_port}`);
});