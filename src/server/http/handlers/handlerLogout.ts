import type { Request, Response } from "express";

export const JWT_COOKIE_NAME = "jwt";
export async function handlerLogout(req: Request, res: Response) {
	try {
		res.clearCookie(JWT_COOKIE_NAME, { path: "/" });
		return res.json({ success: true });
	} catch (err) {
		console.error("Logout error:", err);
		return res
			.status(500)
			.json({ success: false, message: "Internal server error" });
	}
}
