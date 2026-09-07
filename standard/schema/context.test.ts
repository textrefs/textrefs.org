// The published JSON-LD context is part of the standard (`standard/README.md`),
// so its invariants are tested next to the schemas.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import assert from 'node:assert/strict';

const contextPath = join(
	import.meta.dirname,
	'..',
	'..',
	'public',
	'contexts',
	'v1.jsonld',
);
const context = (
	JSON.parse(readFileSync(contextPath, 'utf8')) as {
		'@context': Record<string, unknown>;
	}
)['@context'];

function predicateOf(term: string): string | undefined {
	const definition = context[term];
	if (typeof definition === 'string') return definition;
	if (definition && typeof definition === 'object') {
		const id = (definition as { '@id'?: unknown })['@id'];
		if (typeof id === 'string') return id;
	}
	return undefined;
}

test('no two terms expand to the same predicate', () => {
	// Two terms on one predicate cannot be told apart after expansion. When
	// `license` and `license_url` shared `dcterms:license`, 50047 resolver
	// targets published two IRIs on it: the licence, and the provider's terms
	// page. A consumer had no way to rank them.
	const byPredicate = new Map<string, string[]>();
	for (const term of Object.keys(context)) {
		if (term.startsWith('@')) continue;
		const predicate = predicateOf(term);
		// `id` and `type` alias JSON-LD keywords rather than name a predicate.
		if (!predicate || predicate.startsWith('@')) continue;
		byPredicate.set(predicate, [...(byPredicate.get(predicate) ?? []), term]);
	}

	const shared = [...byPredicate].filter(([, terms]) => terms.length > 1);
	assert.deepEqual(
		shared,
		[],
		`terms sharing a predicate: ${shared.map(([p, t]) => `${t.join(' + ')} → ${p}`).join('; ')}`,
	);
});

test('a licence and a rights statement are different predicates', () => {
	assert.equal(predicateOf('license'), 'dcterms:license');
	assert.equal(predicateOf('license_url'), 'dcterms:rights');
	for (const term of ['license', 'license_url']) {
		assert.equal(
			(context[term] as { '@type'?: string })['@type'],
			'@id',
			`${term} must publish an IRI, not a literal`,
		);
	}
});
