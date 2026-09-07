import type { APIRoute } from 'astro';
import { ontologyJsonLd } from '../lib/ontology.ts';

// The machine-readable half of `/ontology/`. GitHub Pages cannot negotiate
// content, so the ontology needs an explicit sibling like every record page.
export const GET: APIRoute = () =>
	new Response(JSON.stringify(ontologyJsonLd(), null, 2), {
		headers: { 'Content-Type': 'application/ld+json; charset=utf-8' },
	});
