import { createUser } from "../db/queries/users";
import { hashPassword } from "../auth/auth";
import type { Request, Response, NextFunction } from "express";

export async function handlerCreateUser(req: Request, res: Response, next: NextFunction) {
    const { name, email, password } = req.body;

    if (typeof name === "string" && typeof email === "string" && typeof password === "string") {
        try {
            const passwordHash = await hashPassword(password);
            const newUser = await createUser(name, email, passwordHash);
            res.json({ success: true, user: newUser });
        } catch (error) {
            console.error("Error creating user:", error);
            res.status(500).json({ success: false, message: "Internal server error" });
        }
    } else {
        res.status(400).json({ success: false, message: "Invalid input data" });
    }
}