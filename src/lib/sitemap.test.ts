// The sitemap filter in `astro.config.mjs`. It runs against the fixture
// registry here, which carries both `active` and `draft` records — the real
// registry is entirely `draft` under ADR-0004, so it cannot show that the
// predicate discriminates rather than excluding everything under `/id/`.
process.env.TEXTREFS_REGISTRY_FIXTURE = '1';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildSitemapExclusion, draftRecordIris } from './sitemap.js';

const isExcluded = buildSitemapExclusion();

test('draft record pages are excluded', () => {
	assert.equal(isExcluded('/id/system/fixture-alternate/'), true);
	assert.equal(
		isExcluded('/id/ref/00000000-0000-5000-8000-000000000003/'),
		true,
	);
});

test('active record pages are kept', () => {
	assert.equal(isExcluded('/id/work/fixture.work/'), false);
	assert.equal(isExcluded('/id/system/fixture-section/'), false);
	assert.equal(
		isExcluded('/id/ref/00000000-0000-5000-8000-000000000001/'),
		false,
	);
});

test('documentation pages are kept', () => {
	assert.equal(isExcluded('/'), false);
	assert.equal(isExcluded('/standard/specification/'), false);
	assert.equal(isExcluded('/reg/'), false);
});

test('paginated reference browsers follow their work', () => {
	// fixture.work is active, so its browser pages stay in the sitemap.
	assert.equal(isExcluded('/reg/work/fixture.work/refs/1/'), false);
});

test('every cite alias is excluded, whatever its record status', () => {
	// A `/cite/` page redirects to a canonical `/id/` URL, so it is never a
	// destination — not even when the record it points at is active.
	assert.equal(isExcluded('/cite/fixture.work/fixture-alternate/1/'), true);
	assert.equal(isExcluded('/cite/fixture.work/fixture-section/1/'), true);
	assert.equal(isExcluded('/cite/fixture.work/1/'), true);
});

test('a translated locale page is kept and a fallback is dropped', () => {
	// `src/content/docs/de/association/` is the only translated section today.
	assert.equal(isExcluded('/de/association/statutes/'), false);
	assert.equal(isExcluded('/de/association/'), false);
	// No German source file, so Starlight serves the English body under
	// `<html lang="de">`.
	assert.equal(isExcluded('/de/standard/specification/'), true);
	assert.equal(isExcluded('/de/association/board/'), true);
	assert.equal(isExcluded('/de/'), true);
	// The English originals are untouched.
	assert.equal(isExcluded('/standard/specification/'), false);
});

test('draft record IRIs are collected across every record type', () => {
	const draft = draftRecordIris();
	assert.ok(draft.has('https://textrefs.org/id/system/fixture-alternate'));
	assert.ok(
		draft.has(
			'https://textrefs.org/id/ref/00000000-0000-5000-8000-000000000003',
		),
	);
	assert.ok(!draft.has('https://textrefs.org/id/work/fixture.work'));
});
