import { z } from 'zod';

export const Status = z.enum([
	'candidate',
	'active',
	'deprecated',
	'withdrawn',
	'blocked',
]);

export const IsoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

export const Iri = z.string().url();

export const AdminMetadata = z.object({
	status: Status,
	created: IsoDate,
	modified: IsoDate,
});

export const FlatKey = z
	.string()
	.regex(/^[a-z0-9][a-z0-9._-]*$/, 'flat key syntax: ^[a-z0-9][a-z0-9._-]*$');

export const SemVer = z
	.string()
	.regex(/^\d+\.\d+\.\d+(?:-[\w.-]+)?(?:\+[\w.-]+)?$/);
