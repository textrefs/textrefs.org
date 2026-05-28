---
title: Versioning & data packaging
description: How the standard and registry exports are versioned and packaged.
sidebar:
  order: 6
---

TextRefs versions two things separately: the **specification** and the **registry data exports**. Registry snapshots are published monthly as JSON Lines files with a Frictionless Data Package descriptor.

## Version identifiers

- Specification versions use tags such as `v0.1.0-draft`.
- Data-package `version` values use SemVer **without** a leading `v`, such as `0.1.0-draft`.
- Monthly exports MUST record the release month in `custom.textrefs:release_month`.

## SemVer rules for data packages

- Breaking schema changes require a **major** version increment.
- Compatible new fields require a **minor** version increment.
- Corrections that do not change schema shape require a **patch** increment.

## Export layout

Monthly exports use this directory layout:

```text
registry/exports/YYYY-MM/datapackage.json
registry/exports/YYYY-MM/works.jsonl
registry/exports/YYYY-MM/citation-systems.jsonl
registry/exports/YYYY-MM/references.jsonl
registry/exports/YYYY-MM/mappings.jsonl
registry/exports/YYYY-MM/resolver-targets.jsonl
```

## Frictionless requirements

Each `datapackage.json` MUST include:

- `profile`: `data-package`.
- `name`: `textrefs-registry`.
- `version`: SemVer package version.
- `licenses`: CC0-1.0 for registry data.
- `resources`: one resource per JSONL file.
- `schema`: field descriptors for each resource.

## Rights and content guardrails

Exports MUST NOT contain primary full text, commentary, apparatus, or rights metadata that implies TextRefs may redistribute copyrighted text. Disputed resolver endpoints remain in exports with `status: blocked` and tombstone rationale fields.
