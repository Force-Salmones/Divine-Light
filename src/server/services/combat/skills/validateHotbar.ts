import type { Hotbar } from "@/shared/skills/hotbarSchema";
import { HotbarSchema } from "@/shared/skills/hotbarSchema";
import fs from "node:fs/promises";
import path from "node:path";

export async function validateHotbar(
	hotbar: unknown,
	playerId: string = "unsupplied",
): Promise<Hotbar> {
	const result = HotbarSchema.safeParse(hotbar);
	if (result.success) return result.data;

	const errorLogPath = path.join(
		"logs",
		"errors",
		"hotbar",
		`validation-error-${Date.now().toString()}.log`,
	);

	const hotbarJson = (() => {
		try {
			return JSON.stringify(hotbar, null, 2);
		} catch {
			return String(hotbar);
		}
	})();

	const errorMessage = `
[${new Date().toISOString()}]
Invalid hotbar: ${hotbarJson}
For player: ${playerId}
Error: ${result.error.toString()}\n
`;

	// eslint-disable-next-line security/detect-non-literal-fs-filename
	void fs.writeFile(errorLogPath, errorMessage);

	return createEmptyHotbar();
}

function createEmptyHotbar(): Hotbar {
	return { slots: Array.from({ length: 9 }, () => null) };
}
