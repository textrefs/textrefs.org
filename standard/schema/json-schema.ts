// The published JSON Schema, generated from the Zod schemas in this directory.
// `specification.md` §14 names the Zod schemas as the implementation source of
// truth and this document as the published machine-readable contract, so the
// document is emitted at build time and never hand-written.
//
// `src/pages/schemas/v1/textrefs.schema.json.ts` serves it.
import { z } from 'zod';
import { WorkBase } from './work.js';
import { CitationSystemBase } from './citation-system.js';
import { CanonicalReferenceBase } from './canonical-reference.js';
import { MappingAssertionBase } from './mapping-assertion.js';

export const SCHEMA_DIALECT = 'https://json-schema.org/draft/2020-12/schema';
export const SCHEMA_ID = 'https://textrefs.org/schemas/v1/textrefs.schema.json';

type JsonObject = Record<string, unknown>;

/**
 * JSON Schema cannot express a Zod refinement, so the four `…Base` shapes are
 * converted, not the refined `Work` and `CitationSystem`.
 * `standard/schema/index.ts` builds the `RegistryObject` union from the same
 * four Base shapes.
 *
 * Three rules therefore live in the refinements alone, and the compiler
 * enforces all three on every record before publication:
 *
 * 1. `Work.id` agrees with `Work.key`, and `CitationSystem.id` with its `key`.
 * 2. `CitationSystem.locator_regex` compiles as an ECMAScript regex.
 * 3. No `Work.alternative_labels` entry repeats `Work.preferred_label` (§6).
 *
 * Only the fourth §6 rule — the entries are unique among themselves — has a
 * keyword. `work.ts` carries it as `uniqueItems` metadata, so it reaches this
 * document, and the same field's description states rule 3 in prose for a
 * reader of the published schema.
 */
const RECORD_SHAPES = {
	Work: WorkBase,
	CitationSystem: CitationSystemBase,
	CanonicalReference: CanonicalReferenceBase,
	MappingAssertion: MappingAssertionBase,
} as const;

/**
 * Two corrections to the Zod output, applied at any depth.
 *
 * 1. Remove every `additionalProperties: false`. Zod adds the keyword in
 *    `io: 'output'` mode, but a closed record contradicts two published facts.
 *    A served `.json` body carries a JSON-LD `@context` member that no Zod
 *    shape declares, and §15 of the specification allows extensions. A
 *    consumer that validates a real body must not be told it is invalid.
 * 2. Declare `format: "iri"`, not `format: "uri"`. Zod emits `uri` for
 *    `z.url()`, but `uri` is RFC 3986 and forbids non-ASCII characters. The
 *    shape is named `Iri`, `z.url()` accepts an IRI, and the registry holds
 *    resolver targets such as `…/Investigaciones_filosóficas…`. RFC 3987 is
 *    the format those values meet.
 */
function correct(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(correct);
	if (node === null || typeof node !== 'object') return node;

	const out: JsonObject = {};
	for (const [key, value] of Object.entries(node as JsonObject)) {
		if (key === 'additionalProperties' && value === false) continue;
		out[key] = key === 'format' && value === 'uri' ? 'iri' : correct(value);
	}
	return out;
}

function convert(shape: z.ZodType): JsonObject {
	const converted = z.toJSONSchema(shape, {
		target: 'draft-2020-12',
		// Output mode describes a published record rather than authored input:
		// `resolver_targets` carries `.default([])`, and every served
		// CanonicalReference therefore holds the member.
		io: 'output',
	}) as JsonObject;

	// The dialect is declared once, on the document, not on each `$def`.
	delete converted.$schema;
	return correct(converted) as JsonObject;
}

/**
 * One JSON Schema 2020-12 document for the whole registry. The four record
 * types sit in `$defs`, and the document is their union. `type` is `const` in
 * each shape, so exactly one branch matches any valid record — the same
 * discrimination that `api/openapi.yaml` declares for `RegistryObject`.
 */
export function buildRegistryJsonSchema(): JsonObject {
	const $defs = Object.fromEntries(
		Object.entries(RECORD_SHAPES).map(([name, shape]) => [
			name,
			convert(shape),
		]),
	);

	return {
		$schema: SCHEMA_DIALECT,
		$id: SCHEMA_ID,
		title: 'TextRefs registry object',
		description:
			'A single TextRefs registry record: a Work, a CitationSystem, a ' +
			'CanonicalReference, or a MappingAssertion. Generated from the Zod ' +
			'schemas at https://github.com/textrefs/textrefs.org/tree/main/standard/schema, ' +
			'which remain the implementation source of truth. A record served ' +
			'from /id/ also carries a JSON-LD "@context" member, and §15 of the ' +
			'specification allows further extension members; neither is declared ' +
			'here, and neither invalidates a record.',
		oneOf: Object.keys($defs).map((name) => ({ $ref: `#/$defs/${name}` })),
		$defs,
	};
}
