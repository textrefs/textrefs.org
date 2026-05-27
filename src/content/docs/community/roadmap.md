---
title: Roadmap
description: TextRefs roadmap, review and quality model, and how we maintain both.
sidebar:
  order: 6
---

This is the public roadmap. The same content is mirrored on the docs site at <https://textrefs.org/community/roadmap/>. The GitHub project board (link TBD) tracks day-to-day status.

## Status

- **Current spec version:** `v0.1.0-draft` (frozen baseline, unreleased).
- **Phase:** pre-implementation. The site, governance, and spec workspace are in place; the first canonical data set is the next milestone.

Status legend: 🟢 done · 🟡 in progress · ⚪ planned · 🔵 blocked.

## Now

- 🟢 GitHub issue & PR templates and PR-template Conventional-Commit checklist.
- 🟢 ADR directory and template (`decisions/`).
- 🟢 This roadmap, mirrored on the site.
- 🟢 Removed the empty `/association/history/` page.

## Next (target: Q3 2026)

Items run in dependency order. Each links to its tracking GitHub issue once filed.

### A. Merge `textrefs.org-specs` into this repo

⚪ Planned. **Unblocks B, C, D.** Bring `specs/`, `schemas/`, `contexts/`, `scripts/`, `registry/`, `operations/`, `governance/`, `legal/` into this repo; resolve overlaps with existing `CONTRIBUTING.md` and `/association/governance/`; wire `npm run validate` into `npm run verify`; archive `textrefs.org-specs`. Adds `.github/CODEOWNERS` and the first ADR (`ADR-0001-merge-specs-into-site-repo.md`).

### B. Publish Standard draft v0.1.0 on the site

⚪ Planned. **Depends on A.** Move the five spec markdown parts under `/standard/`, keep the canonical text at `specs/v0.1.0-draft/` (frozen), expose `metadata.json` via a static route, add a "Cite this spec" block, ship a `/standard/review-process/` page describing the stage gates.

### C. Static API prototype

⚪ Planned. **Depends on A + B.** Emit static HTML + JSON-LD landing pages for `/id/work/{key}`, `/id/system/{key}`, `/id/ref/{uuid}`, `/id/mapping/{uuid}`, `/id/target/{uuid}`; serve `/contexts/v1.jsonld`; build monthly JSONL exports under `/exports/{yyyy-mm}/` with a Data Package descriptor. Document endpoints under `/api/`. Land the first batch of the conformance test corpus.

### D. Grow the registry

⚪ Planned. **Depends on A + B + C.** First canonical set: ~10 works × ~20 references across ≥ 4 citation systems (Stephanus, Bekker, SBL, Vulgate, Aquinas, Pandekten). Recruit at least one domain reviewer per citation system; publish the roster on the site.

## Review & quality model

These run alongside every item above; they're not a separate phase.

- **L1 — Automated guardrails.** `npm run verify` + `npm run validate` (schema, deterministic UUIDs, locator regex, referential integrity, rights guardrails) + `npm test` (conformance corpus).
- **L2 — Routing & ownership.** `.github/CODEOWNERS` maps spec, schema, registry, and content paths to maintainers and domain reviewers; branch protection on `main` requires a code-owner approval.
- **L3 — Spec-change stages.** Idea → Proposal → Draft → Candidate (≥ 2 weeks public comment) → Accepted → Released. New issue templates for `standard_proposal`, `standard_change`, `decision_record`, `conformance_failure`.
- **L4 — Architecture Decision Records.** Significant decisions recorded under `decisions/`.
- **L5 — Public review windows.** Candidate specs freeze for ≥ 2 weeks before merge.
- **L6 — Conformance reporting.** External implementations submit conformance reports against the published test suite.

## Later (not scheduled)

- Full-text corpus integration tooling (read-only references to externally-hosted corpora; no hosting of protected texts).
- Additional language locales for the spec (after the German legal docs prove the pattern works).
- Public registry dashboard (statistics, recent additions, domain coverage).
- Federated curation — accepting contributions from partner institutions through trust relationships.
- Write-API and authenticated submission (currently registry is PR-only).

## How this roadmap is maintained

- The canonical text is `ROADMAP.md` at the repo root; `src/content/docs/community/roadmap.md` mirrors it with Starlight frontmatter. Edits update both in the same PR.
- Item status moves through the L3 stages where applicable. Smaller changes go through normal PR review.
- Significant scope shifts get an ADR.
