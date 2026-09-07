// What the sitemap advertises. Three rules keep a built page out of it.
//
// 1. ADR-0003 (as amended by ADR-0004): a draft record page is `noindex` and
//    excluded from the sitemap. The first ships in the record template; this
//    module supplies the second. Site search is a separate policy: a draft stays
//    in the Pagefind index, tagged with its status. The rule is derived
//    from record status rather than from a route prefix, so it narrows on its
//    own as records are promoted to `active` — excluding `/id/` wholesale would
//    keep hiding pages that had earned a place in the sitemap.
// 2. A `/cite/` alias redirects to a canonical `/id/` URL. A redirect is not a
//    destination, and a search engine treats one in a sitemap as an error, so
//    an alias never earns a place whatever its record's status. This is a rule
//    about the route, not about the record, which is why it does not contradict
//    the reasoning above.
// 3. A locale page with no source file of its own is a Starlight fallback: it
//    carries `<html lang="de">` over an English body. Advertising it offers a
//    crawler mislabelled duplicate content.
import { readdirSync } from 'node:fs';
import { isDraft } from './record-status.js';
import {
	loadWorks,
	loadSystems,
	loadReferences,
	loadMappings,
	iriToLocal,
	workKeyOf,
} from './registry.js';

/**
 * The IRIs of every record still at `draft`.
 *
 * Shared with `/cite/`, whose alias pages carry no status of their own: an
 * alias is `draft` exactly when the record it redirects to is.
 */
export function draftRecordIris(): Set<string> {
	const iris = new Set<string>();
	for (const record of [
		...loadWorks(),
		...loadSystems(),
		...loadReferences(),
		...loadMappings(),
	]) {
		if (isDraft(record.status)) iris.add(record.id);
	}
	return iris;
}

/**
 * The locales that mirror English content, matching `locales` in
 * `astro.config.mjs`. A locale keeps only the pages it actually translates.
 */
const LOCALES = ['de'];

/** The locale pages that have a source file, so are real translations. */
function translatedPaths(): Set<string> {
	const paths = new Set<string>();
	for (const locale of LOCALES) {
		const root = new URL(`../content/docs/${locale}/`, import.meta.url);
		for (const entry of readdirSync(root, { recursive: true })) {
			const name = String(entry).replaceAll('\\', '/');
			if (!name.endsWith('.md') && !name.endsWith('.mdx')) continue;
			const slug = name
				.replace(/\.mdx?$/, '')
				.replace(/(^|\/)index$/, '')
				.replace(/\/$/, '');
			paths.add(slug ? `/${locale}/${slug}/` : `/${locale}/`);
		}
	}
	return paths;
}

/**
 * A predicate over pathnames that is true for a page the sitemap leaves out.
 *
 * Built once and reused: the record set is large (one path per reference), so
 * membership is an exact `Set` lookup. Paginated reference browsers live under
 * `/reg/work/{key}/refs/{n}/` and follow their work's status, which is a prefix
 * test over the handful of works rather than an enumeration of page numbers.
 */
export function buildSitemapExclusion(): (pathname: string) => boolean {
	const paths = new Set<string>();
	for (const iri of draftRecordIris()) paths.add(iriToLocal(iri));

	const draftWorkPrefixes = loadWorks()
		.filter((work) => isDraft(work.status))
		.map((work) => `/reg/work/${workKeyOf(work.id)}/`);

	const translated = translatedPaths();
	const isFallback = (pathname: string) =>
		LOCALES.some((locale) => pathname.startsWith(`/${locale}/`)) &&
		!translated.has(pathname);

	return (pathname) =>
		pathname.startsWith('/cite/') ||
		isFallback(pathname) ||
		paths.has(pathname) ||
		draftWorkPrefixes.some((prefix) => pathname.startsWith(prefix));
}
