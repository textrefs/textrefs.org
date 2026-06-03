import type {
	Work,
	Creator,
	CanonicalReference,
	CitationSystem,
} from '../../standard/schema/index.js';

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
	work: Work | undefined,
	ref: CanonicalReference,
	system: CitationSystem | undefined,
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

export function formatChicago(csl: CSLItem): string {
	const parts: string[] = [];
	const authors = csl.author ?? [];
	if (authors.length) parts.push(authorsChicago(authors));
	parts.push(`*${csl.title}*`);
	const head = parts.join(', ');
	return `${head} ${csl.locator}. ${csl.URL}`;
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
