---
title: The TextRefs standard
description: Specification for canonical text references.
maturity: working-draft
sidebar:
  order: 1
---

TextRefs defines a minimal registry standard for stable, machine-addressable references to texts. Its centre is the separation of **identity** from **location**: a reference such as `John.3.16` is one abstract, language-independent identity, while the translations, editions, and providers that carry it are recorded as locations embedded on the reference. `Work` and `CitationSystem` records use flat stable keys; richer bibliographic and authority data is connected through mappings to external systems, with optional lightweight `Work.creators` retained for citation rendering. The model has four registry object types — `Work`, `CitationSystem`, and `CanonicalReference` for identity, plus `MappingAssertion` for equivalence. Locations are recorded as `resolver_targets` entries embedded on each `CanonicalReference`; they are not a separate object type. TextRefs never hosts full text, apparatus, commentary, or copyrighted edition content.

One identity fans out to many locations and equivalences — adding a translation adds a resolver-target entry to the reference, never a new reference:

```mermaid
flowchart LR
    subgraph identity ["Identity — which passage"]
        W["Work<br/>New Testament"]
        CS["CitationSystem<br/>book.chapter.verse"]
        CR["CanonicalReference<br/>John.3.16<br/>(resolver_targets: SBLGNT)"]
        W --> CR
        CS --> CR
    end
    subgraph equivalence ["Equivalence — same as"]
        MA["MappingAssertion<br/>CTS URN"]
    end
    W --> MA
```

## Read the standard

- **[Specification](/standard/specification/)** — the normative document: object model, conformance, validation, and the conformance boundary.
- **[Identifier syntax](/standard/identifier-syntax/)** — deterministic UUID v5 generation, namespace, and serialization rules.
- **[Citation-system profiles](/standard/system-profiles/)** — how citation systems constrain locators, with the seed Bekker and Stephanus profiles.
- **[JSON-LD context](/standard/json-ld/)** — the context mapping TextRefs records onto SKOS, Dublin Core, and schema.org.
- **[Versioning & data packaging](/standard/versioning/)** — how the spec and the monthly registry exports are versioned and packaged.

## Cite this spec

These pages are the working authority for the standard while `v0.1.0-draft` is being settled. The `v1` JSON-LD context is served at `https://textrefs.org/contexts/v1.jsonld`. A frozen, citable release will be tagged once the core stabilises.
