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

	const missing = Array.from(spriteUrls).filter(
		(url) => !cache.images.has(url),
	);
	if (!missing.length) return;

	const loaded = await Promise.all(missing.map((url) => loadImage(url)));
	missing.forEach((url, idx) => {
		const img = loaded[idx];
		if (img) cache.images.set(url, img);
	});
}
