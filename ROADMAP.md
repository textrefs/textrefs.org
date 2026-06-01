# TextRefs roadmap

This is the public roadmap. The same content is mirrored on the docs site at <https://textrefs.org/community/roadmap/>.

## Status

- **Current spec version:** `v0.1.0-draft` (frozen baseline, unreleased).
- **Phase:** static registry MVP. The site, governance, standard workspace, schemas, compiler, and seed registry data are in place; public resolver/API behavior is the next milestone.

Status legend: done · in progress · planned · blocked.

## Now

- done: GitHub issue & PR templates and PR-template Conventional-Commit checklist.
- done: ADR directory and template (`decisions/`).
- done: This roadmap, mirrored on the site.
- done: Get-started section (welcome, use cases, related identifier systems, mappings, and authoring guidance).
- done: Standard draft workspace with Zod schemas and JSON-LD context.
- done: Seed registry data and static registry browsing pages.
- in progress: Replace remaining community placeholder pages with contributor-facing guidance.
- in progress: Prepare the static API MVP shape from the OpenAPI draft and current registry pages.

## Next

- planned: Publish the Standard draft v0.1.0 as the first citable baseline.
- planned: Serve JSON-LD representations for works, citation systems, canonical references, and mappings.
- planned: Serve the generated JSON Schema at a stable `/schemas/` path or update the specification if the publication path changes.
- planned: Add resolver behavior for persistent TextRefs IDs under `/id/`.
- planned: Publish regular registry exports from the compiled data bundle.
- planned: Grow the registry with more canonical examples across theology, classics, philosophy, law, and other citation traditions.

## Later

- planned: Define conformance tests for clients and registry data.
- planned: Decide how the future `standard/`, `data/`, and `api/` repo split will be packaged and synchronized.
- planned: Add structured PROV-O provenance for mapping assertions if the draft standard adopts it.

## How this roadmap is maintained

- The canonical text is `ROADMAP.md` at the repo root; `src/content/docs/community/roadmap.md` mirrors it with Starlight frontmatter. Edits update both in the same PR.
- Smaller changes go through normal PR review; significant scope shifts get an ADR.
