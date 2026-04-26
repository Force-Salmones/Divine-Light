export type GameState = {
    player: Player;
    enemies: Enemy[];
    selectedEnemyId: number | null;
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
    gold: number;
    STR: number;
    VIT: number;
    DEX: number;
    LUK: number;
    INT: number;
    WIS: number;
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
    id: number;
    // mobId is the enemy type defined in ../db/mobs.json
    // the mobId is also the filename of the sprite for the enemy in ../assets/mobs/
    mobId: number;
    name: string;
    level: number;
    experience: number;
    gold: number;
    health: number;
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
    player: {
        id: "",
        name: "",
        level: 1,
        experience: 0,
        gold: 0,
        STR: 0,
        VIT: 0,
        DEX: 0,
        LUK: 0,
        INT: 0,
        WIS: 0,
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
    enemies: [],
    selectedEnemyId: null
};