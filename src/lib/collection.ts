// Registry-wide JSON-LD collections served under `/reg/` (works and citation
// systems). The sort order here is shared with the HTML registry browser
// (`src/pages/reg/index.astro`), so the two views cannot drift apart.

export const JSONLD_CONTEXT = 'https://textrefs.org/contexts/v1.jsonld';

export function byKey(a: { key: string }, b: { key: string }): number {
	return a.key.localeCompare(b.key);
}

export function collectionBody<T extends { key: string }>(
	records: readonly T[],
) {
	return { '@context': JSONLD_CONTEXT, '@graph': [...records].sort(byKey) };
}
