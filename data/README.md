# TextRefs Data

Future home of the standalone `textrefs/data` repo. Self-contained so a later `git subtree split --prefix=data` extracts cleanly.

## Layout

One JSON file per registry record, grouped by type:

```
data/
├── works/{key}.json
├── systems/{key}.json
├── refs/{work_key}__{slug}.json
├── targets/{uuid}.json
└── mappings/{uuid}.json
```

The filename is convenience only; identity lives in the `id` field. UUIDs in `refs/` are deterministic per [Identifier syntax](../src/content/docs/standard/identifier-syntax.md); UUIDs in `targets/` and `mappings/` are random v4.

## Validation

Records are validated by the Zod schemas under [`../standard/schema/`](../standard/schema/):

```sh
npm run validate:data
```

The script dispatches on each record's `type` field. Invalid records fail CI.

## Out of scope

No application code, no full text, no derived indexes — see [Specification §2 and §15](../src/content/docs/standard/specification.md). Resolver behaviour lives in `/api/`; spec and schemas live in `/standard/`.
