---
title: Mappings and resolver targets
description: How to model external identifiers, reading URLs, and canonical citation examples in TextRefs.
sidebar:
  order: 5
---

This guide helps contributors decide whether an external resource belongs in a `MappingAssertion`, in the embedded `resolver_targets` array on a `CanonicalReference`, or neither.

Use this guide after you identify the `Work`, the `CitationSystem`, and the `CanonicalReference` for the citation. For the underlying model, start with [How it works](/get-started/how-it-works/). For the authoring format, see [Authoring registry data](/get-started/authoring/).

## Quick rule

Ask what the external thing is doing.

| If it...                                                            | Model it as...                                 |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| identifies the same _work_ (Wikidata QID, CTS URN of the work, DOI) | `MappingAssertion` (subject = Work IRI)        |
| is a URL where a reader can inspect a specific passage              | entry in `CanonicalReference.resolver_targets` |
| is only an author, institution, subject, or non-textual authority   | usually not TextRefs                           |

A `MappingAssertion` describes the work as a whole. A `resolver_targets` entry lets a reader dereference one specific passage.

## Use a MappingAssertion for work-level identifiers

Create a `MappingAssertion` when another system has an identifier for the _whole work_ and you want to connect it to a TextRefs `Work`. The `subject` MUST be a Work IRI.

Common mapping targets include:

- Wikidata QIDs for works.
- CTS URNs at the work level, for example `urn:cts:greekLit:tlg0059.tlg030`.
- DOIs, Handles, ARKs, PURLs, or URN:NBNs for editions or digital objects.
- another TextRefs Work when two registries need to be aligned.

Choose the relation by what the target is, not by how confident you feel. Use `alternateOf` when the target is another entity that denotes the same work, for example a Wikidata item. Use `isReferencedBy` when the target is a document or page about the work, for example a Wikipedia article.

```json
{
  "type": "MappingAssertion",
  "subject": "https://textrefs.org/id/work/dhammapada",
  "relation": "alternateOf",
  "target": {
    "identifier": "https://www.wikidata.org/entity/Q748878",
    "conforms_to": "https://www.wikidata.org/"
  },
  "source": "manual-curation"
}
```

Passage-level external identifiers, for example the CTS URN for `John.3.16`, are not stored as records. They are derived from the work-level mapping plus the locator at resolve time.

## Add resolver targets for reading locations

A `resolver_targets` entry is a dereferenceable URL where a reader can inspect this reference in a specific edition, translation, platform, or provider. Entries live in an array on `CanonicalReference` — one entry per (provider × language × edition).

Typical resolver targets include:

- a Perseus or Scaife page for a Greek or Latin passage.
- a Wikisource page or section anchor.
- a Bible Gateway, Sefaria, Quran.com, or similar reading URL.
- an institutional repository page for a digitized edition.
- a licensed platform URL, if the access status is recorded honestly.

Each entry records what a reader needs to understand the link: `language` (BCP 47), `edition`, `provider`, `access`, `license` when known, and `last_checked` when maintained.

```json
{
  "type": "CanonicalReference",
  "work_key": "dhammapada",
  "citation_system_key": "dhammapada-chapter-verse",
  "locator": "1.1",
  "resolver_targets": [
    {
      "url": "https://suttacentral.net/dhp1/pli/ms",
      "language": "pli",
      "edition": "Mahāsaṅgīti Tipiṭaka",
      "provider": "SuttaCentral",
      "access": "open"
    },
    {
      "url": "https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/01-Pairs.htm",
      "language": "en",
      "edition": "Anandajoti Bhikkhu translation",
      "provider": "ancient-buddhist-texts.net",
      "access": "open"
    }
  ]
}
```

Contributors author resolver targets as URL templates, not raw URLs. See [Authoring registry data](/get-started/authoring/) for the format. The compiler expands them per reference. Browse the live output at [`/id/work/dhammapada/`](/id/work/dhammapada/) or [`/id/work/plato.republic/`](/id/work/plato.republic/).

## Good first candidates

The best TextRefs candidates are works with established, edition-independent citation systems. The examples below are illustrative. Each actual profile still needs a documented canonical locator form, a `locator_regex`, and review.

| Area       | Citation example                         | Citation system      | Notes                                                         |
| ---------- | ---------------------------------------- | -------------------- | ------------------------------------------------------------- |
| Philosophy | Plato, _Republic_ `514a`                 | Stephanus pagination | Present as `plato.republic` with `stephanus`.                 |
| Philosophy | Aristotle, _Nicomachean Ethics_ `1094a1` | Bekker numbering     | Present as `aristotle.nicomachean-ethics` with `bekker`.      |
| Buddhist   | _Dhammapada_ `1.1`                       | chapter and verse    | Present as `dhammapada` with `dhammapada-chapter-verse`.      |
| Tanakh     | Genesis `Gen.1.1`                        | book, chapter, verse | Present as `tanakh` with `bible-book-chapter-verse`.          |
| Bible      | John `John.3.16`                         | book, chapter, verse | Present as `new-testament` with `bible-book-chapter-verse`.   |
| Chinese    | _Analects_ `2.1`                         | book and chapter     | Present as `confucius.analects` with `analects-book-chapter`. |
| Chinese    | _Daodejing_ `1`                          | chapter              | Present as `laozi.daodejing` with `daodejing-chapter`.        |
| Japanese   | _The Tale of Genji_ `2`                  | chapter              | Present as `murasaki-shikibu.genji` with `genji-chapter`.     |
| Classics   | Homer, _Iliad_ `1.1`                     | book and line        | Present as `homer.iliad` with `homer-book-line`.              |
| Classics   | Homer, _Odyssey_ `1.426`                 | book and line        | Present as `homer.odyssey` with `homer-book-line`.            |

An author's name alone is not a `Work`. For example, "Confucius" is an authority or attribution problem. _Analects_ is the textual work that can receive canonical references.

## Edge cases

**Edition page numbers.** Page numbers from one printed edition usually belong to that edition. They can support a resolver target or an edition-level mapping. They should not become a canonical citation system unless the community cites the work that way across editions.

**Translations.** A translation is a resolver target when it lets readers inspect the cited passage. It is not a new canonical reference unless the translation has its own independently cited segmentation.

**Divergent numbering.** If two traditions number the same material differently, create separate `CanonicalReference`s under separate `CitationSystem`s. The equivalence between the two citation systems is not yet expressible in this version. `MappingAssertion.subject` MUST be a Work IRI, so a system-to-system assertion cannot be authored. A future revision may widen `subject` to admit a `CitationSystem` IRI.

**Contained-by relationships.** An identifier for a whole edition, scan, or digital object is still chosen by what it denotes, per the [ADR-0006](https://github.com/textrefs/textrefs.org/blob/main/decisions/ADR-0006-mapping-relation-vocabulary.md) test:

- if it denotes the same work, model it as `alternateOf`.
- if it is a document about the work, model it as `isReferencedBy`.
- if it only lets a reader inspect one specific passage, it belongs in `resolver_targets`, not a mapping.

**Unstable websites.** A website URL can be useful as a resolver target even if it is not a stable identifier. Do not derive TextRefs IDs from it.

## Contribution checklist

Before proposing mappings or resolver targets, check that:

- the cited passage has a clear `Work`, `CitationSystem`, and canonical locator.
- the citation system documents its canonical locator form and declares a `locator_regex`.
- each `MappingAssertion` subject is a Work IRI and its target identifies a textual resource.
- each `relation` matches what the target is (`alternateOf` for a same-work entity, `isReferencedBy` for a document about the work).
- each `resolver_targets` entry has a dereferenceable URL and honest access metadata.
- the proposal documents its source or curation basis.
- no full text, translation text, apparatus, or commentary is copied into the registry.

See [Contributing](/community/contributing/) for review tracks and pull-request expectations.
