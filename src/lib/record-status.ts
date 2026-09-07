// The lifecycle a record page states, and the words it states it in.
//
// ADR-0004 and specification.md §12 make `deprecated`, `withdrawn` and `blocked`
// one tombstone category, and the compiler agrees (`RETIRED_STATUSES` in
// scripts/compile.ts). The three differ in reach, not in kind. All three leave
// the `Work` mapping projections; `scripts/compile.test.ts` asserts this for
// `deprecated` as well as for the other two. A `deprecated` record is otherwise
// retained and still resolves. A `withdrawn` or `blocked` record additionally
// may not be depended on by a live record (`TOMBSTONE_STATUSES`). The banner
// therefore stays one presentation, and the copy below states which of the
// three applies.
//
// Markup and styling stay with each template: `src/components/Tombstone.astro`
// carries a scoped `<style>`, and `src/pages/id/ref/[uuid]/index.astro` styles
// the same banner from `public/assets/record.css` instead, because a `<style>`
// block on 200,000 reference pages is what that template exists to avoid (#100).
// Only the wording and the derivation live here.
//
// This module ships to the browser inside the `/find/` bundle, so it imports
// nothing at runtime. The `Status` import is type-only and is erased at build,
// the way `src/lib/citation.ts` imports `Creator`.
import type { Status } from '../../standard/schema/common.js';

/** A status as it arrives from a compiled record, which is typed `string`. */
type StatusLike = Status | (string & {});

export function isDraft(status: StatusLike): boolean {
	return status === 'draft';
}

export function isTombstone(status: StatusLike): boolean {
	return (
		status === 'deprecated' || status === 'withdrawn' || status === 'blocked'
	);
}

export const DRAFT_TITLE = 'Draft record.';

// The one constant that carries markup: `<code>active</code>` sits inside the
// sentence, so splitting the string into fragments would move the drift risk
// rather than remove it (#100). Templates render it with `set:html`, the way
// `src/lib/banner.ts` stores `UNSTABLE_BANNER.content`. It holds no data, only
// this fixed copy.
export const DRAFT_BODY_HTML =
	'This record has not been promoted to <code>active</code> by expert review. ' +
	'Its identifier carries no persistence promise yet: the record may be ' +
	'corrected (which mints a different identifier) or retracted without a ' +
	'tombstone. Do not cite it as stable.';

/** The lead sentence of a tombstone banner. Empty for a live status. */
export function tombstoneTitle(status: StatusLike): string {
	if (status === 'blocked')
		return 'This record is blocked by a rights, trust, or policy dispute.';
	if (status === 'deprecated') return 'This record is deprecated.';
	if (status === 'withdrawn') return 'This record has been withdrawn.';
	return '';
}

export const DEPRECATED_DETAIL =
	'It is retained and it still resolves, but it is no longer recommended.';

export const NO_SUCCESSOR = 'No successor record exists.';
