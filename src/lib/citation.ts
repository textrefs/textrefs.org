import type { Creator } from '../../standard/schema/index.js';

// The parameters below name the fields this module actually reads, rather than
// the whole compiled records. A full `Work`, `CanonicalReference`, or
// `CitationSystem` still satisfies them, so the record pages pass theirs
// unchanged; `/find/` passes the subset that `/reg/works.json` gives a browser.
export type CitedWork = {
	preferred_label: string;
	creators?: readonly Creator[];
};
export type CitedReference = { id: string; work_key: string; locator: string };
export type CitedSystem = { preferred_label: string };

export type CSLName = { family: string; given?: string } | { literal: string };

export type CSLItem = {
	id: string;
	type: 'book';
	title: string;
	author?: CSLName[];
	locator: string;
	section?: string;
	URL: string;
};

function cslAuthor(c: Creator): CSLName {
	if (c.kind === 'person') {
		return c.given
			? { family: c.family, given: c.given }
			: { family: c.family };
	}
	return { literal: c.name };
}

export function toCSL(
	work: CitedWork | undefined,
	ref: CitedReference,
	system: CitedSystem | undefined,
): CSLItem {
	const title = work ? work.preferred_label : ref.work_key;
	const authors = (work?.creators ?? []).map(cslAuthor);
	const item: CSLItem = {
		id: ref.id,
		type: 'book',
		title,
		locator: ref.locator,
		URL: ref.id,
	};
	if (authors.length) item.author = authors;
	if (system) item.section = system.preferred_label;
	return item;
}

function authorsChicago(authors: CSLName[]): string {
	const names = authors.map((a) =>
		'literal' in a ? a.literal : a.given ? `${a.given} ${a.family}` : a.family,
	);
	if (names.length === 0) return '';
	if (names.length === 1) return names[0];
	if (names.length === 2) return `${names[0]} and ${names[1]}`;
	return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`;
}

/**
 * `includeSection` names the citation system alongside the locator. Set it when
 * the work is cited under more than one system, where a bare locator is
 * ambiguous — the same string can denote a different passage per system
 * (ADR-0005). Left off, the citation stays uncluttered for the common case.
 */
export function formatChicago(
	csl: CSLItem,
	opts: { includeSection?: boolean } = {},
): string {
	const parts: string[] = [];
	const authors = csl.author ?? [];
	if (authors.length) parts.push(authorsChicago(authors));
	parts.push(`*${csl.title}*`);
	const head = parts.join(', ');
	const locator =
		opts.includeSection && csl.section
			? `${csl.locator} (${csl.section})`
			: csl.locator;
	return `${head} ${locator}. ${csl.URL}`;
}

export function toCOinS(csl: CSLItem): string {
	const authors = csl.author ?? [];
	const first = authors[0];
	const authorStr = first
		? 'literal' in first
			? first.literal
			: first.given
				? `${first.family}, ${first.given}`
				: first.family
		: '';
	const params: Array<[string, string]> = [
		['ctx_ver', 'Z39.88-2004'],
		['rft_val_fmt', 'info:ofi/fmt:kev:mtx:book'],
		['rft.genre', 'book'],
		['rft.btitle', csl.title],
		['rft.title', csl.title],
		['rft.pages', csl.locator],
		['rft_id', csl.URL],
	];
	if (authorStr) params.push(['rft.au', authorStr]);
	return params
		.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
		.join('&');
}
