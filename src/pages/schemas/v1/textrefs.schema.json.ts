import type { APIRoute } from 'astro';
import { buildRegistryJsonSchema } from '../../../../standard/schema/json-schema.ts';

// `specification.md` §14 names this URL. The document is generated from the
// canonical Zod schemas on every build, so it cannot drift from the records
// the registry serves. `/schemas/v1/` is versioned: a breaking change to the
// record shapes takes a new path, never a new body at this one.
const body = JSON.stringify(buildRegistryJsonSchema(), null, 2) + '\n';

export const GET: APIRoute = () =>
	new Response(body, {
		headers: { 'Content-Type': 'application/schema+json; charset=utf-8' },
	});
