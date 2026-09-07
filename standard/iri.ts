// How a TextRefs IRI is spelled, in one place.
//
// The four record types put their key or their UUID after a fixed prefix, and
// that prefix was written out at ten call sites across `scripts/compile.ts`,
// `scripts/validate-data.ts` and `src/lib/find.ts` before this module existed.
// A prefix is not interesting enough to get wrong twice.
//
// This module MUST stay dependency-free. `src/lib/find.ts` ships to the browser
// inside the `/find/` bundle, so anything imported here travels with it; that
// is the same rule its own header states about `standard/schema/`, which pulls
// in Zod. Nothing below imports anything.
//
// The canonical form is fixed by the specification and by the `id` regexes in
// `standard/schema/`. Those regexes stay written out: a pattern is checked
// against a string, and deriving one from the other would make each half prove
// the other rather than prove the spelling.

export const BASE = 'https://textrefs.org';

/** `https://textrefs.org/id/work/{key}` */
export function workIri(key: string): string {
	return `${BASE}/id/work/${key}`;
}

/** `https://textrefs.org/id/system/{key}` */
export function systemIri(key: string): string {
	return `${BASE}/id/system/${key}`;
}

/** `https://textrefs.org/id/ref/{uuid}` */
export function refIri(uuid: string): string {
	return `${BASE}/id/ref/${uuid}`;
}

/** `https://textrefs.org/id/mapping/{uuid}` */
export function mappingIri(uuid: string): string {
	return `${BASE}/id/mapping/${uuid}`;
}

/**
 * The site path a record IRI is served at, or the IRI itself when it names no
 * record — `https://textrefs.org/id/ref/{uuid}` → `/id/ref/{uuid}/`.
 *
 * The inverse of the four builders above, so it lives with them. It also has to
 * live outside `src/lib/`: `scripts/compile.ts` writes the `/cite/` redirects
 * and needs the target path, while `src/lib/registry.ts` imports the compiler.
 */
export function iriToLocal(iri: string): string {
	const m = iri.match(
		/^https:\/\/textrefs\.org\/id\/(work|system|ref|mapping)\/(.+)$/,
	);
	if (m) return `/id/${m[1]}/${m[2]}/`;
	return iri;
}
