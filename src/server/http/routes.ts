import express, { type Express } from "express";
import type { Request, Response } from "express";
import { config } from "../../config";
import { gameState } from "../../api/gamestate";
import { makeGameStateSnapshot } from "../../api/makeSnapshot";

import { loadPlayer } from "../../api/loadPlayer";
import { middlewareLogResponses } from "../middleware";
import { handlerCreateUser } from "../../api/handlerCreateUser";
import { handlerLogin } from "../../api/handlerLogin";
import { handlerLogout } from "../../api/handlerLogout";
import { requireJwtForApi, requireJwtForApp, validateJWT, getJwtFromReq } from "../../auth/jwt";

export function registerHttpRoutes(app: Express) {
    app.use(middlewareLogResponses);
    app.use(express.json());

    app.get("/api/health", (req: Request, res: Response) => {
        res.set("Content-Type", "text/plain");
        res.send("ok");
    });

    app.get("/api/game-state", requireJwtForApi, async (req: Request, res: Response) => {
        const userId = (req as any).userId as string;

        // Ensure player is loaded (supports refreshing the page without a WS connection yet)
        let player = gameState.players[userId];
        if (!player) {
            player = await loadPlayer(userId);
            if (player) {
                gameState.players[userId] = player;
                gameState.selectedTargets[userId] = null;
            }
        }

        if (!player) {
            return res.status(404).json({ success: false, message: "Player not found" });
        }

        return res.json({ gameState: makeGameStateSnapshot(userId) });
    });

app.post("/api/create-user", handlerCreateUser);

    app.post("/api/login", handlerLogin);
    app.post("/api/logout", handlerLogout);

    // Require auth to load the game client
    // Disable caching in dev to avoid one client running stale JS while another runs fresh JS.
    app.use(
        "/app",
        requireJwtForApp,
        express.static("./public/app", {
            setHeaders: (res) => {
                res.setHeader("Cache-Control", "no-store");
            },
        })
    );
    app.use("/home", express.static("./public/home"));
    app.use("/signup", express.static("./public/home/signup"));
    app.use("/login", express.static("./public/home/auth"));
    app.use("/assets", express.static("./assets"));

    // For convenience, redirect root to /app if logged in, otherwise /home
    app.get("/", (req: Request, res: Response) => {
        try {
            const token = getJwtFromReq(req);
            if (!token) {
                return res.redirect(302, "/home/");
            }
            validateJWT(token, config.jwt_secret);
            return res.redirect(302, "/app/");
        } catch {
            return res.redirect(302, "/home/");
        }
});
}