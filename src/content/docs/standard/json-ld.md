---
title: JSON-LD context
description: The JSON-LD context that maps TextRefs records to RDF vocabularies.
sidebar:
  order: 5
---

TextRefs records are plain JSON that becomes linked data through a published JSON-LD context. The context maps TextRefs terms onto a small TextRefs ontology namespace (`tr:`) plus established vocabularies — SKOS for mapping relations, Dublin Core Terms for dates and provenance, and schema.org for URLs and providers.

The `v1` context is served at:

```text
https://textrefs.org/contexts/v1.jsonld
```

## Vocabularies

| Prefix    | Namespace                              | Used for                                                   |
| --------- | -------------------------------------- | ---------------------------------------------------------- |
| `tr`      | `https://textrefs.org/ontology#`       | TextRefs object types and properties                       |
| `skos`    | `http://www.w3.org/2004/02/skos/core#` | Mapping relations (`exactMatch`, `closeMatch`)             |
| `dcterms` | `http://purl.org/dc/terms/`            | `created`, `modified`, `source`, `language`, `license_url` |
| `schema`  | `https://schema.org/`                  | `url`, `provider`, `edition`, date types                   |

## Mapping relations

The MVP mapping relations map directly onto SKOS:

- `exactMatch` → `skos:exactMatch`
- `closeMatch` → `skos:closeMatch`

Use `exactMatch` only when the mapped object identifies the same reference with sufficient precision. If there is uncertainty about segmentation, edition, translation, scope, or locator alignment, use `closeMatch`. See [Specification §10](/standard/specification/#10-mappingassertion).

## The context document

```json
{
  "@context": {
    "tr": "https://textrefs.org/ontology#",
    "skos": "http://www.w3.org/2004/02/skos/core#",
    "dcterms": "http://purl.org/dc/terms/",
    "schema": "https://schema.org/",
    "id": "@id",
    "type": "@type",
    "Work": "tr:Work",
    "CitationSystem": "tr:CitationSystem",
    "CanonicalReference": "tr:CanonicalReference",
    "ResolverTarget": "tr:ResolverTarget",
    "MappingAssertion": "tr:MappingAssertion",
    "preferred_label": "skos:prefLabel",
    "work_key": "tr:workKey",
    "citation_system_key": "tr:citationSystemKey",
    "locator": "tr:locator",
    "normalization_version": "tr:normalizationVersion",
    "status": "tr:status",
    "source": "dcterms:source",
    "created": { "@id": "dcterms:created", "@type": "schema:Date" },
    "modified": { "@id": "dcterms:modified", "@type": "schema:Date" },
    "relation": "tr:relation",
    "exactMatch": { "@id": "skos:exactMatch", "@type": "@id" },
    "closeMatch": { "@id": "skos:closeMatch", "@type": "@id" },
    "target": "tr:target",
    "target_kind": "tr:targetKind",
    "identifier": "tr:identifier",
    "provider": "schema:provider",
    "url": { "@id": "schema:url", "@type": "@id" },
    "language": "dcterms:language",
    "edition": "schema:bookEdition",
    "access": "tr:access",
    "rights_status": "tr:rightsStatus",
    "license_url": { "@id": "dcterms:license", "@type": "@id" }
  }
}
```
