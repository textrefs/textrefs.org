---
title: Mappings and resolver targets
description: How to model external identifiers, reading URLs, and canonical citation examples in TextRefs.
sidebar:
  order: 4
---

This guide helps contributors decide whether an external resource belongs in a `MappingAssertion`, in the embedded `resolver_targets` array on a `CanonicalReference`, or neither.

Use it after you have already identified the `Work`, the `CitationSystem`, and the `CanonicalReference` for the citation itself. For the underlying model, start with [How it works](/get-started/how-it-works/). For the authoring format, see [Authoring registry data](/get-started/authoring/).

## Quick rule

Ask what the external thing is doing.

| If it...                                                            | Model it as...                                 |
| ------------------------------------------------------------------- | ---------------------------------------------- |
| identifies the same _work_ (Wikidata QID, CTS URN of the work, DOI) | `MappingAssertion` (subject = Work IRI)        |
| is a URL where a reader can inspect a specific passage              | entry in `CanonicalReference.resolver_targets` |
| is only an author, institution, subject, or non-textual authority   | usually not TextRefs                           |

A `MappingAssertion` is about work-level equivalence. A `resolver_targets` entry is about dereferencing one passage.

## Use a MappingAssertion for work-level identifiers

Create a `MappingAssertion` when another system has an identifier for the _whole work_ that should be connected to a TextRefs `Work`. The `subject` MUST be a Work IRI.

Common mapping targets include:

- Wikidata QIDs for works;
- CTS URNs at the work level (e.g. `urn:cts:greekLit:tlg0059.tlg030`);
- DOIs, Handles, ARKs, PURLs, or URN:NBNs for editions or digital objects;
- another TextRefs Work when two registries need to be aligned.

Use `exactMatch` only when the target identifies the same work with enough precision. Use `closeMatch` for edition or scope mismatches.

```json
{
  "type": "MappingAssertion",
  "subject": "https://textrefs.org/id/work/dhammapada",
  "relation": "exactMatch",
  "target": {
    "target_kind": "wikidata",
    "identifier": "https://www.wikidata.org/entity/Q220114"
  },
  "source": "manual-curation"
}
```

Passage-level external identifiers (e.g. the CTS URN for John 3:16) are not stored as records. They are derived from the work-level mapping plus the locator at resolve time.

## Add resolver targets for reading locations

A `resolver_targets` entry is a dereferenceable URL where a reader can inspect this reference in a specific edition, translation, platform, or provider. Entries live in an array on `CanonicalReference` — one entry per (provider × language × edition).

Typical resolver targets include:

- a Perseus or Scaife page for a Greek or Latin passage;
- a Wikisource page or section anchor;
- a Bible Gateway, Sefaria, Quran.com, or similar reading URL;
- an institutional repository page for a digitized edition;
- a licensed platform URL, if the access status is recorded honestly.

Each entry records what a reader needs to understand the link: `language` (BCP 47), `edition`, `provider`, `access`, `license` when known, and `last_checked` when maintained.

```json
{
  "type": "CanonicalReference",
  "work_key": "dhammapada",
  "citation_system_key": "dhammapada-chapter-verse",
  "locator": "1.1",
  "normalization_version": "1.0.0",
  "resolver_targets": [
    {
      "url": "https://en.wikisource.org/wiki/Dhammapada_(Muller)#Chapter_I:_The_Twin-Verses",
      "language": "en",
      "edition": "Müller (1881)",
      "provider": "Wikisource",
      "access": "open"
    },
    {
      "url": "https://palikanon.com/khuddaka/dhp/dhp.html#dhp_1",
      "language": "de",
      "provider": "palikanon.com",
      "access": "open"
    }
  ]
}
```

Contributors author resolver targets as URL templates, not raw URLs — see [Authoring registry data](/get-started/authoring/). The compiler expands them per reference. Browse the live output at [`/reg/work/dhammapada/`](/reg/work/dhammapada/) or [`/reg/work/kant.krv/`](/reg/work/kant.krv/).

## Good first candidates

The best TextRefs candidates are works with established, edition-independent citation systems. The examples below are illustrative; each actual profile still needs documented normalization rules, valid examples, invalid examples, and review.

| Area       | Citation example                                | Likely citation system                    | Notes                                                                                 |
| ---------- | ----------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------- |
| Philosophy | Plato, _Republic_ `514a`                        | Stephanus pagination                      | Strong candidate; maps well to CTS-aware classical infrastructure.                    |
| Philosophy | Aristotle, _Metaphysics_ `983b10`               | Bekker numbering                          | Strong candidate; already used as a seed profile pattern.                             |
| Philosophy | Kant, _Critique of Pure Reason_ `A51/B75`       | Akademie A/B pagination                   | Strong candidate if normalization covers A-only, B-only, and shared references.       |
| Philosophy | Hegel, _Phenomenology of Spirit_ paragraph 178  | paragraph or section numbering            | Use only a documented stable scheme; edition page numbers are resolver metadata.      |
| Philosophy | Marx, _Capital_ I.1.4                           | volume, chapter, section, subdivision     | Prefer structural citations; edition-specific page systems need separate treatment.   |
| Philosophy | Wittgenstein, _Philosophical Investigations_ 43 | numbered remarks                          | Strong candidate where the cited unit is the stable remark number.                    |
| Law        | U.S. Constitution art. I, sec. 8, cl. 3         | article, section, clause, amendment       | Strong candidate; amendments and clauses need explicit locator rules.                 |
| Bible      | John `3:16`                                     | book, chapter, verse                      | Strong candidate; divergent versification traditions require separate systems.        |
| Qur'an     | Qur'an `2:255`                                  | surah, ayah                               | Strong candidate; edition and translation belong in resolver targets.                 |
| Tanakh     | Genesis `1:1`                                   | book, chapter, verse                      | Strong candidate; distinguish the relevant canon and versification tradition.         |
| Talmud     | Berakhot `2a`                                   | tractate, daf, amud                       | Strong candidate if tractate names and folio normalization are controlled.            |
| Vedic text | Rigveda `1.1.1`                                 | mandala, hymn, verse                      | Strong candidate if the profile states allowed numbering and text scope.              |
| Buddhist   | Vinaya reference                                | tradition-specific rule or section system | Candidate, but likely needs separate profiles by canon, school, and edition practice. |
| Chinese    | _Analects_ `2.1`                                | book and section                          | Strong candidate if chapter and saying divisions are documented.                      |
| Chinese    | _Daodejing_ `1`                                 | chapter                                   | Candidate; line-level or version-specific divisions should be modelled separately.    |
| Japanese   | _Kojiki_ reference                              | agreed book, episode, or section system   | Candidate only after a stable reference profile is selected.                          |
| Sanskrit   | _Bhagavad Gita_ `2:47`                          | chapter and verse                         | Strong candidate; translations and editions are resolver targets.                     |
| Buddhist   | _Dhammapada_ `1`                                | verse                                     | Strong candidate if verse numbering is stable for the chosen textual tradition.       |
| Classics   | Homer, _Iliad_ `1.1`                            | book and line                             | Strong candidate; CTS mappings are likely useful.                                     |

An author's name alone is not a `Work`. For example, "Confucius" is an authority or attribution problem; _Analects_ is the textual work that can receive canonical references.

## Edge cases

**Edition page numbers.** Page numbers from one printed edition usually belong to that edition. They can support a resolver target or an edition-level mapping, but they should not become a canonical citation system unless the community actually cites the work that way across editions.

**Translations.** A translation is a resolver target when it lets readers inspect the cited passage. It is not a new canonical reference unless the translation has its own independently cited segmentation.

**Divergent numbering.** If two traditions number the same material differently, create separate `CanonicalReference`s under separate `CitationSystem`s and connect them with `closeMatch` mappings.

**Contained-by relationships.** If an identifier points to a whole edition, scan, or digital object rather than the exact passage, avoid `exactMatch`. Use `closeMatch` only when the connection is useful and the scope is clear.

**Unstable websites.** A website URL can be useful as a resolver target even if it is not a stable identifier. Do not derive TextRefs IDs from it.

## Contribution checklist

Before proposing mappings or resolver targets, check that:

- the cited passage has a clear `Work`, `CitationSystem`, and normalized locator;
- the citation system has valid and invalid examples;
- each `MappingAssertion` subject is a Work IRI and its target identifies a textual resource;
- each `exactMatch` is precise enough to survive review;
- each `resolver_targets` entry has a dereferenceable URL and honest access metadata;
- the proposal documents its source or curation basis;
- no full text, translation text, apparatus, or commentary is copied into the registry.

See [Contributing](/community/contributing/) for review tracks and pull-request expectations.
