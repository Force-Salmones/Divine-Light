import { serverGameState } from "../state/gameState";
import { updateUser } from "@/db/queries/users";
import { getPlayerFromId } from "../util/getPlayerFromId";

export async function persistPlayer(playerId: string) {
	const player = getPlayerFromId(playerId);
	if (!player) return;
	try {
		await updateUser(
			player.id,
			player.level,
			player.experience,
			player.unallocatedPoints,
			player.baseStats.STR,
			player.baseStats.VIT,
			player.baseStats.DEX,
			player.baseStats.LUK,
			player.baseStats.INT,
			player.baseStats.WIS,
			player.currHealth,
			player.currMana,
			player.inventory,
			player.bank,
			player.equipment,
			player.gold,
			Math.round(player.x),
			Math.round(player.y),
		);
	} catch (err) {
		console.error("Failed to persist player", playerId, err);
	}
}
export async function persistAllPlayers() {
	const ids = Object.keys(serverGameState.players);
	await Promise.all(ids.map((id) => persistPlayer(id)));
}
