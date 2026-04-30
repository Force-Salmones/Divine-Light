import type { Request, Response, NextFunction } from "express";
import { getUserByEmail } from "../db/queries/users";
import { checkPasswordHash } from "../auth/password";
import { makeJWT } from "@/auth/jwt";
import { config } from "../config";

const JWT_COOKIE_NAME = "jwt";
const JWT_EXPIRES_IN_SECONDS = 60 * 60 * 24; // 24h

export async function handlerLogin(req: Request, res: Response, next: NextFunction) {
    try {
        const { email, password } = req.body as { email?: string; password?: string };
        if (typeof email !== "string" || typeof password !== "string") {
            return res.status(400).json({ success: false, message: "Invalid input" });
        }

        const user = await getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const ok = await checkPasswordHash(password, user.passwordHash);
        if (!ok) {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }

        const token = makeJWT(user.id, JWT_EXPIRES_IN_SECONDS, config.jwt_secret);

        // Set httpOnly cookie for browser + websocket auth
        res.cookie(JWT_COOKIE_NAME, token, {
            httpOnly: true,
            sameSite: "lax",
            secure: req.secure,
            maxAge: JWT_EXPIRES_IN_SECONDS * 1000,
            path: "/",
        });

        return res.json({ success: true });
    } catch (err) {
        console.error("Login error:", err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}
