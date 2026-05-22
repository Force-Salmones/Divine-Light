export type FloatingTextEvent = {
	id: string;
	x: number;
	y: number;
	text: string;
	color?: string;
	kind?: "damage" | "levelup" | "emote" | "system";
	timestamp: number; // ms
};

export type FloatingText = FloatingTextEvent & {
	elapsed: number; // seconds
	duration: number; // seconds
	amplitude: number;
	frequency: number;
};
