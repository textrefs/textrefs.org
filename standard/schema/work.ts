import { z } from 'zod';
import { AdminMetadata, FlatKey, validateTombstone } from './common.js';

export const WorkBase = AdminMetadata.extend({
	id: z.string().regex(/^https:\/\/textrefs\.org\/id\/work\/[^/]+$/),
	key: FlatKey,
	type: z.literal('Work'),
	preferred_label: z.string().min(1),
});

export const Work = WorkBase.superRefine((w, ctx) => {
	if (w.id !== `https://textrefs.org/id/work/${w.key}`) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'id MUST be https://textrefs.org/id/work/{key}',
			path: ['id'],
		});
	}
	validateTombstone(w, ctx);
});

export type Work = z.infer<typeof Work>;
