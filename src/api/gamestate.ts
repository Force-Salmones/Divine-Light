import type {
	EnemyPublic,
	PlayerPrivate,
	PlayerPublic,
} from "../shared/protocol/gamestate.js";
import type { AttackEvent } from "../shared/protocol/gamestate.js";

// Authoritative server-side state
export type ServerGameState = {
	players: Record<string, Player>;
	enemies: Enemy[];
	// Players with a selected target will auto attack if in combat
	selectedTargets: Record<string, number | null>;
	lastAttackEvents: AttackEvent[];
};

export type Entity = Player | Enemy;

export type EntityRef = {
	kind: "player" | "enemy";
	id: number;
};

export type Player = PlayerPublic & PlayerPrivate;

export type Enemy = EnemyPublic & EnemyPrivate;

export type EnemyPrivate = {
	experience: number;
	gold: number;
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
	drops: unknown;
	homeX: number;
	homeY: number;
	targetPlayerId?: string | null;
	targetX?: number;
	targetY?: number;
	nextRoamTimeMs: number;
	lastAttackTime: number;
};

export const serverGameState: ServerGameState = {
	players: {},
	enemies: [],
	selectedTargets: {},
	lastAttackEvents: [],
};
