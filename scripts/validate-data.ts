import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { v5 as uuidv5 } from 'uuid';
import { compileRegistry, printIssues } from './compile.js';
import { refIri, mappingIri } from '../standard/iri.js';
import {
	Work,
	CitationSystem,
	CanonicalReference,
	MappingAssertion,
} from '../standard/schema/index.js';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// The namespaces and the seed strings below are deliberately a second,
// independent implementation of what `scripts/compile.ts` does. Do not "fix"
// this by importing `referenceUuid` and `mappingUuid` from the compiler.
//
// This gate exists to prove the compiler's identifiers are deterministic from
// the ADR-0002 tuple. Calling the compiler's own function to compute the
// expected value would make every assertion below a tautology that passes
// whatever the compiler does — including silently re-minting all 86k
// identifiers. Two implementations that must agree is the whole check.
const REFERENCE_NS = 'b1a3670e-2ac7-544c-a1b9-396e0dc193f7';
const MAPPING_NS = 'f16bb214-4241-549d-ad41-7b011f02befb';

const registry = compileRegistry();

let failed = 0;
let checked = 0;

function reportIssue(
	label: string,
	issues: readonly { path: readonly PropertyKey[]; message: string }[],
): void {
	console.error(`✗ ${label}:`);
	printIssues(issues);
	failed++;
}

for (const w of registry.works) {
	const r = Work.safeParse(w);
	checked++;
	if (!r.success) reportIssue(`work/${w.key}`, r.error.issues);
}

for (const s of registry.systems) {
	const r = CitationSystem.safeParse(s);
	checked++;
	if (!r.success) reportIssue(`system/${s.key}`, r.error.issues);
}

for (const ref of registry.references) {
	const r = CanonicalReference.safeParse(ref);
	checked++;
	if (!r.success) {
		reportIssue(`ref/${ref.work_key}/${ref.locator}`, r.error.issues);
		continue;
	}
	const seed = [ref.work_key, ref.citation_system_key, ref.locator].join('\n');
	const expected = refIri(uuidv5(seed, REFERENCE_NS));
	if (ref.id !== expected) {
		console.error(
			`✗ ref/${ref.work_key}/${ref.locator}: UUID not deterministic from seed (got ${ref.id}, expected ${expected})`,
		);
		failed++;
	}
}

for (const m of registry.mappings) {
	const r = MappingAssertion.safeParse(m);
	checked++;
	if (!r.success) {
		reportIssue(`mapping/${m.id}`, r.error.issues);
		continue;
	}
	const seed = [m.subject, m.relation, m.target.identifier].join('\n');
	const expected = mappingIri(uuidv5(seed, MAPPING_NS));
	if (m.id !== expected) {
		console.error(
			`✗ mapping/${m.id}: UUID not deterministic from seed (expected ${expected})`,
		);
		failed++;
	}
}

// JSON-LD context completeness — every emitted record key MUST resolve to a
// mapped term in public/contexts/v1.jsonld. Unmapped keys are silently dropped
// on RDF expansion, so a missing term is a wire-format bug.
const contextPath = join(projectRoot, 'public', 'contexts', 'v1.jsonld');
const contextDoc = JSON.parse(readFileSync(contextPath, 'utf8')) as {
	'@context': Record<string, unknown>;
};
const mappedKeys = new Set(Object.keys(contextDoc['@context']));

const unmapped = new Set<string>();
function walk(node: unknown): void {
	if (Array.isArray(node)) {
		for (const item of node) walk(item);
		return;
	}
	if (node === null || typeof node !== 'object') return;
	for (const [k, v] of Object.entries(node)) {
		if (!mappedKeys.has(k)) unmapped.add(k);
		walk(v);
	}
}

for (const r of registry.works) walk(r);
for (const r of registry.systems) walk(r);
for (const r of registry.references) walk(r);
for (const r of registry.mappings) walk(r);

if (unmapped.size > 0) {
	console.error(
		`\n✗ JSON-LD context is missing terms for emitted keys: ${[...unmapped].sort().join(', ')}`,
	);
	console.error(`  Add them to ${contextPath} or stop emitting the field.`);
	failed += unmapped.size;
}

// --- Frozen identifiers ------------------------------------------------------
//
// The recomputation above proves the compiler agrees with a second
// implementation of the ADR-0002 seed rule. It does not prove either one still
// produces the identifiers the registry published, because both are code: edit
// the seed rule in `scripts/compile.ts` and in this file — the natural move
// when the check goes red — and every assertion passes while all 86k
// identifiers silently re-mint.
//
// These are data, so no edit to any implementation can satisfy them. Each pair
// was taken from the v0.1.0 baseline: one reference per citation system, and
// one mapping per relation, because the relation is part of the mapping seed.
//
// A failure here is not a test to fix. It means the identifiers the registry
// promised have moved, and a published citation has stopped resolving. ADR-0003
// allows that for a `draft` record; after the v0.1.0 tag it is a breaking
// change, and the tombstone rules in specification §12 apply.
const FROZEN_REFERENCE_IDS: ReadonlyArray<[string, string, string, string]> = [
	[
		'confucius.analects',
		'analects-book-chapter',
		'11.3',
		'00e5c911-4eb8-5309-b38e-a409d8bf3c2b',
	],
	[
		'aristotle.nicomachean-ethics',
		'bekker',
		'1103b26',
		'000112c4-c060-5823-8fe9-c4632d7c9b2b',
	],
	[
		'new-testament',
		'bible-book-chapter-verse',
		'Luke.1.77',
		'0001f355-684b-5c1d-978d-351ed95824c0',
	],
	[
		'dante.commedia',
		'dante-cantica-canto-verse',
		'Purg.9.41',
		'00084ac1-eb8c-50c5-abe7-d90e44909314',
	],
	[
		'laozi.daodejing',
		'daodejing-chapter',
		'61',
		'024cf6b6-b1d0-5b90-b0fa-5b99ce612a35',
	],
	[
		'dhammapada',
		'dhammapada-chapter-verse',
		'14.1',
		'003e3b7a-8893-5917-a731-62a2fa02621b',
	],
	[
		'murasaki-shikibu.genji',
		'genji-chapter',
		'47',
		'013ade7c-241d-5685-9c7f-97ae56a860ee',
	],
	[
		'homer.iliad',
		'homer-book-line',
		'7.18',
		'0002587e-7044-516a-9825-f740950b9663',
	],
	[
		'hume.treatise',
		'hume-book-part-section-paragraph',
		'2.2.10.4',
		'001ef489-c761-53b1-8a07-ce51c95ea4c1',
	],
	[
		'hume.enquiry-human-understanding',
		'hume-section-paragraph',
		'1.13',
		'0053bd60-ae8c-59c6-bf37-fbf44241b0a8',
	],
	[
		'wittgenstein.philosophical-investigations',
		'integer-section',
		'76',
		'00164dc6-f185-5081-b9e4-84d59a9ab0e1',
	],
	[
		'plato.republic',
		'stephanus',
		'509b',
		'00182f77-1597-5f2f-b215-59af4c645640',
	],
	[
		'wittgenstein.tractatus',
		'tractatus-proposition',
		'2.0231',
		'007377e5-fe05-545a-a4ff-24ee9f016aa9',
	],
];

const FROZEN_MAPPING_IDS: ReadonlyArray<[string, string, string, string]> = [
	[
		'homer.iliad',
		'alternateOf',
		'https://www.wikidata.org/entity/Q8275',
		'158a91fb-ac10-5c1c-b048-1fca5d421289',
	],
	[
		'homer.iliad',
		'isReferencedBy',
		'https://en.wikipedia.org/wiki/Iliad',
		'14fe951b-bb68-5b82-943a-ca122b2bb61b',
	],
];

const refByTuple = new Map(
	registry.references.map((r) => [
		[r.work_key, r.citation_system_key, r.locator].join('\n'),
		r.id,
	]),
);
for (const [work, system, locator, uuid] of FROZEN_REFERENCE_IDS) {
	checked++;
	const actual = refByTuple.get([work, system, locator].join('\n'));
	const expected = refIri(uuid);
	if (actual === undefined) {
		console.error(
			`✗ frozen ${work}/${system}/${locator}: no such reference in the registry`,
		);
		failed++;
	} else if (actual !== expected) {
		console.error(
			`✗ frozen ${work}/${system}/${locator}: identifier moved\n    was      ${expected}\n    compiled ${actual}`,
		);
		failed++;
	}
}

const mappingById = new Map(registry.mappings.map((m) => [m.id, m]));
for (const [work, relation, identifier, uuid] of FROZEN_MAPPING_IDS) {
	checked++;
	const expected = mappingIri(uuid);
	const found = mappingById.get(expected);
	if (!found) {
		console.error(
			`✗ frozen mapping ${work} ${relation} ${identifier}: ${expected} is no longer minted`,
		);
		failed++;
	}
}

console.log(
	`\n${checked - failed}/${checked} records valid (works=${registry.works.length}, systems=${registry.systems.length}, refs=${registry.references.length}, mappings=${registry.mappings.length}); ${FROZEN_REFERENCE_IDS.length + FROZEN_MAPPING_IDS.length} frozen identifiers unchanged`,
);
if (failed > 0) process.exit(1);
