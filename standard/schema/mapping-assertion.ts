import { z } from 'zod';
import { AdminMetadata, Iri } from './common.js';

export const MappingAssertion = AdminMetadata.extend({
	id: z
		.string()
		.regex(
			/^https:\/\/textrefs\.org\/id\/mapping\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		),
	type: z.literal('MappingAssertion'),
	subject: Iri,
	relation: z.enum(['exactMatch', 'closeMatch']),
	target: z.object({
		target_kind: z.string().optional(),
		identifier: Iri,
	}),
	source: z.string().min(1),
});

export type MappingAssertion = z.infer<typeof MappingAssertion>;
