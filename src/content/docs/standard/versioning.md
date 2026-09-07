---
title: Versioning & data packaging
description: How the standard and registry exports are versioned and packaged.
maturity: working-draft
sidebar:
  order: 6
---

TextRefs versions three things that move at different speeds, and archives each independently:

| Train                | Lives in                  | Tag format                     | Zenodo concept DOI                |
| -------------------- | ------------------------- | ------------------------------ | --------------------------------- |
| Standard + site      | `textrefs/textrefs.org`   | `vMAJOR.MINOR.PATCH[-pre]`     | TextRefs Standard                 |
| Registry data        | `textrefs/registry`       | `vYYYY.MM.N`                   | TextRefs Registry                 |
| Data-package version | inside `datapackage.json` | SemVer **without** leading `v` | (carried within registry deposit) |

The release tag and the spec document's own version string (e.g. `0.1.0-draft` in `specification.md`) are independent labels, not aliases: the tag marks the site repository's release, the document version marks the spec's own maturity, and the two are not required to read identically.

The site repository couples the spec, JSON-LD context, Zod schemas, and Astro site under a single tag because pre-1.0 the site is the spec's reference rendering; splitting them now would create empty changelogs and confuse Zenodo metadata. Registry data is decoupled — record changes flow on their own cadence — and lives in a separate repository because the [Zenodo–GitHub integration](https://docs.github.com/en/repositories/archiving-a-github-repository/referencing-and-citing-content) mints one concept DOI per repository. The two repositories are cross-linked via `.zenodo.json` `related_identifiers`.

The site repository includes `textrefs/registry` as a git submodule at `data/`. The registry uses `main` as its working branch. The site pins a specific registry `main` commit through the submodule pointer, and its compiler builds registry dumps from that pinned content for reproducible site releases.

## Maturity ladder

Each `/standard/*` page carries a `maturity` field in its frontmatter, encoding **intent** alongside the SemVer tag (which encodes pre-release status):

| Value                      | Meaning                                                                                                        |
| -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `working-draft`            | Unstable. Data model and prose may change without notice and without a version bump while the core is settled. |
| `candidate-recommendation` | Stable enough to implement against. Breaking changes still require a major version bump.                       |
| `recommendation`           | Stable recommendation. Breaking changes require a major version bump and a new document.                       |
| `superseded`               | Replaced by a later version. Retained at its tagged URL for archival lookup.                                   |

Transitions:

- `0.x` releases stay `working-draft` regardless of any `-draft` suffix on the spec document's version string.
- First `1.0.0-rc.1` enters `candidate-recommendation`.
- `1.0.0` enters `recommendation`.

## SemVer rules for data packages

- Breaking schema changes require a **major** version increment.
- Compatible new fields require a **minor** version increment.
- Corrections that do not change schema shape require a **patch** increment.

## Export layout

Generated dumps use this directory layout:

```text
dist/dump/datapackage.json
dist/dump/works.jsonl
dist/dump/citation-systems.jsonl
dist/dump/references.jsonl
dist/dump/mappings.jsonl
dist/dump/aliases.json
```

Registry exports are organized by object type. This gives consumers stable file names, simple streaming imports, and one predictable place to find each record type. Resolver targets are embedded in reference records. Relationships are represented inside records through standard fields such as `key`, `work_key`, `citation_system_key`, `subject`, and `target`.

## Archival copies and DOIs

TextRefs Standard/site GitHub Releases are the primary distribution point for generated registry dumps. The dump is built from the `data/` submodule pointer committed in that release. Each released tag in either repository is also deposited in the [TextRefs Zenodo community](https://zenodo.org/communities/textrefs/) for long-term archival preservation and DOI minting. Cite the version DOI when referring to a specific archived dump.

## Frictionless requirements

Each `datapackage.json` MUST include:

- `profile`: `data-package`.
- `name`: `textrefs-registry`.
- `version`: SemVer package version.
- `licenses`: SPDX identifier `CC0-1.0` for registry data.
- `resources`: one resource per published file, that is, each JSONL record file and the JSON alias table. Each resource carries `path`, `format`, `mediatype`, `encoding`, `bytes`, and a `sha256:` `hash` of the resource body.

Resources SHOULD additionally carry a Frictionless `schema` with field descriptors. Exports through `v0.1.0` omit it: record shapes are normative in the [specification](/standard/specification/) and enforced by the compiler, and restating them as Frictionless descriptors is [tracked separately](https://github.com/textrefs/textrefs.org/issues/74). Validate against the published shapes, not against the data package alone.

## Per-record versioning

Records do **not** carry their own SemVer. The registry is append-only from promotion onward, with status transitions (`draft` → `active` → `deprecated` / `withdrawn` / `blocked`). The `draft` tier is pre-persistence: see [Draft records and retraction](#draft-records-and-retraction). Consumers pin to a registry tag (or its DOI) for reproducibility. Identifier-level changes to promoted records are expressed via tombstones, below.

## Draft records and retraction

Records at status `draft` have not been promoted and carry no persistence promise ([Specification §11](/standard/specification/#11-identifier-policy)). A draft MAY be corrected — changing an identity field mints a different id, and the previous IRI ceases to resolve — or retracted, meaning the record is deleted outright. Retraction MUST NOT create a tombstone. Because identifiers are deterministic, a retracted tuple that is later re-proposed regains the same UUID; a reappearing id does not imply continuity of curation history.

Draft records appear in exports inside the same `.jsonl` files as their type, with `status` as the signal — the same convention tombstones use. Consumers MUST NOT rely on a draft record persisting across releases and SHOULD filter on `status` when they need only promoted records. Rendered draft pages SHOULD be clearly flagged and SHOULD be excluded from external search engine indexing. A registry's own search MAY list them, and SHOULD show the `draft` status beside each result.

## Tombstones and re-minted records

Registry identity is permanent once promoted: the IRI of a `Work`, `CitationSystem`, `CanonicalReference`, or `MappingAssertion` MUST continue to resolve once the record has been published at status `active`. Re-minting a promoted record (renaming a key, correcting a locator that changes the content-derived UUID, splitting/merging records) MUST be expressed by **tombstoning** the old record and minting a successor.

### Schema

Tombstones use a status value plus one optional field. The old record stays in the data tree with `status: withdrawn` (or `blocked`, for a rights or policy dispute). If a successor exists, the record carries its IRI in `superseded_by` (`dcterms:isReplacedBy` in the published context); a `deprecated` record may do the same. Consumers follow `superseded_by` to find the successor. `MappingAssertion`s are reserved for work-level relations to external identifiers and MUST NOT be used for succession links.

### On-disk representation

Tombstones are full records, not deletions. The old record retains every other field unchanged; `status` flips to `withdrawn`, `modified` is bumped, and `superseded_by` is set when a successor exists. The successor is a separately authored record at the new IRI.

### HTTP behavior

Old IRI HTML pages render a tombstone banner; when `superseded_by` is present the banner links the successor IRI. The `.json` JSON-LD sibling returns the withdrawn record verbatim. Old IRIs are **not** hard-redirected: archival consumers MUST be able to inspect the tombstone payload.

### Export inclusion

Tombstones MUST appear in monthly exports inside the same `.jsonl` file as their type. The `status` field is the signal — no separate `tombstones.jsonl`.

### Compiler invariants

The compiler enforces these invariants, and fails the build on any violation:

1. `superseded_by` MUST only appear on records whose `status` is `deprecated`, `withdrawn`, or `blocked`. A record still in active use has no successor.
2. A `CanonicalReference` that is not itself a tombstone MUST NOT reference a tombstoned (`withdrawn` or `blocked`) `Work` or `CitationSystem` through `work_key` or `citation_system_key` — those break resolution.
3. `Work.preferred_citation_system_key` MUST name a known `CitationSystem`.
4. An `active` `Work` MUST have an `active` preferred `CitationSystem`. Its other citation systems MAY be `draft`; a fallback system's status never downgrades the work.
5. An `active` `CanonicalReference` MUST have an `active` `Work` and an `active` `CitationSystem` for its own `citation_system_key`. Works and systems are promoted to `active` before or together with whatever depends on them.
6. An `active` `MappingAssertion` MUST take an `active` `Work` as its `subject`.

Two further checks apply. A work MUST NOT declare the same citation system twice, checked when a source file is parsed, before any record is built. A `locator` MUST NOT contain `/`, checked per reference during emission — the alias grammar below distinguishes its two forms by segment count alone.

### Aliases vs. tombstones

The compiler maintains a presentational alias map: multiple lookup paths pointing at the same canonical record. It publishes that map at `/dump/aliases.json`, and one per-work slice of it at `/reg/work/{work_key}/aliases.json`. Publishing the map does not change the permanence rules below.

- External identifiers.
- `{work_key}/{citation_system_key}/{locator}` — a qualified alias, minted for every reference.
- `{work_key}/{locator}` — a bare alias, minted only for a work's preferred citation system ([Specification §6](/standard/specification/#6-work)).

Tombstones handle **identity** changes; aliases handle **presentation**, and the two MUST NOT be conflated. Bare aliases MAY be added, removed, or **retargeted**: changing a work's preferred citation system changes what its bare alias resolves to, including for active works. Qualified aliases and `/id/ref/{uuid}` identifiers are never retargeted.

## Rights and content guardrails

Exports MUST NOT contain primary full text, commentary, apparatus, or rights metadata that implies TextRefs may redistribute copyrighted text. Disputed resolver endpoints remain in exports with `status: blocked`.
