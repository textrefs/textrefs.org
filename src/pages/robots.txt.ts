import type { APIRoute } from 'astro';

// An endpoint rather than `public/robots.txt`, so the `Sitemap:` line follows
// the configured site. `astro.config.mjs` derives `site` from `SITE_DOMAIN`,
// and a preview deployment must not advertise the production sitemap.
//
// Nothing is disallowed. Draft record pages already carry `noindex` and stay
// out of the sitemap (ADR-0003 as amended by ADR-0004, `src/lib/noindex.ts`),
// and a crawler that respects the note below never needs the record pages in
// bulk.
const body = (
	sitemap: string,
) => `# TextRefs — an open registry for canonical text references.
#
# Bulk access: /dump/ carries the whole registry as newline-delimited JSON,
# plus the alias table and a Frictionless datapackage.json with a byte count
# and a sha256 hash per file. One request there replaces thousands of record
# pages. The site is hosted on GitHub Pages and inherits its soft limits, so
# read /dump/ instead of crawling /id/ or /cite/.

User-agent: *
Allow: /

Sitemap: ${sitemap}
`;

export const GET: APIRoute = () =>
	new Response(body(new URL('sitemap-index.xml', import.meta.env.SITE).href), {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
