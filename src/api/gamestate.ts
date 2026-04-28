export type AttackEvent = {
    playerId: string;
    enemyId: number;
    damage: number;
    timestamp: number;
    x: number;
    y: number;
    enemyDead: boolean;
};

export type AttackResult = {
    enemyId: number;
    damage: number;
    timestamp: number;
    x: number;
    y: number;
    enemyDead: boolean;
};

export type IncomingHit = {
    damage: number;
    timestamp: number;
    x: number;
    y: number;
};

export type LevelUpEvent = {
    level: number;
    timestamp: number;
};

// Authoritative server-side state (shared across all clients)
export type ServerGameState = {
    players: Record<string, Player>;
    enemies: Enemy[];
    selectedTargets: Record<string, number | null>; // per-player selected enemy
    lastAttackEvents: AttackEvent[]; // log of recent attack events
};

// Per-client snapshot sent over WS / HTTP.
// Includes backward-compat fields (player, selectedEnemyId, etc) derived from the authoritative state.
export type GameStateSnapshot = ServerGameState & {
    selfId: string;
    player: Player;
    selectedEnemyId: number | null;
    lastAttackResult?: AttackResult;
    lastIncomingHit?: IncomingHit;
};

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

    // Per-player UI events (so multiple concurrent clients don't stomp each other)
    lastAttackResult?: AttackResult;
    lastIncomingHit?: IncomingHit;
    lastLevelUp?: LevelUpEvent;
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
    // Home position used for leash / return behavior
    homeX: number;
    homeY: number;
    // The current player this enemy is focused on, if any
    targetPlayerId?: string | null;
    // Optional movement target when chasing or returning home
    targetX?: number;
    targetY?: number;

    // Roaming: next time (ms) we may pick a random point near home
    nextRoamTimeMs: number;

    // Last time this enemy performed an attack (seconds since epoch)
    lastAttackTime: number;
    sprite: string;
}

export const gameState: ServerGameState = {
    players: {},
    enemies: [],
    selectedTargets: {},
    lastAttackEvents: [],
};