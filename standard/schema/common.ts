import { z } from 'zod';

// Lifecycle (ADR-0004): `draft` is mutable and carries no persistence promise;
// promotion to `active` grants both recommendation and identifier permanence.
// The remaining three are tombstone states for records that have left active use.
export const Status = z.enum([
	'draft',
	'active',
	'deprecated',
	'withdrawn',
	'blocked',
]);

export type Status = z.infer<typeof Status>;

export const IsoDate = z
	.string()
	.regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');

export const Iri = z.url();

export const AdminMetadata = z.object({
	status: Status,
	created: IsoDate,
	modified: IsoDate,
	// Successor link (dcterms:isReplacedBy) on records that have left active
	// use. The status constraint — deprecated, withdrawn, or blocked only —
	// needs the whole registry, so the compiler enforces it, not this shape.
	superseded_by: Iri.optional(),
});

export const FlatKey = z
	.string()
	.regex(/^[a-z0-9][a-z0-9._-]*$/, 'flat key syntax: ^[a-z0-9][a-z0-9._-]*$');

// BCP 47 well-formedness (RFC 5646 langtag + privateuse). Registry validity is
// not checked — only that the tag parses. Grandfathered tags split on that same
// line: the nine regular ones (art-lojban, zh-min-nan, …) are well-formed
// langtags and pass, and the seventeen irregular ones are out of scope — both
// the i- forms (i-klingon, …) and the four without that prefix (en-GB-oed,
// sgn-BE-FR, sgn-BE-NL, sgn-CH-DE). No text language in the registry needs one.
// `scripts/compile.test.ts` locks this split to the regex.
export const LanguageTag = z
	.string()
	.regex(
		/^(?:[A-Za-z]{2,3}(?:-[A-Za-z]{3}){0,3}|[A-Za-z]{4,8})(?:-[A-Za-z]{4})?(?:-(?:[A-Za-z]{2}|\d{3}))?(?:-(?:[\dA-Za-z]{5,8}|\d[\dA-Za-z]{3}))*(?:-[\dA-WY-Za-wy-z](?:-[\dA-Za-z]{2,8})+)*(?:-[Xx](?:-[\dA-Za-z]{1,8})+)?$|^[Xx](?:-[\dA-Za-z]{1,8})+$/,
		'must be a well-formed BCP 47 language tag',
	);
