import type { APIRoute } from 'astro';
import { loadWorks } from '../../lib/registry.ts';
import { collectionBody } from '../../lib/collection.ts';

export const GET: APIRoute = () =>
	new Response(JSON.stringify(collectionBody(loadWorks()), null, 2), {
		headers: { 'Content-Type': 'application/ld+json; charset=utf-8' },
	});
