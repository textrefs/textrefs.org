// Query interpretation for the reference finder at `/find/`.
//
// This module is pure. It holds no DOM reference, opens no network connection,
// and reads no registry file. Two reasons:
//
//  1. It ships to the browser. `src/pages/find/index.astro` imports it from a
//     bundled `<script>`, so anything it pulls in travels with it. It must
//     therefore never touch `./registry.js` (which imports the compiler) or
//     `standard/schema/` (which imports Zod). The input types below are
//     declared structurally for that reason, the way `alias-index.ts` declares
//     `IndexedWork`.
//  2. It is testable. The repository has no Astro component test harness, so
//     `src/lib/*.test.ts` is where registry-shaped logic is pinned.
//
// Resolution runs in two stages, because the two halves of the answer live in
// two different files. `/reg/works.json` names a work's PREFERRED citation
// system and nothing else — a work may declare `additional_systems`, and the
// compiled `Work` record drops them. Only `/reg/work/{key}/aliases.json` lists
// every system a work actually carries references under. So:
//
//   interpret()      picks the work and splits off the locator, from the small
//                    collections alone.
//   resolveInIndex() decides system and identity, once the caller has fetched
//                    that work's alias index.
//
// Splitting there keeps the large fetch lazy: an alias index runs from 68 KB
// (Republic) to 1.18 MB (Tanakh), and nothing may fetch one before a single
// work is identified.

import type { WorkAliasIndex } from './alias-index.js';
import { byKey } from './collection.js';
// `standard/iri.js` is dependency-free by design, so importing it here does not
// breach the rule stated above about what may travel into the browser bundle.
import { refIri } from '../../standard/iri.js';

export type FindCreator =
	| { kind: 'person'; family: string; given?: string }
	| { kind: 'literal'; name: string };

/** The subset of a compiled `Work` that `/reg/works.json` gives the finder. */
export interface FindWork {
	key: string;
	preferred_label: string;
	alternative_labels?: string[];
	preferred_citation_system_key: string;
	creators?: FindCreator[];
	status: string;
}

/** The subset of a compiled `CitationSystem` that `/reg/systems.json` gives. */
export interface FindSystem {
	key: string;
	preferred_label: string;
	/** Prose that usually names the locator form, e.g. "`book.chapter`, e.g.
	 *  1.1". Nothing here reads it; the page shows it to explain a rejection. */
	description: string;
	locator_regex: string;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/**
 * Fold a label or a creator name to its comparison form: decomposed, stripped
 * of combining marks, lowercased, punctuation replaced by a single space.
 *
 * `Tractatus Logico-Philosophicus` and `plato.republic` both flatten to space
 * separated words, so a hyphen or a dot in a title never has to be typed.
 *
 * A locator is NEVER passed through here. `1Cor.1.1` and `514a` depend on their
 * dots and their case, and ADR-0002 seeds reference identity on the exact
 * locator string.
 */
export function normalizeLabel(value: string): string {
	return value
		.normalize('NFKD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, ' ')
		.trim();
}

function tokens(value: string): string[] {
	const normalized = normalizeLabel(value);
	return normalized.length === 0 ? [] : normalized.split(' ');
}

/**
 * Every name a work answers to, plus its key, as a set of normalized tokens.
 *
 * A set rather than one joined string, because tier 6 asks whether the reader
 * typed a word this work answers to. Substring containment over a joined string
 * answers a different question: it accepts `ant` for Dante and `art` for
 * Descartes, and `interpret` would then carry that fragment through to locator
 * resolution. A three-letter fragment must not select a work.
 */
function haystack(work: FindWork): Set<string> {
	return new Set(
		tokens(
			[
				work.preferred_label,
				...(work.alternative_labels ?? []),
				work.key,
				...creatorNames(work),
			].join(' '),
		),
	);
}

function creatorNames(work: FindWork): string[] {
	return (work.creators ?? []).flatMap((c) =>
		c.kind === 'person' ? [c.family, ...(c.given ? [c.given] : [])] : [c.name],
	);
}

function labels(work: FindWork): string[] {
	return [work.preferred_label, ...(work.alternative_labels ?? [])];
}

// ---------------------------------------------------------------------------
// Query parsing
// ---------------------------------------------------------------------------

export interface ParsedQuery {
	/** The query with any trailing locator token removed. May be empty. */
	workQuery: string;
	/** The trailing locator candidate, verbatim, or `null`. */
	locator: string | null;
	/** Whether some registered citation system accepts that candidate. */
	locatorIsWellFormed: boolean;
}

/**
 * Split a query into a work part and a trailing locator candidate.
 *
 * Only the LAST whitespace-separated token is ever considered, and only when it
 * contains a digit. Both rules earn their place: every citation system in the
 * registry writes a locator with a digit in it, and taking any token would make
 * `1 Corinthians` lose its `1`.
 *
 * `locatorIsWellFormed` reports whether any system's `locator_regex` accepts the
 * candidate. It is a shape test across the whole registry, not a decision about
 * one work — a work's own systems are not knowable until its alias index is
 * fetched.
 */
export function parseQuery(
	query: string,
	systems: readonly FindSystem[],
): ParsedQuery {
	const trimmed = query.trim().replace(/\s+/g, ' ');
	if (trimmed.length === 0) {
		return { workQuery: '', locator: null, locatorIsWellFormed: false };
	}

	const parts = trimmed.split(' ');
	const last = parts[parts.length - 1];
	if (!/\p{N}/u.test(last)) {
		return { workQuery: trimmed, locator: null, locatorIsWellFormed: false };
	}

	return {
		workQuery: parts.slice(0, -1).join(' '),
		locator: last,
		locatorIsWellFormed: systems.some((s) => acceptsLocator(s, last)),
	};
}

/** Whether one citation system's `locator_regex` accepts a locator verbatim. */
export function acceptsLocator(system: FindSystem, locator: string): boolean {
	try {
		return new RegExp(system.locator_regex, 'u').test(locator);
	} catch {
		// A system whose regex does not compile accepts nothing. The compiler
		// rejects such a record (`standard/schema/citation-system.ts`), so this
		// guards only against a hand-built or third-party collection.
		return false;
	}
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

/** The ranking ladder, best first. Lower is better. */
export const TIER = {
	EXACT_KEY: 1,
	EXACT_LABEL: 2,
	EXACT_ALTERNATIVE_LABEL: 3,
	CREATOR_AND_TITLE: 4,
	TITLE_PREFIX: 5,
	TOKEN: 6,
	FUZZY: 7,
} as const;

export type Tier = (typeof TIER)[keyof typeof TIER];

export interface WorkMatch {
	work: FindWork;
	tier: Tier;
	/** The string that matched, for explaining the hit to a reader. */
	matchedOn: string;
}

const FUZZY_MIN_LENGTH = 4;
const FUZZY_MAX_DISTANCE = 2;

/**
 * Levenshtein distance, abandoned as soon as it exceeds `max`.
 *
 * Hand-rolled on purpose: the finder adds no runtime dependency, and the inputs
 * are single titles.
 */
export function boundedDistance(a: string, b: string, max: number): number {
	if (Math.abs(a.length - b.length) > max) return max + 1;
	let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
	for (let i = 1; i <= a.length; i++) {
		const current = [i];
		let best = i;
		for (let j = 1; j <= b.length; j++) {
			const cost = a[i - 1] === b[j - 1] ? 0 : 1;
			const value = Math.min(
				previous[j] + 1,
				current[j - 1] + 1,
				previous[j - 1] + cost,
			);
			current.push(value);
			if (value < best) best = value;
		}
		if (best > max) return max + 1;
		previous = current;
	}
	return previous[b.length];
}

function tierOf(query: string, work: FindWork): WorkMatch | null {
	const raw = query.trim().toLowerCase();
	const normalized = normalizeLabel(query);
	if (normalized.length === 0) return null;

	if (work.key.toLowerCase() === raw) {
		return { work, tier: TIER.EXACT_KEY, matchedOn: work.key };
	}
	if (normalizeLabel(work.preferred_label) === normalized) {
		return { work, tier: TIER.EXACT_LABEL, matchedOn: work.preferred_label };
	}
	const exactAlternative = (work.alternative_labels ?? []).find(
		(label) => normalizeLabel(label) === normalized,
	);
	if (exactAlternative !== undefined) {
		return {
			work,
			tier: TIER.EXACT_ALTERNATIVE_LABEL,
			matchedOn: exactAlternative,
		};
	}

	// A creator surname plus a title, in either order: `Plato Republic`.
	const queryTokens = tokens(query);
	for (const name of creatorNames(work)) {
		const normalizedName = normalizeLabel(name);
		const rest = queryTokens
			.filter((t) => t !== normalizedName)
			.join(' ')
			.trim();
		if (rest === normalized || rest.length === 0) continue;
		const title = labels(work).find((label) => normalizeLabel(label) === rest);
		if (title !== undefined) {
			return {
				work,
				tier: TIER.CREATOR_AND_TITLE,
				matchedOn: `${name}, ${title}`,
			};
		}
	}

	const prefixed = labels(work).find((label) =>
		normalizeLabel(label).startsWith(normalized),
	);
	if (prefixed !== undefined) {
		return { work, tier: TIER.TITLE_PREFIX, matchedOn: prefixed };
	}

	const hay = haystack(work);
	if (queryTokens.length > 0 && queryTokens.every((token) => hay.has(token))) {
		return { work, tier: TIER.TOKEN, matchedOn: work.preferred_label };
	}

	if (normalized.length >= FUZZY_MIN_LENGTH) {
		const near = labels(work).find(
			(label) =>
				boundedDistance(
					normalized,
					normalizeLabel(label),
					FUZZY_MAX_DISTANCE,
				) <= FUZZY_MAX_DISTANCE,
		);
		if (near !== undefined) {
			return { work, tier: TIER.FUZZY, matchedOn: near };
		}
	}

	return null;
}

/**
 * Rank every work that answers to a query, best tier first.
 *
 * Inside a tier the order is by work key, so the same query always produces the
 * same array. A caller that needs a decision uses `leadingTier` on the result;
 * the tail is there for a caller that wants to show weaker hits as well.
 */
export function rankWorks(
	query: string,
	works: readonly FindWork[],
): WorkMatch[] {
	return works
		.map((work) => tierOf(query, work))
		.filter((m): m is WorkMatch => m !== null)
		.sort((a, b) => a.tier - b.tier || byKey(a.work, b.work));
}

/**
 * The matches in the best tier that matched anything.
 *
 * Every decision in `interpret` reads this rather than the whole ranked list.
 * Cutting at the tier boundary is what keeps "exactly one work" crisp: an exact
 * title is never counted alongside a fuzzy near-miss, so a good hit cannot be
 * turned into an ambiguity by a weak one.
 */
export function leadingTier(matches: readonly WorkMatch[]): WorkMatch[] {
	if (matches.length === 0) return [];
	const best = matches[0].tier;
	return matches.filter((m) => m.tier === best);
}

/** True when a leading tier was reached by spelling distance alone. */
export function isFuzzy(matches: readonly WorkMatch[]): boolean {
	return matches.length > 0 && matches[0].tier === TIER.FUZZY;
}

// ---------------------------------------------------------------------------
// Stage one: interpret a query
// ---------------------------------------------------------------------------

export type Interpretation =
	/** Nothing typed. */
	| { kind: 'empty' }
	/** No work answers to the query. */
	| { kind: 'no-match'; query: string }
	/** More than one work answers. Never resolved further. */
	| { kind: 'work-matches'; matches: WorkMatch[]; locator: string | null }
	/** One work, no locator yet. */
	| { kind: 'work-selected'; match: WorkMatch }
	/**
	 * A locator with no work. Always ambiguous, even when one candidate is
	 * listed: the finder does not guess which work a bare locator belongs to,
	 * and today's single candidate becomes several as the registry grows.
	 */
	| { kind: 'bare-locator'; locator: string; candidates: WorkMatch[] }
	/** One work, but the locator matches no registered system's shape. */
	| { kind: 'locator-invalid'; match: WorkMatch; locator: string }
	/** One work and a well-formed locator. The caller now fetches the index. */
	| { kind: 'resolvable'; match: WorkMatch; locator: string };

/**
 * Decide what a query means, from the two small collections alone.
 *
 * `resolvable` is deliberately not called `resolved`. It names a work and a
 * locator string; it does not name a citation system and it does not name a
 * UUID. Both of those come from `resolveInIndex`.
 */
export function interpret(
	query: string,
	works: readonly FindWork[],
	systems: readonly FindSystem[],
): Interpretation {
	const parsed = parseQuery(query, systems);
	if (parsed.workQuery.length === 0 && parsed.locator === null) {
		return { kind: 'empty' };
	}

	// A bare locator names no work.
	if (parsed.workQuery.length === 0 && parsed.locator !== null) {
		if (!parsed.locatorIsWellFormed) {
			return { kind: 'no-match', query: query.trim() };
		}
		const candidates = works
			.filter((work) => {
				const system = systems.find(
					(s) => s.key === work.preferred_citation_system_key,
				);
				return system ? acceptsLocator(system, parsed.locator!) : false;
			})
			.map((work) => ({
				work,
				tier: TIER.TOKEN as Tier,
				matchedOn: work.preferred_citation_system_key,
			}))
			.sort((a, b) => byKey(a.work, b.work));
		return { kind: 'bare-locator', locator: parsed.locator, candidates };
	}

	const matches = leadingTier(rankWorks(parsed.workQuery, works));

	// A title that ends in something a reader would type as a locator loses its
	// last token above — `MA II/1` is one of Nietzsche's registered labels, and
	// the split leaves `MA`, which is a different work's label. So rank the whole
	// query as well and let it win when it is at least as good: a match that
	// explains the entire input beats one that had to discard a token.
	//
	// A spelling guess never displaces a real hit. It is offered only when the
	// split found nothing at all, where any candidate beats none.
	if (parsed.locator !== null) {
		const whole = leadingTier(rankWorks(query, works));
		const wholeWins =
			whole.length > 0 &&
			(matches.length === 0 ||
				(!isFuzzy(whole) && whole[0].tier <= matches[0].tier));
		if (wholeWins) {
			return whole.length === 1 && !isFuzzy(whole)
				? { kind: 'work-selected', match: whole[0] }
				: { kind: 'work-matches', matches: whole, locator: null };
		}
	}

	if (matches.length === 0) return { kind: 'no-match', query: query.trim() };
	// A fuzzy hit is a spelling guess, so it offers and never decides — even
	// when it is the only one. The page promises that nothing is guessed, and
	// resolving an edit-distance hit straight to a passage would break that
	// promise silently. `work-matches` is already the "never resolved further"
	// answer, so the caller renders it as a question.
	if (matches.length > 1 || isFuzzy(matches)) {
		return { kind: 'work-matches', matches, locator: parsed.locator };
	}

	const match = matches[0];
	if (parsed.locator === null) return { kind: 'work-selected', match };
	if (!parsed.locatorIsWellFormed) {
		return { kind: 'locator-invalid', match, locator: parsed.locator };
	}
	return { kind: 'resolvable', match, locator: parsed.locator };
}

// ---------------------------------------------------------------------------
// Stage two: resolve inside one work's alias index
// ---------------------------------------------------------------------------

export type Resolution =
	/** Exactly one of the work's systems holds this locator. */
	| { kind: 'resolved'; uuid: string; systemKey: string }
	/**
	 * More than one does. ADR-0005: the same string under two systems denotes a
	 * different passage, so the caller must ask rather than pick.
	 */
	| { kind: 'ambiguous-system'; options: { systemKey: string; uuid: string }[] }
	/** Well formed for this work, but no such reference is registered. */
	| { kind: 'not-in-registry'; locator: string; validUnder: string[] }
	/** No system this work uses accepts the locator's shape. */
	| { kind: 'locator-invalid'; locator: string; workSystems: string[] };

/**
 * Look a locator up in one work's alias index.
 *
 * The lookup is exact. No normalization, no case folding, no near miss: ADR-0002
 * seeds a reference UUID on the `(work_key, citation_system_key, locator)` tuple
 * verbatim, so a fuzzy hit here would invent an identity. Fuzzy matching helps
 * find a work and stops there.
 *
 * The index is also the only place that lists every citation system a work
 * carries references under, which is why the shape check happens here and not
 * in `interpret`.
 */
export function resolveInIndex(
	index: WorkAliasIndex,
	locator: string,
	systems: readonly FindSystem[],
): Resolution {
	const workSystems = Object.keys(index.refs).sort();

	const hits = workSystems
		.map((systemKey) => ({
			systemKey,
			uuid: Object.prototype.hasOwnProperty.call(index.refs[systemKey], locator)
				? index.refs[systemKey][locator]
				: undefined,
		}))
		.filter(
			(h): h is { systemKey: string; uuid: string } => h.uuid !== undefined,
		);

	if (hits.length === 1) {
		return {
			kind: 'resolved',
			uuid: hits[0].uuid,
			systemKey: hits[0].systemKey,
		};
	}
	if (hits.length > 1) {
		// The preferred system leads, so a caller that renders the list puts the
		// work's default first (ADR-0005).
		const options = [...hits].sort((a, b) =>
			a.systemKey === index.preferred_citation_system_key
				? -1
				: b.systemKey === index.preferred_citation_system_key
					? 1
					: a.systemKey.localeCompare(b.systemKey),
		);
		return { kind: 'ambiguous-system', options };
	}

	const validUnder = workSystems.filter((systemKey) => {
		const system = systems.find((s) => s.key === systemKey);
		return system ? acceptsLocator(system, locator) : false;
	});
	if (validUnder.length === 0) {
		return { kind: 'locator-invalid', locator, workSystems };
	}
	return { kind: 'not-in-registry', locator, validUnder };
}

/** The canonical TextRefs URI of a reference. */
export function referenceIri(uuid: string): string {
	return refIri(uuid);
}
