import type { Player } from "@/server/state/gameState";

export function applyUseEffect(effectId: string, player: Player) {
	switch (effectId) {
		case "healthPotionSwig": {
			player.currHealth = Math.min(
				player.maxHealth,
				player.currHealth + 100,
			);
			console.log(player.maxHealth, player.currHealth);
			return;
		}
		default: {
			console.warn(`Invalid effectId: ${effectId}`);
			return;
		}
	}
}
