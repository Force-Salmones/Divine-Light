import type { AppContext } from "./appContext.js";
import { createViewport, resizeCanvasToScreen } from "./render/viewport.js";
import { createClientStore } from "./state/store.js";
import { createSpriteCache } from "./assets/spriteCache.js";
import {
	createFloatingTextManager,
	spawnFloatingText,
} from "./effects/floatingText.js";
import { createChatUI } from "./ui/chat.js";
import { createStatsPanelUI } from "./ui/statsPanel.js";
import { createOptionsPanelUI } from "./ui/optionsPanel.js";
import { layoutOverlayElements } from "./ui/layout.js";
import { createWsClient } from "./net/wsClient.js";
import { applySnapshot } from "./state/applySnapshot.js";
import { startGameLoop } from "./engine/loop.js";
import { registerCanvasClickHandler } from "./input/clickHandler.js";
import { sendChat, spendStat } from "./actions/gameActions.js";
import { createLoadingScreenUI } from "./ui/loadingScreen.js";
import { createInventoryPanelUI } from "./ui/inventoryPanel.js";

export function startApp() {
	const canvas = document.getElementById("game") as HTMLCanvasElement | null;
	if (!canvas) throw new Error("Canvas element #game not found");

	const ctx = canvas.getContext("2d") as CanvasRenderingContext2D | null;
	if (!ctx) throw new Error("Failed to get 2D canvas context");

	// Ensure the body can host fixed-position overlays.
	document.body.style.position = document.body.style.position || "relative";

	const loadingScreen = createLoadingScreenUI();
	let loadingHidden = false;

	const worldImage = new Image();
	const viewport = createViewport();
	const store = createClientStore();
	const sprites = createSpriteCache();
	const floatingText = createFloatingTextManager();

	// The app context is referenced by callbacks; declare first and assign later.
	let app!: AppContext;

	// UI
	const chat = createChatUI({
		onSend: (text) => {
			sendChat(app, text);
		},
	});

	const stats = createStatsPanelUI({
		onSpendStat: (stat) => {
			spendStat(app, stat);
		},
	});

	const options = createOptionsPanelUI({ store });

	const inventory = createInventoryPanelUI();

	const ws = createWsClient({
		onOpen: () => {
			console.log("Connected to game websocket");
		},
		onMessage: async (msg) => {
			switch (msg.type) {
				case "gameState":
					await applySnapshot(app, msg.gameState);
					if (!loadingHidden) {
						loadingHidden = true;
						loadingScreen.hide();
					}
					break;
				case "chat":
					chat.append({
						from:
							typeof msg.from === "string" ? msg.from : undefined,
						text: String(msg.text ?? ""),
						system: !!msg.system,
						timestamp:
							typeof msg.timestamp === "number"
								? msg.timestamp
								: Date.now(),
					});
					break;
				case "bonk":
					spawnFloatingText(floatingText, {
						x: msg.x + (store.snapshot?.player.size ?? 32) / 2,
						y: msg.y,
						text: "bonk",
						color: "white",
						kind: "emote",
						timestamp: msg.timestamp,
					});
					break;
			}
		},
	});

	app = {
		canvas,
		ctx,
		worldImage,
		viewport,
		store,
		sprites,
		floatingText,
		ws,
		ui: { chat, stats, options, inventory },
	};

	function relayout() {
		layoutOverlayElements(viewport, {
			chatContainer: chat.container,
			statsButton: stats.button,
			statsContainer: stats.container,
			optionsButton: options.button,
			optionsContainer: options.container,
			inventoryButton: inventory.button,
			inventoryContainer: inventory.container,
		});
	}

	worldImage.onload = () => {
		loadingScreen.setText("Connecting...");
		if (worldImage.naturalWidth && worldImage.naturalHeight) {
			viewport.worldWidth = worldImage.naturalWidth;
			viewport.worldHeight = worldImage.naturalHeight;
		}

		resizeCanvasToScreen(canvas, viewport);
		relayout();

		window.addEventListener("resize", () => {
			resizeCanvasToScreen(canvas, viewport);
			relayout();
		});

		registerCanvasClickHandler(app);
		ws.connect();
		startGameLoop(app);
	};

	worldImage.src = "/assets/world.png";
}
