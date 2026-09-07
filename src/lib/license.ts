import { SPDX_LICENSE_BASE } from '../../scripts/compile.js';

/**
 * The display label for a published `license` value.
 *
 * Specification §9 requires the canonical SPDX IRI in a published record, so
 * `dcterms:license` has a single IRI-typed range. That IRI is right for the
 * JSON-LD sibling and wrong for a tag chip: `https://spdx.org/licenses/CC-BY-SA-3.0`
 * is what a reader recognises as `CC-BY-SA-3.0`.
 *
 * A value that does not carry the canonical prefix is returned unchanged. The
 * compiler cannot emit one — it rejects a non-SPDX id at parse time — but a
 * template must not render an empty chip if one ever reaches it.
 */
export function spdxLicenseLabel(license: string): string {
	if (!license.startsWith(SPDX_LICENSE_BASE)) return license;
	const id = license.slice(SPDX_LICENSE_BASE.length);
	return id === '' ? license : id;
}
