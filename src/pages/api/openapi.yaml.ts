import type { APIRoute } from 'astro';
// The contract itself, not a copy of it. `?raw` inlines the file at build time,
// so the served body cannot drift from `api/openapi.yaml`, and `starlight-openapi`
// keeps reading the same source for the HTML at `/api/`.
import contract from '../../../api/openapi.yaml?raw';

// Astro strips the final `.ts`, so this route emits `/api/openapi.yaml`. The
// site is static, so a deployed request never reaches this handler: the host
// derives the media type from the `.yaml` extension and sends `text/yaml`.
// The header repeats that value, so `astro dev` matches production.
export const GET: APIRoute = () =>
	new Response(contract, {
		headers: { 'Content-Type': 'text/yaml; charset=utf-8' },
	});
