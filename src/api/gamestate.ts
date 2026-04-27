import { expToLevelUp } from "./gainExperience";

export type AttackEvent = {
    playerId: string;
    enemyId: number;
    damage: number;
    timestamp: number;
    x: number;
    y: number;
    enemyDead: boolean;
};

export type GameState = {
    // Multiplayer primary fields
    players: Record<string, Player>;
    enemies: Enemy[];
    selectedTargets: Record<string, number | null>; // per-player selected enemy
    lastAttackEvents: AttackEvent[]; // log of recent attack events
    selfId?: string; // the playerId for this session (dev only for now)

    // Backward-compatibility aliases for current client
    player: Player; // alias to players[selfId]
    selectedEnemyId: number | null; // alias to selectedTargets[selfId]
    lastAttackResult?: {
        enemyId: number;
        damage: number;
        timestamp: number;
        x: number;
        y: number;
        enemyDead: boolean;
    };
}

export type Player = {
    id: string;
    name: string;
    level: number;
    experience: number;
    expToNextLevel: number;
    gold: number;
    STR: number;
    VIT: number;
    DEX: number;
    LUK: number;
    INT: number;
    WIS: number;
    unallocatedPoints: number;
    maxHealth: number;
    currHealth: number;
    maxMana: number;
    currMana: number;
    defense: number;
    resistance: number;
    x: number;
    y: number;
    sprite: string;
    speed: number;
    attackRange: number;
    attackSpeed: number;
    lastAttackTime: number;
    targetX?: number;
    targetY?: number;
    inventory: {};
}

export type Enemy = {
    id: number; // unique instance ID for this enemy on the map
    mobId: number; //enemy type, corresponds to mobs.json and sprite file
    name: string;
    level: number;
    experience: number;
    gold: number;
    currHealth: number;
    maxHealth: number;
    damage: number;
    damageType: "physical" | "magical" | "true";
    attackSpeed: number;
    attackRange: number;
    defense: number;
    resistance: number;
    speed: number;
    reSpawnTime: number;
    aggressive: boolean;
    retreats: boolean;
    drops: {};
    x: number;
    y: number;
    sprite: string;
}

export let gameState: GameState = {
    players: {},
    enemies: [],
    selectedTargets: {},
    lastAttackEvents: [],
    selfId: undefined,
    // Backward compatibility defaults
    player: {
        id: "",
        name: "",
        level: 1,
        experience: 0,
        expToNextLevel: expToLevelUp(1),
        gold: 0,
        STR: 0,
        VIT: 0,
        DEX: 0,
        LUK: 0,
        INT: 0,
        WIS: 0,
        unallocatedPoints: 0,
        maxHealth: 0,
        currHealth: 0,
        maxMana: 0,
        currMana: 0,
        defense: 0,
        resistance: 0,
        x: 0,
        y: 0,
        sprite: "/assets/player-temp.png",
        speed: 120,
        attackRange: 48,
        attackSpeed: 1,
        lastAttackTime: 0,
        inventory: {}
    },
    selectedEnemyId: null
};