# ADR-0003: Review lifecycle with an ephemeral `draft` state

- **Status:** Superseded by ADR-0004
- **Date:** 2026-07-05
- **Deciders:** @maehr
- **Tags:** spec, governance

## Context and problem statement

Every published record carries the full persistence promise: IRIs are permanent once minted (identifier-syntax § Immutability, specification §11), and any identity correction requires tombstone ceremony (versioning § Tombstones). There is no state in which a record is visible in the registry but still retractable — a wrong locator cannot simply be fixed, a bad entry cannot simply vanish. Issue [#22](https://github.com/textrefs/textrefs.org/issues/22) proposes such a state.

The governance regulation defines review _tracks_ (§4: technical / expert / board) but no in-registry review _lifecycle_: nothing distinguishes freshly imported, unreviewed data from records that have passed expert review.

Since ADR-0002, identity is pure math: the reference UUID is offline-computable from `(work_key, citation_system_key, locator)`. That separates **identity** (which never mutates — a tuple always hashes to the same UUID) from **registration** (what the registry endorses and promises). It also puts governance §6.4 ("provisional or uncertain objects receive generated IDs") in conflict with the deterministic-identity model.

## Decision drivers

- Reviewers need to browse rendered records and check resolver targets _before_ the registry commits to permanence.
- Corrections during review should be cheap: fix the tuple, the wrong UUID disappears — no tombstone debt for data nobody ever relied on.
- The persistence promise must stay absolute where it applies; a promise with fuzzy edges is worse than a narrower hard one.
- ADR-0002's offline computability must hold at every lifecycle stage; re-minting ceremonies contradict it.
- The DE governance regulation is the legally binding text; the model must be expressible there in sync.

## Considered options

1. **Attach the promise at `candidate → active`** — no new status; `candidate` becomes retractable. Silently weakens what `candidate` means today and leaves no distinction between "just imported" and "proposed for acceptance".
2. **Never publish ephemeral records (PR-only review)** — everything published stays permanent. Reviewers cannot browse rendered records; long-running review branches become the de-facto ephemeral state.
3. **v4 provisional IDs, re-minted to v5 at promotion** (governance §6.4 as written) — ephemerality visible in the ID itself, but breaks offline computability for drafts and makes every promotion an ID migration.
4. **New `draft` status; promise attaches at `draft → candidate` promotion; deterministic v5 throughout.**

## Decision

We choose **Option 4**. The status ladder becomes `draft` → `candidate` → `active` → `deprecated` / `withdrawn` / `blocked`, and the identifier-persistence promise attaches at the **promotion** event (`draft → candidate`), not at publication.

**Entry.** New data enters the registry as `status: draft` after technical review (governance §4.1: schema validation, `locator_regex`, no full text). Draft records are rendered with a prominent "draft — not a persistent identifier" treatment (`noindex`, excluded from site search) and appear in exports with `status` as the signal — the same convention tombstones use.

**Ephemerality.** Draft records are excluded from the persistence policy. They MAY be corrected — changing an identity field mints a different id; the old UUID simply disappears — or retracted: the record is deleted, its IRI ceases to resolve, and **no tombstone** is created. Because identity is deterministic, a retracted tuple that is later re-proposed regains the same UUID by construction; there is no identity split and no way to "lose" an identity by retraction.

**Promotion.** `draft → candidate` requires expert review (governance §4.2: rationale, sources, attestation of the reference points, canonical-form check). Promotion changes `status` only — it MUST NOT change identity fields, so the IRI survives promotion unchanged. From promotion onward the record is permanent and the tombstone rules of versioning apply. `candidate → active` and the tombstone states are unchanged.

**Granularity.** References share their work's status (the compiler assigns `status` from the work record), so the promotion unit is a work together with its references; citation systems and mappings promote individually. A promoted record MUST NOT reference a draft `Work` or `CitationSystem` through its keys — systems and works are promoted before or together with the references that depend on them.

**ID policy.** All registry records carry deterministic v5 identifiers at every stage. Provisionality is expressed by `draft` status, not by the ID algorithm; governance §6.3/6.4 is amended accordingly.

## Consequences

### Positive

- The registry gains a reviewable, retractable tier without weakening any existing promise: permanence attaches at promotion and is absolute from there.
- Review-stage corrections cost nothing: no tombstone debt for data nobody ever relied on.
- One lifecycle connects the governance review tracks (§4) to the status model (§5): technical review gates entry, expert review gates permanence.
- The earlier wish to downgrade the unreviewed seed data below `candidate` becomes meaningful and lands as a follow-up.

### Negative / trade-offs

- Dump consumers MUST filter by `status` if they need only promoted records; a draft's presence in one release says nothing about the next.
- A retracted draft's IRI returns 404 rather than a tombstone page — link rot is possible for anyone who cited a draft despite the flagging.
- Re-proposal reuses the same UUID; consumers must not treat a reappearing id as continuity of curation history.
- Two texts (EN + legally binding DE governance) must be amended in sync.

### Follow-up actions

- [x] Compiler invariant: a promoted (`candidate`+) record MUST NOT reference a draft `Work`/`CitationSystem` (extend the tombstone invariant in `scripts/compile.ts`).
- [x] Draft rendering: banner and `noindex` on record pages (extend the `Tombstone.astro` pattern). **Amended 2026-09-07 ([#148](https://github.com/textrefs/textrefs.org/issues/148)):** the Decision above also excludes a draft from site search. That part is withdrawn. External indexing and internal discovery are two policies: a draft record stays `noindex` and out of the sitemap, but stays in the site's own Pagefind index, where its status is shown beside the result. Almost every record is a draft, so exclusion would empty the search UI of the tier the draft state exists to make reviewable.
- [x] Sitemap exclusion for draft record pages — `astro.config.mjs` declares `@astrojs/sitemap` explicitly and filters on `isNoindex`, so drafts are dropped. The predicate keys on record status, not on route prefix, so it narrows as records are promoted ([#47](https://github.com/textrefs/textrefs.org/issues/47)).
- [x] Downgrade the current unreviewed seed data to `draft` in `textrefs/registry`.
- [ ] Optional CI persistence check: promoted ids diffed against the previous release dump ([#103](https://github.com/textrefs/textrefs.org/issues/103)).

## Links

- Related ADRs: ADR-0002 (deterministic identity from the semantic tuple — the identity/registration separation this builds on), ADR-0004 (supersedes this ADR: collapses the ladder to `draft` → `active`, removing `candidate`)
- Related issues / PRs: textrefs/textrefs.org#22, textrefs/textrefs.org#15
- External references: governance regulation §4–§6 (`/association/governance/`)
