import type { User } from "../db/schema";
import type { Player } from "./gamestate";
import { getUserByEmail, getUserById } from "../db/queries/users";

export async function loadPlayer(playerId: string): Promise<Player | null> {
    const dbUser: User | undefined = await getUserById(playerId);
    if (!dbUser) {
        throw new Error("Player not found");
    }
    const player: Player = {
        id: dbUser.id,
        name: dbUser.name,
        level: dbUser.level,
        experience: dbUser.experience,
        gold: dbUser.gold,
        STR: dbUser.baseSTR,
        VIT: dbUser.baseVIT,
        DEX: dbUser.baseDEX,
        LUK: dbUser.baseLUK,
        INT: dbUser.baseINT,
        WIS: dbUser.baseWIS,
        maxHealth: calcHealth(dbUser),
        currHealth: calcHealth(dbUser),
        maxMana: calcMana(dbUser),
        currMana: calcMana(dbUser),
        defense: Math.max(calcDefense(dbUser), 0),
        resistance: Math.max(calcResistance(dbUser), 0),
        x: dbUser.posX,
        y: dbUser.posY,
        sprite: "/assets/player-temp.png",
        speed: 100,
        attackRange: 50,
        attackSpeed: 1,
        lastAttackTime: 0,
        inventory: dbUser.inventory ?? { equipment: {}, items: {} }
    };
    return player;
}

function calcHealth(user: User): number {
    const level = user.level;
    return Math.floor(level**1.7 / 3) + level + 9 + 
        user.baseVIT * (5 + Math.floor(level / 5)) +
        user.baseSTR * (3 + Math.floor(level / 10)) +
        user.baseDEX * (1 + Math.floor(level / 20)) +
        user.baseWIS * (1 + Math.floor(level / 15));
}

function calcMana(user: User): number {
    const level = user.level;
    return Math.floor(level**2 / 15) + level + 9 +
        user.baseINT * (5 + Math.floor(level / 5)) +
        user.baseWIS * (3 + Math.floor(level / 10));
}

function calcDefense(user: User): number {
    const level = user.level;
    return (Math.floor(level**1.2 / 10) + 
        user.baseVIT * (1.5 + Math.floor(level / 30)) +
        user.baseSTR * (1 + Math.floor(level / 40)) +
        user.baseDEX * (1 + Math.floor(level / 50))) * .5 - 10;
}

function calcResistance(user: User): number {
    const level = user.level;
    return (Math.floor(level**1.1 / 10) + 
        user.baseWIS * (1.5 + Math.floor(level / 30)) +
        user.baseINT * (1 + Math.floor(level / 40)) +
        user.baseLUK * (1 + Math.floor(level / 50))) * .5 - 10;
}