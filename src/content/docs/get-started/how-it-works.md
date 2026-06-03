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

The identity is the Stephanus reference, not any one Greek text, translation, or platform page. The compiled registry record for [`plato.republic` `514a`](/id/ref/884e8b51-b9cc-5f4b-9e49-60c636c0cd1a/) is:

```json
{
  "id": "https://textrefs.org/id/ref/884e8b51-b9cc-5f4b-9e49-60c636c0cd1a",
  "type": "CanonicalReference",
  "work_key": "plato.republic",
  "citation_system_key": "stephanus",
  "locator": "514a",
  "normalization_version": "1.0.0",
  "resolver_targets": [
    {
      "url": "https://www.perseus.tufts.edu/hopper/text?doc=Plat.+Rep.+514a",
      "language": "grc",
      "edition": "Plato, Republic (Burnet, OCT)",
      "provider": "Perseus Digital Library",
      "access": "open",
      "license": "CC-BY-SA-3.0",
      "license_url": "https://www.perseus.tufts.edu/hopper/about/copyright",
      "last_checked": "2026-06-03"
    }
  ],
  "status": "candidate",
  "created": "2026-05-31",
  "modified": "2026-06-03"
}
```

When reading locations exist, they are embedded on the reference itself, one entry per provider or translation. For example, the compiled registry record for [`new-testament` `John.3.16`](/id/ref/59a2d83f-6aff-5fbf-b8f7-b243c3ed0594/) contains a resolver target to STEP Bible:

```json
{
  "id": "https://textrefs.org/id/ref/59a2d83f-6aff-5fbf-b8f7-b243c3ed0594",
  "type": "CanonicalReference",
  "work_key": "new-testament",
  "citation_system_key": "bible-book-chapter-verse",
  "locator": "John.3.16",
  "normalization_version": "1.0.0",
  "resolver_targets": [
    {
      "url": "https://www.stepbible.org/?q=version=SBLG|reference=John.3.16",
      "language": "grc",
      "edition": "SBL Greek New Testament",
      "provider": "STEP Bible",
      "access": "open",
      "license": "CC-BY-4.0",
      "license_url": "https://sblgnt.com/license/"
    }
  ],
  "status": "candidate",
  "created": "2026-05-31",
  "modified": "2026-05-31"
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
    "identifier": "https://www.wikidata.org/entity/Q123397"
  },
  "source": "manual-curation",
  "status": "candidate",
  "created": "2026-05-31",
  "modified": "2026-06-02"
}
```

Adding a resolver target adds one entry to `resolver_targets`; adding a Wikidata QID adds one `MappingAssertion`. No new records are minted per passage. A reference with no curated reading URL yet is still a valid identity record.

## Example: John.3.16

For a heavily translated work, many locations can share one reference identity. The current data-backed example is [`new-testament` `John.3.16`](/id/ref/59a2d83f-6aff-5fbf-b8f7-b243c3ed0594/):

```json
{
  "type": "CanonicalReference",
  "work_key": "new-testament",
  "citation_system_key": "bible-book-chapter-verse",
  "locator": "John.3.16",
  "normalization_version": "1.0.0"
}
```

An English translation, a German translation, a Greek edition, and a library scan can all sit in the `resolver_targets` array on the same reference. Adding a new translation adds another entry, not another canonical reference.

For complete worked examples, see the live [Dhammapada work page](/id/work/dhammapada/) (four providers, two languages, 423 references) or the [Plato _Republic_ work page](/id/work/plato.republic/) (Stephanus pagination). The contributor YAML behind them is documented in [Authoring registry data](/get-started/authoring/).

Where traditions number passages differently, create separate references under separate citation systems and connect them with `closeMatch` mappings. Do not collapse divergent versification, pagination, or segmentation into one identity.

## What TextRefs does not store

TextRefs stores reference data, not texts. Registry records must not include full text, translations, critical apparatus, commentary, or copyrighted edition content.

Keep those in editions, libraries, repositories, or reading platforms. TextRefs only records the stable reference identity, curated mappings, resolver targets, and provenance needed to connect those systems.

## Keep reading

- [Authoring registry data](/get-started/authoring/) — the contributor YAML format and the `npm run build:data` pipeline.
- [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/) explains how to decide whether an external resource should be modelled as a `MappingAssertion` or a resolver-target entry.
- [Related identifier systems](/get-started/related-systems/) compares TextRefs with DOI, ARK, CTS, DTS, Wikidata, VIAF, TEI, and platform URLs.
- [The standard](/standard/) contains the normative object model and validation rules.
