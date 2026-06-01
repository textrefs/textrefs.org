import { z } from 'zod';
import { AdminMetadata, FlatKey, Iri, IsoDate, SemVer } from './common.js';

export const ResolverTargetEntry = z.object({
	url: Iri,
	language: z.string().min(2).optional(),
	edition: z.string().optional(),
	provider: z.string().optional(),
	access: z.enum(['open', 'paywalled', 'restricted', 'unknown']),
	license: z.string().optional(),
	license_url: Iri.nullable().optional(),
	last_checked: IsoDate.optional(),
});

export type ResolverTargetEntry = z.infer<typeof ResolverTargetEntry>;

export const CanonicalReferenceBase = AdminMetadata.extend({
	id: z
		.string()
		.regex(
			/^https:\/\/textrefs\.org\/id\/ref\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
		),
	type: z.literal('CanonicalReference'),
	work_key: FlatKey,
	citation_system_key: FlatKey,
	locator: z.string().min(1),
	normalization_version: SemVer,
	resolver_targets: z.array(ResolverTargetEntry).default([]),
});

export const CanonicalReference = CanonicalReferenceBase;

export type CanonicalReference = z.infer<typeof CanonicalReference>;
