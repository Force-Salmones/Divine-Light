import type { NextFunction, Request, Response } from "express";
import { parseCookies } from "./cookies";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { config } from "@/config";


export function getJwtFromReq(req: Request): string | null {
    // Prefer cookie (browser + ws), fall back to Authorization header
    const cookies = parseCookies(req.headers.cookie);
    if (cookies.jwt) return cookies.jwt;

    const auth = req.get("Authorization");
    if (auth && auth.startsWith("Bearer ")) {
        return auth.slice(7);
    }

    return null;
}export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    const timeNow = Math.floor(Date.now() / 1000);
    const payload: payload = {
        iss: "Chirpy",
        sub: userID,
        iat: timeNow,
        exp: timeNow + expiresIn
    };
    return jwt.sign(payload, secret);
}
export type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;
export function validateJWT(tokenString: string, secret: string): string {
    let payload: JwtPayload;
    try {
        payload = jwt.verify(tokenString, secret) as JwtPayload;
    } catch (err) {
        throw new Error("Forbidden");
    }
    return payload.sub!;
}
export function requireJwtForApp(req: Request, res: Response, next: NextFunction) {
    try {
        const token = getJwtFromReq(req);
        if (!token) {
            return res.redirect(302, "/home/");
        }
        const userId = validateJWT(token, config.jwt_secret);
        (req as any).userId = userId;
        return next();
    } catch {
        return res.redirect(302, "/home/");
    }
}
export function requireJwtForApi(req: Request, res: Response, next: NextFunction) {
    try {
        const token = getJwtFromReq(req);
        if (!token) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const userId = validateJWT(token, config.jwt_secret);
        (req as any).userId = userId;
        return next();
    } catch {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }
}

