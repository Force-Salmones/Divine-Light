import argon2, { verify } from "argon2"
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import type { Request } from "express";

export async function hashPassword(password: string) {
    return await argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string) {
    return verify(hash, password);
}

type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

export function makeJWT(userID: string, expiresIn: number, secret: string): string {
    const timeNow = Math.floor(Date.now() / 1000);
    const payload: payload = {
        iss: "Chirpy",
        sub: userID,
        iat: timeNow,
        exp: timeNow + expiresIn
    }
    return jwt.sign(payload, secret);
}

export function validateJWT(tokenString: string, secret: string): string {
    let payload: JwtPayload;
    try{
        payload = jwt.verify(tokenString, secret) as JwtPayload;
    } catch (err) {
        throw new Error("Forbidden");
    }
    return payload.sub!;
}

export function getBearerToken(req: Request): string {
    const token =  req.get("Authorization");
    if (!token) {
        throw new Error("Bad Request");
    }
    return token.slice(7);
}