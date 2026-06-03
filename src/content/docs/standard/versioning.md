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

- `0.x` releases stay `working-draft` regardless of any `-draft` suffix on the tag.
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
- `resources`: one resource per JSONL file.
- `schema`: field descriptors for each resource.

## Per-record versioning

Records do **not** carry their own SemVer. The registry is append-only with status transitions (`candidate` → `active` → `deprecated` / `withdrawn` / `blocked`). Consumers pin to a registry tag (or its DOI) for reproducibility. Identifier-level changes are expressed via tombstones, below.

## Tombstones and re-minted records

Registry identity is permanent: the IRI of a `Work`, `CitationSystem`, `CanonicalReference`, or `MappingAssertion` MUST continue to resolve once minted. Re-minting (renaming a key, correcting a locator that changes the content-derived UUID, splitting/merging records) MUST be expressed by **tombstoning** the old record and minting a successor.

### Schema

Tombstones use one status value, no extra fields. The old record stays in the data tree with `status: withdrawn`. If a successor exists, a single `MappingAssertion` with `relation: exactMatch`, `subject: <old IRI>`, and `target: <new IRI>` carries the link. Consumers walk the mapping to find the successor.

### On-disk representation

Tombstones are full records, not deletions. The old record retains every other field unchanged; only `status` flips to `withdrawn` and `modified` is bumped. If a successor exists, the successor is a separately authored record at the new IRI, and the linking `MappingAssertion` is committed alongside.

### HTTP behavior

Old IRI HTML pages render a tombstone banner. The page already lists every `MappingAssertion` whose subject is this record, so the successor (if any) appears in that list with no extra rendering logic. The `.json` JSON-LD sibling returns the withdrawn record verbatim. Old IRIs are **not** hard-redirected: archival consumers MUST be able to inspect the tombstone payload.

### Export inclusion

Tombstones MUST appear in monthly exports inside the same `.jsonl` file as their type. The `status` field is the signal — no separate `tombstones.jsonl`.

### Compiler invariants

The compiler enforces: an active `CanonicalReference` MUST NOT reference a tombstoned `Work` or `CitationSystem` through `work_key` or `citation_system_key`. `MappingAssertion`s are exempt — successor links from a withdrawn subject to an active target are exactly the documented pattern.

### Aliases vs. tombstones

`aliases.json` handles **presentational** URL aliases (multiple paths pointing at the same canonical record). Tombstones handle **identity** changes (the record itself is no longer canonical). These are distinct mechanisms and MUST NOT be conflated.

## Rights and content guardrails

Exports MUST NOT contain primary full text, commentary, apparatus, or rights metadata that implies TextRefs may redistribute copyrighted text. Disputed resolver endpoints remain in exports with `status: blocked` and tombstone rationale fields.
