// Per-work locator indexes served at `/reg/work/{key}/aliases.json`.
//
// The only public handle on a reference is its UUIDv5, seeded from the work
// key, the citation system key, and the locator (ADR-0002). A client that knows
// a passage but ships no UUIDv5 implementation could reach the record only
// through the `/cite/` redirect, which is HTML. This module turns the registry
// inside out into one JSON map per work, so the same lookup needs a JSON parse
// alone (#84).
//
// The indexes come from the reference records, not from `loadAliases()`. The
// flat alias table mixes two target kinds — a `/cite/` alias targets a
// reference IRI, an external mapping identifier targets a work IRI — and the
// records already carry the three fields the index groups by.
//
// The logic sits here rather than in the page because the repository has no
// Astro component test harness: `src/lib/*.test.ts` is where registry-shaped
// logic is pinned.

import { uuidOf } from './registry.js';

// Locators sort the way the reference browser lists them — `1.2` before `1.10`.
// The locale is pinned: the bare `localeCompare(undefined, …)` the Astro pages
// use resolves against the host's ICU build, and a published file must not
// depend on which machine built it.
const byLocator = new Intl.Collator('en', { numeric: true }).compare;

// Flat keys are ASCII, so code-unit order needs no collator and cannot drift.
const byCodeUnit = (a: string, b: string): number =>
	a < b ? -1 : a > b ? 1 : 0;

export interface WorkAliasIndex {
	work_key: string;
	preferred_citation_system_key: string;
	/** Citation system key → locator → CanonicalReference UUID. */
	refs: Record<string, Record<string, string>>;
}

type IndexedWork = { key: string; preferred_citation_system_key: string };
type IndexedReference = {
	id: string;
	work_key: string;
	citation_system_key: string;
	locator: string;
};

/**
 * One index per work, in the order the works arrive.
 *
 * The map loses nothing, because the compiler makes `(work, system, locator)`
 * unique: a block deduplicates its own locators, and a work cannot declare the
 * same citation system twice.
 */
export function buildWorkAliasIndexes(
	works: readonly IndexedWork[],
	references: readonly IndexedReference[],
): WorkAliasIndex[] {
	const byWork = new Map<string, IndexedReference[]>();
	for (const ref of references) {
		const group = byWork.get(ref.work_key);
		if (group) group.push(ref);
		else byWork.set(ref.work_key, [ref]);
	}

	return works.map((work) => {
		const bySystem = new Map<string, IndexedReference[]>();
		for (const ref of byWork.get(work.key) ?? []) {
			const group = bySystem.get(ref.citation_system_key);
			if (group) group.push(ref);
			else bySystem.set(ref.citation_system_key, [ref]);
		}

		const refs: Record<string, Record<string, string>> = {};
		for (const [systemKey, group] of [...bySystem].sort(([a], [b]) =>
			byCodeUnit(a, b),
		)) {
			// Sorting `group` mutates an array this function built, never the
			// caller's array.
			group.sort((a, b) => byLocator(a.locator, b.locator));
			// `Object.fromEntries`, not assignment: a locator is author-controlled,
			// and one spelled `__proto__` would set a prototype instead of a key.
			// `fromEntries` defines own properties, so it cannot.
			refs[systemKey] = Object.fromEntries(
				group.map((ref) => [ref.locator, uuidOf(ref.id)]),
			);
		}

		// Every work gets an index, including a work with no references. A client
		// that holds a work key must be able to tell "no references yet" from
		// "wrong key", and only a 200 with an empty `refs` does that.
		return {
			work_key: work.key,
			preferred_citation_system_key: work.preferred_citation_system_key,
			refs,
		};
	});
}
