import { hashPassword } from "@/auth/password";
import { createUser } from "@/db/queries/users";
import type { Request, Response } from "express";

export async function handlerCreateUser(req: Request, res: Response) {
	const { name, email, password } = req.body;

	if (
		typeof name === "string" &&
		typeof email === "string" &&
		typeof password === "string"
	) {
		try {
			const passwordHash = await hashPassword(password);
			await createUser(name, email, passwordHash);
			res.json({ success: true, user: { name, email } });
		} catch (error) {
			console.error("Error creating user:", error);
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	} else {
		res.status(400).json({ success: false, message: "Invalid input data" });
	}
}
