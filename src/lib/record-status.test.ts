import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getRecordStatusBanner } from './record-status.js';

test('record status banner flags and titles stay consistent', () => {
	assert.deepEqual(getRecordStatusBanner('draft'), {
		isDraft: true,
		isTombstone: false,
		title: null,
	});
	assert.deepEqual(getRecordStatusBanner('withdrawn'), {
		isDraft: false,
		isTombstone: true,
		title: 'This record has been withdrawn.',
	});
	assert.deepEqual(getRecordStatusBanner('blocked'), {
		isDraft: false,
		isTombstone: true,
		title: 'This record is blocked by a rights, trust, or policy dispute.',
	});
	assert.deepEqual(getRecordStatusBanner('active'), {
		isDraft: false,
		isTombstone: false,
		title: null,
	});
});
