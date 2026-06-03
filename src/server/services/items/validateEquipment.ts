import type { Equipment } from "@/shared/items/inventory";
import { EquipmentSchema } from "@/shared/items/inventorySchema";
import fs from "node:fs/promises";
import path from "path";

export async function validateEquipment(
	equipment: unknown,
	playerId: string = "unsupplied",
): Promise<Equipment> {
	const result = EquipmentSchema.safeParse(equipment);

	if (result.success) {
		return result.data;
	}

	const errorLogPath = path.join(
		"logs",
		"errors",
		"equipment",
		`validation-error-${Date.now().toString()}.log`,
	);

	const equipmentJson = (() => {
		try {
			return JSON.stringify(equipment, null, 2);
		} catch {
			return String(equipment);
		}
	})();

	const errorMessage = `
        [${new Date().toISOString()}]
        Invalid equipment: ${equipmentJson}
        For player: ${playerId}
        Error: ${result.error.toString()}\n
        `;

	// eslint-disable-next-line security/detect-non-literal-fs-filename
	void fs.writeFile(errorLogPath, errorMessage);

	return createEmptyEquipment();
}

function createEmptyEquipment(): Equipment {
	return { weapon: null, charm: null };
}
