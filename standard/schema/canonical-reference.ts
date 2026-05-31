import { z } from 'zod';
import { AdminMetadata, FlatKey, SemVer } from './common.js';

// TODO(spec §11, §14): verify deterministic UUID seed (work_key, citation_system_key, locator, normalization_version)
export const CanonicalReference = AdminMetadata.extend({
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
});

export type CanonicalReference = z.infer<typeof CanonicalReference>;
