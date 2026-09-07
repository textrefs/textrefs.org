---
title: JSON-LD context
description: The JSON-LD context that maps TextRefs records to RDF vocabularies.
maturity: working-draft
sidebar:
  order: 5
---

TextRefs records are plain JSON that becomes linked data through a published JSON-LD context. The context stays within JSON-LD 1.0, so every processor can read it. It maps TextRefs terms onto a small TextRefs ontology namespace (`tr:`) — defined term by term in the [TextRefs ontology](/ontology/) — plus established vocabularies — SKOS for labels and schemes, PROV-O and Dublin Core Terms for mapping relations, Dublin Core Terms also for dates and provenance, schema.org for URLs and providers, and XSD for date typing.

The `v1` context is served at:

```text
https://textrefs.org/contexts/v1.jsonld
```

## Vocabularies

| Prefix    | Namespace                              | Used for                                                                                                                                                                      |
| --------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tr`      | `https://textrefs.org/ontology#`       | TextRefs object types and TextRefs-specific metadata, defined at [`/ontology/`](/ontology/)                                                                                   |
| `skos`    | `http://www.w3.org/2004/02/skos/core#` | Labels, schemes (`inScheme`), and locator notations                                                                                                                           |
| `dcterms` | `http://purl.org/dc/terms/`            | `identifier`, `created`, `modified`, `source`, `language`, `license`, `rights`, `conformsTo`, `description`, `isReferencedBy` mapping relation, `isReplacedBy` successor link |
| `prov`    | `http://www.w3.org/ns/prov#`           | Work ↔ same-entity mapping relation (`alternateOf`)                                                                                                                           |
| `schema`  | `https://schema.org/`                  | `url`, `provider`, `edition`, `creator`, `familyName`, `givenName`, `name`                                                                                                    |
| `xsd`     | `http://www.w3.org/2001/XMLSchema#`    | `xsd:date` typing for `created` / `modified` / `last_checked`                                                                                                                 |

## Mapping relations

The mapping relations are chosen by what the target is, never by author confidence:

- `alternateOf` → `prov:alternateOf`, when the target is another entity denoting the same work (e.g. a Wikidata item).
- `isReferencedBy` → `dcterms:isReferencedBy`, when the target is a document or page about the work (e.g. a Wikipedia article).

Published `Work` records additionally carry direct `alternateOf` / `isReferencedBy` arrays derived from mapping assertions that are not `deprecated`, `withdrawn` or `blocked`, published as `prov:alternateOf` / `dcterms:isReferencedBy` edges from the work IRI to the mapped identifiers without dereferencing the reified `MappingAssertion` records. The arrays are a read-only projection; the assertion stays authoritative ([Specification §6](/standard/specification/#6-work)). The arrays enrich the work. They make no claim about review: a consumer that needs the status of a mapping must read the `MappingAssertion`.

Choose `alternateOf` when the target identifies the same work from a different perspective or at a different level of abstraction; choose `isReferencedBy` when the target describes the work rather than identifying it. See [Specification §10](/standard/specification/#10-mappingassertion).

## The context document

```json
{
  "@context": {
    "tr": "https://textrefs.org/ontology#",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "dcterms": "http://purl.org/dc/terms/",
    "prov": "http://www.w3.org/ns/prov#",
    "schema": "https://schema.org/",
    "xsd": "http://www.w3.org/2001/XMLSchema#",
    "id": "@id",
    "type": "@type",
    "Work": "tr:Work",
    "CitationSystem": "tr:CitationSystem",
    "CanonicalReference": "tr:CanonicalReference",
    "MappingAssertion": "tr:MappingAssertion",
    "key": "dcterms:identifier",
    "preferred_label": "skos:prefLabel",
    "alternative_labels": { "@id": "skos:altLabel", "@container": "@set" },
    "description": "dcterms:description",
    "creators": "schema:creator",
    "kind": "tr:creatorKind",
    "family": "schema:familyName",
    "given": "schema:givenName",
    "name": "schema:name",
    "inScheme": { "@id": "skos:inScheme", "@type": "@id" },
    "work_key": "tr:workKey",
    "citation_system_key": "tr:citationSystemKey",
    "preferred_citation_system_key": "tr:preferredCitationSystemKey",
    "locator": "skos:notation",
    "status": "tr:status",
    "source": "dcterms:source",
    "created": { "@id": "dcterms:created", "@type": "xsd:date" },
    "modified": { "@id": "dcterms:modified", "@type": "xsd:date" },
    "relation": "tr:relation",
    "alternateOf": { "@id": "prov:alternateOf", "@type": "@id" },
    "isReferencedBy": { "@id": "dcterms:isReferencedBy", "@type": "@id" },
    "subject": { "@id": "tr:subject", "@type": "@id" },
    "target": "tr:target",
    "identifier": { "@id": "tr:identifier", "@type": "@id" },
    "conforms_to": { "@id": "dcterms:conformsTo", "@type": "@id" },
    "resolver_targets": "tr:resolverTargets",
    "provider": "schema:provider",
    "url": { "@id": "schema:url", "@type": "@id" },
    "language": "dcterms:language",
    "edition": "schema:bookEdition",
    "access": "tr:access",
    "license": { "@id": "dcterms:license", "@type": "@id" },
    "license_url": { "@id": "dcterms:rights", "@type": "@id" },
    "superseded_by": { "@id": "dcterms:isReplacedBy", "@type": "@id" },
    "last_checked": { "@id": "tr:lastChecked", "@type": "xsd:date" },
    "locator_regex": "tr:locatorRegex"
  }
}
```

`key`, `work_key`, `citation_system_key`, and `preferred_citation_system_key` are plain strings in the core JSON format. In RDF, `key` is a `dcterms:identifier` and `locator` is a `skos:notation`; the three relationship keys stay TextRefs terms, because treating them as identifiers of the record itself would be false. Rich bibliographic and authority data — catalogue records, edition histories, subject classifications — belongs in external systems and is connected to TextRefs records through `MappingAssertion`s. The one in-record exception is the optional `Work.creators` array, which carries minimal authorship for citation rendering (see [Specification §6](/standard/specification/#6-work)). The `license` term carries the canonical SPDX licence IRI (`https://spdx.org/licenses/{id}`, derived from the authored SPDX identifier at compile time) and maps to an IRI-typed `dcterms:license`. `license_url` names the provider's rights statement — a licensing page, a terms page, or an imprint — and maps to an IRI-typed `dcterms:rights`. The two say different things, so a target may carry both. `MappingAssertion.source` is a plain string in v0.1 — a structured **W3C PROV-O** mapping (`prov:wasDerivedFrom`) is reserved for a later context version.
