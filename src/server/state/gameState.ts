import type { MobDropsDef } from "../../shared/mobs/mobTypes.js";
import type {
	AttackEvent,
	EnemyPublic,
	GroundItem,
	PlayerPrivate,
	PlayerPublic,
} from "../../shared/protocol/gamestate";

// Authoritative server-side state

export type ServerGameState = {
	players: Record<string, Player>;
	enemies: Enemy[];
	groundItems: Map<string, GroundItem>;
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
	respawnTime: number;
	aggressive: boolean;
	retreats: boolean;
	drops: MobDropsDef;
	homeX: number;
	homeY: number;
	targetPlayerId?: string | null;
	targetX?: number;
	targetY?: number;
	nextRoamTimeMs: number;
	lastAttackTime: number;
};

export type Enemy = EnemyPublic & EnemyPrivate;

export const serverGameState: ServerGameState = {
	players: {},
	enemies: [],
	groundItems: new Map(),
	selectedTargets: {},
	lastAttackEvents: [],
};
