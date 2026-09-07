// `/cite/` in `astro dev`.
//
// The redirect pages are output, not routes: `scripts/compile.ts` writes all
// 172,794 of them after `astro build`, which keeps them out of Astro's render
// pipeline and out of Pagefind's scan. `astro dev` runs neither, so without
// this integration every alias link on a reference page would 404 in
// development.
//
// The page body comes from `citeRedirectHtml`, the same function the compiler
// writes with, so the dev server and the published site cannot disagree.
import type { AstroIntegration } from 'astro';
import { citeRedirectHtml } from '../../scripts/compile.js';
import { iriToLocal } from '../../standard/iri.js';
import { loadAliases } from '../lib/registry.js';
import { draftRecordIris } from '../lib/sitemap.js';

const PREFIX = '/cite/';

export default function citeDev(): AstroIntegration {
	return {
		name: 'textrefs:cite-dev',
		hooks: {
			'astro:server:setup': ({ server }) => {
				// Kept for the life of the server, the same lifetime the compiled
				// registry itself has.
				let aliases: Record<string, string> | undefined;
				let draft: Set<string> | undefined;

				server.middlewares.use((req, res, next) => {
					const path = (req.url ?? '/').split('?')[0];
					if (!path.startsWith(PREFIX)) return next();

					// `decodeURIComponent` throws on a malformed escape, and the URL
					// belongs to whoever typed it. A request that cannot be decoded
					// names no alias, so it takes the same path as an unknown one.
					let alias: string;
					try {
						alias = decodeURIComponent(path.slice(PREFIX.length));
					} catch {
						return next();
					}
					alias = alias.replace(/\/$/, '');

					// Both are derived from the whole registry, so the first
					// `/cite/` request pays for them and the rest do not.
					aliases ??= loadAliases();
					draft ??= draftRecordIris();

					const target = aliases[alias];
					// Unknown alias, or an external identifier that never had a page:
					// hand it back to Astro so the 404 looks like every other one.
					if (target === undefined || alias.includes('://')) return next();

					res.setHeader('Content-Type', 'text/html; charset=utf-8');
					res.end(citeRedirectHtml(iriToLocal(target), draft.has(target)));
				});
			},
		},
	};
}
