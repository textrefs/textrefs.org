import { z } from 'zod';
import { AdminMetadata, FlatKey, Iri } from './common.js';

export const Creator = z.discriminatedUnion('kind', [
	z.object({
		kind: z.literal('person'),
		family: z.string().min(1),
		given: z.string().min(1).optional(),
	}),
	z.object({
		kind: z.literal('literal'),
		name: z.string().min(1),
	}),
]);

export type Creator = z.infer<typeof Creator>;

export const WorkBase = AdminMetadata.extend({
	id: z.string().regex(/^https:\/\/textrefs\.org\/id\/work\/[^/]+$/),
	key: FlatKey,
	type: z.literal('Work'),
	preferred_label: z.string().min(1),
	// Additional names for the work: abbreviations ("NE"), translated titles
	// ("Nikomachische Ethik"), and established short forms. Search and display
	// only. Identity-neutral: no label is a UUID seed input (ADR-0002), so a
	// label change never moves an identifier (ADR-0007). Two works MAY share an
	// alternative label; the compiler does not treat that as an error. Omit the
	// field rather than publishing an empty array; the entries are checked for
	// uniqueness below.
	alternative_labels: z
		.array(z.string().min(1))
		.min(1)
		// The metadata reaches the published JSON Schema
		// (`standard/schema/json-schema.ts`). `uniqueItems` is the half of the §6
		// rule that JSON Schema can express; the `superRefine` below enforces
		// both halves, and the description states the half that no keyword covers.
		.meta({
			uniqueItems: true,
			description:
				'Additional names for the work: abbreviations, translated titles, and established short forms. Each entry MUST be unique within the work, and no entry MUST repeat preferred_label (specification §6). The second rule compares two members and has no JSON Schema keyword; the compiler enforces it on every published record.',
		})
		.optional(),
	// The citation system this work is cited under by default (ADR-0005). It
	// governs the bare `/cite/{work}/{locator}` alias and default presentation
	// only — it is identity-neutral and never affects how a fully qualified
	// reference validates or resolves. The compiler checks that it names a
	// known CitationSystem.
	preferred_citation_system_key: FlatKey,
	creators: z.array(Creator).optional(),
	// Compiler-derived projection of the work's MappingAssertions that are not
	// deprecated, withdrawn or blocked (prov:alternateOf / dcterms:isReferencedBy
	// in the published context, ADR-0006). The arrays enrich the work; they make
	// no review claim. Read the MappingAssertion for status. Never authored.
	alternateOf: z.array(Iri).optional(),
	isReferencedBy: z.array(Iri).optional(),
});

export const Work = WorkBase.superRefine((w, ctx) => {
	if (w.id !== `https://textrefs.org/id/work/${w.key}`) {
		ctx.addIssue({
			code: 'custom',
			message: 'id MUST be https://textrefs.org/id/work/{key}',
			path: ['id'],
		});
	}
	// The rules the specification states for alternative_labels (§6). They are
	// enforced here, on the published record, and not only on the authored
	// YAML, so a record that reaches a consumer cannot carry a label twice.
	// Uniqueness is deliberately local to one work: two different works MAY
	// claim the same label (ADR-0007).
	const seenLabels = new Set<string>();
	(w.alternative_labels ?? []).forEach((label, i) => {
		if (label === w.preferred_label) {
			ctx.addIssue({
				code: 'custom',
				message: `alternative label "${label}" repeats the preferred label`,
				path: ['alternative_labels', i],
			});
		} else if (seenLabels.has(label)) {
			ctx.addIssue({
				code: 'custom',
				message: `alternative label "${label}" is declared more than once for this work`,
				path: ['alternative_labels', i],
			});
		}
		seenLabels.add(label);
	});
});

export type Work = z.infer<typeof Work>;
