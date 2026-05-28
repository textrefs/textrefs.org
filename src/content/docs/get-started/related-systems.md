---
title: Related identifier systems
description: How TextRefs relates to DOI, ARK, Handle, PURL, CTS, DTS, Wikidata, VIAF, TEI, and platform URLs.
sidebar:
  order: 3
---

TextRefs is **adjacent** to existing identifier systems, not a competitor. It identifies _canonical references inside a work_ — Stephanus 514a, Bekker 983b10, _ST_ I-II.94.2 — while most existing systems identify the _digital container_ that hosts a passage (the edition, the PDF, the platform record). The difference matters: you can cite Plato's _Republic_ 514a across a dozen editions and centuries without naming any specific edition, but you can only DOI-cite one published edition at a time.

So the relationship is almost always: TextRefs holds the canonical reference, and the system in the table below is one of its mappings.

## Comparison

| System                                                                          | Identifies                                                   | Granularity            | TextRefs relationship                                                                                                                                                              |
| :------------------------------------------------------------------------------ | :----------------------------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[DOI](https://www.doi.org/)**                                                 | a published digital object (article, edition, dataset)       | publication            | TextRefs records carry DOI mappings for editions hosting the cited passage                                                                                                         |
| **[Handle](https://www.handle.net/)**                                           | any digital object with a Handle.net record                  | object                 | underlying tech for DOI; same mapping pattern as DOI                                                                                                                               |
| **[ARK](https://arks.org/)**                                                    | any object an institution chooses to persist                 | object                 | similar role to Handle; same mapping pattern                                                                                                                                       |
| **[PURL](https://purl.archive.org/)**                                           | a redirecting persistent URL                                 | URL only               | TextRefs IDs are themselves HTTP URIs that redirect; PURLs can target a TextRefs ID                                                                                                |
| **[CTS URN](http://cts.informatik.uni-leipzig.de/Canonical_Text_Service.html)** | a passage in a canonical work, Perseus/Homer-Multitext model | passage                | strongest semantic overlap, but the project appears abandoned and its URNs may carry copyright constraints — TextRefs treats CTS URNs as a mapping target rather than a primary ID |
| **[DTS API](https://distributed-text-services.github.io/specifications/)**      | a discovery/retrieval API for texts using CTS-style URNs     | service                | downstream consumer — DTS implementations can resolve TextRefs IDs via mappings                                                                                                    |
| **[Wikidata QID](https://www.wikidata.org/)**                                   | an abstract entity (work, person, event)                     | work / entity          | `Work` records map to Wikidata QIDs; canonical references inside a work do not                                                                                                     |
| **[VIAF](https://viaf.org/)**                                                   | author and work authority records                            | work / person          | mapping target for `Work` records, not for references inside them                                                                                                                  |
| **[TEI `xml:id`](https://tei-c.org/)**                                          | a local anchor inside a TEI document                         | edition-local          | edition-internal; TextRefs `MappingAssertion`s can point at a specific TEI anchor in a published edition                                                                           |
| **Perseus / Scaife URLs**                                                       | a passage on a specific reading platform                     | platform-bound passage | surface as `ResolverTarget` records with provenance; not a primary ID because they bind reader to platform                                                                         |

## Why we don't mint DOIs for every reference

- **Volume.** A reasonable first-batch target is tens of thousands of canonical references; full coverage of the canonical corpus reaches the millions. DOI registration fees and metadata curation at that scale are infeasible for a non-profit.
- **Category mismatch.** DOIs label publications. Plato's _Republic_ 514a is not a publication; the Loeb edition of the _Republic_ is. We DOI-map the latter and use TextRefs for the former.
- **Adoption.** Scholarly tools already expect DOIs for editions; layering canonical-reference IDs on top of that, rather than trying to displace it, plays to existing infrastructure.

## What this means for implementers

- Treat TextRefs IDs as the **primary** identifier for a canonical reference.
- Read external identifiers and resolver targets from the `mappings` array — they are enriched metadata, not the citation's identity.
- Fall back to your own resolver chain: if no mapping exists for the user's preferred edition, link to a default mapping or to the TextRefs landing page.
- When you publish your own data, attach a TextRefs ID alongside whatever you already issue. This is how the citation graph grows without anyone changing primary keys.
