import test from 'node:test';
import assert from 'node:assert/strict';
import { spdxLicenseLabel } from './license.ts';

test('a canonical SPDX IRI renders as the bare identifier', () => {
	assert.equal(
		spdxLicenseLabel('https://spdx.org/licenses/CC-BY-SA-3.0'),
		'CC-BY-SA-3.0',
	);
	assert.equal(
		spdxLicenseLabel('https://spdx.org/licenses/CC0-1.0'),
		'CC0-1.0',
	);
});

test('a value without the canonical prefix is left alone', () => {
	assert.equal(spdxLicenseLabel('CC-BY-4.0'), 'CC-BY-4.0');
	assert.equal(
		spdxLicenseLabel('https://example.org/licences/house-terms'),
		'https://example.org/licences/house-terms',
	);
});

test('the bare prefix never renders as an empty chip', () => {
	assert.equal(
		spdxLicenseLabel('https://spdx.org/licenses/'),
		'https://spdx.org/licenses/',
	);
});

test('a prefix that only looks like the canonical one is left alone', () => {
	// Different host: stripping here would invent an SPDX id from a foreign IRI.
	assert.equal(
		spdxLicenseLabel('http://spdx.org/licenses/MIT'),
		'http://spdx.org/licenses/MIT',
	);
});
