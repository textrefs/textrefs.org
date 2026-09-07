import type { APIRoute, GetStaticPaths } from 'astro';
import { loadMappings, uuidOf } from '../../../lib/registry.ts';

const CONTEXT = 'https://textrefs.org/contexts/v1.jsonld';

export const getStaticPaths: GetStaticPaths = () => {
	return loadMappings().map((mapping) => ({
		params: { uuid: uuidOf(mapping.id) },
		props: { mapping },
	}));
};

export const GET: APIRoute = ({ props }) => {
	const { mapping } = props as {
		mapping: ReturnType<typeof loadMappings>[number];
	};
	const body = { '@context': CONTEXT, ...mapping };
	return new Response(JSON.stringify(body, null, 2), {
		headers: { 'Content-Type': 'application/ld+json; charset=utf-8' },
	});
};
