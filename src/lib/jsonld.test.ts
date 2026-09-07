import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import jsonld from 'jsonld';
import type { ContextDefinition, JsonLdDocument } from 'jsonld';

import { fixtureRegistry } from './registry.fixture.ts';
import {
	ONTOLOGY_IRI,
	ONTOLOGY_NAMESPACE,
	ONTOLOGY_TERMS,
	ONTOLOGY_VERSION,
	ontologyJsonLd,
} from './ontology.ts';

const projectRoot = join(import.meta.dirname, '..', '..');
const contextDocument = JSON.parse(
	readFileSync(join(projectRoot, 'public', 'contexts', 'v1.jsonld'), 'utf8'),
) as { '@context': Record<string, unknown> };
const context = contextDocument['@context'];

const RDF = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#';
const OWL = 'http://www.w3.org/2002/07/owl#';
const DCTERMS = 'http://purl.org/dc/terms/';
const PROV = 'http://www.w3.org/ns/prov#';
const SKOS = 'http://www.w3.org/2004/02/skos/core#';

async function expand(record: object) {
	// The context comes from parsed JSON, whose broad runtime types cannot carry
	// the literal unions in @types/jsonld. The processor remains the authority.
	const document = {
		'@context': context as unknown as ContextDefinition,
		...record,
	} as JsonLdDocument;
	const nodes = await jsonld.expand(document, {});
	assert.equal(nodes.length, 1);
	return nodes[0] as Record<string, unknown>;
}

test('the v1 context stays within JSON-LD 1.0', () => {
	// A 1.1-only feature makes a 1.0 processor reject the whole context, so the
	// published v1 keeps to what every processor can read.
	assert.equal(context['@version'], undefined);
	for (const [term, definition] of Object.entries(context)) {
		if (definition && typeof definition === 'object') {
			assert.equal(
				(definition as { '@context'?: unknown })['@context'],
				undefined,
				`${term} carries a term-scoped context, which is JSON-LD 1.1 only`,
			);
		}
	}
});

test('generic identifiers and scheme-specific locators reuse established terms', async () => {
	const work = fixtureRegistry.works[0];
	const expandedWork = await expand(work);
	assert.deepEqual(expandedWork[`${DCTERMS}identifier`], [
		{ '@value': work.key },
	]);

	const reference = fixtureRegistry.references[0];
	const expandedReference = await expand(reference);
	assert.deepEqual(expandedReference[`${SKOS}notation`], [
		{ '@value': reference.locator },
	]);
});

test('Work projections expand as the ADR-0006 mapping relations', async () => {
	const work = fixtureRegistry.works[0];
	const node = await expand(work);

	assert.deepEqual(node[`${PROV}alternateOf`], [
		{ '@id': work.alternateOf?.[0] },
	]);
	assert.deepEqual(node[`${DCTERMS}isReferencedBy`], [
		{ '@id': work.isReferencedBy?.[0] },
	]);
});

test('the ontology defines every TextRefs term the context uses', () => {
	const usedTerms = new Set<string>();
	for (const definition of Object.values(context)) {
		const id =
			typeof definition === 'string'
				? definition
				: definition && typeof definition === 'object'
					? (definition as { '@id'?: unknown })['@id']
					: undefined;
		if (typeof id === 'string' && id.startsWith('tr:')) {
			usedTerms.add(id.slice('tr:'.length));
		}
	}

	assert.deepEqual(
		[...usedTerms].sort(),
		ONTOLOGY_TERMS.map((term) => term.localName).sort(),
	);
});

test('every ontology term is typed in the default graph', async () => {
	// The point of the document is that a consumer can parse it into one graph
	// and see the vocabulary. Asserting the expanded shape would not catch a
	// named graph, which is where an `@id` beside `@graph` would put the terms.
	const quads = (await jsonld.toRDF(
		ontologyJsonLd() as unknown as JsonLdDocument,
		{ format: 'application/n-quads' },
	)) as unknown as string;

	// A quad in a named graph would carry the graph IRI as a fourth term, so a
	// line that ends right after the object proves the triple is in the default
	// graph.
	for (const term of ONTOLOGY_TERMS) {
		assert.ok(
			quads.includes(
				`<${ONTOLOGY_NAMESPACE}${term.localName}> <${RDF}type> <${OWL}${term.kind}> .\n`,
			),
			`${term.localName} is not typed in the default graph`,
		);
	}
	assert.ok(
		quads.includes(`<${ONTOLOGY_IRI}> <${RDF}type> <${OWL}Ontology> .\n`),
	);
});

test('the ontology version matches the package version', () => {
	const pkg = JSON.parse(
		readFileSync(join(projectRoot, 'package.json'), 'utf8'),
	) as { version: string };
	assert.equal(ONTOLOGY_VERSION, pkg.version);
});
