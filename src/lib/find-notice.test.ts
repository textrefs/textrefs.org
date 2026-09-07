import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
	DRAFT_CITE_ADVICE,
	DRAFT_LEAD,
	TOMBSTONE_CITE_ADVICE,
	findNotice,
	type NoticePart,
} from './find-notice.js';
import { DEPRECATED_DETAIL, NO_SUCCESSOR } from './record-status.js';
import { Status } from '../../standard/schema/common.js';

const SUCCESSOR =
	'https://textrefs.org/id/ref/00000000-0000-5000-8000-000000000001';
const RETIRED = ['deprecated', 'withdrawn', 'blocked'];

/** The sentence a reader ends up with, as the card renders it. */
const rendered = (parts: NoticePart[] | null): string =>
	(parts ?? []).map((part) => part.text).join('');

const links = (parts: NoticePart[] | null) =>
	(parts ?? []).filter((part) => part.kind === 'link');

test('every status in the lifecycle has a decided notice', () => {
	// The five of ADR-0004. A sixth would land here before it reached a card.
	for (const status of Status.options) {
		const parts = findNotice(status, undefined);
		assert.equal(parts === null, status === 'active', status);
	}
});

test('an active record earns no notice, with or without a successor', () => {
	assert.equal(findNotice('active'), null);
	assert.equal(findNotice('active', SUCCESSOR), null);
});

test('a draft keeps the provisional-identifier advice', () => {
	const parts = findNotice('draft');
	assert.deepEqual(parts, [
		{ kind: 'lead', text: DRAFT_LEAD },
		{ kind: 'text', text: DRAFT_CITE_ADVICE },
	]);
	assert.match(rendered(parts), /no persistence promise yet/);
});

test('a retired record never gets the draft-only persistence claim (#149)', () => {
	// The regression this file exists for: `status !== 'active'` sent all three
	// retired statuses down the draft branch.
	for (const status of RETIRED) {
		const text = rendered(findNotice(status, SUCCESSOR));
		assert.doesNotMatch(text, /no persistence promise/, status);
		assert.doesNotMatch(text, /without a tombstone/, status);
		assert.match(text, /remains as a tombstone/, status);
	}
});

test('each retired status leads with its own sentence', () => {
	assert.match(
		rendered(findNotice('deprecated')),
		/^This record is deprecated\./,
	);
	assert.match(
		rendered(findNotice('withdrawn')),
		/^This record has been withdrawn\./,
	);
	assert.match(
		rendered(findNotice('blocked')),
		/^This record is blocked by a rights/,
	);
	// Only a deprecated record still resolves as a recommendation would.
	assert.ok(rendered(findNotice('deprecated')).includes(DEPRECATED_DETAIL));
	for (const status of ['withdrawn', 'blocked']) {
		assert.ok(
			!rendered(findNotice(status)).includes(DEPRECATED_DETAIL),
			status,
		);
	}
});

test('the lead is bold and the citing advice is not', () => {
	for (const status of ['draft', ...RETIRED]) {
		const parts = findNotice(status, SUCCESSOR) ?? [];
		assert.equal(parts[0].kind, 'lead', status);
		assert.equal(
			parts.filter((part) => part.kind === 'lead').length,
			1,
			status,
		);
	}
});

test('a successor becomes a link on every retired status', () => {
	for (const status of RETIRED) {
		const parts = findNotice(status, SUCCESSOR);
		assert.deepEqual(links(parts), [
			{ kind: 'link', text: SUCCESSOR, href: SUCCESSOR },
		]);
		assert.match(
			rendered(parts),
			/Superseded by https:\/\/textrefs\.org\S+\.$/,
		);
	}
});

test('a retired record without a successor says so, and links nothing', () => {
	for (const status of RETIRED) {
		const parts = findNotice(status);
		assert.deepEqual(links(parts), [], status);
		assert.ok(rendered(parts).endsWith(NO_SUCCESSOR), status);
	}
	assert.deepEqual(links(findNotice('withdrawn', '')), []);
});

test('a successor that is not an http URL is never linked', () => {
	// Registry data meets the DOM here, so the href is checked the way a
	// resolver target is.
	const parts = findNotice('withdrawn', 'javascript:alert(1)');
	assert.deepEqual(links(parts), []);
	assert.match(rendered(parts), /Superseded by javascript:alert\(1\)\.$/);
});

test('the finder advice reads as one sentence run, spaced but not doubled', () => {
	const text = rendered(findNotice('deprecated', SUCCESSOR));
	assert.ok(text.includes(TOMBSTONE_CITE_ADVICE));
	assert.doesNotMatch(text, /  /);
	assert.doesNotMatch(text, /\.[A-Z]/);
});
