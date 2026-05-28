# ADR-0001: Standard-first; resolver/registry engine deferred

- **Status:** Accepted
- **Date:** 2026-05-28
- **Deciders:** @moritzmaehr
- **Tags:** spec, infra, governance

## Context and problem statement

Earlier exploratory work produced a reference implementation (an "engine") for TextRefs — Zod schemas, a `validate.ts` conformance script, seed registry data, monthly JSONL exports, a JSON-LD context, and static resolver routes (`/id/ref/{uuid}`, `/context`, `/exports/*`) — alongside the public site.

This raised two questions:

1. **Duplication / drift.** The normative spec text existed in more than one place, including two byte-identical full copies in this repo (`standard/specification.md` and `standard/index.md`).
2. **Sequencing.** Should we ship the live resolver engine now, or settle the standard and architecture first?

The engine is small (~750 LOC) and almost entirely mechanical glue **downstream of the standard**: the Zod schema is the core model retyped, `validate.ts` encodes the conformance rules, and the routes are thin glue. Its difficulty is a function of spec ambiguity, not implementation complexity — so it is cheap to (re)build once the standard is settled.

## Decision drivers

- One authoritative spec text; eliminate drift between duplicate copies.
- Get the standard and architecture right before building on top of them.
- Avoid committing to a runtime API surface before the model is stable.
- Preserve the genuinely valuable, hard-to-redo artifacts (the precise identity algorithm, citation-system profiles, JSON-LD context).
- Static-first architecture and resolver neutrality.

## Considered options

1. **Ship the engine now** — bring in the resolver/exports and commit to an API surface before the standard is settled. Heaviest; locks in choices prematurely.
2. **Replace the site spec with a leaner one** — simpler, but the rigorous site spec carries normative content (per-type examples, validation checklist, conformance boundary) worth keeping.
3. **Standard-first, engine deferred (chosen)** — make the site the single home of the standard and architecture; defer the resolver/registry engine until the live API is the priority.

## Decision

We choose **Option 3**. This repo is the single home of the standard, architecture, and association material. The normative spec lives at `standard/specification.md`, supported by:

- `standard/identifier-syntax.md` — deterministic UUID v5 (namespace `b1a3670e-2ac7-544c-a1b9-396e0dc193f7`, serialization rules, worked example).
- `standard/system-profiles.md` — citation-system profiles with the seed Bekker/Stephanus regexes.
- `standard/json-ld.md` — the `v1` context, also served statically at `/contexts/v1.jsonld`.
- `standard/versioning.md` — data packaging, Frictionless/SemVer rules, content guardrails.

The duplicate `standard/index.md` became a short landing page. The deferred API section was removed from the site (placeholders deleted, sidebar group dropped, homepage card reframed as "planned").

**Architecture (recorded, not yet built):** static-first compilation of registry JSON into HTML landing pages, JSON-LD fragments, the context endpoint, and monthly JSONL exports; CI gatekeeping that fails on schema violations, broken references, invalid deterministic IDs, forbidden full-text markers, illegal rights metadata, or invalid JSON-LD relations. Reference identity is detached from location; external systems (CTS, DTS, Perseus, Wikidata) are modeled uniformly as targets/mappings.

**Deferred:** the resolver routes (`/id/*`, `/exports/*`), the registry loader, and scaling the seed corpus. These are built in this repo from the settled standard when the live API becomes the priority.

## Consequences

### Positive

- One authoritative spec; no duplicate copies to drift.
- The interop-critical details (identity algorithm, profiles, context) are now published.
- No premature commitment to a runtime API surface; the engine is buildable from the settled standard.

### Negative / trade-offs

- The site temporarily has no live resolver or machine-readable registry endpoints beyond the static context file.
- The engine must be (re)built later, with the risk that intervening spec changes require adjustments.

### Follow-up actions

- [ ] Build the engine (schema, `validate.ts`, registry, resolver/export routes) in this repo when the live API is prioritized.
- [ ] Add the JSON Schema / Zod schema as a normative companion when the engine lands.

## Links

- Related ADRs: none
- Standard pages: `/standard/`, `/standard/identifier-syntax/`, `/standard/system-profiles/`, `/standard/json-ld/`, `/standard/versioning/`
