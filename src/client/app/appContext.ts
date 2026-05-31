/**
 * Defines the AppContext object used throughout the modular client.
 *
 * The AppContext is a dependency container (canvas, rendering utilities, state store, services).
 * Passing it (or small subsets of it) keeps module dependencies explicit and prevents hidden globals.
 */

import type { Viewport } from "./render/viewport.js";
import type { ClientStore } from "./state/store.js";
import type { SpriteCache } from "./assets/spriteCache.js";
import type { FloatingTextManager } from "./effects/floatingText.js";
import type { WsClient } from "./net/wsClient.js";
import type { ChatUI } from "./ui/chat.js";
import type { StatsPanelUI } from "./ui/statsPanel.js";
import type { OptionsPanelUI } from "./ui/optionsPanel.js";
import type { InventoryPanelUI } from "./ui/inventoryPanel.js";
import type { BankPanelUI } from "./ui/bankPanel.js";

export type AppContext = {
	/** The game canvas element. */
	canvas: HTMLCanvasElement;

	/** Canvas 2D rendering context. */
	ctx: CanvasRenderingContext2D;

	/** Background world image. */
	worldImage: HTMLImageElement;

	/** Viewport transform information (letterboxing / world->screen transform). */
	viewport: Viewport;

	/** Client-side state (latest snapshot + selection + toggles + dedupe baselines). */
	store: ClientStore;

	/** Sprite cache for player/enemy images. */
	sprites: SpriteCache;

	/** Floating text effect manager. */
	floatingText: FloatingTextManager;

	/** WebSocket client (send queue + reconnect). */
	ws: WsClient;

	/** DOM UI overlays. */
	ui: {
		chat: ChatUI;
		stats: StatsPanelUI;
		options: OptionsPanelUI;
		inventory: InventoryPanelUI;
		bank: BankPanelUI;
	};
};
