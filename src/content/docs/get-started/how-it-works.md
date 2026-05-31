---
title: How it works
description: A practical walkthrough of TextRefs identity, mappings, and resolver targets.
sidebar:
  order: 3
---

TextRefs turns traditional scholarly citations into stable, machine-readable identifiers without choosing one edition, translation, website, or provider as authoritative.

The core move is simple: separate the cited passage from the places where someone can read it.

## The four records

TextRefs uses three records for identity and one record for work-level equivalences. Reading locations are embedded directly on the `CanonicalReference`.

| Record               | Question it answers               | Example                                       |
| -------------------- | --------------------------------- | --------------------------------------------- |
| `Work`               | Which abstract text?              | Plato's _Republic_                            |
| `CitationSystem`     | Which reference notation?         | Stephanus pagination                          |
| `CanonicalReference` | Which point inside the work?      | `514a`, with embedded `resolver_targets`      |
| `MappingAssertion`   | What else identifies this _work_? | a CTS URN, Wikidata item, or DOI for the work |

`MappingAssertion.subject` is always a `Work` IRI. Passage-level external identifiers are derived from the work-level mapping plus the locator; they are not stored one per passage. See [the specification](/standard/specification/) for the normative rules.

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

Reading locations are embedded on the reference itself, one entry per provider or translation:

```json
{
  "type": "CanonicalReference",
  "work_key": "plato.republic",
  "citation_system_key": "stephanus",
  "locator": "514a",
  "normalization_version": "1.0.0",
  "resolver_targets": [
    {
      "url": "https://www.perseus.tufts.edu/...",
      "language": "grc-Grek",
      "provider": "Perseus Digital Library",
      "access": "open"
    }
  ]
}
```

Work-level equivalences live in a `MappingAssertion`:

```json
{
  "type": "MappingAssertion",
  "subject": "https://textrefs.org/id/work/plato.republic",
  "relation": "exactMatch",
  "target": {
    "target_kind": "wikidata",
    "identifier": "https://www.wikidata.org/entity/Q193760"
  },
  "source": "manual-curation"
}
```

Adding a translation adds one entry to `resolver_targets`; adding a Wikidata QID adds one `MappingAssertion`. No new records are minted per passage.

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

An English translation, a German translation, a Greek edition, and a library scan can all sit in the `resolver_targets` array on the same reference. Adding a new translation adds another entry, not another canonical reference.

For a complete worked example, see the live [Dhammapada work page](/reg/work/dhammapada/) (four providers, two languages, 20 references in chapter 1) or the [Kant _Critique of Pure Reason_](/reg/work/kant.krv/) example. The contributor YAML behind them is documented in [Authoring registry data](/get-started/authoring/).

Where traditions number passages differently, create separate references under separate citation systems and connect them with `closeMatch` mappings. Do not collapse divergent versification, pagination, or segmentation into one identity.

## What TextRefs does not store

TextRefs stores reference data, not texts. Registry records must not include full text, translations, critical apparatus, commentary, or copyrighted edition content.

Keep those in editions, libraries, repositories, or reading platforms. TextRefs only records the stable reference identity, curated mappings, resolver targets, and provenance needed to connect those systems.

## Keep reading

- [Authoring registry data](/get-started/authoring/) — the contributor YAML format and the `npm run build:data` pipeline.
- [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/) explains how to decide whether an external resource should be modelled as a `MappingAssertion` or a resolver-target entry.
- [Related identifier systems](/get-started/related-systems/) compares TextRefs with DOI, ARK, CTS, DTS, Wikidata, VIAF, TEI, and platform URLs.
- [The standard](/standard/) contains the normative object model and validation rules.
