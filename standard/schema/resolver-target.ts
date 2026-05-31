import { z } from 'zod';
import { AdminMetadata, IsoDate, Iri } from './common.js';

const UuidUri = z
	.string()
	.regex(
		/^https:\/\/textrefs\.org\/id\/target\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
	);

export const ResolverTarget = AdminMetadata.extend({
	id: UuidUri,
	type: z.literal('ResolverTarget'),
	subject: Iri,
	url: Iri,
	language: z.string().min(2).optional(),
	edition: z.string().optional(),
	provider: z.string().optional(),
	access: z.enum(['open', 'paywalled', 'restricted', 'unknown']),
	license: z.string().optional(),
	license_url: Iri.nullable().optional(),
	last_checked: IsoDate.optional(),
});

export type ResolverTarget = z.infer<typeof ResolverTarget>;
