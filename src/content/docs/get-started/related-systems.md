---
title: Related identifier systems
description: How TextRefs relates to DOI, ARK, Handle, PURL, CTS, DTS, Wikidata, VIAF, TEI, and platform URLs.
sidebar:
  order: 5
---

Use TextRefs for _canonical references inside a work_ — Stephanus 514a, Bekker 983b10, _ST_ I-II.94.2 — and use existing identifier systems for the editions, files, authority records, catalogues, and platforms that carry those references. The difference matters: you can cite Plato's _Republic_ 514a across a dozen editions and centuries without naming any specific edition, while a DOI identifies one published object at a time.

So the relationship is almost always: TextRefs holds the canonical reference, and the system in the table below is one of its mappings.

For the practical modelling distinction between external identifiers and reading URLs, see [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/).

## Comparison

| System                                                                          | Identifies                                                   | Granularity            | TextRefs relationship                                                                                                  |
| :------------------------------------------------------------------------------ | :----------------------------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **[DOI](https://www.doi.org/)**                                                 | a published digital object (article, edition, dataset)       | publication            | TextRefs records carry DOI mappings for editions hosting the cited passage                                             |
| **[Handle](https://www.handle.net/)**                                           | any digital object with a Handle.net record                  | object                 | underlying tech for DOI; same mapping pattern as DOI                                                                   |
| **[ARK](https://arks.org/)**                                                    | any object an institution chooses to persist                 | object                 | similar role to Handle; same mapping pattern                                                                           |
| **[PURL](https://purl.archive.org/)**                                           | a redirecting persistent URL                                 | URL only               | TextRefs IDs are themselves HTTP URIs that redirect; PURLs can target a TextRefs ID                                    |
| **[CTS URN](http://cts.informatik.uni-leipzig.de/Canonical_Text_Service.html)** | a passage in a canonical work, Perseus/Homer-Multitext model | passage                | strongest semantic overlap; TextRefs records CTS URNs as mappings so CTS-aware tools can interoperate                  |
| **[DTS API](https://distributed-text-services.github.io/specifications/)**      | a discovery/retrieval API for texts using CTS-style URNs     | service                | downstream consumer — DTS implementations can resolve TextRefs IDs via mappings                                        |
| **[Wikidata QID](https://www.wikidata.org/)**                                   | an abstract entity (work, person, event)                     | work / entity          | `Work` records map to Wikidata QIDs; TextRefs IDs handle the references inside those works                             |
| **[VIAF](https://viaf.org/)**                                                   | author and work authority records                            | work / person          | mapping target for `Work` records; TextRefs IDs provide passage-level identity                                         |
| **[TEI `xml:id`](https://tei-c.org/)**                                          | a local anchor inside a TEI document                         | edition-local          | edition-internal; TextRefs `MappingAssertion`s can point at a specific TEI anchor in a published edition               |
| **Perseus / Scaife URLs**                                                       | a passage on a specific reading platform                     | platform-bound passage | surface as `resolver_targets` entries with provenance so readers can jump from a stable reference to a useful platform |

## Where DOIs fit

- **Use DOIs for publications.** A DOI is the right identifier for a published edition, article, dataset, or digital object.
- **Use TextRefs for cited passages.** Plato's _Republic_ 514a is a canonical reference. The Loeb edition that contains it can have a DOI; the passage gets a TextRefs ID that can map to that DOI-backed edition.
- **Layer identifiers instead of replacing them.** Scholarly tools already understand DOIs for editions. Adding TextRefs IDs for canonical references gives those tools passage-level precision without changing their publication-level identifiers.
- **Keep the model affordable.** Canonical-reference coverage grows into the millions. A lightweight open registry is the practical way to curate that graph at non-profit scale.

## What this means for implementers

- Treat TextRefs IDs as the **primary** identifier for a canonical reference.
- Read external identifiers and resolver targets from the `mappings` array — they are enriched metadata, not the citation's identity.
- Fall back to your own resolver chain: if no mapping exists for the user's preferred edition, link to a default mapping or to the TextRefs landing page.
- When you publish your own data, attach a TextRefs ID alongside whatever you already issue. This is how the citation graph grows without anyone changing primary keys.
