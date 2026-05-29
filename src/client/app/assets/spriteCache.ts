/**
 * Sprite cache and loading utilities.
 */

import type { GameStateSnapshot } from "../../../shared/protocol/gamestate.js";

export type SpriteCache = {
	images: Map<string, HTMLImageElement>;
};

/**
 * Create an empty sprite cache.
 */
export function createSpriteCache(): SpriteCache {
	return { images: new Map() };
}

/**
 * Load an image and resolve once available.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

/**
 * Ensure sprites for all entities in the snapshot are loaded in the cache.
 */
export async function refreshSpritesIfNeeded(
	cache: SpriteCache,
	snapshot: GameStateSnapshot,
) {
	const spriteUrls = new Set<string>();
	spriteUrls.add(snapshot.player.sprite);

	for (const p of Object.values(snapshot.players ?? {})) {
		spriteUrls.add(p.sprite);
	}

	for (const e of snapshot.enemies) {
		spriteUrls.add(e.sprite);
	}

	for (const gi of snapshot.groundItems) {
		spriteUrls.add(`/assets/items/${gi.itemId}.png`);
	}

	const missing = Array.from(spriteUrls).filter(
		(url) => !cache.images.has(url),
	);
	if (!missing.length) return;

	const results = await Promise.allSettled(
		missing.map((url) => loadImage(url)),
	);
	results.forEach((res, idx) => {
		const url = missing[idx]!;
		if (res.status === "fulfilled") {
			cache.images.set(url, res.value);
		} else {
			console.warn("Failed to load sprite");
		}
	});
}
