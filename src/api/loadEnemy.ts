import type { Mob } from "@/db/schema";
import type { Enemy } from "./gamestate";

export async function loadEnemy(id: number): Promise<Enemy> {
    const response = await fetch(`/api/mobs/${id}`);
    if (!response.ok) {
        throw new Error(`Failed to load enemy with id ${id}`);
    }
    const dbEnemy: Mob | undefined = await response.json();
    if (!dbEnemy) {
        throw new Error(`Enemy with id ${id} not found`);
    }
    //i need to get the json from ../db/mobs.json and convert it to an Enemy object that can be used in the game. I will also need to set the sprite for the enemy based on its mobId.
    const jsonData = await fetch("/db/mobs.json").then(res => res.json());
    const mobData = jsonData.dbEnemy.mobId;
    const enemy: Enemy = {
        mobId: dbEnemy.mobId,
        name: mobData.name,
        level: mobData.level,
        experience: mobData.experience,
        gold: mobData.gold,
        maxHealth: mobData.health,
        currHealth: mobData.health,
        damage: mobData.damage,
        damageType: mobData.damageType,
        attackSpeed: mobData.attackSpeed,
        attackRange: mobData.attackRange,
        defense: mobData.defense,
        resistance: mobData.resistance,
        speed: mobData.speed,
        reSpawnTime: mobData.reSpawnTime,
        aggressive: mobData.aggressive,
        retreats: mobData.retreats,
        drops: mobData.drops,
        posX: dbEnemy.homeX,
        posY: dbEnemy.homeY
    };
    return enemy;
}