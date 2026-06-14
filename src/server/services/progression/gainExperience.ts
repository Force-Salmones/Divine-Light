import { recalcPlayerDerivedStats } from "./recalcPlayerStats";
import { sendChatToPlayer } from "@/server/chatService";
import type { Player } from "@/server/state/gameState";

export function gainExperience(player: Player, amount: number): void {
	player.experience += amount;

	// Check for level up
	while (player.experience >= expToLevelUp(player.level)) {
		player.experience -= expToLevelUp(player.level);
		player.level += 1;
		player.expToNextLevel = expToLevelUp(player.level);
		player.unallocatedPoints += 5; // Award 5 stat points per level

		// Derived stats scale with level; keep HP/MP proportion and clamp.
		recalcPlayerDerivedStats(player);

		// UI effect (broadcast to all clients via snapshots)
		player.lastLevelUp = {
			level: player.level,
			timestamp: Date.now(),
		};

		sendChatToPlayer(
			player.id,
			`Congratulations! You've reached level ${player.level}! You have ${player.unallocatedPoints} unallocated stat points.`,
			true,
		);
	}
}
export function expToLevelUp(level: number): number {
	return Math.floor(100 * 1.1 ** (level - 1));
}
