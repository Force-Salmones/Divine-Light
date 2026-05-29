export function getRandomBetween(x: number, spread = 0.2): number {
	const min = Math.ceil((1 - spread) * x);
	const max = Math.floor((1 + spread) * x);

	return Math.floor(Math.random() * (max - min + 1)) + min;
}
