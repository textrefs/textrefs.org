import type { APIRoute, GetStaticPaths } from 'astro';
import { loadSystems } from '../../../lib/registry.ts';

const CONTEXT = 'https://textrefs.org/contexts/v1.jsonld';

export const getStaticPaths: GetStaticPaths = () => {
	return loadSystems().map((system) => ({
		params: { key: system.key },
		props: { system },
	}));
};

export const GET: APIRoute = ({ props }) => {
	const { system } = props as {
		system: ReturnType<typeof loadSystems>[number];
	};
	const body = { '@context': CONTEXT, ...system };
	return new Response(JSON.stringify(body, null, 2), {
		headers: { 'Content-Type': 'application/ld+json; charset=utf-8' },
	});
};
