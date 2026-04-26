import type { NextFunction, Request, Response } from "express";

export type Middleware = (req: Request, res: Response, next: NextFunction) => void;

export function middlewareLogResponses(req: Request, res: Response, next: NextFunction) {
    res.on("finish", () => {
        const statusCode: number = res.statusCode;
        if (statusCode < 300){
            return;
        } else {
        console.log(`[NON-OK] ${req.method} ${req.url} - Status: ${statusCode}`);
        }
    })
    next();
}