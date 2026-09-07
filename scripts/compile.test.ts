// Compiler coverage for the alias grammar and status dependency rules
// introduced by ADR-0005, on top of ADR-0004's two-state lifecycle.
//
// Each case builds a throwaway registry directory and compiles it, so the tests
// exercise the real YAML → record path (source validation included) rather than
// a hand-written CompiledRegistry.
import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import {
	mkdtempSync,
	mkdirSync,
	writeFileSync,
	readFileSync,
	readdirSync,
	rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { v5 as uuidv5 } from 'uuid';
import { createHash } from 'node:crypto';
import {
	compileRegistry,
	citeRedirectHtml,
	writeCiteRedirects,
	dumpResources,
	describeResource,
	DUMP_MANIFEST,
	packageVersion,
	type CompiledRegistry,
} from './compile.js';
import { LanguageTag } from '../standard/schema/common.js';
import { Work } from '../standard/schema/work.js';

type RegistryFiles = {
	systems: Record<string, string>;
	works: Record<string, string>;
};

function compileFixture(files: RegistryFiles): CompiledRegistry {
	const root = mkdtempSync(join(tmpdir(), 'textrefs-compile-'));
	try {
		mkdirSync(join(root, 'systems'));
		mkdirSync(join(root, 'works'));
		for (const [name, body] of Object.entries(files.systems)) {
			writeFileSync(join(root, 'systems', `${name}.yaml`), body);
		}
		for (const [name, body] of Object.entries(files.works)) {
			writeFileSync(join(root, 'works', `${name}.yaml`), body);
		}
		return compileRegistry(root);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

/** Compile expecting failure, without the expected diagnostics spamming stdout. */
function expectCompileError(t: TestContext, files: RegistryFiles): string {
	t.mock.method(console, 'error', () => {});
	try {
		compileFixture(files);
	} catch (e) {
		return e instanceof Error ? e.message : String(e);
	}
	assert.fail('expected compileRegistry to throw');
}

const system = (
	key: string,
	status = 'active',
	regex = '^(?<section>[1-9][0-9]*)$',
) => `
key: ${key}
preferred_label: ${key}
description: Test citation system ${key}.
locator_regex: '${regex}'
status: ${status}
created: 2026-01-01
modified: 2026-01-01
`;

const workHeader = (status = 'active') => `
work:
  key: test.work
  preferred_label: Test Work
  status: ${status}
  created: 2026-01-01
  modified: 2026-01-01
`;

const twoSystems = {
	'primary-section': system('primary-section'),
	'fallback-section': system('fallback-section'),
};

test('a work under two systems mints one bare and two qualified aliases', () => {
	const reg = compileFixture({
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'

additional_systems:
  - citation_system: fallback-section
    references:
      - '5'
`,
		},
	});

	const primary = reg.references.find(
		(r) => r.citation_system_key === 'primary-section',
	);
	const fallback = reg.references.find(
		(r) => r.citation_system_key === 'fallback-section',
	);
	assert.ok(primary && fallback, 'both references are compiled');
	assert.notEqual(
		primary.id,
		fallback.id,
		'the same locator under two systems is two identities',
	);

	// Qualified for both, bare only for the preferred system.
	assert.equal(reg.aliases['test.work/primary-section/5'], primary.id);
	assert.equal(reg.aliases['test.work/fallback-section/5'], fallback.id);
	assert.equal(reg.aliases['test.work/5'], primary.id);

	const workAliases = Object.keys(reg.aliases).filter((a) =>
		a.startsWith('test.work/'),
	);
	assert.deepEqual(workAliases.sort(), [
		'test.work/5',
		'test.work/fallback-section/5',
		'test.work/primary-section/5',
	]);
});

test('declaring the same citation system twice is rejected at parse time', (t) => {
	const message = expectCompileError(t, {
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'

additional_systems:
  - citation_system: primary-section
    references:
      - '6'
`,
		},
	});
	assert.match(message, /invalid source file/);
});

// A key is the whole identity of a work or a citation system. Two files
// claiming one used to pass: the systems Map kept the last file read and
// dropped the other, and works had no check at all — so the second work would
// mint the same reference UUIDs as the first, because ADR-0002 seeds them on
// `(work_key, citation_system_key, locator)`. `setAlias` cannot catch that,
// since both files produce the same alias target.

test('two files declaring one citation system key fail the build', (t) => {
	const message = expectCompileError(t, {
		systems: {
			'first-file': system('shared'),
			'second-file': system('shared'),
		},
		works: {
			'test.work': `${workHeader()}
citation_system: shared
references:
  - '1'
`,
		},
	});
	assert.match(message, /citation system key "shared" is declared twice/);
});

test('two files declaring one work key fail the build', (t) => {
	const body = `${workHeader()}
citation_system: primary-section
references:
  - '1'
`;
	const message = expectCompileError(t, {
		systems: twoSystems,
		works: { 'first-file': body, 'second-file': body },
	});
	assert.match(message, /work key "test.work" is declared twice/);
});

test('a locator containing "/" is rejected before any alias is minted', (t) => {
	const message = expectCompileError(t, {
		systems: {
			'slashed-section': system(
				'slashed-section',
				'active',
				'^(?<a>[0-9]+)/(?<b>[0-9]+)$',
			),
		},
		works: {
			'test.work': `${workHeader()}
citation_system: slashed-section
references:
  - '1/5'
`,
		},
	});
	assert.match(message, /alias grammar/);
});

test('an active reference under a draft citation system is rejected', (t) => {
	const message = expectCompileError(t, {
		systems: {
			'primary-section': system('primary-section'),
			'fallback-section': system('fallback-section', 'draft'),
		},
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'

additional_systems:
  - citation_system: fallback-section
    reference_status: active
    references:
      - '5'
`,
		},
	});
	assert.match(message, /active reference requires an active citation system/);
});

for (const workStatus of [
	'draft',
	'active',
	'deprecated',
	'withdrawn',
	'blocked',
]) {
	for (const systemStatus of [
		'draft',
		'active',
		'deprecated',
		'withdrawn',
		'blocked',
	]) {
		test(`an empty ${workStatus} work with a ${systemStatus} preferred system obeys dependency rules`, (t) => {
			const files = {
				systems: { 'primary-section': system('primary-section', systemStatus) },
				works: {
					'test.work': `${workHeader(workStatus)}
citation_system: primary-section
`,
				},
			};
			if (
				!['withdrawn', 'blocked'].includes(workStatus) &&
				['withdrawn', 'blocked'].includes(systemStatus)
			) {
				assert.ok(
					expectCompileError(t, files).includes(
						'https://textrefs.org/id/work/test.work: live work points at tombstoned preferred citation system https://textrefs.org/id/system/primary-section',
					),
				);
			} else if (workStatus === 'active' && systemStatus !== 'active') {
				assert.match(
					expectCompileError(t, files),
					/active work requires an active preferred citation system/,
				);
			} else {
				const reg = compileFixture(files);
				assert.equal(reg.works[0].status, workStatus);
				assert.equal(reg.systems[0].status, systemStatus);
				assert.equal(reg.references.length, 0);
			}
		});
	}
}

test('a draft fallback system does not downgrade an active work', () => {
	const reg = compileFixture({
		systems: {
			'primary-section': system('primary-section'),
			'fallback-section': system('fallback-section', 'draft'),
		},
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'

additional_systems:
  - citation_system: fallback-section
    references:
      - '5'
`,
		},
	});
	assert.equal(reg.works[0].status, 'active');
	const fallback = reg.references.find(
		(r) => r.citation_system_key === 'fallback-section',
	);
	assert.equal(fallback?.status, 'draft');
});

test('an additional system defaults to draft references even on an active work', () => {
	const reg = compileFixture({
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'

additional_systems:
  - citation_system: fallback-section
    references:
      - '5'
`,
		},
	});
	const bySystem = Object.fromEntries(
		reg.references.map((r) => [r.citation_system_key, r.status]),
	);
	assert.equal(bySystem['primary-section'], 'active');
	assert.equal(bySystem['fallback-section'], 'draft');
});

test('every compiled work carries preferred_citation_system_key', () => {
	const reg = compileFixture({
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'
`,
		},
	});
	for (const work of reg.works) {
		assert.equal(work.preferred_citation_system_key, 'primary-section');
	}
});

// --- Alternative labels (ADR-0007) ----------------------------------------

/** A work header whose `work:` block carries an `alternative_labels:` list. */
const workWithLabels = (labels: string[]) => ({
	systems: twoSystems,
	works: {
		'test.work': `
work:
  key: test.work
  preferred_label: Test Work
  alternative_labels:
${labels.map((l) => `    - '${l}'`).join('\n')}
  status: active
  created: 2026-01-01
  modified: 2026-01-01

citation_system: primary-section
references:
  - '5'
`,
	},
});

test('authored alternative labels reach the compiled work in order', () => {
	const reg = compileFixture(workWithLabels(['TW', 'Testwerk']));
	const work = reg.works.find((w) => w.key === 'test.work');
	assert.ok(work);
	assert.deepEqual(work.alternative_labels, ['TW', 'Testwerk']);
});

test('a work without alternative labels omits the key entirely', () => {
	const reg = compileFixture({
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'
`,
		},
	});
	const work = reg.works.find((w) => w.key === 'test.work');
	assert.ok(work);
	assert.ok(!('alternative_labels' in work));
});

test('an empty alternative_labels list is an authoring error', (t) => {
	const message = expectCompileError(t, {
		systems: twoSystems,
		works: {
			'test.work': `
work:
  key: test.work
  preferred_label: Test Work
  alternative_labels: []
  status: active
  created: 2026-01-01
  modified: 2026-01-01

citation_system: primary-section
references:
  - '5'
`,
		},
	});
	assert.match(message, /invalid source file/);
});

test('repeating one alternative label within a work is an authoring error', (t) => {
	const message = expectCompileError(t, workWithLabels(['TW', 'TW']));
	assert.match(message, /invalid source file/);
});

test('an alternative label equal to the preferred label is an authoring error', (t) => {
	const message = expectCompileError(t, workWithLabels(['Test Work']));
	assert.match(message, /invalid source file/);
});

test('two different works may share one alternative label', () => {
	const shared = (key: string, label: string) => `
work:
  key: ${key}
  preferred_label: ${label}
  alternative_labels:
    - 'Ethics'
  status: active
  created: 2026-01-01
  modified: 2026-01-01

citation_system: primary-section
references:
  - '5'
`;
	const reg = compileFixture({
		systems: twoSystems,
		works: {
			'aristotle.ne': shared('aristotle.ne', 'Nicomachean Ethics'),
			'spinoza.ethica': shared('spinoza.ethica', 'Ethica'),
		},
	});
	const claimants = reg.works.filter((w) =>
		(w.alternative_labels ?? []).includes('Ethics'),
	);
	assert.equal(claimants.length, 2);
});

// An alternative label is not a UUID seed input (ADR-0002), so editing one
// must leave every minted identifier where it was.
test('alternative labels never move a reference identifier', () => {
	const withLabels = compileFixture(workWithLabels(['TW']));
	const withOtherLabels = compileFixture(workWithLabels(['Testwerk', 'TW-2']));
	assert.deepEqual(
		withLabels.references.map((r) => r.id),
		withOtherLabels.references.map((r) => r.id),
	);
});

// The rules above are enforced on the published record too, not only on the
// authored YAML — a hand-built record that reaches a consumer must not be able
// to carry an empty list, a repeat, or the preferred label.
const workRecord = (alternative_labels?: string[]) => ({
	id: 'https://textrefs.org/id/work/test.work',
	key: 'test.work',
	type: 'Work' as const,
	preferred_label: 'Test Work',
	...(alternative_labels ? { alternative_labels } : {}),
	preferred_citation_system_key: 'primary-section',
	status: 'active' as const,
	created: '2026-01-01',
	modified: '2026-01-01',
});

test('the canonical Work schema accepts a well-formed label list', () => {
	assert.equal(Work.safeParse(workRecord(['TW', 'Testwerk'])).success, true);
	assert.equal(Work.safeParse(workRecord()).success, true);
});

test('the canonical Work schema rejects an empty label list', () => {
	assert.equal(Work.safeParse(workRecord([])).success, false);
});

test('the canonical Work schema rejects a repeated label', () => {
	const result = Work.safeParse(workRecord(['TW', 'TW']));
	assert.equal(result.success, false);
	assert.match(
		result.error?.issues[0]?.message ?? '',
		/declared more than once/,
	);
});

test('the canonical Work schema rejects a label equal to preferred_label', () => {
	const result = Work.safeParse(workRecord(['Test Work']));
	assert.equal(result.success, false);
	assert.match(
		result.error?.issues[0]?.message ?? '',
		/repeats the preferred label/,
	);
});

// --- Mapping relation vocabulary (ADR-0006) -------------------------------

const mappings = `
mappings:
  - relation: alternateOf
    identifier: 'https://www.wikidata.org/entity/Q1'
    source: manual-curation
    status: active
    created: 2026-01-01
    modified: 2026-01-01
  - relation: isReferencedBy
    identifier: 'https://en.wikipedia.org/wiki/Test'
    source: manual-curation
    status: active
    created: 2026-01-01
    modified: 2026-01-01
`;

const workWithMappings = (extra = '') => ({
	systems: twoSystems,
	works: {
		'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'
${mappings}${extra}`,
	},
});

test('the work projection groups every relation onto its own array', () => {
	const reg = compileFixture(workWithMappings());
	const work = reg.works.find((w) => w.key === 'test.work');
	assert.ok(work);
	assert.deepEqual(work.alternateOf, ['https://www.wikidata.org/entity/Q1']);
	assert.deepEqual(work.isReferencedBy, ['https://en.wikipedia.org/wiki/Test']);
	assert.equal(reg.mappings.length, 2);
});

test('tombstoned mappings are excluded from the projection', () => {
	const reg = compileFixture({
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'

mappings:
  - relation: alternateOf
    identifier: 'https://www.wikidata.org/entity/Q1'
    source: manual-curation
    status: withdrawn
    created: 2026-01-01
    modified: 2026-01-01
  - relation: isReferencedBy
    identifier: 'https://en.wikipedia.org/wiki/Test'
    source: manual-curation
    status: blocked
    created: 2026-01-01
    modified: 2026-01-01
`,
		},
	});
	const work = reg.works.find((w) => w.key === 'test.work');
	assert.ok(work);
	assert.equal(work.alternateOf, undefined);
	assert.equal(work.isReferencedBy, undefined);
	// The reified assertions survive as tombstones; only the projection drops them.
	assert.equal(reg.mappings.length, 2);
});

test('deprecated mappings are excluded from the projection', () => {
	const reg = compileFixture({
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'

mappings:
  - relation: alternateOf
    identifier: 'https://www.wikidata.org/entity/Q1'
    source: manual-curation
    status: deprecated
    created: 2026-01-01
    modified: 2026-01-01
  - relation: isReferencedBy
    identifier: 'https://en.wikipedia.org/wiki/Test'
    source: manual-curation
    status: deprecated
    created: 2026-01-01
    modified: 2026-01-01
`,
		},
	});
	const work = reg.works.find((w) => w.key === 'test.work');
	assert.ok(work);
	// `deprecated` is retained but no longer recommended (specification §12), so
	// the unqualified edge must not advertise it (#45).
	assert.equal(work.alternateOf, undefined);
	assert.equal(work.isReferencedBy, undefined);
	// The reified assertions survive; only the projection drops them.
	assert.equal(reg.mappings.length, 2);
});

test('mapping IRIs are deterministic from [subject, relation, target]', () => {
	const reg = compileFixture(workWithMappings());
	// Recomputed independently here, exactly as validate-data.ts and any
	// third-party implementation would (identifier-syntax, MappingAssertion seed).
	for (const m of reg.mappings) {
		const seed = [m.subject, m.relation, m.target.identifier].join('\n');
		assert.equal(
			m.id,
			`https://textrefs.org/id/mapping/${uuidv5(seed, 'f16bb214-4241-549d-ad41-7b011f02befb')}`,
		);
	}
	// The relation is *in* the seed, so reclassifying a target re-mints its IRI.
	const [alternate, referenced] = reg.mappings;
	assert.notEqual(alternate.id, referenced.id);
});

test('a relation outside the enum is rejected at parse time', (t) => {
	const message = expectCompileError(t, {
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'

mappings:
  - relation: closeMatch
    identifier: 'https://en.wikipedia.org/wiki/Test'
    source: manual-curation
    status: active
    created: 2026-01-01
    modified: 2026-01-01
`,
		},
	});
	assert.match(message, /test\.work/);
});

// --- Resolver URL expansion -------------------------------------------------
//
// `vars` (this section's main subject) rides on the same skip-and-warn path as
// a missing template variable, so the pre-existing `url` / `url_by` behaviour
// is pinned here too — it had no coverage before.

const bookChapter = {
	'book-chapter': system(
		'book-chapter',
		'active',
		'^(?<book>[1-4]?[A-Za-z]+)\\.(?<chapter>[1-9][0-9]*)$',
	),
};

/** One work, one resolver, two locators — `Gen.1` and `John.3`. */
const workWithResolver = (resolver: string) => ({
	systems: bookChapter,
	works: {
		'test.work': `${workHeader()}
citation_system: book-chapter
resolvers:
${resolver}
references:
  - 'Gen.1'
  - 'John.3'
`,
	},
});

const urlFor = (reg: CompiledRegistry, locator: string) =>
	reg.references.find((r) => r.locator === locator)?.resolver_targets[0]?.url;

test('a url template expands the locator capture groups', () => {
	const reg = compileFixture(
		workWithResolver(`  - url: 'https://example.org/{book}/{chapter}'`),
	);
	assert.equal(urlFor(reg, 'Gen.1'), 'https://example.org/Gen/1');
	assert.equal(urlFor(reg, 'John.3'), 'https://example.org/John/3');
	assert.equal(reg.warnings, 0);
});

test('url_by picks a whole URL by key, and an absent key skips the entry', () => {
	const reg = compileFixture(
		workWithResolver(`  - url_by:
      book:
        Gen: 'https://example.org/genesis'`),
	);
	assert.equal(urlFor(reg, 'Gen.1'), 'https://example.org/genesis');
	assert.equal(urlFor(reg, 'John.3'), undefined, 'John has no url_by entry');
	assert.equal(reg.warnings, 1);
});

test('vars translates a locator value into the provider vocabulary', () => {
	const reg = compileFixture(
		workWithResolver(`  - vars:
      bookUsfm:
        from: book
        map:
          Gen: GEN
          John: JHN
    url: 'https://example.org/{bookUsfm}.{chapter}/#{bookUsfm}.{chapter}'`),
	);
	assert.equal(urlFor(reg, 'Gen.1'), 'https://example.org/GEN.1/#GEN.1');
	assert.equal(urlFor(reg, 'John.3'), 'https://example.org/JHN.3/#JHN.3');
	assert.equal(reg.warnings, 0);
});

test('a hole in a vars map skips the entry and warns rather than emitting a wrong URL', () => {
	const reg = compileFixture(
		workWithResolver(`  - vars:
      bookUsfm:
        from: book
        map:
          Gen: GEN
    url: 'https://example.org/{bookUsfm}.{chapter}'`),
	);
	assert.equal(urlFor(reg, 'Gen.1'), 'https://example.org/GEN.1');
	assert.equal(urlFor(reg, 'John.3'), undefined, 'John is unmapped');
	assert.equal(reg.warnings, 1);
});

test('vars composes with url_by', () => {
	const reg = compileFixture(
		workWithResolver(`  - vars:
      slug:
        from: book
        map:
          Gen: genesis
          John: john
    url_by:
      slug:
        genesis: 'https://example.org/a'
        john: 'https://example.org/b'`),
	);
	assert.equal(urlFor(reg, 'Gen.1'), 'https://example.org/a');
	assert.equal(urlFor(reg, 'John.3'), 'https://example.org/b');
	assert.equal(reg.warnings, 0);
});

test('a vars name that shadows a locator variable is rejected', (t) => {
	const message = expectCompileError(
		t,
		workWithResolver(`  - vars:
      book:
        from: book
        map:
          Gen: GEN
    url: 'https://example.org/{book}'`),
	);
	assert.match(message, /shadows a locator-derived variable/);
});

// Variable names and locator values are both author-controlled, so every lookup
// on the way to a URL is own-property only. On a plain object these three cases
// would inherit from Object.prototype and expand into a published URL.

test('a template variable naming an Object.prototype member is absent, not inherited', () => {
	const reg = compileFixture(
		workWithResolver(`  - url: 'https://example.org/{book}/{toString}'`),
	);
	assert.equal(urlFor(reg, 'Gen.1'), undefined);
	assert.equal(urlFor(reg, 'John.3'), undefined);
	assert.equal(reg.warnings, 2);
});

test('a locator value naming an Object.prototype member misses the vars map', () => {
	const reg = compileFixture({
		systems: bookChapter,
		works: {
			'test.work': `${workHeader()}
citation_system: book-chapter
resolvers:
  - vars:
      bookUsfm:
        from: book
        map:
          Gen: GEN
    url: 'https://example.org/{bookUsfm}.{chapter}'
references:
  - 'Gen.1'
  - 'toString.1'
`,
		},
	});
	assert.equal(urlFor(reg, 'Gen.1'), 'https://example.org/GEN.1');
	assert.equal(
		urlFor(reg, 'toString.1'),
		undefined,
		'toString is not a mapped book',
	);
	assert.equal(reg.warnings, 1);
});

// --- Resolver licences -------------------------------------------------------

test('an SPDX license id becomes the canonical SPDX IRI', () => {
	const reg = compileFixture(
		workWithResolver(`  - url: 'https://example.org/{book}/{chapter}'
    license: CC-BY-4.0`),
	);
	assert.equal(
		reg.references.find((r) => r.locator === 'Gen.1')?.resolver_targets[0]
			?.license,
		'https://spdx.org/licenses/CC-BY-4.0',
	);
});

test('a non-SPDX license id fails the build instead of dropping the licence', (t) => {
	const logged: string[] = [];
	t.mock.method(console, 'error', (...args: unknown[]) => {
		logged.push(args.join(' '));
	});
	assert.throws(() =>
		compileFixture(
			workWithResolver(`  - url: 'https://example.org/{book}/{chapter}'
    license: CC-BY-4`),
		),
	);
	assert.match(logged.join('\n'), /not an SPDX license id/);
});

test('url_by with more than one selector variable is rejected at parse time', (t) => {
	// The thrown message only names the file; the failing rule goes to
	// console.error, so capture it rather than assert on any parse error.
	const logged: string[] = [];
	t.mock.method(console, 'error', (...args: unknown[]) => {
		logged.push(args.join(' '));
	});
	assert.throws(() =>
		compileFixture(
			workWithResolver(`  - url_by:
      book:
        Gen: 'https://example.org/genesis'
      chapter:
        '1': 'https://example.org/one'`),
		),
	);
	assert.match(logged.join('\n'), /url_by takes exactly one selector variable/);
});

// --- Resolver language tags (BCP 47) -----------------------------------------

test('a malformed language tag is rejected at parse time', (t) => {
	const message = expectCompileError(
		t,
		workWithResolver(`  - url: 'https://example.org/{book}/{chapter}'
    language: 'e n'`),
	);
	assert.match(message, /test\.work/);
});

test('a well-formed subtagged language tag is accepted', () => {
	const reg = compileFixture(
		workWithResolver(`  - url: 'https://example.org/{book}/{chapter}'
    language: grc-Grek`),
	);
	assert.equal(
		reg.references.find((r) => r.locator === 'Gen.1')?.resolver_targets[0]
			?.language,
		'grc-Grek',
	);
});

// RFC 5646 keeps grandfathered tags outside the langtag production it defines,
// so `LanguageTag` accepts or rejects them by whether they happen to parse as a
// langtag. This locks that split, which the comment on `LanguageTag` describes.
test('regular grandfathered tags parse and irregular ones do not', () => {
	const regular = [
		'art-lojban',
		'cel-gaulish',
		'no-bok',
		'no-nyn',
		'zh-guoyu',
		'zh-hakka',
		'zh-min',
		'zh-min-nan',
		'zh-xiang',
	];
	const irregular = [
		'en-GB-oed',
		'i-ami',
		'i-bnn',
		'i-default',
		'i-enochian',
		'i-hak',
		'i-klingon',
		'i-lux',
		'i-mingo',
		'i-navajo',
		'i-pwn',
		'i-tao',
		'i-tay',
		'i-tsu',
		'sgn-BE-FR',
		'sgn-BE-NL',
		'sgn-CH-DE',
	];
	assert.deepEqual(
		regular.filter((tag) => !LanguageTag.safeParse(tag).success),
		[],
	);
	assert.deepEqual(
		irregular.filter((tag) => LanguageTag.safeParse(tag).success),
		[],
	);
});

// --- Dump resources (#84) -------------------------------------------------

// `workWithMappings` gives an alias table with both kinds of entry: `/cite/`
// aliases targeting reference IRIs, and external identifiers targeting the work
// IRI.
const dumped = () => dumpResources(compileFixture(workWithMappings()));

const aliasSpec = (specs: ReturnType<typeof dumpResources>) => {
	const spec = specs.find((s) => s.name === 'aliases');
	assert.ok(spec, 'the dump carries an alias resource');
	return spec;
};

test('the dump carries the alias table beside the four JSONL resources', () => {
	const specs = dumped();
	assert.deepEqual(
		specs.map((s) => s.name),
		['works', 'citation-systems', 'references', 'mappings', 'aliases'],
	);
	const spec = aliasSpec(specs);
	assert.equal(spec.filename, 'aliases.json');
	assert.equal(spec.format, 'json');
	assert.equal(spec.mediatype, 'application/json');
});

test('the alias resource body is the whole alias table', () => {
	const reg = compileFixture(workWithMappings());
	const spec = aliasSpec(dumpResources(reg));
	const table = JSON.parse(spec.body) as Record<string, string>;
	assert.deepEqual(table, reg.aliases);
	// A `/cite/` alias resolves to a reference; an external identifier resolves
	// to the work. A `://` in the key marks the second kind.
	assert.match(
		table['test.work/primary-section/5'],
		/^https:\/\/textrefs\.org\/id\/ref\//,
	);
	assert.equal(
		table['https://www.wikidata.org/entity/Q1'],
		'https://textrefs.org/id/work/test.work',
	);
});

test('alias keys are sorted, so the body does not depend on visit order', () => {
	const keys = Object.keys(JSON.parse(aliasSpec(dumped()).body));
	assert.ok(keys.length > 1);
	assert.deepEqual(keys, [...keys].sort());
});

test('the alias body is minified and newline-terminated', () => {
	const body = aliasSpec(dumped()).body;
	assert.equal(body.split('\n').length, 2);
	assert.ok(body.startsWith('{"'));
	assert.ok(body.endsWith('}\n'));
});

test('every descriptor states the bytes and sha256 of its own body', () => {
	for (const spec of dumped()) {
		const d = describeResource(spec);
		// Recomputed the way a downstream consumer verifies a download.
		assert.equal(d.bytes, Buffer.byteLength(spec.body, 'utf8'));
		assert.equal(
			d.hash,
			`sha256:${createHash('sha256').update(spec.body).digest('hex')}`,
		);
	}
});

test('every descriptor carries the Frictionless fields', () => {
	for (const spec of dumped()) {
		const d = describeResource(spec);
		assert.equal(d.profile, 'data-resource');
		assert.equal(d.encoding, 'utf-8');
		assert.equal(d.path, spec.filename);
		assert.equal(d.name, spec.name);
	}
});

// `/dump/index.astro` renders DUMP_MANIFEST so that building the page costs no
// serialisation. Both it and `dumpResources` are derived from the one
// `DUMP_SPECS` list, so they can no longer disagree about the set or its order.
// What still needs pinning is that the manifest carries no body: forcing one is
// exactly what the split exists to avoid.
test('DUMP_MANIFEST lists the files without carrying a body', () => {
	assert.deepEqual(
		DUMP_MANIFEST.map(({ name, filename, format }) => ({
			name,
			filename,
			format,
		})),
		dumpResources(compileFixture(workWithMappings())).map(
			({ name, filename, format }) => ({ name, filename, format }),
		),
	);
	for (const entry of DUMP_MANIFEST) assert.ok(!('body' in entry));
});

test('packageVersion drops a leading v and leaves the rest alone', () => {
	assert.equal(packageVersion('v0.1.0'), '0.1.0');
	assert.equal(packageVersion('0.1.0'), '0.1.0');
	assert.equal(packageVersion('v1.2.3-rc.1'), '1.2.3-rc.1');
});

test('the JSONL bodies are unchanged by the alias-resource refactor', () => {
	const reg = compileFixture(workWithMappings());
	const specs = dumpResources(reg);
	const bodyOf = (name: string) => specs.find((s) => s.name === name)?.body;
	assert.equal(
		bodyOf('works'),
		reg.works.map((r) => JSON.stringify(r)).join('\n') + '\n',
	);
	assert.equal(
		bodyOf('references'),
		reg.references.map((r) => JSON.stringify(r)).join('\n') + '\n',
	);
	// An empty record array still yields an empty body, not a bare newline.
	assert.equal(
		dumpResources({ ...reg, mappings: [] }).find((s) => s.name === 'mappings')
			?.body,
		'',
	);
});

// `/cite/` redirects. The pages are written here rather than rendered by Astro
// (see `writeCiteRedirects`), so `npm run build:fast` never exercises them and
// these tests are the only cover the writer has.

test('a redirect page carries the target, a title, a lang and nothing else', () => {
	const html = citeRedirectHtml('/id/ref/uuid/', false);
	assert.equal(
		html,
		'<!doctype html><html lang="en"><meta charset="utf-8">' +
			'<title>Redirecting</title>' +
			'<meta http-equiv="refresh" content="0;url=/id/ref/uuid/">' +
			'<link rel="canonical" href="/id/ref/uuid/">' +
			'<p>Redirecting to <a href="/id/ref/uuid/">the record</a>.',
	);
});

test('the redirect page stays small, because there are 172,794 of them', () => {
	// A UUID target is the longest form the compiler writes.
	const html = citeRedirectHtml(
		'/id/ref/dc799d4b-9b17-5d76-85aa-dfd001c5321d/',
		true,
	);
	assert.ok(
		Buffer.byteLength(html) <= 410,
		`redirect page grew to ${Buffer.byteLength(html)} bytes`,
	);
});

test('only the alias of a draft record carries noindex', () => {
	assert.ok(!citeRedirectHtml('/id/ref/uuid/', false).includes('noindex'));
	assert.ok(
		citeRedirectHtml('/id/ref/uuid/', true).includes(
			'<meta name="robots" content="noindex">',
		),
	);
});

test('every /cite/ alias gets a page, and no external identifier does', () => {
	const reg = compileFixture(
		workWithMappings(`
additional_systems:
  - citation_system: fallback-section
    references:
      - '5'
`),
	);
	const root = mkdtempSync(join(tmpdir(), 'textrefs-cite-'));
	try {
		const written = writeCiteRedirects(reg, root);

		// Three alias paths, and two mapping identifiers that are not routes.
		assert.equal(written, 3);
		assert.deepEqual(readdirSync(root), ['test.work']);

		const page = (alias: string) =>
			readFileSync(join(root, alias, 'index.html'), 'utf-8');
		const primary = reg.aliases['test.work/primary-section/5'];
		assert.equal(page('test.work/5'), page('test.work/primary-section/5'));
		assert.ok(page('test.work/5').includes(`content="0;url=/id/ref/`));
		assert.ok(page('test.work/5').includes(primary.split('/').pop() ?? ''));
		assert.notEqual(
			page('test.work/fallback-section/5'),
			page('test.work/primary-section/5'),
		);
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
});

test('a draft reference gets a noindex redirect, an active one does not', () => {
	const draft = compileFixture({
		systems: twoSystems,
		works: {
			'test.work': `${workHeader('draft')}
citation_system: primary-section
references:
  - '5'
`,
		},
	});
	const active = compileFixture({
		systems: twoSystems,
		works: {
			'test.work': `${workHeader()}
citation_system: primary-section
references:
  - '5'
`,
		},
	});

	const pageFor = (reg: CompiledRegistry) => {
		const root = mkdtempSync(join(tmpdir(), 'textrefs-cite-'));
		try {
			writeCiteRedirects(reg, root);
			return readFileSync(join(root, 'test.work', '5', 'index.html'), 'utf-8');
		} finally {
			rmSync(root, { recursive: true, force: true });
		}
	};

	assert.ok(pageFor(draft).includes('noindex'));
	assert.ok(!pageFor(active).includes('noindex'));
});
