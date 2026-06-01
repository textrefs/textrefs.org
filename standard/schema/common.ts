import { z } from 'zod';

export const Status = z.enum([
	'candidate',
	'active',
	'deprecated',
	'superseded',
	'withdrawn',
	'blocked',
]);

export const IsoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

export const Iri = z.string().url();

export const TextRefsIri = z
	.string()
	.regex(/^https:\/\/textrefs\.org\/id\/(work|system|ref|mapping)\/[^/]+$/);

export const AdminMetadata = z.object({
	status: Status,
	created: IsoDate,
	modified: IsoDate,
	superseded_by: TextRefsIri.optional(),
	replaces: z.array(TextRefsIri).optional(),
	tombstone_reason: z.string().min(1).optional(),
});

/**
 * Cross-field validation for the tombstone block on AdminMetadata. Call from
 * each record schema's superRefine — AdminMetadata itself stays a plain
 * z.object so it remains extendable.
 */
export function validateTombstone(
	m: {
		status: z.infer<typeof Status>;
		superseded_by?: string;
	},
	ctx: z.RefinementCtx,
): void {
	if (m.status === 'superseded' && !m.superseded_by) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'status "superseded" requires superseded_by',
			path: ['superseded_by'],
		});
	}
	if (m.status !== 'superseded' && m.superseded_by) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message: 'superseded_by is only allowed when status is "superseded"',
			path: ['superseded_by'],
		});
	}
	if (m.status === 'withdrawn' && m.superseded_by) {
		ctx.addIssue({
			code: z.ZodIssueCode.custom,
			message:
				'withdrawn records MUST NOT carry superseded_by (use status "superseded" instead)',
			path: ['superseded_by'],
		});
	}
}

export const FlatKey = z
	.string()
	.regex(/^[a-z0-9][a-z0-9._-]*$/, 'flat key syntax: ^[a-z0-9][a-z0-9._-]*$');

export const SemVer = z
	.string()
	.regex(/^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/);
