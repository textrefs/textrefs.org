# TextRefs Standard

This directory is the future home of the standalone `textrefs/standard` repo. It is kept self-contained so a later `git subtree split --prefix=standard` produces a clean extraction.

## What lives here

- `schema/` — Zod schemas for every registry object type. Per the specification (§14), **the Zod schemas are the implementation source of truth**; the published JSON Schema is generated from them.

## What will move here at split time

These paths are part of the standard but stay in their current locations today because the Astro/Starlight build serves them:

- `src/content/docs/standard/*.md` — normative spec prose (rendered by Starlight at `/standard/`).
- `public/contexts/v1.jsonld` — JSON-LD `@context` (served at `/contexts/v1.jsonld`).
- `src/lib/ontology.ts`, `src/pages/ontology.astro`, and `src/pages/ontology.json.ts` — the shared ontology definitions and their dereferenceable renderings at `/ontology/` (HTML) and `/ontology.json` (JSON-LD).

When the standard is extracted, these move into this directory (e.g. `standard/spec/`, `standard/contexts/`) and the site consumes them through a submodule, an npm package, or a CI sync step.

## What does **not** belong here

- Registry data records → `data/` (now a git submodule pointing at [`textrefs/registry`](https://github.com/textrefs/registry); the data/ split is done)
- Resolver API code → `/api/`
- Site chrome (Astro layouts, components, styles) → `/src/`
