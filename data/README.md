# TextRefs Data

This directory contains the hand-authored seed registry data for TextRefs.

It is also kept self-contained so a later `git subtree split --prefix=data` can extract a standalone `textrefs/data` repository cleanly.

## Layout

```
data/
├── works/{key}.yaml             # One file per Work
└── systems/{key}.yaml           # One file per CitationSystem
```

Only hand-authored YAML lives in this repo. No JSON, no derived indexes, no per-reference files. The compiled registry is an in-memory derivation at build time; the published bundle is attached to GitHub Releases as a single NDJSON.gz artifact. Published dumps are long-term archived in the [TextRefs Zenodo community](https://zenodo.org/communities/textrefs/) and receive citable DOIs.

See [`docs/get-started/authoring`](../src/content/docs/get-started/authoring.md) for the YAML format.

## Build pipeline

```sh
npm run compile:data    # YAML → dist/dump/textrefs-{version}.ndjson.gz (+ manifest)
npm run validate:data   # validate every in-memory record against the Zod schemas
npm run build:data      # compile + validate, in sequence
npm run build           # full site build; also emits the dump under dist/dump/
```

The compiler is deterministic: re-running `compile:data` against unchanged source produces a dump with identical SHA-256 (`content_hash_sha256` in the manifest). UUIDs for `CanonicalReference` and `MappingAssertion` are derived from content per [Identifier syntax](../src/content/docs/standard/identifier-syntax.md).

## Data boundaries

Registry records describe citation identity, mappings, aliases, and resolver targets. They do not contain full text, critical apparatus, protected translations, or application code.

Resolver behavior lives in `/api/`; spec prose and schemas live in `/standard/`; the Astro site lives in `/src/`.
