import { z } from 'zod';
import { AdminMetadata, FlatKey } from './common.js';

export const Creator = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('person'),
		family: z.string().min(1),
		given: z.string().min(1).optional(),
	}),
	z.object({
		kind: z.literal('literal'),
		name: z.string().min(1),
	}),
]);

export type Creator = z.infer<typeof Creator>;

export const WorkBase = AdminMetadata.extend({
	id: z.string().regex(/^https:\/\/textrefs\.org\/id\/work\/[^/]+$/),
	key: FlatKey,
	type: z.literal('Work'),
	preferred_label: z.string().min(1),
	creators: z.array(Creator).optional(),
});

export const Work = WorkBase.superRefine((w, ctx) => {
	if (w.id !== `https://textrefs.org/id/work/${w.key}`) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'id MUST be https://textrefs.org/id/work/{key}',
			path: ['id'],
		});
	}
});

export type Work = z.infer<typeof Work>;
