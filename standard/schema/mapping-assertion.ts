import { z } from 'zod';
import { AdminMetadata, Iri } from './common.js';

// Subject MUST be a Work IRI. Per-passage equivalences are derived via
// work-level mapping + locator templates at resolve time, not stored as records.
const WorkIri = z
	.string()
	.regex(
		/^https:\/\/textrefs\.org\/id\/work\/[a-z0-9][a-z0-9._-]*$/,
		'subject MUST be a Work IRI (https://textrefs.org/id/work/{key})',
	);

export const MappingAssertionBase = AdminMetadata.extend({
	id: z
		.string()
		.regex(
			/^https:\/\/textrefs\.org\/id\/mapping\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		),
	type: z.literal('MappingAssertion'),
	subject: WorkIri,
	relation: z.enum(['exactMatch', 'closeMatch']),
	target: z.object({
		target_kind: z.string().optional(),
		identifier: Iri,
	}),
	source: z.string().min(1),
});

export const MappingAssertion = MappingAssertionBase;

export type MappingAssertion = z.infer<typeof MappingAssertion>;
