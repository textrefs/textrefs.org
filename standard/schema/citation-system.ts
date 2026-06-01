import { z } from 'zod';
import { AdminMetadata, FlatKey, SemVer } from './common.js';

export const CitationSystemBase = AdminMetadata.extend({
	id: z.string().regex(/^https:\/\/textrefs\.org\/id\/system\/[^/]+$/),
	key: FlatKey,
	type: z.literal('CitationSystem'),
	preferred_label: z.string().min(1),
	normalization_version: SemVer,
	locator_regex: z.string().min(1),
	examples: z.object({
		valid: z.array(z.string()).min(1),
		invalid: z.array(z.string()).min(1),
	}),
});

export const CitationSystem = CitationSystemBase.superRefine((s, ctx) => {
	if (s.id !== `https://textrefs.org/id/system/${s.key}`) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'id MUST be https://textrefs.org/id/system/{key}',
			path: ['id'],
		});
	}
	let re: RegExp;
	try {
		re = new RegExp(s.locator_regex);
	} catch {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'locator_regex is not a valid ECMAScript regex',
			path: ['locator_regex'],
		});
		return;
	}
	s.examples.valid.forEach((v, i) => {
		if (!re.test(v))
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `examples.valid[${i}] does not match locator_regex`,
				path: ['examples', 'valid', i],
			});
	});
	s.examples.invalid.forEach((v, i) => {
		if (re.test(v))
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: `examples.invalid[${i}] must NOT match locator_regex`,
				path: ['examples', 'invalid', i],
			});
	});
});

export type CitationSystem = z.infer<typeof CitationSystem>;
