// The compiled registry is memoised on `globalThis` rather than in a module
// variable, because Astro loads `astro.config.mjs` in a module graph of its own
// and would otherwise compile the whole registry a second time.
process.env.TEXTREFS_REGISTRY_FIXTURE = '1';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadRegistry, loadWorks } from './registry.js';
import { fixtureRegistry } from './registry.fixture.js';

const CACHE_KEY = Symbol.for('textrefs.compiledRegistry');

test('the fixture short-circuit never compiles or caches the real registry', () => {
	// The env check has to stay above the cache, or every fixture-backed test
	// would pay for a full compile of the real registry and leave it on the
	// global for whatever ran next.
	assert.equal(loadRegistry(), fixtureRegistry);
	assert.equal(
		Object.getOwnPropertySymbols(globalThis).includes(CACHE_KEY),
		false,
		'the fixture path must not populate the global cache',
	);
});

test('repeated loads return one registry', () => {
	assert.equal(loadRegistry(), loadRegistry());
	assert.equal(loadWorks(), loadRegistry().works);
});
