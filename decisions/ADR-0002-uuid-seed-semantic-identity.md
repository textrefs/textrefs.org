# ADR-0002: Seed CanonicalReference UUIDs from the semantic identity tuple

- **Status:** Accepted
- **Date:** 2026-07-05
- **Deciders:** @maehr
- **Tags:** spec

## Context and problem statement

The `CanonicalReference` UUID v5 seed included four fields: `work_key`, `citation_system_key`, `locator`, and `normalization_version`, with `normalization_version` fixed at minting time. Issue [#15](https://github.com/textrefs/textrefs.org/issues/15) observes the consequence: a third party holding only `(work_key, citation_system_key, locator)` cannot compute the registry UUID, because they cannot know which `normalization_version` was in force when that reference was minted. They must look the reference up first — at which point they already have the IRI. "Deterministic" therefore did not mean "offline-computable from semantic fields", and the spec was silent about which purpose determinism actually serves.

TextRefs has not yet published authoritative reference data. UUIDs are computed at compile time from enumerated YAML source; none are stored in the registry. Changing the seed now recomputes identifiers at zero migration cost; changing it after publication would be a registry-wide tombstone event.

## Decision drivers

- The intuitive public contract for a registry of canonical references: same work + same citation system + same canonical locator = same reference ID.
- Offline computability for third-party tooling that holds the canonical fields.
- Pre-v1.0.0 and pre-data: a breaking seed change is still nearly free (precedent: ADR-0001).
- An identity field whose contract needs a lookup to explain (issue #15) breeds the next round of confusion; a version field kept "just as metadata" would do the same.
- Multiple regex-valid spellings of one passage would mint permanent identity splits (issue [#13](https://github.com/textrefs/textrefs.org/issues/13)), so removing the version discriminator must be paired with strict canonical locator forms.

## Considered options

1. **Keep the 4-field seed; declare determinism's purpose as compiler/mirror reproducibility** — zero migration; documents that IDs are not offline-computable. (Issue #15's original recommendation.)
2. **Remove `normalization_version` from the seed, keep loose normalization** — offline-computable IDs, but silently re-opens the `John.3.16` / `john.3.16` identity-split class.
3. **Keep the seed; tell clients to compute with the current version and fall back to lookup** — false sense of offline computability; silent mis-mints.
4. **Revised option 2: 3-field seed + strict canonical locator forms + drop `normalization_version` from the data model** — offline-computable IDs with the split window closed by profile strictness instead of a version discriminator.

## Decision

We choose **Option 4**. Because TextRefs has not yet published authoritative reference data, canonical-reference UUIDs become computable from the semantic identity tuple: `work_key`, `citation_system_key`, and the canonical `locator`, LF-joined in that order (namespace UUID unchanged).

`normalization_version` is removed from the data model entirely — not demoted to metadata. Once outside the seed it would version nothing that matters: a normalization change that alters any accepted locator is compatibility-sensitive by the rules below regardless of any version label, and rule evolution that does not alter locators is visible through `modified`. Keeping a vestigial version field would reproduce the confusion that motivated issue #15.

The accompanying rules that make the 3-field seed safe:

- **Citation-system profiles define canonical forms.** Each profile defines exactly one canonical spelling per reference point, in `locator_regex` (machine-checkable constraints, including ASCII digit and case forms — issue #13) and in the new required `description` field (prose constraints).
- **Non-canonical locators are rejected at validation time**, never silently folded into the canonical form. The compiler's regex gate stays a hard error.
- **The enumerated registry data is the canon.** A locator is canonical and attested because a curated work record enumerates it; `locator_regex` is the machine-checkable floor beneath curation, not the definition of validity.
- **Canonicalization changes are compatibility events.** A profile change that would alter the canonical spelling of any accepted locator is a pre-1.0 registry migration, a breaking registry release, or — when the distinction is genuinely semantic — a new `citation_system_key`. Never a silent change.

Two simplifications ride along, keeping the `CitationSystem` shape honest after the field removal:

- The `examples.valid` / `examples.invalid` block is removed. Its only job was self-testing `locator_regex`; the compiler already tests the regex against every enumerated locator of every work, a strictly larger test set.
- The explanatory YAML comments in system files move into the required `description` field (`dcterms:description` in the JSON-LD context), so the prose part of the profile contract is published rather than buried in source comments.

## Consequences

### Positive

- Same work + same citation system + same canonical locator = same reference ID, computable offline.
- No identity-bearing field whose value depends on registry state at minting time.
- Profile discipline (canonical forms, rejection over folding) is forced now, before data exists, instead of compensated for later.
- Leaner `CitationSystem` records: one label, one description, one regex.

### Negative / trade-offs

- Every compiled reference UUID changes. Acceptable now (nothing published, nothing stored); it would not be later.
- Without a version discriminator, locator-affecting profile changes have no soft path — by design, but it makes profile authors' first regex more consequential.
- The regexes originally shipped were laxer than the canonical-form rules demand (Bekker leading zeros, Bible case variants); #13 closed that gap alongside this ADR, and profiles now declare leading-zero policy and canonical case explicitly. Curation remains the only guard for constraints no regex can express.

### Follow-up actions

- [x] Update spec (`specification.md` §§5, 7, 8, 11, 13, 14; `identifier-syntax.md`; `system-profiles.md`; `json-ld.md`) and get-started docs.
- [x] Update the v1 JSON-LD context (drop `normalization_version`, `examples`, `valid`, `invalid`; add `description`).
- [x] Update Zod schemas, compile/validate pipeline, in-tree fixture, and record pages.
- [x] Migrate `data/systems/*.yaml` in `textrefs/registry` and bump the `data/` submodule pointer.
- [x] Tighten per-profile `locator_regex` canonical digit/case forms under issue #13 (textrefs/registry#2, textrefs/registry#3).

## Links

- Related ADRs: ADR-0001 (precedent for a pre-v1.0.0 breaking change)
- Related issues / PRs: textrefs/textrefs.org#15, textrefs/textrefs.org#13, textrefs/textrefs.org#9, textrefs/registry#2, textrefs/registry#3
- External references: [RFC 9562 — UUID v5](https://www.rfc-editor.org/rfc/rfc9562)
