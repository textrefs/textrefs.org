import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkAliasIndexes } from './alias-index.js';
import { uuidOf } from './registry.js';
import { fixtureRegistry } from './registry.fixture.js';

const { works, references } = fixtureRegistry;
const indexes = () => buildWorkAliasIndexes(works, references);

// A synthetic reference, for the cases the fixture cannot express.
const ref = (citation_system_key: string, locator: string, uuid: string) => ({
	id: `https://textrefs.org/id/ref/${uuid}`,
	work_key: 'fixture.work',
	citation_system_key,
	locator,
});

test('every reference of a work is reachable by system and locator', () => {
	const [index] = indexes();
	assert.equal(index.work_key, 'fixture.work');
	for (const r of references) {
		assert.ok(
			index.refs[r.citation_system_key]?.[r.locator],
			`unreachable: ${r.citation_system_key}/${r.locator}`,
		);
	}
});

test('each mapped value is the reference UUID, not its IRI', () => {
	const [index] = indexes();
	for (const r of references) {
		const mapped = index.refs[r.citation_system_key][r.locator];
		assert.equal(mapped, uuidOf(r.id));
		assert.ok(!mapped.includes('/'), 'a UUID carries no path separator');
	}
});

test('the same locator under two systems keeps two identities', () => {
	// ADR-0005: a work under two systems can repeat a locator string and mean a
	// different passage each time.
	const [index] = indexes();
	const a = index.refs['fixture-section']['1'];
	const b = index.refs['fixture-alternate']['1'];
	assert.ok(a && b);
	assert.notEqual(a, b);
});

test('the index covers every reference exactly once', () => {
	const mapped = indexes().reduce(
		(total, index) =>
			total +
			Object.values(index.refs).reduce(
				(n, locators) => n + Object.keys(locators).length,
				0,
			),
		0,
	);
	assert.equal(mapped, references.length);
});

test('a work with no references gets an index with an empty refs object', () => {
	const [index] = buildWorkAliasIndexes(works, []);
	assert.equal(index.work_key, 'fixture.work');
	assert.deepEqual(index.refs, {});
});

test('the index names the preferred citation system', () => {
	const [index] = indexes();
	assert.equal(index.preferred_citation_system_key, 'fixture-section');
	// The preferred key is presentation, not identity: both systems appear in
	// `refs` with equal standing.
	assert.deepEqual(Object.keys(index.refs).sort(), [
		'fixture-alternate',
		'fixture-section',
	]);
});

test('references of another work do not leak in', () => {
	const foreign = {
		id: 'https://textrefs.org/id/ref/00000000-0000-5000-8000-0000000000ff',
		work_key: 'other.work',
		citation_system_key: 'fixture-section',
		locator: '99',
	};
	const built = buildWorkAliasIndexes(works, [...references, foreign]);
	assert.equal(built.length, works.length);
	assert.equal(built[0].refs['fixture-section']['99'], undefined);
});

test('draft references are indexed — the index makes no status claim', () => {
	const draft = references.find((r) => r.status === 'draft');
	assert.ok(draft, 'the fixture carries a draft reference');
	const [index] = indexes();
	assert.equal(
		index.refs[draft.citation_system_key][draft.locator],
		uuidOf(draft.id),
	);
});

test('system keys sort, and locators sort numerically', () => {
	const [index] = buildWorkAliasIndexes(works, [
		ref('fixture-section', '1.10', '00000000-0000-5000-8000-00000000000a'),
		ref('fixture-section', '1.2', '00000000-0000-5000-8000-00000000000b'),
		ref('fixture-section', '1.1', '00000000-0000-5000-8000-00000000000c'),
		ref('fixture-alternate', '1', '00000000-0000-5000-8000-00000000000d'),
	]);
	assert.deepEqual(Object.keys(index.refs), [
		'fixture-alternate',
		'fixture-section',
	]);
	assert.deepEqual(Object.keys(index.refs['fixture-section']), [
		'1.1',
		'1.2',
		'1.10',
	]);
});

test('the output does not depend on the input order', () => {
	const forward = buildWorkAliasIndexes(works, references);
	const backward = buildWorkAliasIndexes(works, [...references].reverse());
	assert.deepEqual(backward, forward);
});

test('a locator spelled __proto__ becomes an own key', () => {
	const [index] = buildWorkAliasIndexes(works, [
		ref('fixture-section', '__proto__', '00000000-0000-5000-8000-00000000000e'),
	]);
	const locators = index.refs['fixture-section'];
	assert.ok(Object.hasOwn(locators, '__proto__'));
	assert.equal(Object.getPrototypeOf(locators), Object.prototype);
	assert.equal(
		JSON.parse(JSON.stringify(locators))['__proto__'],
		'00000000-0000-5000-8000-00000000000e',
	);
});

test('the caller’s arrays are not mutated', () => {
	// `loadReferences()` hands back the live cached array.
	const order = references.map((r) => r.id);
	const keys = works.map((w) => w.key);
	buildWorkAliasIndexes(works, references);
	assert.deepEqual(
		references.map((r) => r.id),
		order,
	);
	assert.deepEqual(
		works.map((w) => w.key),
		keys,
	);
});
