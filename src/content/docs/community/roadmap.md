---
title: Roadmap
description: TextRefs roadmap, review and quality model, and how we maintain both.
sidebar:
  order: 7
---

This is the public roadmap. The same content is mirrored on the docs site at [textrefs.org/community/roadmap/](/community/roadmap/).

## Status

- **Current spec version:** `v0.1.0-draft` (frozen baseline, unreleased).
- **Phase:** static registry MVP. The site, governance, standard workspace, schemas, compiler, and seed registry data are in place; public resolver/API behavior is the next milestone.

Status legend: done · in progress · planned · blocked.

## Now

- done: GitHub issue & PR templates and PR-template Conventional-Commit checklist.
- done: Repository-wide CODEOWNERS routing to `@textrefs/maintainers`.
- done: ADR directory and template (`decisions/`).
- done: This roadmap, mirrored on the site.
- done: Get-started section (welcome, use cases, related identifier systems, mappings, and authoring guidance).
- done: Standard draft workspace with Zod schemas and JSON-LD context.
- done: Seed registry data and static registry browsing pages.
- in progress: Replace remaining community placeholder pages with contributor-facing guidance.
- done: Serve canonical record pages under `/id/work/{key}/`, `/id/system/{key}/`, `/id/ref/{uuid}/`, `/id/mapping/{uuid}/`, each with a `.json` JSON-LD sibling advertised via `<link rel="alternate">`.
- done: Decide how the `data/` repo split is packaged — extracted to [`textrefs/registry`](https://github.com/textrefs/registry) and included here as a git submodule.

## Next

- planned: Publish the Standard draft v0.1.0 as the first citable baseline.
- planned: Serve the generated JSON Schema at a stable `/schemas/` path or update the specification if the publication path changes.
- planned: Add `Accept-Language` / `edition`-based 303 redirect on `/id/ref/{uuid}` to a matching `resolver_targets` entry.
- planned: Publish regular registry exports from the compiled data bundle.
- planned: Grow the registry with more canonical examples across theology, classics, philosophy, law, and other citation traditions.

## Later

- planned: Define conformance tests for clients and registry data.
- planned: Apply the same submodule split to `standard/` and `api/` once those interfaces stabilize.
- planned: Add structured PROV-O provenance for mapping assertions if the draft standard adopts it.

## How this roadmap is maintained

- The canonical text is `ROADMAP.md` at the repo root; `src/content/docs/community/roadmap.md` mirrors it with Starlight frontmatter. Edits update both in the same PR.
- Smaller changes go through normal PR review; significant scope shifts get an ADR.
