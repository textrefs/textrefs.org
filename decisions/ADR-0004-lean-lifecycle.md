# ADR-0004: Lean record lifecycle — `draft` → `active`

- **Status:** Accepted
- **Date:** 2026-08-04
- **Deciders:** @maehr
- **Tags:** spec, governance

## Context and problem statement

ADR-0003 established the ladder `draft` → `candidate` → `active` → `deprecated` / `withdrawn` / `blocked`, and attached the identifier-persistence promise at the `draft → candidate` promotion (specification §11: "The persistence promise attaches at **promotion**: the first time a record is published at status `candidate` or higher"). That leaves `candidate` as a state that is permanent but not recommended. Nothing in the model distinguishes it operationally from `active` except that `active` also carries a recommendation (specification §12: `active` — "accepted and recommended for use"; `candidate` — "proposed but not yet accepted as stable"). A promoted-but-unrecommended tier is not a distinction TextRefs' review process or its consumers act on anywhere.

The status enum is defined once, in `standard/schema/common.ts` (before this change: `Status = z.enum(['draft', 'candidate', 'active', 'deprecated', 'withdrawn', 'blocked'])`), and duplicated once, in `api/openapi.yaml:183-185`. No record anywhere in the registry is on `candidate`: every record in the `data/` submodule is `draft` (ADR-0003's own follow-up downgraded the seed data to `draft`, and nothing has since been promoted). Removing the state therefore needs zero data migration.

`scripts/compile.ts:631` already keys its dependency invariant off `status !== 'draft'` rather than off `candidate` by name:

```ts
// Analogously (ADR-0004): a promoted record — anything past `draft`, so
// anything that carries or once carried the persistence promise — MUST NOT
// depend on a record that is still retractable.
const isPromoted = (r: StatusRecord) => r.status !== 'draft';
```

The logic survives a two-state ladder unchanged. The real cost of keeping the state is prose: specification §11–§12, the versioning maturity-ladder prose, identifier-syntax, get-started examples, CONTRIBUTING, and — because it is the legally binding text — the German governance regulation, which ADR-0003 itself records as amended in lockstep with the English original (`association/governance.md` §4.2, §5.1, §5.2, §5.3, §6, and its `de/` counterpart).

## Decision drivers

- A status vocabulary should have no state whose meaning must be explained by what it is _not_: `candidate` is defined by "not yet `active`", not by anything it uniquely permits or forbids.
- Promotion should be one reviewable event, not two: expert review under governance §4.2 already gates both "permanent" and "recommended" judgments together in practice.
- The identifier-persistence promise must stay absolute where it applies; ADR-0003's finding — that a promise with fuzzy edges is worse than a narrower hard one — argues against a state whose only content is "already permanent, not yet endorsed".
- ADR-0002's offline-computable identity (deterministic v5 UUIDs from `(work_key, citation_system_key, locator)`) must hold at every remaining stage; collapsing the ladder does not touch the identity seed.
- Additional citation systems (issue [#60](https://github.com/textrefs/textrefs.org/issues/60), ADR-0005) need to be introducible as drafts against an already-active work, which requires a clear per-record status _dependency_ rule rather than a total ordering of ladder rungs.

## Considered options

1. **Keep the three-state ladder — status quo.** The extra state keeps costing prose and review ceremony (two governance sections, two spec sections, a compiler comment, a fixture value) without buying a distinction anyone consumes: no tooling, no rendering, and no policy in this repository treats `candidate` differently from `active` except for the recommendation flag.
2. **Keep `candidate` but attach permanence at `candidate → active` instead of `draft → candidate`.** This makes `candidate` mutable, which contradicts ADR-0003's core finding that review-stage records must be cheap to correct (§ Ephemerality: "Draft records ... MAY be corrected ... or retracted ... without a tombstone"). Moving that ephemerality window one rung up just relabels which state absorbs the correction cost, and reintroduces the exact ambiguity ADR-0003 was written to remove — a published-but-uncommitted state with no name for its own promise.
3. **Collapse to `draft` → `active`.** ← chosen
4. **Rename `candidate` to something clearer** (e.g. `reviewed`, `accepted`). Cosmetic: the redundancy is structural — a promoted-but-unrecommended tier that nothing uses — not lexical. A better name does not give the state a purpose.

## Decision

We choose **Option 3**. The status ladder is `draft` → `active`, plus the tombstone states `deprecated`, `withdrawn`, `blocked`. The surviving mutable-review keyword is `draft`, not `candidate` — ADR-0003's ephemeral tier is unchanged, only the rung above it is removed.

**`draft`.** Unchanged from ADR-0003: mutable, not recommended, excluded from the persistence policy (specification §11), retractable without a tombstone.

**`active`.** Promotion out of `draft` now means _both_ "TextRefs recommends this record" _and_ "this identifier is now permanent". These were always judged together under governance §4.2 expert review; there is no longer a state that carries one without the other. One event, one gate: expert review, governance §4.2.

**Corrections after promotion.** An incorrect `active` record is never deleted and its identity-defining fields are never mutated — that constraint is unchanged from specification §11. It is marked `deprecated` (retained, no longer recommended), `withdrawn` (erroneous or superseded), or `blocked` (rights, trust, or policy dispute), and carries `superseded_by` when a successor exists. Because identity is deterministic (ADR-0002), the corrected tuple mints a _new_ UUID at a new IRI; the old IRI keeps resolving as a tombstone page. This is the only correction path for a promoted record: no identity mutation, no deletion.

**General dependency rule.** An `active` record MUST NOT depend on a `draft` record: an active `CanonicalReference` needs an active `Work` and an active `CitationSystem`; an active `MappingAssertion` needs an active subject `Work`. This restates `scripts/compile.ts:631`'s existing invariant in terms of the two-state ladder instead of "candidate or higher". ADR-0005 specialises this rule for the preferred-versus-additional citation-system distinction it introduces.

**Governance.** `association/governance.md` (and its legally binding `de/association/governance.md` counterpart) lose the `candidate` row in §5.1 and §5.2; §4.2's promotion bullet becomes "promotion of records from `draft` to `active`"; §5.3's "Promoted IDs (status `candidate` or higher)" becomes "Active IDs"; §6 item 4 ("Provisional records are expressed through the `draft` status ... their IDs may disappear or change until promotion") follows without further change other than dropping any remaining `candidate` reference. Both texts are amended in the same change, as ADR-0003 required.

## Consequences

### Positive

- One promotion event and one review gate, matching how governance §4.2 already treats the decision in practice.
- The status vocabulary is now fully explained by two live states plus three tombstones — no state defined by what it is not.
- No data migration: nothing in the `data/` submodule is on `candidate`.
- ADR-0005's per-record dependency rules become expressible in one sentence each, instead of needing to reason about ladder position.
- The spec carries `maturity: working-draft` (`/standard/versioning/`, "Unstable. Data model and prose may change without notice and without a version bump while the core is settled"), so this change needs no spec version bump.

### Negative / trade-offs

- Dump consumers reading the `Status` enum see one fewer value. Under `/standard/versioning/#semver-rules-for-data-packages` this is a breaking change for the data package's SemVer, exercised here under the pre-1.0 latitude ADR-0002 and ADR-0001 already established as acceptable.
- Anyone who read ADR-0003 must now read two ADRs (ADR-0003 plus this one) to know the current lifecycle model; ADR-0003 itself is not rewritten, only superseded.
- Two legally distinct texts (English `governance.md`, binding German `de/association/governance.md`) must be amended in sync again, repeating the coordination cost ADR-0003 already paid once.
- A future registry need for a "proposed but already permanent" tier would have to re-add a state rather than repurpose an existing one.

### Follow-up actions

- [x] Remove `candidate` from the `Status` enum in `standard/schema/common.ts` and from `api/openapi.yaml:185`.
- [x] Reword the compiler invariants and comments in `scripts/compile.ts` (e.g. the comment above line 631) to describe a `draft` → `active` ladder instead of "candidate or higher".
- [x] Update `src/lib/registry.fixture.ts`, whose fixture records currently carry `status: 'candidate'`.
- [x] Sweep the lifecycle prose: specification §11–§12, `/standard/versioning/`, `/standard/identifier-syntax/`, get-started examples, `CONTRIBUTING.md`, and its community-docs mirror.
- [x] Amend governance §4.2, §5.1, §5.2, §5.3, and §6 in both `association/governance.md` (English) and `de/association/governance.md` (binding German).

## Links

- Related ADRs: ADR-0002 (deterministic identity from the semantic tuple), ADR-0003 (superseded by this one), ADR-0005 (preferred citation system — builds on the dependency rule this ADR states)
- Related issues / PRs: textrefs/textrefs.org#22
- External references: governance regulation §4–§6 (`/association/governance/`)
