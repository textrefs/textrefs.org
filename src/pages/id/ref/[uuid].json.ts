import type { APIRoute, GetStaticPaths } from 'astro';
import { loadReferences, uuidOf } from '../../../lib/registry.ts';

const CONTEXT = 'https://textrefs.org/contexts/v1.jsonld';

export const getStaticPaths: GetStaticPaths = () => {
	return loadReferences().map((ref) => ({
		params: { uuid: uuidOf(ref.id) },
		props: { ref },
	}));
};

export const GET: APIRoute = ({ props }) => {
	const { ref } = props as { ref: ReturnType<typeof loadReferences>[number] };
	const body = { '@context': CONTEXT, ...ref };
	return new Response(JSON.stringify(body, null, 2), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
