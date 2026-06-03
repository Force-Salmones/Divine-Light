import type { Bank } from "@/shared/items/inventory";
import { BankSchema } from "@/shared/items/inventorySchema";
import fs from "node:fs/promises";
import path from "path";

export async function validateBank(
	bank: unknown,
	playerId: string = "unsupplied",
): Promise<Bank> {
	const result = BankSchema.safeParse(bank);

	if (result.success) {
		return result.data;
	}

	const errorLogPath = path.join(
		"logs",
		"errors",
		"bank",
		`validation-error-${Date.now().toString()}.log`,
	);

	const bankJson = (() => {
		try {
			return JSON.stringify(bank, null, 2);
		} catch {
			return String(bank);
		}
	})();

	const errorMessage = `
        [${new Date().toISOString()}]
        Invalid bank: ${bankJson}
        For player: ${playerId}
        Error: ${result.error.toString()}\n
        `;

	// eslint-disable-next-line security/detect-non-literal-fs-filename
	void fs.writeFile(errorLogPath, errorMessage);

	return createEmptyBank();
}

function createEmptyBank(): Bank {
	return { slots: Array.from({ length: 98 }, () => null) };
}
