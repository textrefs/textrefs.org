import type { CompiledRegistry } from '../../scripts/compile.js';

const fixtureWorkIri = 'https://textrefs.org/id/work/fixture.work';
const fixtureRefIri =
	'https://textrefs.org/id/ref/00000000-0000-5000-8000-000000000001';
// Same locator (`1`) under a second, non-preferred citation system — the case
// ADR-0005 exists for. Distinct identity, distinct IRI, no bare alias.
const fixtureAltRefIri =
	'https://textrefs.org/id/ref/00000000-0000-5000-8000-000000000003';
// A retired reference, superseded by the active one. Specification §12 keeps
// its identifier resolving as a tombstone, so `/find/` and the record page both
// have a tombstone branch to render under `build:fast` (#149).
const fixtureRetiredRefIri =
	'https://textrefs.org/id/ref/00000000-0000-5000-8000-000000000005';

export const fixtureRegistry: CompiledRegistry = {
	works: [
		{
			id: fixtureWorkIri,
			key: 'fixture.work',
			type: 'Work',
			preferred_label: 'Fixture Work',
			// Exercises the ADR-0007 field under `build:fast`: the record page
			// renders the list, and the registry browser finds the work by
			// "fw" and by "Musterwerk".
			alternative_labels: ['FW', 'Musterwerk'],
			preferred_citation_system_key: 'fixture-section',
			status: 'active',
			created: '2026-01-01',
			modified: '2026-01-01',
			alternateOf: ['https://example.org/fixture-work'],
			isReferencedBy: ['https://example.org/about-fixture-work'],
		},
		{
			id: 'https://textrefs.org/id/work/fixture.draft',
			key: 'fixture.draft',
			type: 'Work',
			preferred_label: 'Fixture Draft Work',
			preferred_citation_system_key: 'fixture-section',
			status: 'draft',
			created: '2026-01-01',
			modified: '2026-01-01',
		},
	],
	systems: [
		{
			id: 'https://textrefs.org/id/system/fixture-section',
			key: 'fixture-section',
			type: 'CitationSystem',
			preferred_label: 'Fixture section',
			description: 'Single positive integer section number.',
			locator_regex: '^(?<section>\\d+)$',
			status: 'active',
			created: '2026-01-01',
			modified: '2026-01-01',
		},
		{
			id: 'https://textrefs.org/id/system/fixture-alternate',
			key: 'fixture-alternate',
			type: 'CitationSystem',
			preferred_label: 'Fixture alternate numbering',
			description:
				'A competing section numbering for the same work: the same locator string denotes a different passage.',
			locator_regex: '^(?<section>\\d+)$',
			status: 'draft',
			created: '2026-01-01',
			modified: '2026-01-01',
		},
	],
	references: [
		{
			id: fixtureRefIri,
			type: 'CanonicalReference',
			work_key: 'fixture.work',
			citation_system_key: 'fixture-section',
			locator: '1',
			resolver_targets: [
				{
					url: 'https://example.org/fixture-work/1',
					language: 'en',
					provider: 'Example',
					// The compiler publishes `license` as the canonical SPDX IRI
					// (specification §9), so the fixture carries one too. Without it no
					// fixture-backed build renders the licence chip on a record page.
					license: 'https://spdx.org/licenses/CC-BY-SA-3.0',
					access: 'open',
				},
			],
			status: 'active',
			created: '2026-01-01',
			modified: '2026-01-01',
		},
		{
			id: fixtureAltRefIri,
			type: 'CanonicalReference',
			work_key: 'fixture.work',
			citation_system_key: 'fixture-alternate',
			locator: '1',
			resolver_targets: [
				{
					url: 'https://example.org/fixture-work/alt/1',
					language: 'en',
					provider: 'Example',
					// No SPDX `license`, only the provider's rights statement. This is
					// the shape of 54,380 real targets — two providers whose terms are
					// not SPDX-expressible — and the reference page rendered nothing at
					// all for it before the Rights chip.
					license_url: 'https://example.org/terms',
					access: 'open',
				},
			],
			// A fallback system enters as draft and does not downgrade the work.
			status: 'draft',
			created: '2026-01-01',
			modified: '2026-01-01',
		},
		{
			id: fixtureRetiredRefIri,
			type: 'CanonicalReference',
			work_key: 'fixture.work',
			citation_system_key: 'fixture-section',
			locator: '2',
			resolver_targets: [
				{
					url: 'https://example.org/fixture-work/2',
					language: 'en',
					provider: 'Example',
					license: 'https://spdx.org/licenses/CC-BY-SA-3.0',
					access: 'open',
				},
			],
			status: 'deprecated',
			superseded_by: fixtureRefIri,
			created: '2026-01-01',
			modified: '2026-01-01',
		},
	],
	mappings: [
		{
			id: 'https://textrefs.org/id/mapping/00000000-0000-5000-8000-000000000002',
			type: 'MappingAssertion',
			subject: fixtureWorkIri,
			relation: 'alternateOf',
			target: {
				identifier: 'https://example.org/fixture-work',
			},
			source: 'Local fixture for fast site validation.',
			status: 'active',
			created: '2026-01-01',
			modified: '2026-01-01',
		},
		// The second relation ADR-0006 defines: a page *about* the work rather
		// than another identifier for it. Present so the work page renders both
		// relation tags under `build:fast`.
		{
			id: 'https://textrefs.org/id/mapping/00000000-0000-5000-8000-000000000004',
			type: 'MappingAssertion',
			subject: fixtureWorkIri,
			relation: 'isReferencedBy',
			target: {
				identifier: 'https://example.org/about-fixture-work',
			},
			source: 'Local fixture for fast site validation.',
			status: 'active',
			created: '2026-01-01',
			modified: '2026-01-01',
		},
	],
	aliases: {
		'fixture.work/fixture-section/1': fixtureRefIri,
		'fixture.work/1': fixtureRefIri,
		'fixture.work/fixture-alternate/1': fixtureAltRefIri,
		// The compiler mints both aliases for a preferred-system block at any
		// status, so a retired reference keeps them.
		'fixture.work/fixture-section/2': fixtureRetiredRefIri,
		'fixture.work/2': fixtureRetiredRefIri,
		'https://example.org/fixture-work': fixtureWorkIri,
		'https://example.org/about-fixture-work': fixtureWorkIri,
	},
	warnings: 0,
};
