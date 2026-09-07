// The citing notice on a `/find/` result card: which sentences a status earns,
// in which order, and whether the successor becomes a link.
//
// It lives here rather than in the page because the repository has no Astro
// component test harness, and `src/lib/*.test.ts` is where registry-shaped
// logic is pinned. The page maps the parts below onto DOM nodes and does
// nothing else, so a wrong status branch fails a test instead of a review.
//
// The wording shared with the record pages comes from `./record-status.js`
// (#100). The two sentences declared here are the finder's own: they address a
// reader about to paste the citation printed directly above the notice, and a
// record page has no citation to warn about.
import {
	DEPRECATED_DETAIL,
	NO_SUCCESSOR,
	isDraft,
	isTombstone,
	tombstoneTitle,
} from './record-status.js';

/** One run of text in the notice. `lead` is the bold opening sentence. */
export type NoticePart =
	| { kind: 'lead'; text: string }
	| { kind: 'text'; text: string }
	| { kind: 'link'; text: string; href: string };

export const DRAFT_LEAD = 'Not final (draft). ';

export const DRAFT_CITE_ADVICE =
	'This record carries no persistence promise yet. It may be corrected, ' +
	'which mints a different identifier, or retracted without a tombstone, and ' +
	'this link can then stop resolving. Do not cite it as stable.';

export const TOMBSTONE_CITE_ADVICE =
	'The link above remains as a tombstone, so a citation you have already ' +
	'published keeps resolving. ';

/**
 * The notice for one reference, or `null` when the record earns none.
 *
 * Only a draft carries no persistence promise (specification §11). A
 * deprecated, withdrawn or blocked record keeps the promise it got at
 * promotion: the identifier stays as a tombstone, and `superseded_by` names the
 * successor (§12). An active record says nothing at all.
 */
export function findNotice(
	status: string,
	supersededBy?: string,
): NoticePart[] | null {
	if (isDraft(status)) {
		return [
			{ kind: 'lead', text: DRAFT_LEAD },
			{ kind: 'text', text: DRAFT_CITE_ADVICE },
		];
	}
	if (!isTombstone(status)) return null;

	const parts: NoticePart[] = [
		{ kind: 'lead', text: `${tombstoneTitle(status)} ` },
	];
	if (status === 'deprecated')
		parts.push({ kind: 'text', text: `${DEPRECATED_DETAIL} ` });
	parts.push({ kind: 'text', text: TOMBSTONE_CITE_ADVICE });

	if (supersededBy === undefined || supersededBy === '') {
		parts.push({ kind: 'text', text: NO_SUCCESSOR });
		return parts;
	}
	// A successor IRI is registry data, so it is checked the way a resolver
	// target is before it becomes a link.
	if (/^https?:\/\//i.test(supersededBy)) {
		parts.push({ kind: 'text', text: 'Superseded by ' });
		parts.push({ kind: 'link', text: supersededBy, href: supersededBy });
		parts.push({ kind: 'text', text: '.' });
	} else {
		parts.push({ kind: 'text', text: `Superseded by ${supersededBy}.` });
	}
	return parts;
}
