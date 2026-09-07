export const ONTOLOGY_IRI = 'https://textrefs.org/ontology';
export const ONTOLOGY_NAMESPACE = `${ONTOLOGY_IRI}#`;
/** Kept in lockstep with `package.json`; asserted by `jsonld.test.ts`. */
export const ONTOLOGY_VERSION = '0.1.0';

export interface OntologyTerm {
	localName: string;
	kind: 'Class' | 'DatatypeProperty' | 'ObjectProperty';
	label: string;
	comment: string;
	subClassOf?: string[];
	domain?: string[];
	range?: string[];
}

/**
 * The terms TextRefs genuinely needs to own. Generic RDF structure and metadata
 * stay in RDF, SKOS, Dublin Core Terms, PROV-O, and schema.org instead.
 */
export const ONTOLOGY_TERMS: OntologyTerm[] = [
	{
		localName: 'Work',
		kind: 'Class',
		label: 'Work',
		comment:
			'An abstract, language-independent intellectual work identified by TextRefs.',
		subClassOf: ['https://schema.org/CreativeWork'],
	},
	{
		localName: 'CitationSystem',
		kind: 'Class',
		label: 'Citation system',
		comment:
			'A notation and validation scheme used to identify reference points within one or more works.',
		subClassOf: ['http://www.w3.org/2004/02/skos/core#ConceptScheme'],
	},
	{
		localName: 'CanonicalReference',
		kind: 'Class',
		label: 'Canonical reference',
		comment:
			'An abstract, language-independent reference point identified by a work, a citation system, and a canonical locator.',
		subClassOf: ['http://www.w3.org/2004/02/skos/core#Concept'],
	},
	{
		localName: 'MappingAssertion',
		kind: 'Class',
		label: 'Mapping assertion',
		comment:
			'A curated, sourced statement that relates a TextRefs Work to an identifier in another system.',
	},
	{
		localName: 'creatorKind',
		kind: 'DatatypeProperty',
		label: 'creator kind',
		comment:
			'The plain-JSON discriminator for a lightweight creator object: person or literal.',
		range: ['http://www.w3.org/2000/01/rdf-schema#Literal'],
	},
	{
		localName: 'workKey',
		kind: 'DatatypeProperty',
		label: 'work key',
		comment:
			'The flat TextRefs key of the Work that participates in a record identity.',
		domain: [`${ONTOLOGY_NAMESPACE}CanonicalReference`],
		range: ['http://www.w3.org/2000/01/rdf-schema#Literal'],
	},
	{
		localName: 'citationSystemKey',
		kind: 'DatatypeProperty',
		label: 'citation-system key',
		comment:
			'The flat TextRefs key of the CitationSystem that participates in a reference identity.',
		domain: [`${ONTOLOGY_NAMESPACE}CanonicalReference`],
		range: ['http://www.w3.org/2000/01/rdf-schema#Literal'],
	},
	{
		localName: 'preferredCitationSystemKey',
		kind: 'DatatypeProperty',
		label: 'preferred citation-system key',
		comment:
			'The flat TextRefs key of the citation system a work uses for its bare citation aliases and default presentation.',
		domain: [`${ONTOLOGY_NAMESPACE}Work`],
		range: ['http://www.w3.org/2000/01/rdf-schema#Literal'],
	},
	{
		localName: 'status',
		kind: 'DatatypeProperty',
		label: 'status',
		comment:
			'The TextRefs lifecycle status of a record: draft, active, deprecated, withdrawn, or blocked.',
		range: ['http://www.w3.org/2000/01/rdf-schema#Literal'],
	},
	{
		localName: 'relation',
		kind: 'DatatypeProperty',
		label: 'relation',
		comment:
			'The TextRefs relation a mapping assertion records: alternateOf or isReferencedBy (ADR-0006).',
		domain: [`${ONTOLOGY_NAMESPACE}MappingAssertion`],
		range: ['http://www.w3.org/2000/01/rdf-schema#Literal'],
	},
	{
		localName: 'subject',
		kind: 'ObjectProperty',
		label: 'subject',
		comment: 'The Work a mapping assertion is about.',
		domain: [`${ONTOLOGY_NAMESPACE}MappingAssertion`],
		range: [`${ONTOLOGY_NAMESPACE}Work`],
	},
	{
		localName: 'target',
		kind: 'ObjectProperty',
		label: 'target',
		comment:
			'The embedded description of the external entity a mapping assertion points at.',
		domain: [`${ONTOLOGY_NAMESPACE}MappingAssertion`],
	},
	{
		localName: 'identifier',
		kind: 'ObjectProperty',
		label: 'identifier',
		comment:
			'The IRI of the external entity a mapping target names. It identifies a textual resource.',
	},
	{
		localName: 'resolverTargets',
		kind: 'ObjectProperty',
		label: 'resolver targets',
		comment:
			'Embedded descriptions of external locations where a canonical reference can be read.',
		domain: [`${ONTOLOGY_NAMESPACE}CanonicalReference`],
	},
	{
		localName: 'access',
		kind: 'DatatypeProperty',
		label: 'access',
		comment:
			'The TextRefs access category for a resolver target: open, paywalled, restricted, or unknown.',
		range: ['http://www.w3.org/2000/01/rdf-schema#Literal'],
	},
	{
		localName: 'lastChecked',
		kind: 'DatatypeProperty',
		label: 'last checked',
		comment: 'The date on which a resolver target was last checked.',
		range: ['http://www.w3.org/2001/XMLSchema#date'],
	},
	{
		localName: 'locatorRegex',
		kind: 'DatatypeProperty',
		label: 'locator regular expression',
		comment:
			'An ECMAScript regular expression that validates canonical locators in a citation system.',
		domain: [`${ONTOLOGY_NAMESPACE}CitationSystem`],
		range: ['http://www.w3.org/2000/01/rdf-schema#Literal'],
	},
];

function iriReferences(values: string[] | undefined) {
	return values?.map((value) => ({ '@id': value }));
}

export function ontologyJsonLd() {
	return {
		'@context': {
			dcterms: 'http://purl.org/dc/terms/',
			owl: 'http://www.w3.org/2002/07/owl#',
			rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
		},
		// `@graph` without an `@id` sibling keeps every triple in the default
		// graph, as the registry collections do. A node object carrying both
		// would declare a *named* graph, and a consumer that parses the document
		// into a single graph would then find the ontology empty.
		'@graph': [
			{
				'@id': ONTOLOGY_IRI,
				'@type': 'owl:Ontology',
				'dcterms:title': 'TextRefs ontology',
				'dcterms:description':
					'The small application vocabulary used by the TextRefs JSON-LD context where established vocabularies are not precise enough.',
				'dcterms:license': {
					'@id': 'https://creativecommons.org/licenses/by-sa/4.0/',
				},
				'owl:versionInfo': ONTOLOGY_VERSION,
			},
			...ONTOLOGY_TERMS.map((term) => ({
				'@id': `${ONTOLOGY_NAMESPACE}${term.localName}`,
				'@type': `owl:${term.kind}`,
				'rdfs:isDefinedBy': { '@id': ONTOLOGY_IRI },
				'rdfs:label': term.label,
				'rdfs:comment': term.comment,
				...(term.subClassOf
					? { 'rdfs:subClassOf': iriReferences(term.subClassOf) }
					: {}),
				...(term.domain ? { 'rdfs:domain': iriReferences(term.domain) } : {}),
				...(term.range ? { 'rdfs:range': iriReferences(term.range) } : {}),
			})),
		],
	};
}
