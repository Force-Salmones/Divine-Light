import { calcDistance } from "@/shared/util/calcDistance";
import { populateBankerList } from "../services/npcs/npcRegistry";

//move later
const BANK_RANGE = 50;

export function isInBankRange(playerX: number, playerY: number): boolean {
	const bankNpcs = populateBankerList();
	for (const bank of bankNpcs) {
		if (calcDistance(playerX, playerY, bank.x, bank.y) <= BANK_RANGE) {
			return true;
		}
	}
	return false;
}
