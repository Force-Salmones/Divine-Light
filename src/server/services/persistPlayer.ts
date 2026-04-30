import { gameState } from "@/api/gamestate";
import { updateUser } from "@/db/queries/users";


export async function persistPlayer(playerId: string) {
    const player = gameState.players[playerId];
    if (!player) return;
    try {
        await updateUser(
            player.id,
            player.level,
            player.experience,
            player.unallocatedPoints,
            player.STR,
            player.VIT,
            player.DEX,
            player.LUK,
            player.INT,
            player.WIS,
            player.inventory,
            player.gold,
            Math.round(player.x),
            Math.round(player.y)
        );
    } catch (err) {
        console.error("Failed to persist player", playerId, err);
    }
}export async function persistAllPlayers() {
    const ids = Object.keys(gameState.players);
    await Promise.all(ids.map((id) => persistPlayer(id)));
}

