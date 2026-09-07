// Contract regression tests for `api/openapi.yaml`.
//
// The contract is hand-authored YAML, so nothing else in the build proves that
// it accepts the records this site actually serves. `starlight-openapi` renders
// the document; it never validates data against it.
//
// The case that motivated this file: `Iri` declared `format: uri`. RFC 3986
// forbids non-ASCII, the registry publishes resolver targets that carry it, and
// a consumer validating with `ajv-formats` therefore rejected real records.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

type JsonObject = Record<string, unknown>;

const CONTRACT = fileURLToPath(new URL('./openapi.yaml', import.meta.url));

function contract(): JsonObject {
	return parse(readFileSync(CONTRACT, 'utf8')) as JsonObject;
}

function schemas(): Record<string, JsonObject> {
	const components = contract().components as JsonObject;
	return components.schemas as Record<string, JsonObject>;
}

/**
 * Rewrite OpenAPI component pointers to JSON Schema `$defs` pointers.
 *
 * The contract is an OpenAPI document, so its internal references read
 * `#/components/schemas/X`. Ajv validates a plain JSON Schema, where the same
 * subschemas live under `$defs`.
 */
function toDefsPointers(node: unknown): unknown {
	if (Array.isArray(node)) return node.map(toDefsPointers);
	if (node === null || typeof node !== 'object') return node;

	const out: JsonObject = {};
	for (const [key, value] of Object.entries(node as JsonObject)) {
		out[key] =
			key === '$ref' && typeof value === 'string'
				? value.replace('#/components/schemas/', '#/$defs/')
				: toDefsPointers(value);
	}
	return out;
}

/** Every component name reachable from `name` through `$ref`, including it. */
function closure(name: string, all: Record<string, JsonObject>): Set<string> {
	const seen = new Set<string>();
	const pending = [name];
	while (pending.length > 0) {
		const current = pending.pop()!;
		if (seen.has(current)) continue;
		seen.add(current);
		const json = JSON.stringify(all[current] ?? {});
		for (const [, ref] of json.matchAll(/"#\/components\/schemas\/([^"]+)"/g)) {
			pending.push(ref);
		}
	}
	return seen;
}

/**
 * A validator for one named component, carrying only the definitions it needs.
 *
 * Deliberately not the whole `components.schemas` map: `RegistryObject` uses
 * OpenAPI's `discriminator`, which is not a JSON Schema keyword, and Ajv in
 * strict mode rejects it. Taking the reference closure keeps that component out
 * unless something under test actually points at it.
 */
function validatorFor(name: string) {
	const all = schemas();
	const $defs: Record<string, unknown> = {};
	for (const dep of closure(name, all)) $defs[dep] = toDefsPointers(all[dep]);

	const ajv = new Ajv2020({ strict: true, allErrors: true });
	addFormats(ajv);
	// `ajv-formats` carries no RFC 3987 format, so register the same test the
	// generated JSON Schema's suite registers. See
	// `standard/schema/json-schema.test.ts`.
	ajv.addFormat('iri', (value: string) => URL.canParse(value));
	return ajv.compile({
		$schema: 'https://json-schema.org/draft/2020-12/schema',
		$defs,
		$ref: `#/$defs/${name}`,
	});
}

test('the contract declares Iri as an IRI, not a URI', () => {
	// Locked as a value, not only as behaviour: `format: uri` looks harmless in
	// review, and the failure it causes appears in a downstream consumer rather
	// than in this build.
	assert.equal(schemas().Iri.format, 'iri');
});

test('a resolver target with a non-ASCII IRI validates', () => {
	const validate = validatorFor('ResolverTargetEntry');

	// Real entries from the registry. Latin-1 accents and a Devanagari title.
	for (const url of [
		'https://www.wittgensteinproject.org/w/index.php/Investigaciones_filosóficas_(edición_A)#76',
		'https://www.wittgensteinproject.org/w/index.php/ट्रैक्टेटस_लॉजिको-फ़िलोसॉफ़िकस#1',
		'https://www.wittgensteinproject.org/w/index.php/Tractatus_logico-philosophicus_(français)#1',
	]) {
		assert.ok(
			validate({ url, access: 'open' }),
			`rejected ${url}: ${JSON.stringify(validate.errors)}`,
		);
	}
});

test('an ASCII resolver target still validates', () => {
	const validate = validatorFor('ResolverTargetEntry');
	assert.ok(
		validate({
			url: 'https://scaife.perseus.org/reader/urn:cts:greekLit:tlg0012.tlg001.perseus-grc2:1.1/',
			language: 'grc',
			access: 'open',
		}),
		JSON.stringify(validate.errors),
	);
});

test('a resolver target still requires url and access', () => {
	const validate = validatorFor('ResolverTargetEntry');
	assert.equal(validate({ url: 'https://example.org/' }), false);
	assert.equal(validate({ access: 'open' }), false);
});
