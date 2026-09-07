---
title: Related standards and systems
description: How TextRefs relates to identifier schemes, text APIs, bibliographic models, edition and annotation standards, digital surrogates, and reading platforms.
sidebar:
  order: 6
---

Use TextRefs for _canonical references inside a work_, such as Stephanus 514a, Bekker 983b10, or _ST_ I-II.94.2. Use existing identifier systems for the editions, files, authority records, catalogues, and platforms that carry those references. The difference matters. You can cite Plato's _Republic_ 514a across a dozen editions and centuries without naming any specific edition. A DOI, by contrast, identifies one published object at a time.

The systems on this page work at different layers of textual reference. Very few of them compete with TextRefs. Some supply mapping targets for a `Work`. Others describe a different layer: the encoded edition, the digitized object, the annotation, or the bibliographic record. Each section below names one layer and states what TextRefs adds to it.

For the practical modelling distinction between external identifiers and reading URLs, see [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/).

## Canonical reference and text APIs

These systems address the same layer as TextRefs: the passage inside a work.

| System                                                                          | Identifies                                                      | Granularity | TextRefs relationship                                                                                  |
| :------------------------------------------------------------------------------ | :-------------------------------------------------------------- | :---------- | :----------------------------------------------------------------------------------------------------- |
| **[CTS URN](http://cts.informatik.uni-leipzig.de/Canonical_Text_Service.html)** | a passage in a canonical work, Perseus/Homer-Multitext model    | passage     | strongest semantic overlap. TextRefs records CTS URNs as mappings, so CTS-aware tools can interoperate |
| **[DTS API](https://distributed-text-services.github.io/specifications/)**      | a discovery and retrieval API for texts that use CTS-style URNs | service     | downstream consumer — DTS implementations can resolve TextRefs IDs via mappings                        |

## Persistent object and publication identifiers

These schemes name a published object: an edition, an article, a dataset, or a scan. A TextRefs record maps to them at work level. The standard lists the same schemes with example `conforms_to` values in [Appendix B of the specification](/standard/specification/#appendix-b-well-known-external-identifier-schemes-informative).

| System                                    | Identifies                                             | Granularity | TextRefs relationship                                                                                          |
| :---------------------------------------- | :----------------------------------------------------- | :---------- | :------------------------------------------------------------------------------------------------------------- |
| **[DOI](https://www.doi.org/)**           | a published digital object (article, edition, dataset) | publication | TextRefs records carry DOI mappings for editions that host the cited passage                                   |
| **[Handle](https://www.handle.net/)**     | any digital object with a Handle.net record            | object      | underlying technology for DOI. Same mapping pattern as DOI                                                     |
| **[ARK](https://arks.org/)**              | any object that an institution chooses to persist      | object      | similar role to Handle. Same mapping pattern                                                                   |
| **[PURL](https://purl.archive.org/)**     | a redirecting persistent URL                           | URL only    | TextRefs `/id/` URLs are the stable target and do not redirect (`/cite/` does). PURLs can target a TextRefs ID |
| **[URN:NBN](https://nbn-resolving.org/)** | a digital object registered by a national library      | object      | national-library counterpart to Handle and ARK. Same mapping pattern                                           |

## Bibliographic and authority models

These models describe works, agents, and records in libraries. Wikidata and VIAF supply mapping targets today. BIBFRAME and IFLA LRM show where TextRefs sits relative to library metadata.

| System                                                             | Identifies                                         | Granularity     | TextRefs relationship                                                                                                                               |
| :----------------------------------------------------------------- | :------------------------------------------------- | :-------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[Wikidata QID](https://www.wikidata.org/)**                      | an abstract entity (work, person, event)           | work / entity   | `Work` records map to Wikidata QIDs. TextRefs IDs handle the references inside those works                                                          |
| **[VIAF](https://viaf.org/)**                                      | author and work authority records                  | work / person   | mapping target for `Work` records. TextRefs IDs provide passage-level identity                                                                      |
| **[BIBFRAME](https://www.loc.gov/bibframe/)**                      | a bibliographic description (Work, Instance, Item) | work / instance | complementary vocabulary. Its Work level sits near a TextRefs `Work`; its Instance level is what a DOI or an ARK names                              |
| **[IFLA LRM](https://repository.ifla.org/handle/20.500.14598/40)** | a conceptual model for bibliographic information   | model           | no identifiers of its own. Its work-to-manifestation split is the split TextRefs makes between a canonical reference and the editions that carry it |

## Edition and fragment addressing

These standards point into one representation of a text: one encoded file, one rendering, one fragment.

| System                                                            | Identifies                                                 | Granularity                      | TextRefs relationship                                                                                         |
| :---------------------------------------------------------------- | :--------------------------------------------------------- | :------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **[TEI `xml:id`](https://tei-c.org/)**                            | a local anchor inside a TEI document                       | edition-local                    | edition-internal. A TEI anchor for a specific passage belongs in `resolver_targets`, not a `MappingAssertion` |
| **[W3C Web Annotation](https://www.w3.org/TR/annotation-model/)** | an annotation, and the target it anchors through selectors | representation-specific fragment | complementary. Use a TextRefs URI as the annotation target for the canonical passage                          |

The two carry different claims:

- A **TextRefs URI** is the canonical semantic reference. It holds no matter which edition, file, or rendering you open.
- A **Web Annotation selector** is a representation-specific location. It holds for the one text it was anchored to.

IIIF builds on the Web Annotation model, so the same division applies to the next section.

## Digital surrogates

IIIF describes the digitized object and its parts, not the canonical passage.

| System                                                             | Identifies                                                 | Granularity             | TextRefs relationship                                                                                            |
| :----------------------------------------------------------------- | :--------------------------------------------------------- | :---------------------- | :--------------------------------------------------------------------------------------------------------------- |
| **[IIIF Presentation API](https://iiif.io/api/presentation/3.0/)** | a digitized object and its parts (Manifest, Canvas, Range) | digital object / canvas | complementary. A IIIF resource that shows one passage belongs in `resolver_targets`, not in a `MappingAssertion` |

The questions differ:

- **TextRefs** answers: which canonical passage is this?
- **IIIF** answers: where does that passage appear in this digitized edition?

TextRefs already borrows one convention from this layer. [ADR-0001](https://github.com/textrefs/textrefs.org/blob/main/decisions/ADR-0001-conforms-to-replaces-target-kind.md) adopted it from the Linked Art digital integration model, where the value points at a specification such as the IIIF profile URI.

## Editorial conceptual models

RAMEN models editorial objects and their relations. It is a recent model, and its own documentation states that it does not replace TEI or IIIF.

| System                                         | Identifies                                                  | Granularity | TextRefs relationship                                                                                              |
| :--------------------------------------------- | :---------------------------------------------------------- | :---------- | :----------------------------------------------------------------------------------------------------------------- |
| **[RAMEN](https://ramen-schema.org/concepts)** | editorial objects (Collection, Content, Annotation, Entity) | model       | complementary. TextRefs can serve as the canonical-reference layer that a RAMEN `Annotation` or `Entity` refers to |

That gives each layer one job:

- **RAMEN** — editorial objects and their relations.
- **TEI** — textual representation and encoding.
- **IIIF** — digital objects and their presentation.
- **TextRefs** — stable canonical references.

## Platforms and resolvers

A reading platform shows the passage. It does not identify the passage.

| System                    | Identifies                               | Granularity            | TextRefs relationship                                                                                                  |
| :------------------------ | :--------------------------------------- | :--------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| **Perseus / Scaife URLs** | a passage on a specific reading platform | platform-bound passage | surface as `resolver_targets` entries with provenance so readers can jump from a stable reference to a useful platform |

## Where DOIs fit

- **Use DOIs for publications.** A DOI is the right identifier for a published edition, article, dataset, or digital object.
- **Use TextRefs for cited passages.** Plato's _Republic_ 514a is a canonical reference. The Loeb edition that contains it can have a DOI. The passage gets a TextRefs ID that can map to that DOI-backed edition.
- **Layer identifiers instead of replacing them.** Scholarly tools already understand DOIs for editions. If you add TextRefs IDs for canonical references, those tools gain passage-level precision, and their publication-level identifiers stay the same.
- **Keep the model affordable.** Canonical-reference coverage grows into the millions. A lightweight open registry is the practical way to curate that graph at non-profit scale.

## What this means for implementers

- Treat TextRefs IDs as the **primary** identifier for a canonical reference.
- Read external identifiers from a `Work`'s `alternateOf` and `isReferencedBy` arrays, and reading URLs from `CanonicalReference.resolver_targets`. These are enriched metadata, not the citation's identity.
- If you write annotations, target the TextRefs IRI when you mean the canonical passage. Keep your selectors, canvases, and TEI anchors for the representation you actually annotated.
- If no mapping exists for the user's preferred edition, fall back to your own resolver chain. Link to a default mapping or to the TextRefs landing page.
- When you publish your own data, attach a TextRefs ID alongside whatever you already issue. This is how the citation graph grows, and no one needs to change primary keys.
