import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	DEPRECATED_DETAIL,
	DRAFT_BODY_HTML,
	DRAFT_TITLE,
	NO_SUCCESSOR,
	isDraft,
	isTombstone,
	tombstoneTitle,
} from './record-status.js';
import { Status } from '../../standard/schema/common.js';

// The five statuses, read from the schema rather than written out, so a sixth
// one added to ADR-0004's lifecycle fails here instead of rendering nothing.
const STATUSES = Status.options;
const RETIRED = ['deprecated', 'withdrawn', 'blocked'];

test('the lifecycle holds exactly the five statuses these branches cover', () => {
	assert.deepEqual([...STATUSES].sort(), [
		'active',
		'blocked',
		'deprecated',
		'draft',
		'withdrawn',
	]);
});

test('only a draft is a draft, and an active record is neither', () => {
	for (const status of STATUSES) {
		assert.equal(isDraft(status), status === 'draft', status);
	}
	assert.equal(isDraft('active'), false);
	assert.equal(isTombstone('active'), false);
});

test('the three retired statuses are the tombstone category', () => {
	for (const status of STATUSES) {
		assert.equal(isTombstone(status), RETIRED.includes(status), status);
	}
});

test('each retired status names itself, and a live one has no title', () => {
	assert.equal(tombstoneTitle('deprecated'), 'This record is deprecated.');
	assert.equal(tombstoneTitle('withdrawn'), 'This record has been withdrawn.');
	assert.match(tombstoneTitle('blocked'), /rights, trust, or policy dispute/);
	assert.equal(tombstoneTitle('active'), '');
	assert.equal(tombstoneTitle('draft'), '');
});

test('the draft body keeps the code element inside the sentence', () => {
	// #100: fragmenting the sentence around `<code>active</code>` moves the drift
	// risk instead of removing it, so the constant carries the markup itself.
	assert.match(DRAFT_BODY_HTML, /promoted to <code>active<\/code> by expert/);
	assert.ok(DRAFT_BODY_HTML.endsWith('Do not cite it as stable.'));
	assert.equal(DRAFT_TITLE, 'Draft record.');
});

test('no tombstone copy denies the persistence promise (#149)', () => {
	// The promise attaches at promotion and survives retirement
	// (specification §11-12). Only the draft copy may deny it.
	const tombstoneCopy = [
		...RETIRED.map(tombstoneTitle),
		DEPRECATED_DETAIL,
		NO_SUCCESSOR,
	].join(' ');
	assert.doesNotMatch(tombstoneCopy, /persistence promise/);
	assert.match(DRAFT_BODY_HTML, /no persistence promise/);
});
