# ADR-0005: Preferred citation system and qualified `/cite/` aliases

- **Status:** Accepted
- **Date:** 2026-08-04
- **Deciders:** @maehr, @stephenhart8
- **Tags:** spec, data-model

## Context and problem statement

Issue [#60](https://github.com/textrefs/textrefs.org/issues/60), raised by **@stephenhart8**, observes that the alias shown on a reference page drops the citation system: Odyssey 1.5 renders `/cite/homer.odyssey/1.5/` even though the record's own "In context" block lists Work, Citation system, and Locator, and even though the citation system is one of the three fields that seed the reference UUID (`referenceUuid`, `scripts/compile.ts:323`, per ADR-0002). The compiler mints exactly one alias per reference, `` `${workKey}/${locator}` `` (`scripts/compile.ts:543`).

Today the defect is unreachable rather than handled: `data/works/*.yaml` carries a single scalar `citation_system:` per work (`WorkSource`, `scripts/compile.ts:157`), so alias keys are unique by construction, and all 12 seed works are single-system. `setAlias` (`scripts/compile.ts:341`) throws when two references claim the same alias, so the current failure mode is a broken build, not a wrong redirect. The deeper consequence is that **a work under two citation systems cannot be represented at all** — even though `CanonicalReference.citation_system_key` is per-reference and `src/pages/id/work/[key]/index.astro:46` already derives and renders a _list_ of a work's systems (`usedSystemKeys` / `usedSystems`).

That matters because the roadmap's plan to grow the registry across theology, classics, philosophy, and law runs directly into works where the same locator string is valid under two systems and denotes different passages: Psalms under Masoretic versus Septuagint/Vulgate versification (`Ps.23.1`), the Qur'an under Cairo versus Flügel verse numbering, Aristotle under Bekker (`1094a1`) and book/chapter (`1.1`). A bare `{work}/{locator}` alias there does not merely under-specify — it silently resolves to the wrong passage, which is worse than a 404.

Quote @stephenhart8's own framing from #60: always adding the citation system to the alias would solve the ambiguity but "might complexify 90% of the usage of the passages, as it is often implied which system is used", and their proposal is a preferred citation system so the common case stays `homer.odyssey/1.5` while non-preferred systems carry the system segment.

## Decision drivers

- Short aliases must stay memorable and hand-typeable — that is the entire purpose of `/cite/` (`/get-started/url-layout/`).
- An alias must never silently denote a different passage.
- Reference identity (ADR-0002) must not move.
- The registry must be able to represent multi-system works.
- Which system is "preferred" is a curatorial claim that needs a review path, not a hard-coded rule.
- Additional systems are fallback functionality and must be introducible as drafts against an already-active work (ADR-0004's dependency rule).

## Considered options

1. **Status quo** — bare alias only. Blocks multi-system works entirely; `setAlias` turns the ambiguity into a build failure with no way forward.
2. **Always qualify; drop bare aliases** — `/cite/{work}/{system}/{locator}` for everything. Unambiguous and needs no curatorial judgment, but breaks every existing short URL and defeats the point of a memorable shortcut: readers know `plato.republic/514a`, not `plato.republic/stephanus/514a`.
3. **Bare for preferred, qualified only for others** — issue #60 as written. Minimal change, but a reference under the preferred system then has _no_ unambiguous alias at all, which is the form you would want to cite or share precisely when a work has competing systems.
4. **Build-time disambiguation pages** — a bare alias with more than one candidate renders a chooser. No curatorial decision needed, but a URL that resolves today would silently become a chooser page tomorrow when a second system is added — a regression on an already-shared link.
5. **Qualified always, bare when preferred.** ← chosen

## Decision

We choose **Option 5**.

- A new **mandatory** `Work.preferred_citation_system_key` (flat key syntax), published in the JSON-LD record and in the `works.jsonl` dump — consumers can see and reuse it.
- Every reference gets `/cite/{work}/{system}/{locator}/`. The bare `/cite/{work}/{locator}/` is minted only for the work's preferred system.
- Collisions become structurally impossible rather than merely detected: a qualified alias is keyed by the same tuple that seeds the UUID, and at most one system per work is preferred.
- The grammar is unambiguous by segment count only because keys (`FlatKey`, `^[a-z0-9][a-z0-9._-]*$`) and locators both exclude `/`. Locators containing `/` are therefore rejected before alias minting — a new compiler invariant, since no current `locator_regex` allows one but nothing stated the constraint.
- **Alias permanence.** `/cite/` aliases are presentational. They may be added, removed, or **retargeted**. Changing a work's preferred citation system changes what an existing bare alias resolves to, _including for active works_. This is allowed and must be documented prominently; there is no alias ledger and no freezing. Qualified aliases and `/id/ref/{uuid}` identifiers are never retargeted. Governance §6 item 6 already says citation URLs are aliases; this ADR makes retargeting explicit.
- **UUID contract.** Adding an additional citation system creates new reference identities from new `(work, citation system, locator)` tuples. **No existing reference UUID changes.** It adds qualified aliases and may change bare aliases — acceptable precisely because aliases are not permanent.
- **Status dependency rules**, specialising ADR-0004's general rule:

  ```text
  An active reference requires:  an active work, AND
                                 an active citation system for its citation_system_key.
  An active work requires:       an active preferred citation system.
  An active work MAY additionally carry draft citation systems and draft references.
  The status of a fallback system never downgrades the work.
  ```

- **Authoring.** The work source keeps `citation_system:` as the preferred system and gains an optional `additional_systems:` list, each entry carrying its own citation system, resolvers, references, and an optional `reference_status:`. `reference_status` on the primary block defaults to the work's status; on an `additional_systems` block it defaults to **`draft`**, never to the work's status — a newly added fallback system must not silently inherit `active`. Resolver URL templates stay scoped to their block because template variables come from that system's `locator_regex` capture groups.
- Preference is expressed positionally in the source (the top-level block is the preferred one), so it cannot drift out of sync with the systems a work actually uses, while the compiled record carries `preferred_citation_system_key` explicitly for consumers.

## Consequences

### Positive

- Existing short URLs keep working; every reference gains a stable unambiguous alias; alias collisions become structurally impossible.
- The field is identity-neutral (`Work` IRIs are key-derived, reference UUIDs unaffected), so nothing in ADR-0002 moves.
- Multi-system works become representable, and fallback systems can be reviewed independently of the work.

### Negative / trade-offs

- A mandatory field means a work with genuinely competing systems must pick one rather than abstain — the mitigation is documentary (share the qualified form when precision matters; cite `/id/`).
- Bare aliases can be retargeted, so anyone who treated `/cite/` as permanent is relying on something never promised.
- Adding the required field is breaking for `works.jsonl` consumers.
- Roughly twice as many alias entries are compiled.
- Who decides "preferred" is a curatorial judgment; the review path is expert review under governance §4.2, informed by how frequently a system is used in a scholarly community, as @stephenhart8 suggested — a decision input, not a rule.

### Follow-up actions

- [x] Required `preferred_citation_system_key` in `standard/schema/work.ts`.
- [x] Zod validation of the YAML source shape, including duplicate-system rejection.
- [x] Per-block reference emission and alias minting in `scripts/compile.ts`.
- [x] Reject `/` in locators; new compiler invariant.
- [x] JSON-LD context term and OpenAPI `Work` schema.
- [x] Disambiguate duplicate locators in the work page, the paginated reference list, the reference page title, and the rendered citation.
- [x] Document `additional_systems:` and both alias forms.
- [x] Compiler test coverage.
- [x] A note in `textrefs/registry`'s `data/AGENTS.md`.
- [ ] Deferred: real multi-system registry data (needs a curated second profile and attested reference points) ([#104](https://github.com/textrefs/textrefs.org/issues/104)).
- [ ] Deferred: per-community/per-language preference ([#105](https://github.com/textrefs/textrefs.org/issues/105)).

## Links

- Related ADRs: ADR-0002 (deterministic identity), ADR-0004 (lifecycle and the general dependency rule this specialises)
- Related issues / PRs: textrefs/textrefs.org#60 — raised by @stephenhart8, whose preferred-citation-system proposal this ADR adopts
- External references: `/get-started/url-layout/`, governance §4.2 and §6
