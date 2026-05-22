import { type Player, serverGameState } from "@/api/gamestate";
import { sendChatToPlayer } from "../chatService";

export function respawnPlayer(player: Player) {
	// For now: treat 0 HP as "death" and instantly respawn.
	sendChatToPlayer(player.id, "You were defeated! Respawning...", true);

	player.x = 970;
	player.y = 374;
	delete player.targetX;
	delete player.targetY;

	// Heal on respawn (prevents getting stuck at 0 HP)
	player.currHealth = player.maxHealth;
	player.currMana = player.maxMana;

	// Stop any server-side auto-attack selection
	serverGameState.selectedTargets[player.id] = null;

	// Drop aggro from enemies currently targeting this player
	for (const enemy of serverGameState.enemies) {
		if (enemy.targetPlayerId === player.id) {
			enemy.targetPlayerId = null;
			enemy.targetX = enemy.homeX;
			enemy.targetY = enemy.homeY;
		}
	}
}
