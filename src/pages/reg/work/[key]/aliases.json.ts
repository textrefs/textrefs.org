import type { APIRoute, GetStaticPaths } from 'astro';
import { loadWorks, loadReferences } from '../../../../lib/registry.ts';
import {
	buildWorkAliasIndexes,
	type WorkAliasIndex,
} from '../../../../lib/alias-index.ts';

// Everything comes from the compiled registry in memory. `npm run build` runs
// `astro build` before `tsx scripts/compile.ts`, so `/dump/aliases.json` does
// not exist yet at this point and this route must never read it.
export const getStaticPaths: GetStaticPaths = () =>
	buildWorkAliasIndexes(loadWorks(), loadReferences()).map((index) => ({
		params: { key: index.work_key },
		props: { index },
	}));

export const GET: APIRoute = ({ props }) => {
	const { index } = props as { index: WorkAliasIndex };
	// Minified, unlike the `/reg/*.json` collections: the largest index holds
	// 23k locators and no person reads this file. Plain JSON, not JSON-LD — it
	// carries no `@context` and states identity alone.
	return new Response(JSON.stringify(index), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
};
