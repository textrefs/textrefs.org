---
title: How it works
description: A practical walkthrough of TextRefs identity, mappings, and resolver targets.
sidebar:
  order: 2
---

TextRefs turns traditional scholarly citations into stable, machine-readable identifiers without choosing one edition, translation, website, or provider as authoritative.

The core move is simple: separate the cited passage from the places where someone can read it.

## The five records

TextRefs uses three records for identity and two records for connections to the outside world.

| Record               | Question it answers          | Example                                       |
| -------------------- | ---------------------------- | --------------------------------------------- |
| `Work`               | Which abstract text?         | Plato's _Republic_                            |
| `CitationSystem`     | Which reference notation?    | Stephanus pagination                          |
| `CanonicalReference` | Which point inside the work? | `514a`                                        |
| `MappingAssertion`   | What else identifies this?   | a CTS URN, Wikidata item, DOI, or TextRefs ID |
| `ResolverTarget`     | Where can someone read it?   | a Perseus, Scaife, Wikisource, or library URL |

`Work`, `CitationSystem`, and `CanonicalReference` define identity. `MappingAssertion` and `ResolverTarget` enrich that identity; they do not create it.

## From citation string to TextRefs ID

For a citation such as "Plato, _Republic_ 514a", a registry contributor or parser does four things.

1. Identify the work: `plato.republic`.
2. Identify the citation system: `stephanus`.
3. Normalize the locator according to that citation system: `514a`.
4. Mint the `CanonicalReference` ID from the tuple `work_key`, `citation_system_key`, `locator`, and `normalization_version`.

The result is a persistent TextRefs URI for the cited point itself. That URI stays stable if a website changes its URLs, a library adds a new scan, a translation appears, or a mapping is corrected.

## Example: Plato, Republic 514a

The identity is the Stephanus reference, not any one Greek text, translation, or platform page:

```json
{
  "type": "CanonicalReference",
  "work_key": "plato.republic",
  "citation_system_key": "stephanus",
  "locator": "514a",
  "normalization_version": "1.0.0"
}
```

External identifiers and reading locations attach to that identity:

```json
[
  {
    "type": "MappingAssertion",
    "subject": "https://textrefs.org/id/ref/{republic-514a}",
    "relation": "exactMatch",
    "target": {
      "target_kind": "cts",
      "identifier": "urn:cts:greekLit:tlg0059.tlg030:514a"
    },
    "source": "manual-curation"
  },
  {
    "type": "ResolverTarget",
    "subject": "https://textrefs.org/id/ref/{republic-514a}",
    "url": "https://www.perseus.tufts.edu/...",
    "language": "grc-Grek",
    "provider": "Perseus Digital Library",
    "access": "open"
  }
]
```

The `MappingAssertion` says another identifier denotes the same reference. The `ResolverTarget` says a reader can follow this URL to inspect a concrete source.

## Example: John 3:16

For a heavily translated work, many locations can share one reference identity:

```json
{
  "type": "CanonicalReference",
  "work_key": "bible.john",
  "citation_system_key": "bible-chapter-verse",
  "locator": "3:16",
  "normalization_version": "1.0.0"
}
```

An English translation, a German translation, a Greek edition, and a library scan can all be `ResolverTarget`s for the same subject. Adding a new translation adds another resolver target, not another canonical reference.

Where traditions number passages differently, create separate references under separate citation systems and connect them with `closeMatch` mappings. Do not collapse divergent versification, pagination, or segmentation into one identity.

## What TextRefs does not store

TextRefs stores reference data, not texts. Registry records must not include full text, translations, critical apparatus, commentary, or copyrighted edition content.

Keep those in editions, libraries, repositories, or reading platforms. TextRefs only records the stable reference identity, curated mappings, resolver targets, and provenance needed to connect those systems.

## Keep reading

- [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/) explains how to decide whether an external resource should be modelled as a `MappingAssertion` or a `ResolverTarget`.
- [Related identifier systems](/get-started/related-systems/) compares TextRefs with DOI, ARK, CTS, DTS, Wikidata, VIAF, TEI, and platform URLs.
- [The standard](/standard/) contains the normative object model and validation rules.
