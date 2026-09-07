import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	TIER,
	acceptsLocator,
	boundedDistance,
	interpret,
	leadingTier,
	normalizeLabel,
	parseQuery,
	rankWorks,
	resolveInIndex,
	type FindSystem,
	type FindWork,
	type Interpretation,
} from './find.js';
import { buildWorkAliasIndexes } from './alias-index.js';
import { fixtureRegistry } from './registry.fixture.js';

// A trimmed copy of the real registry. The locator regexes are verbatim from
// `/reg/systems.json`, so a locator that passes here passes in the browser.
const systems: FindSystem[] = [
	{
		key: 'bekker',
		preferred_label: 'Bekker numbering (Aristotelian corpus)',
		description:
			'Bekker numbering: page, column (a or b), and line, e.g. 1094a1.',
		locator_regex:
			'^(?<page>[1-9][0-9]{0,3})(?<column>[ab])(?<line>[1-9][0-9]?)$',
	},
	{
		key: 'bible-book-chapter-verse',
		preferred_label: 'Bible book-chapter-verse (OSIS)',
		description: 'OSIS locator: `Book.Chapter.Verse`, e.g. Gen.1.1.',
		locator_regex:
			'^(?<book>[1-4]?[A-Za-z][A-Za-z0-9]*)\\.(?<chapter>[1-9][0-9]*)\\.(?<verse>[1-9][0-9]*)$',
	},
	{
		key: 'homer-book-line',
		preferred_label: 'Homeric book-line',
		description: 'Book and line within it, as `book.line`, e.g. 1.1.',
		locator_regex: '^(?<book>[1-9]|1[0-9]|2[0-4])\\.(?<line>[1-9][0-9]*)$',
	},
	{
		key: 'integer-section',
		preferred_label: 'Integer section numbering',
		description: 'Generic integer section locators, e.g. 43.',
		locator_regex: '^(?<section>[1-9][0-9]*)$',
	},
	{
		key: 'stephanus',
		preferred_label: 'Stephanus pagination (Platonic corpus)',
		description:
			'Stephanus pagination: page, section (a-e), optional sub-line, e.g. 514a.',
		locator_regex:
			'^(?<page>[1-9][0-9]{0,3})(?<section>[a-e])(?<sub>[1-9][0-9]?)?$',
	},
	{
		key: 'tractatus-proposition',
		preferred_label: 'Tractatus proposition numbering',
		description: 'Proposition numbers such as 1, 2.0121, 6.54, 7.',
		locator_regex: '^(?<proposition>[1-7](?:\\.[0-9]{1,5})?)$',
	},
];

const work = (
	key: string,
	preferred_label: string,
	preferred_citation_system_key: string,
	creators: FindWork['creators'] = undefined,
	alternative_labels?: string[],
): FindWork => ({
	key,
	preferred_label,
	preferred_citation_system_key,
	status: 'draft',
	...(creators ? { creators } : {}),
	...(alternative_labels ? { alternative_labels } : {}),
});

const person = (family: string, given?: string): FindWork['creators'] => [
	given ? { kind: 'person', family, given } : { kind: 'person', family },
];

const works: FindWork[] = [
	work(
		'aristotle.nicomachean-ethics',
		'Nicomachean Ethics',
		'bekker',
		person('Aristotle'),
	),
	work('homer.iliad', 'Iliad', 'homer-book-line', person('Homer')),
	work('homer.odyssey', 'Odyssey', 'homer-book-line', person('Homer')),
	work('plato.republic', 'Republic', 'stephanus', person('Plato')),
	work('tanakh', 'Tanakh', 'bible-book-chapter-verse'),
	work(
		'wittgenstein.philosophical-investigations',
		'Philosophical Investigations',
		'integer-section',
		person('Wittgenstein', 'Ludwig'),
	),
	work(
		'wittgenstein.tractatus',
		'Tractatus Logico-Philosophicus',
		'tractatus-proposition',
		person('Wittgenstein', 'Ludwig'),
	),
];

const find = (query: string, over: FindWork[] = works): Interpretation =>
	interpret(query, over, systems);

// ---------------------------------------------------------------------------
// The minimum cases the technical spec names
// ---------------------------------------------------------------------------

test('"Plato Republic" identifies one work and waits for a locator', () => {
	const result = find('Plato Republic');
	assert.equal(result.kind, 'work-selected');
	assert.equal(
		result.kind === 'work-selected' && result.match.work.key,
		'plato.republic',
	);
	assert.equal(
		result.kind === 'work-selected' && result.match.tier,
		TIER.CREATOR_AND_TITLE,
	);
});

test('"Plato Republic 514a" is resolvable against one work and locator', () => {
	const result = find('Plato Republic 514a');
	assert.equal(result.kind, 'resolvable');
	if (result.kind !== 'resolvable') return;
	assert.equal(result.match.work.key, 'plato.republic');
	assert.equal(result.locator, '514a');
});

test('"Republic 514a" resolves without the creator', () => {
	const result = find('Republic 514a');
	assert.equal(result.kind, 'resolvable');
	if (result.kind !== 'resolvable') return;
	assert.equal(result.match.work.key, 'plato.republic');
	assert.equal(result.match.tier, TIER.EXACT_LABEL);
	assert.equal(result.locator, '514a');
});

test('"Nicomachean Ethics 1094a1" resolves under Bekker numbering', () => {
	const result = find('Nicomachean Ethics 1094a1');
	assert.equal(result.kind, 'resolvable');
	if (result.kind !== 'resolvable') return;
	assert.equal(result.match.work.key, 'aristotle.nicomachean-ethics');
	assert.equal(result.locator, '1094a1');
});

test('a bare locator is never resolved, even with one candidate', () => {
	// Republic is the only Stephanus work today, so the candidate list has one
	// entry. The finder still refuses to pick it: the query named no work.
	const result = find('514a');
	assert.equal(result.kind, 'bare-locator');
	if (result.kind !== 'bare-locator') return;
	assert.equal(result.locator, '514a');
	assert.deepEqual(
		result.candidates.map((c) => c.work.key),
		['plato.republic'],
	);
});

test('"unknown work" matches nothing', () => {
	assert.equal(find('unknown work').kind, 'no-match');
});

// ---------------------------------------------------------------------------
// Ambiguity is never resolved silently
// ---------------------------------------------------------------------------

test('"Homer 1.1" stays ambiguous across the two Homeric works', () => {
	const result = find('Homer 1.1');
	assert.equal(result.kind, 'work-matches');
	if (result.kind !== 'work-matches') return;
	assert.deepEqual(
		result.matches.map((m) => m.work.key),
		['homer.iliad', 'homer.odyssey'],
	);
	// The locator survives, so choosing a work resolves in one more step.
	assert.equal(result.locator, '1.1');
});

test('two works sharing an alternative label are ambiguous (ADR-0007)', () => {
	// ADR-0007 allows the homonym and requires the consumer to treat it as
	// ambiguous. "Ethics" fits Aristotle and Spinoza.
	const homonyms: FindWork[] = [
		work(
			'aristotle.nicomachean-ethics',
			'Nicomachean Ethics',
			'bekker',
			person('Aristotle'),
			['NE', 'Ethics'],
		),
		work('spinoza.ethica', 'Ethica', 'integer-section', person('Spinoza'), [
			'Ethics',
		]),
	];
	const result = interpret('Ethics', homonyms, systems);
	assert.equal(result.kind, 'work-matches');
	if (result.kind !== 'work-matches') return;
	assert.equal(result.matches.length, 2);
	assert.ok(
		result.matches.every((m) => m.tier === TIER.EXACT_ALTERNATIVE_LABEL),
	);
});

test('a label that ends in a locator-shaped token is not split apart', () => {
	// Nietzsche's registered labels include `MA`, `MA I`, `MA II/1` and
	// `MA II/2`. Splitting `MA II/1` leaves `MA`, which is a different work's
	// label, so the query used to land on that work with `II/1` reported as an
	// invalid passage. The whole query is an exact label, so it wins.
	const nietzsche: FindWork[] = [
		work(
			'n.mensch',
			'Menschliches, Allzumenschliches',
			'integer-section',
			person('Nietzsche'),
			['MA', 'MA I'],
		),
		work(
			'n.vermischte',
			'Vermischte Meinungen und Sprüche',
			'integer-section',
			person('Nietzsche'),
			['MA II/1'],
		),
	];

	const result = interpret('MA II/1', nietzsche, systems);
	assert.equal(result.kind, 'work-selected');
	if (result.kind !== 'work-selected') return;
	assert.equal(result.match.work.key, 'n.vermischte');
	assert.equal(result.match.tier, TIER.EXACT_ALTERNATIVE_LABEL);

	// The shorter label still reaches its own work.
	const shorter = interpret('MA', nietzsche, systems);
	assert.equal(shorter.kind, 'work-selected');
	if (shorter.kind !== 'work-selected') return;
	assert.equal(shorter.match.work.key, 'n.mensch');
});

test('a better split match is not displaced by a weaker whole-query match', () => {
	// The whole query wins only at an equal or better tier. Here the split finds
	// an exact preferred label, which outranks the alternative label that the
	// whole query would match, so the locator survives.
	const rival: FindWork[] = [
		work('a.book', 'Book', 'integer-section', person('Author')),
		work('b.other', 'Other', 'integer-section', person('Author'), ['Book 1']),
	];
	const result = interpret('Book 1', rival, systems);
	assert.equal(result.kind, 'resolvable');
	if (result.kind !== 'resolvable') return;
	assert.equal(result.match.work.key, 'a.book');
	assert.equal(result.locator, '1');
});

test('an exact preferred label outranks another work’s alternative label', () => {
	// The spec's ladder puts tier 2 above tier 3, so this is decided rather than
	// ambiguous. Recorded here because it is the one homonym shape that does not
	// end in a question.
	const mixed: FindWork[] = [
		work(
			'aristotle.nicomachean-ethics',
			'Nicomachean Ethics',
			'bekker',
			person('Aristotle'),
			['Ethics'],
		),
		work('spinoza.ethics', 'Ethics', 'integer-section', person('Spinoza')),
	];
	const result = interpret('Ethics', mixed, systems);
	assert.equal(result.kind, 'work-selected');
	assert.equal(
		result.kind === 'work-selected' && result.match.work.key,
		'spinoza.ethics',
	);
});

// ---------------------------------------------------------------------------
// Locator shape
// ---------------------------------------------------------------------------

test('a locator no citation system accepts is reported, not guessed', () => {
	const result = find('Republic 999z');
	assert.equal(result.kind, 'locator-invalid');
	if (result.kind !== 'locator-invalid') return;
	assert.equal(result.match.work.key, 'plato.republic');
	assert.equal(result.locator, '999z');
});

test('a Stephanus work does not accept a bare integer locator', () => {
	// "327" satisfies `integer-section`, so `parseQuery` calls it well formed
	// registry-wide. Only the work's own index can reject it, which it does.
	const result = find('Republic 327');
	assert.equal(result.kind, 'resolvable');

	const index = {
		work_key: 'plato.republic',
		preferred_citation_system_key: 'stephanus',
		refs: { stephanus: { '327a': 'cecef712-e8cf-5878-9d48-419f7d185a56' } },
	};
	const resolution = resolveInIndex(index, '327', systems);
	assert.equal(resolution.kind, 'locator-invalid');
	if (resolution.kind !== 'locator-invalid') return;
	assert.deepEqual(resolution.workSystems, ['stephanus']);
});

test('a leading number is not mistaken for a locator', () => {
	const parsed = parseQuery('1 Corinthians', systems);
	assert.equal(parsed.locator, null);
	assert.equal(parsed.workQuery, '1 Corinthians');
});

test('a trailing token without a digit is never a locator', () => {
	assert.equal(parseQuery('Nicomachean Ethics', systems).locator, null);
});

test('an OSIS book code survives parsing as one token', () => {
	const parsed = parseQuery('Tanakh Gen.1.1', systems);
	assert.equal(parsed.locator, 'Gen.1.1');
	assert.equal(parsed.workQuery, 'Tanakh');
	assert.equal(parsed.locatorIsWellFormed, true);
});

test('locator case and dots are preserved verbatim (ADR-0002)', () => {
	const result = find('Tanakh 1Sam.1.1');
	assert.equal(result.kind, 'resolvable');
	assert.equal(result.kind === 'resolvable' && result.locator, '1Sam.1.1');
});

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

test('an exact key outranks every title match', () => {
	const matches = rankWorks('plato.republic', works);
	assert.equal(matches[0].tier, TIER.EXACT_KEY);
	assert.equal(matches[0].work.key, 'plato.republic');
	assert.deepEqual(
		leadingTier(matches).map((m) => m.work.key),
		['plato.republic'],
	);
});

test('an alternative label finds a work the preferred label hides', () => {
	// No work in `data/` carries `alternative_labels` yet, so this tier is
	// proven here rather than against the registry (ADR-0007 follow-up).
	const withAbbreviations = works.map((w) =>
		w.key === 'aristotle.nicomachean-ethics'
			? { ...w, alternative_labels: ['NE', 'EN', 'Nikomachische Ethik'] }
			: w,
	);
	const result = interpret('NE 1094a1', withAbbreviations, systems);
	assert.equal(result.kind, 'resolvable');
	if (result.kind !== 'resolvable') return;
	assert.equal(result.match.work.key, 'aristotle.nicomachean-ethics');
	assert.equal(result.match.tier, TIER.EXACT_ALTERNATIVE_LABEL);
	assert.equal(result.match.matchedOn, 'NE');
});

test('a translated title finds the work', () => {
	const withAbbreviations = works.map((w) =>
		w.key === 'aristotle.nicomachean-ethics'
			? { ...w, alternative_labels: ['Nikomachische Ethik'] }
			: w,
	);
	const result = interpret('Nikomachische Ethik', withAbbreviations, systems);
	assert.equal(result.kind, 'work-selected');
});

test('a title prefix ranks above a bare token match', () => {
	const matches = rankWorks('Tractatus', works);
	assert.equal(matches[0].tier, TIER.TITLE_PREFIX);
	assert.equal(matches[0].work.key, 'wittgenstein.tractatus');
});

test('a creator name alone is a token match across that creator’s works', () => {
	const matches = leadingTier(rankWorks('Wittgenstein', works));
	assert.deepEqual(
		matches.map((m) => m.work.key),
		['wittgenstein.philosophical-investigations', 'wittgenstein.tractatus'],
	);
	assert.ok(matches.every((m) => m.tier === TIER.TOKEN));
});

test('a near miss is found by fuzzy matching', () => {
	const matches = rankWorks('Republik', works);
	assert.equal(matches[0].tier, TIER.FUZZY);
	assert.equal(matches[0].work.key, 'plato.republic');
});

// Tier 6 compared the query against one joined string, so `includes` accepted
// any fragment of any name. `ant` sits inside `Dante`, and `interpret` then
// carried that fragment all the way to locator resolution.
test('a fragment inside a name is not a token match', () => {
	const withDante = [
		...works,
		work(
			'dante.commedia',
			'Divine Comedy',
			'dante-cantica-canto-verse',
			person('Alighieri', 'Dante'),
		),
	];
	assert.deepEqual(rankWorks('ant', withDante), []);
	assert.deepEqual(rankWorks('lato', works), []);

	// The whole token still matches, at the tier it always did.
	const whole = rankWorks('Dante', withDante);
	assert.equal(whole.length, 1);
	assert.equal(whole[0].work.key, 'dante.commedia');
	assert.equal(whole[0].tier, TIER.TOKEN);
});

// A fuzzy hit is a spelling guess. `/find/` promises that nothing is guessed,
// so a near miss offers candidates and never resolves to a passage by itself.
test('a single fuzzy match asks instead of resolving', () => {
	const bare = find('Republik');
	assert.equal(bare.kind, 'work-matches');
	assert.equal(
		bare.kind === 'work-matches' && bare.matches[0].tier,
		TIER.FUZZY,
	);

	const withLocator = find('Republik 514a');
	assert.equal(withLocator.kind, 'work-matches');
	assert.equal(
		withLocator.kind === 'work-matches' && withLocator.matches[0].work.key,
		'plato.republic',
	);
});

test('an exact match still resolves without asking', () => {
	assert.equal(find('Republic 514a').kind, 'resolvable');
	assert.equal(find('Republic').kind, 'work-selected');
});

test('fuzzy matching never outranks an exact hit', () => {
	// "Odyssey" is an exact label and within edit distance of nothing else, but
	// the guarantee is structural: the leading tier is a single tier.
	const matches = leadingTier(rankWorks('Odyssey', works));
	assert.deepEqual(
		matches.map((m) => m.work.key),
		['homer.odyssey'],
	);
	assert.equal(matches[0].tier, TIER.EXACT_LABEL);
});

test('a short query is not fuzzy matched', () => {
	assert.equal(
		rankWorks('Ili', works).some((m) => m.tier === TIER.FUZZY),
		false,
	);
});

test('ranking is deterministic', () => {
	const once = rankWorks('Homer', works);
	const twice = rankWorks('Homer', works);
	assert.deepEqual(
		once.map((m) => [m.work.key, m.tier]),
		twice.map((m) => [m.work.key, m.tier]),
	);
});

test('punctuation and diacritics do not have to be typed', () => {
	assert.equal(
		normalizeLabel('Tractatus Logico-Philosophicus'),
		'tractatus logico philosophicus',
	);
	assert.equal(normalizeLabel('Nikomachische Ethík'), 'nikomachische ethik');
	assert.equal(find('tractatus logico philosophicus').kind, 'work-selected');
});

test('an empty query is the empty state', () => {
	assert.equal(find('').kind, 'empty');
	assert.equal(find('   ').kind, 'empty');
});

test('boundedDistance abandons past the limit', () => {
	assert.equal(boundedDistance('republic', 'republik', 2), 1);
	assert.equal(boundedDistance('republic', 'odyssey', 2), 3);
	assert.ok(boundedDistance('a', 'abcdefgh', 2) > 2);
});

test('acceptsLocator rejects a system whose regex does not compile', () => {
	assert.equal(
		acceptsLocator(
			{
				key: 'broken',
				preferred_label: 'Broken',
				description: 'Does not compile.',
				locator_regex: '^(',
			},
			'1',
		),
		false,
	);
});

// ---------------------------------------------------------------------------
// Stage two: the alias index decides identity
// ---------------------------------------------------------------------------

const republicIndex = {
	work_key: 'plato.republic',
	preferred_citation_system_key: 'stephanus',
	refs: {
		stephanus: {
			'327a': 'cecef712-e8cf-5878-9d48-419f7d185a56',
			'514a': 'dc799d4b-9b17-5d76-85aa-dfd001c5321d',
		},
	},
};

test('a locator present under one system resolves to its UUID', () => {
	const resolution = resolveInIndex(republicIndex, '514a', systems);
	assert.equal(resolution.kind, 'resolved');
	if (resolution.kind !== 'resolved') return;
	assert.equal(resolution.uuid, 'dc799d4b-9b17-5d76-85aa-dfd001c5321d');
	assert.equal(resolution.systemKey, 'stephanus');
});

test('a well-formed locator absent from the index is not invented (ADR-0002)', () => {
	// "999e" is a valid Stephanus string but Republic ends at 621d. There is no
	// near miss and no fallback: identity comes from the index or not at all.
	const resolution = resolveInIndex(republicIndex, '999e', systems);
	assert.equal(resolution.kind, 'not-in-registry');
	if (resolution.kind !== 'not-in-registry') return;
	assert.deepEqual(resolution.validUnder, ['stephanus']);
});

test('lookup is exact, never case folded', () => {
	assert.notEqual(
		resolveInIndex(republicIndex, '514A', systems).kind,
		'resolved',
	);
});

test('a locator spelled __proto__ cannot reach the prototype', () => {
	const resolution = resolveInIndex(republicIndex, '__proto__', systems);
	assert.notEqual(resolution.kind, 'resolved');
});

test('one locator under two systems is ambiguous, not picked (ADR-0005)', () => {
	// The build fixture declares a work under two citation systems that both
	// carry locator "1"; the same string denotes a different passage in each.
	const [index] = buildWorkAliasIndexes(
		fixtureRegistry.works,
		fixtureRegistry.references,
	);
	const fixtureSystems: FindSystem[] = fixtureRegistry.systems.map((s) => ({
		key: s.key,
		preferred_label: s.preferred_label,
		description: s.description,
		locator_regex: s.locator_regex,
	}));

	const resolution = resolveInIndex(index, '1', fixtureSystems);
	assert.equal(resolution.kind, 'ambiguous-system');
	if (resolution.kind !== 'ambiguous-system') return;
	assert.equal(resolution.options.length, 2);
	// The work's preferred system leads the list.
	assert.equal(
		resolution.options[0].systemKey,
		index.preferred_citation_system_key,
	);
	// Two systems, two identities.
	assert.notEqual(resolution.options[0].uuid, resolution.options[1].uuid);
});

test('a work with no references reports the locator as unusable', () => {
	const empty = {
		work_key: 'empty.work',
		preferred_citation_system_key: 'stephanus',
		refs: {},
	};
	const resolution = resolveInIndex(empty, '514a', systems);
	assert.equal(resolution.kind, 'locator-invalid');
	if (resolution.kind !== 'locator-invalid') return;
	assert.deepEqual(resolution.workSystems, []);
});
