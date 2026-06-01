import type { Player } from "@/server/state/gameState";

export function applyUseEffect(effectId: string, player: Player) {
	switch (effectId) {
		case "healthPotionSwig": {
			player.currHealth = Math.min(
				player.maxHealth,
				player.currHealth + 100,
			);
			return;
		}
		default: {
			console.warn(`Invalid effectId: ${effectId}`);
			return;
		}
	}
}
