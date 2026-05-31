import { calcDistance } from "@/shared/util/calcDistance";

//automate later
const bankNpcs = [
	{
		x: 500,
		y: 50,
	},
];
//move later
const BANK_RANGE = 50;

export function isInBankRange(playerX: number, playerY: number): boolean {
	for (const bank of bankNpcs) {
		if (calcDistance(playerX, playerY, bank.x, bank.y) <= BANK_RANGE) {
			return true;
		}
	}
	return false;
}
