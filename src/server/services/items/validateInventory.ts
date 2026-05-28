import type { Inventory } from "../../../shared/items/inventory.js";
import { InventorySchema } from "../../../shared/items/inventorySchema.js";
import fs from "node:fs/promises";
import path from "path";

export async function validateInventory(
	inv: unknown,
	playerId: string = "unsupplied",
): Promise<Inventory> {
	const result = InventorySchema.safeParse(inv);

	if (result.success) {
		return result.data;
	}

	const errorLogPath = path.join(
		"logs",
		"errors",
		"inventory",
		`validation-error-${Date.now().toString()}.log`,
	);

	const invJson = (() => {
		try {
			return JSON.stringify(inv, null, 2);
		} catch {
			return String(inv);
		}
	})();

	const errorMessage = `
        [${new Date().toISOString()}]
        Invalid inventory: ${invJson}
        For player: ${playerId}
        Error: ${result.error.toString()}\n
        `;

	// eslint-disable-next-line security/detect-non-literal-fs-filename
	void fs.writeFile(errorLogPath, errorMessage);

	return createEmptyInventory();
}

function createEmptyInventory(): Inventory {
	return { slots: Array.from({ length: 25 }, () => null) };
}
