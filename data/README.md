# TextRefs Data

Future home of the standalone `textrefs/data` repo. Self-contained so a later `git subtree split --prefix=data` extracts cleanly.

## Layout

```
data/
├── source/                       # ✍️ Contributors edit these YAML files.
│   ├── {work_key}.yaml           #     One file per Work (references, resolvers, mappings)
│   └── systems/{system_key}.yaml #     One file per CitationSystem
│
├── works/{key}.json              # ⚙️  Compiler output. Do not edit by hand.
├── systems/{key}.json            # ⚙️
├── refs/{work_key}__{slug}.json  # ⚙️  Each ref carries an embedded resolver_targets array.
├── mappings/{uuid}.json          # ⚙️  Subject is always a Work IRI.
└── aliases.json                  # ⚙️  Alias → canonical target index.
```

Contributors edit only the YAML under `data/source/`. Everything else is compiler output, committed to git so diffs are reviewable but never hand-authored. See [`docs/get-started/authoring`](../src/content/docs/get-started/authoring.md) for the YAML format.

## Build pipeline

```sh
npm run compile:data    # YAML → flat JSON records under data/
npm run validate:data   # validate every record against the Zod schemas
npm run build:data      # both, in sequence (the contributor entry point)
```

The compiler is deterministic: re-running `compile:data` against unchanged source produces zero diff. UUIDs for `CanonicalReference` and `MappingAssertion` are derived from content per [Identifier syntax](../src/content/docs/standard/identifier-syntax.md).

## Out of scope

No application code, no full text, no derived indexes — see [Specification §2 and §15](../src/content/docs/standard/specification.md). Resolver behaviour lives in `/api/`; spec and schemas live in `/standard/`.
