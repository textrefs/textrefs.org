import { test } from 'node:test';
import assert from 'node:assert/strict';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import {
	buildRegistryJsonSchema,
	SCHEMA_DIALECT,
	SCHEMA_ID,
} from './json-schema.ts';
import { fixtureRegistry } from '../../src/lib/registry.fixture.ts';

function validator() {
	const ajv = new Ajv2020({ strict: true, allErrors: true });
	addFormats(ajv);
	// `ajv-formats` carries no RFC 3987 format. Register the same test that Zod
	// applies for `z.url()`, so this validator judges an IRI as the compiler
	// does. In JSON Schema 2020-12 `format` is an annotation by default, so a
	// consumer without the format is not misled either way.
	ajv.addFormat('iri', (value: string) => URL.canParse(value));
	return ajv.compile(buildRegistryJsonSchema());
}

test('the document declares the 2020-12 dialect and its published $id', () => {
	const doc = buildRegistryJsonSchema();
	assert.equal(doc.$schema, SCHEMA_DIALECT);
	assert.equal(doc.$schema, 'https://json-schema.org/draft/2020-12/schema');
	// `specification.md` §14 names this URL. Changing it breaks the published
	// claim, so the value is locked here rather than only in the route.
	assert.equal(doc.$id, SCHEMA_ID);
	assert.equal(doc.$id, 'https://textrefs.org/schemas/v1/textrefs.schema.json');
});

test('the document compiles as JSON Schema 2020-12', () => {
	assert.doesNotThrow(validator);
});

test('the union names all four record types', () => {
	const doc = buildRegistryJsonSchema() as {
		oneOf: { $ref: string }[];
		$defs: Record<string, unknown>;
	};
	assert.deepEqual(Object.keys(doc.$defs), [
		'Work',
		'CitationSystem',
		'CanonicalReference',
		'MappingAssertion',
	]);
	assert.deepEqual(
		doc.oneOf.map((branch) => branch.$ref),
		[
			'#/$defs/Work',
			'#/$defs/CitationSystem',
			'#/$defs/CanonicalReference',
			'#/$defs/MappingAssertion',
		],
	);
});

test('a published CanonicalReference must carry resolver_targets', () => {
	const doc = buildRegistryJsonSchema() as {
		$defs: { CanonicalReference: { required: string[] } };
	};
	// `.default([])` makes the member optional on input and certain on output.
	// The published contract describes the output.
	assert.ok(doc.$defs.CanonicalReference.required.includes('resolver_targets'));
});

test('one record of each type validates', () => {
	const validate = validator();
	const records = [
		fixtureRegistry.works[0],
		fixtureRegistry.systems[0],
		fixtureRegistry.references[0],
		fixtureRegistry.mappings[0],
	];

	for (const record of records) {
		assert.ok(
			validate(record),
			`${record.type} record is invalid: ${JSON.stringify(validate.errors)}`,
		);
	}
});

test('a served body validates with its JSON-LD @context', () => {
	const validate = validator();
	// The shape that `/id/work/{key}.json` actually serves.
	const body = {
		'@context': 'https://textrefs.org/contexts/v1.jsonld',
		...fixtureRegistry.works[0],
	};
	assert.ok(
		validate(body),
		`served body is invalid: ${JSON.stringify(validate.errors)}`,
	);
});

test('a resolver target with a non-ASCII IRI validates', () => {
	const validate = validator();
	// 1219 registry references carry such a target today, for example the
	// Wittgenstein Project's Spanish translations. `format: "uri"` (RFC 3986)
	// would reject every one of them, so the document declares `iri`.
	const reference = structuredClone(fixtureRegistry.references[0]);
	reference.resolver_targets = [
		{
			url: 'https://www.wittgensteinproject.org/w/index.php/Investigaciones_filosóficas_(edición_A)#76',
			access: 'open',
		},
	];
	assert.ok(
		validate(reference),
		`IRI target rejected: ${JSON.stringify(validate.errors)}`,
	);
});

test('a Work with repeated alternative labels is rejected', () => {
	const validate = validator();
	// §6: the entries are unique within one work. `uniqueItems` expresses it,
	// and `work.ts` carries the keyword next to the refinement that enforces it.
	const work = structuredClone(fixtureRegistry.works[0]);
	work.alternative_labels = ['FW', 'FW'];
	assert.equal(validate(work), false);
});

test('the label rule that JSON Schema cannot express is documented', () => {
	// §6 also forbids an alternative label that repeats `preferred_label`. That
	// rule compares two members, which no keyword does, so the published
	// document states it in the field description instead. This test locks the
	// gap: the record below is invalid per the specification and per the
	// canonical Zod `Work`, yet it validates here. Only the compiler rejects it.
	const validate = validator();
	const doc = buildRegistryJsonSchema() as {
		$defs: {
			Work: { properties: { alternative_labels: { description: string } } };
		};
	};
	const description = doc.$defs.Work.properties.alternative_labels.description;
	assert.match(description, /MUST repeat preferred_label/);

	const work = structuredClone(fixtureRegistry.works[0]);
	work.alternative_labels = [work.preferred_label];
	assert.ok(validate(work));
});

test('a record with an unknown type matches no branch', () => {
	const validate = validator();
	const record = { ...fixtureRegistry.works[0], type: 'Manuscript' };
	assert.equal(validate(record), false);
});
