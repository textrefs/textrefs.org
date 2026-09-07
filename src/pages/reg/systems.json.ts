import type { APIRoute } from 'astro';
import { loadSystems } from '../../lib/registry.ts';
import { collectionBody } from '../../lib/collection.ts';

export const GET: APIRoute = () =>
	new Response(JSON.stringify(collectionBody(loadSystems()), null, 2), {
		headers: { 'Content-Type': 'application/ld+json; charset=utf-8' },
	});
