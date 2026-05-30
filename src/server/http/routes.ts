import express, { type Express } from "express";
import type { Request, Response } from "express";
import { config } from "../../config";

import { middlewareLogResponses } from "../middleware";
import { handlerCreateUser } from "./handlers/handlerCreateUser";
import { handlerLogin } from "./handlers/handlerLogin";
import { handlerLogout } from "./handlers/handlerLogout";
import { requireJwtForApp, validateJWT, getJwtFromReq } from "../../auth/jwt";

export function registerHttpRoutes(app: Express) {
	app.use(middlewareLogResponses);
	app.use(express.json());

	app.get("/api/health", (req: Request, res: Response) => {
		res.set("Content-Type", "text/plain");
		res.send("ok");
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
		}),
	);

	// Additional emitted modules used by /app/script.js (tsc output; not bundled)
	app.use(
		"/client",
		requireJwtForApp,
		express.static("./public/client", {
			setHeaders: (res) => {
				res.setHeader("Cache-Control", "no-store");
			},
		}),
	);

	// Shared protocol modules imported by the browser build
	app.use(
		"/shared",
		requireJwtForApp,
		express.static("./public/shared", {
			setHeaders: (res) => {
				res.setHeader("Cache-Control", "no-store");
			},
		}),
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
