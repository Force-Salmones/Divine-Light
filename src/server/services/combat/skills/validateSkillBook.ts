import type { SkillId } from "@/shared/skills/skillTypes";
import fs from "node:fs/promises";
import path from "node:path";
import { SkillBookSchema } from "@/shared/skills/skillBookSchema";

export type SkillBook = Record<SkillId, number>;

export async function validateSkillBook(
	skillBook: unknown,
	playerId: string = "unsupplied",
): Promise<SkillBook> {
	const result = SkillBookSchema.safeParse(skillBook);
	if (result.success) return result.data;

	const errorLogPath = path.join(
		"logs",
		"errors",
		"skillBook",
		`validation-error-${Date.now().toString()}.log`,
	);

	const json = (() => {
		try {
			return JSON.stringify(skillBook, null, 2);
		} catch {
			return String(skillBook);
		}
	})();

	const errorMessage = `
[${new Date().toISOString()}]
Invalid skillBook: ${json}
For player: ${playerId}
Error: ${result.error.toString()}\n
`;

	// eslint-disable-next-line security/detect-non-literal-fs-filename
	void fs.writeFile(errorLogPath, errorMessage);

	return {};
}
