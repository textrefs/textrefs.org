---
title: How it works
description: A practical walkthrough of TextRefs identity, mappings, and resolver targets.
sidebar:
  order: 4
---

TextRefs turns traditional scholarly citations into stable, machine-readable identifiers without choosing one edition, translation, website, or provider as authoritative.

The core move is simple: separate the cited passage from the places where someone can read it.

## The four records

TextRefs uses three records for identity and one record for work-level mappings. Reading locations are embedded directly on the `CanonicalReference`.

| Record               | Question it answers               | Example                                       |
| -------------------- | --------------------------------- | --------------------------------------------- |
| `Work`               | Which abstract text?              | Plato's _Republic_                            |
| `CitationSystem`     | Which reference notation?         | Stephanus pagination                          |
| `CanonicalReference` | Which point inside the work?      | `514a`, with embedded `resolver_targets`      |
| `MappingAssertion`   | What else identifies this _work_? | a CTS URN, Wikidata item, or DOI for the work |

`MappingAssertion.subject` is always a `Work` IRI. Passage-level external identifiers are derived from the work-level mapping plus the locator. The registry does not store them one per passage. See [the specification](/standard/specification/) for the normative rules.

## From citation string to TextRefs ID

For a citation such as "Plato, _Republic_ 514a", a registry contributor or parser does four things.

1. Identify the work: `plato.republic`.
2. Identify the citation system: `stephanus`.
3. Normalize the locator according to that citation system: `514a`.
4. Mint the `CanonicalReference` ID from the tuple `work_key`, `citation_system_key`, and `locator`.

The result is a TextRefs URI for the cited point itself. Once the record is `active`, that URI stays stable even when:

- a website changes its URLs;
- a library adds a new scan;
- a translation appears;
- a mapping is corrected.

## Example: Plato, Republic 514a

The identity is the Stephanus reference, not any one Greek text, translation, or platform page. The compiled registry record for [`plato.republic` `514a`](/id/ref/dc799d4b-9b17-5d76-85aa-dfd001c5321d/) is:

```json
{
  "id": "https://textrefs.org/id/ref/dc799d4b-9b17-5d76-85aa-dfd001c5321d",
  "type": "CanonicalReference",
  "work_key": "plato.republic",
  "citation_system_key": "stephanus",
  "locator": "514a",
  "resolver_targets": [
    {
      "url": "https://www.perseus.tufts.edu/hopper/text?doc=Plat.+Rep.+514a",
      "language": "grc",
      "edition": "Plato, Republic (Burnet, OCT)",
      "provider": "Perseus Digital Library",
      "access": "open",
      "license": "https://spdx.org/licenses/CC-BY-SA-3.0",
      "license_url": "https://www.perseus.tufts.edu/hopper/opensource",
      "last_checked": "2026-06-03"
    }
  ],
  "status": "draft",
  "created": "2026-05-31",
  "modified": "2026-08-12"
}
```

When reading locations exist, the registry embeds them on the reference itself, one entry per provider or translation. For example, the compiled registry record for [`new-testament` `John.3.16`](/id/ref/b6438d55-f3f2-5fc7-ab40-4f582f8774c3/) contains resolver targets to STEP Bible and Deutsche Bibelgesellschaft:

```json
{
  "id": "https://textrefs.org/id/ref/b6438d55-f3f2-5fc7-ab40-4f582f8774c3",
  "type": "CanonicalReference",
  "work_key": "new-testament",
  "citation_system_key": "bible-book-chapter-verse",
  "locator": "John.3.16",
  "resolver_targets": [
    {
      "url": "https://www.stepbible.org/?q=version=SBLG%7Creference=John.3.16",
      "language": "grc",
      "edition": "SBL Greek New Testament",
      "provider": "STEP Bible",
      "access": "open",
      "license": "https://spdx.org/licenses/CC-BY-4.0",
      "license_url": "https://sblgnt.com/license/",
      "last_checked": "2026-06-03"
    },
    {
      "url": "https://www.die-bibel.de/bibel/NA28/JHN.3/#JHN.3.16",
      "language": "grc",
      "edition": "Nestle-Aland, Novum Testamentum Graece, 28th edn (NA28)",
      "provider": "Deutsche Bibelgesellschaft",
      "access": "open",
      "license_url": "https://www.die-bibel.de/impressum",
      "last_checked": "2026-08-12"
    }
  ],
  "status": "draft",
  "created": "2026-05-31",
  "modified": "2026-08-12"
}
```

Work-level mappings live in a `MappingAssertion`. This one says the Wikidata item denotes the same work:

```json
{
  "type": "MappingAssertion",
  "subject": "https://textrefs.org/id/work/plato.republic",
  "relation": "alternateOf",
  "target": {
    "identifier": "https://www.wikidata.org/entity/Q123397",
    "conforms_to": "https://www.wikidata.org/"
  },
  "source": "manual-curation",
  "status": "draft",
  "created": "2026-05-31",
  "modified": "2026-08-11"
}
```

Adding a resolver target adds one entry to `resolver_targets`. Adding a Wikidata QID adds one `MappingAssertion`. The compiler mints no new records per passage. A reference with no curated reading URL yet is still a valid identity record.

## Example: John.3.16

For a heavily translated work, many locations can share one reference identity. The current data-backed example is [`new-testament` `John.3.16`](/id/ref/b6438d55-f3f2-5fc7-ab40-4f582f8774c3/):

```json
{
  "type": "CanonicalReference",
  "work_key": "new-testament",
  "citation_system_key": "bible-book-chapter-verse",
  "locator": "John.3.16"
}
```

An English translation, a German translation, a Greek edition, and a library scan can all sit in the `resolver_targets` array on the same reference. Adding a new translation adds another entry, not another canonical reference.

For complete worked examples, see the live [Dhammapada work page](/id/work/dhammapada/), which has three resolver targets across two providers, two languages, and 423 references. Alternatively, see the [Plato _Republic_ work page](/id/work/plato.republic/), which uses Stephanus pagination. The contributor YAML behind them is documented in [Authoring registry data](/get-started/authoring/).

Where traditions number passages differently, create separate references under separate citation systems. Do not collapse divergent versification, pagination, or segmentation into one identity. The equivalence between the citation systems themselves is not yet expressible in this version. `MappingAssertion.subject` MUST be a Work IRI, so a system-to-system assertion cannot be authored. A future revision may widen `subject` to admit a `CitationSystem` IRI.

## What TextRefs does not store

TextRefs stores reference data, not texts. Registry records must not include:

- full text;
- translations;
- critical apparatus;
- commentary;
- copyrighted edition content.

Keep those in editions, libraries, repositories, or reading platforms. TextRefs only records the stable reference identity, curated mappings, resolver targets, and provenance needed to connect those systems.

## Keep reading

- [Authoring registry data](/get-started/authoring/) documents the contributor YAML format and the `npm run build:data` pipeline.
- [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/) explains how to decide whether an external resource should be modelled as a `MappingAssertion` or a resolver-target entry.
- [Related standards and systems](/get-started/related-systems/) groups the neighbouring standards by the layer they address, from identifier schemes to annotation models and reading platforms.
- [The standard](/standard/) contains the normative object model and validation rules.
