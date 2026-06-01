import type { APIRoute, GetStaticPaths } from 'astro';
import { loadWorks } from '../../../lib/registry.ts';

const CONTEXT = 'https://textrefs.org/contexts/v1.jsonld';

export const getStaticPaths: GetStaticPaths = () => {
	return loadWorks().map((work) => ({
		params: { key: work.key },
		props: { work },
	}));
};

export const GET: APIRoute = ({ props }) => {
	const { work } = props as { work: ReturnType<typeof loadWorks>[number] };
	const body = { '@context': CONTEXT, ...work };
	return new Response(JSON.stringify(body, null, 2), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
