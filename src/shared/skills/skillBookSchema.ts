import { z } from "zod";

export const SkillBookSchema = z.record(
	z.string().regex(/^\d+$/),
	z.number().int().nonnegative().min(1),
);
