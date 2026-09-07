import { z } from 'zod';
import { AdminMetadata, FlatKey } from './common.js';

export const CitationSystemBase = AdminMetadata.extend({
	id: z.string().regex(/^https:\/\/textrefs\.org\/id\/system\/[^/]+$/),
	key: FlatKey,
	type: z.literal('CitationSystem'),
	preferred_label: z.string().min(1),
	description: z.string().min(1),
	locator_regex: z.string().min(1),
});

export const CitationSystem = CitationSystemBase.superRefine((s, ctx) => {
	if (s.id !== `https://textrefs.org/id/system/${s.key}`) {
		ctx.addIssue({
			code: 'custom',
			message: 'id MUST be https://textrefs.org/id/system/{key}',
			path: ['id'],
		});
	}
	try {
		new RegExp(s.locator_regex);
	} catch {
		ctx.addIssue({
			code: 'custom',
			message: 'locator_regex is not a valid ECMAScript regex',
			path: ['locator_regex'],
		});
	}
});

export type CitationSystem = z.infer<typeof CitationSystem>;
