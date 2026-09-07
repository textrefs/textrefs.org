import { test } from 'node:test';
import assert from 'node:assert/strict';
import { collectionBody, JSONLD_CONTEXT } from './collection.js';
import { fixtureRegistry } from './registry.fixture.js';

test('collectionBody sets the shared JSON-LD context', () => {
	const body = collectionBody(fixtureRegistry.systems);
	assert.equal(body['@context'], 'https://textrefs.org/contexts/v1.jsonld');
	assert.equal(body['@context'], JSONLD_CONTEXT);
});

test('collectionBody sorts @graph by key', () => {
	const unsorted = [...fixtureRegistry.systems].reverse();
	assert.ok(unsorted.length > 1);
	const body = collectionBody(unsorted);
	const keys = body['@graph'].map((r) => r.key);
	const expected = [...keys].sort((a, b) => a.localeCompare(b));
	assert.deepEqual(keys, expected);
});

test('collectionBody does not mutate the input array', () => {
	const unsorted = [...fixtureRegistry.systems].reverse();
	const before = unsorted.map((r) => r.key);
	collectionBody(unsorted);
	assert.deepEqual(
		unsorted.map((r) => r.key),
		before,
	);
});

test('collectionBody passes items through unchanged with no per-item @context', () => {
	const body = collectionBody(fixtureRegistry.systems);
	const item = body['@graph'].find(
		(r) => r.key === fixtureRegistry.systems[0].key,
	);
	assert.deepEqual(item, fixtureRegistry.systems[0]);
	assert.equal(item && '@context' in item, false);
});
