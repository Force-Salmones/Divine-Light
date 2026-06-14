import type { PlayerPublic } from "@/shared/protocol/gamestate";
import type { Player } from "../state/gameState";

export function playerToPublic(player: Player): PlayerPublic {
	return {
		id: player.id,
		name: player.name,
		level: player.level,
		x: player.x,
		y: player.y,
		sprite: player.sprite,
		currHealth: player.currHealth,
		maxHealth: player.maxHealth,
		currMana: player.currMana,
		maxMana: player.maxMana,
		size: player.size,
		activeEffects: player.activeEffects ?? [],
	};
}
