# ADR-0001: Replace `target_kind` with `dcterms:conformsTo`

- **Status:** Accepted
- **Date:** 2026-06-09
- **Deciders:** @maehr
- **Tags:** spec

## Context and problem statement

`MappingAssertion.target.target_kind` was introduced as an OPTIONAL human-readable scheme hint (`"cts"`, `"wikidata"`, `"doi"`, …). The spec already says validators MUST NOT key behaviour off it and the IRI in `identifier` is authoritative. Issue [#6](https://github.com/textrefs/textrefs.org/issues/6) observes that a field with no normative weight, accompanied by Appendix B's enumerated list of "known" scheme labels, is upkeep without payoff: every new scheme means another table row to police.

Linked Art's [digital integration model](https://linked.art/model/digital/) handles the same problem with `conforms_to` pointing at the relevant specification (e.g. the IIIF profile URI), letting the IRI carry the conformance claim without a curated label registry.

## Decision drivers

- The field is already non-normative; the IRI is authoritative.
- Appendix B's label column would otherwise grow indefinitely.
- Pre-v1.0.0 — breaking field renames are still acceptable.
- Want to align with established Linked Data practice rather than invent a TextRefs-specific convention.

## Considered options

1. **Replace `target_kind` with `conforms_to`** — drop the field, introduce an optional `target.conforms_to` typed as `dcterms:conformsTo` in the JSON-LD context, accepting an IRI or array of IRIs.
2. **Deprecate `target_kind`, keep accepting it** — add `conforms_to` alongside, mark `target_kind` deprecated. Smoother for downstream consumers; carries the dead field into v1.
3. **Leave `target_kind` as-is** — no change. Fails to address the upkeep concern that prompted the issue.

## Decision

We choose **Option 1**. The replacement happens before v1.0.0 freezes the schema, so a clean break is preferable to carrying a deprecated field into the stable surface. `target.conforms_to` is OPTIONAL; the registry will not synthesise values where none are known. Multiple IRIs are allowed via array form so a target can claim conformance to several specifications.

In the JSON-LD context, `conforms_to` maps to `dcterms:conformsTo` with `@type: @id` so the value is treated as an IRI reference.

## Consequences

### Positive

- One less curated label registry to maintain.
- IRIs are self-describing; conformance claims are dereferenceable.
- Aligns with Linked Art's established pattern.

### Negative / trade-offs

- Breaking rename for any downstream consumer that read `target_kind`. Acceptable pre-v1.0.0.
- Coordinated change across two repos (`textrefs/textrefs.org` schema/docs, `textrefs/registry` YAML data).

### Follow-up actions

- [x] Update spec §10 and Appendix B.
- [x] Update the v1 JSON-LD context.
- [x] Update Zod schema, compile pipeline, and in-tree fixture.
- [x] Migrate `data/works/*.yaml` in `textrefs/registry` (carried by registry PR #1).
- [x] Bump `data/` submodule pointer to the migrated registry commit.

## Links

- Related issues / PRs: textrefs/textrefs.org#6, textrefs/textrefs.org#5, textrefs/registry#1
- External references: [Linked Art — Digital Integration](https://linked.art/model/digital/), [DCMI Terms — conformsTo](http://purl.org/dc/terms/conformsTo)
