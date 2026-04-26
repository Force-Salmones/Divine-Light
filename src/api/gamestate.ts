export type GameState = {
    players: Player[];
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
    //mobId is the type of enemy defined in ../db/mobs.json
    //the mobId of the enemy is also the filename of the sprite for the enemy in ../assets/mobs/
    mobId: number;
    name: string;
    level: number;
    experience: number;
    gold: number;
    maxHealth: number;
    currHealth: number;
    damage: number;
    damageType: "physical" | "magical" | "true";
    attackSpeed: number;
    attackRange: number;
    defense: number;
    resistance: number;
    speed: number;
    reSpawnTime: number;
    aggressive: true;
    retreats: false;
    drops: {};
    posX: number;
    posY: number;
}

export let gameState: GameState = {
    players: [],
    enemies: [],
    selectedEnemyId: null
};