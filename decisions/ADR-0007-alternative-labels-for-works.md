# ADR-0007: Alternative labels on `Work` — one flat list, published as `skos:altLabel`

- **Status:** Accepted
- **Date:** 2026-08-24
- **Deciders:** @maehr
- **Tags:** spec, data-model

## Context and problem statement

A `Work` carries exactly one name. `standard/schema/work.ts:22` declares `preferred_label` as a plain string, and `public/contexts/v1.jsonld:16` maps it to `skos:prefLabel`. Nothing else names a work. There is no `alt_label`, no `abbreviation`, no `alternateName`, and no language-tagged label anywhere in `standard/`, `scripts/`, `data/`, or the published context. `alternateOf` is not a label field: it holds IRIs of other entities, the compiler derives it from `MappingAssertion`s, and an author never writes it (ADR-0006).

The consequence shows in the registry browser. Before this change, `src/pages/reg/index.astro:71` built its filter key from `preferred_label` and `key` only (anchor against `staging` at `8bcfdca`), and the client filter — `src/pages/reg/index.astro:115-118` — is a plain substring match on that attribute. A scholar who typed `NE`, `EN`, or `Nikomachische Ethik` found nothing. The registry holds Aristotle's _Nicomachean Ethics_, but only under that one English string. The same gap hit `PI` for the _Philosophical Investigations_, `LXX` for the Septuagint, and every German, French, or Latin title a scholar uses by habit.

Two documents already promised the fix and named a field that did not exist: `src/content/docs/get-started/authoring.md:124` and `data/AGENTS.md:36` both said "alt-names belong in a future `alt_labels` field". The promise was two documents old and never had a schema behind it.

The registry is small today, so the cost is small. The roadmap plans growth across theology, classics, philosophy, and law. Works in those fields carry many established short forms. Search by one canonical English label does not scale to that.

This adds a field to a published record shape, so it needs an ADR rather than a `standard:` erratum. [#85](https://github.com/textrefs/textrefs.org/issues/85) laid out the four options below and recommended option 2.

## Decision drivers

- The registry browser must find a work by the name a scholar actually types, which in classics and theology is usually an abbreviation, not the English title.
- Labels must never reach identity. ADR-0002 fixes the reference UUID seed at `work_key`, `citation_system_key`, `locator`; no label appears in it, and none may be added.
- The change must be additive. Every existing record lacks the field, and the build must pass with no submodule data change.
- No new namespace. `skos` is already declared at `public/contexts/v1.jsonld:4` and already carries `preferred_label`.
- The language question applies to `preferred_label` too. Answering it for one field alone would leave the two inconsistent and make the eventual fix breaking for both.

## Considered options

1. **Do nothing.** Keep one label per work; tell clients to search the `preferred_label` string. Rejected: it leaves the registry unusable for a scholar who knows a work by its abbreviation, which is the common case in the fields the roadmap targets.
2. **One flat list of plain strings**, published as `skos:altLabel`. ← chosen
3. **Language-tagged label objects** — `{ value: string, language?: string }[]`. `LanguageTag` already exists at `standard/schema/common.ts:41-46` for `ResolverTargetEntry`, so the validator is available. Rejected for now, not on merit: it is the better end state, but it leaves `preferred_label` a bare string, and the inconsistency means the language question should be answered for both fields at once. See _Open questions_.
4. **Separate `alternative_labels` and `abbreviations`.** More expressive, because a search UI can give an abbreviation an exact match and a full title a substring match. Rejected: it doubles the authoring burden and the boundary is not clear. `LXX` is an abbreviation. `Septuaginta` is an alternate title. `Sept.` is arguable, and an author should not have to decide.

## Decision

We choose **option 2**. `Work` gains an optional `alternative_labels: string[]`, published as `skos:altLabel` with `"@container": "@set"`.

The field is named **`alternative_labels`**, not the `alt_labels` that #85 and the two stale documents used. The registry spells its terms out — `preferred_label`, `preferred_citation_system_key`, `citation_system_key` — and an abbreviated key inside a field whose whole purpose is abbreviations reads as an accident.

**Identity.** An alternative label is never a UUID seed input (ADR-0002). Adding, editing, or removing one MUST NOT move an identifier. `scripts/compile.test.ts` locks this: compiling the same work under two different label lists yields identical reference IRIs. This rule is non-negotiable and is stated normatively in `specification.md` §6.

**Homonymy.** Two different works MAY claim the same alternative label. `Ethics` fits Aristotle and Spinoza. The compiler allows this and prints nothing. Homonymy is a fact about titles, not an authoring error, and the correct answer for a search field is two hits, not a rejected build. Consumers MUST treat such a match as ambiguous.

**Authoring.** Inside one work, entries MUST be unique and MUST NOT repeat the `preferred_label`. An empty list is rejected too: omit the key instead. This keeps the uniqueness rule strictly local, which is what makes the homonymy allowance above coherent.

These rules are enforced **twice**, because the two schemas answer different questions. `WorkSource.superRefine` (`scripts/source-schema.ts:191-207`) rejects the authored YAML at parse time with a field path, beside the duplicate-citation-system check. `Work.superRefine` (`standard/schema/work.ts:59-75`) rejects the compiled record, and it is the canonical schema the standard publishes — `scripts/validate-data.ts:36` and `scripts/compile.ts:519` both run it. Enforcing only the authoring shape would let a hand-built or third-party record carry a duplicate while still validating against the published schema, which would make the normative sentence in `specification.md` §6 unenforceable. The two report the same two messages, so a violation reads the same whichever layer catches it.

**Scope.** `CitationSystem` does not get the field in this ADR, even though it has the same problem — `Bekker` and `Stephanus` are the names scholars use, not the registry's `preferred_label` strings. One decision per ADR. See _Open questions_.

**Versioning.** No spec version bump. The standard stays `v0.1.0-draft` (`ROADMAP.md:7`, `specification.md:9`) and carries `maturity: working-draft`, which `/standard/versioning/` defines as "Unstable. Data model and prose may change without notice and without a version bump while the core is settled." ADR-0004 and ADR-0006 both invoked this clause; this ADR follows that precedent. The **data package** is a separate artefact and takes a **minor** SemVer bump at the next release under `/standard/versioning/#semver-rules-for-data-packages` — "Compatible new fields require a minor version increment" — which is automatic, since the compiler reads the version from `package.json`.

## Consequences

### Positive

- The registry browser finds a work by abbreviation and by translated title. This needed no client script change: the labels are folded into the existing `data-reg-item` haystack.
- The field flows into `dist/dump/works.jsonl`, `/reg/works.json`, and `/id/work/{key}.json` with no further edit. `scripts/compile.ts:786-790`, `src/lib/collection.ts:11-15`, and `src/pages/id/work/[key].json.ts:15` all serialize the whole record rather than a field whitelist.
- `skos:altLabel` is standard vocabulary paired with the `skos:prefLabel` already in the context, so consuming tools understand it without documentation and no new namespace is added.
- The two stale `alt_labels` promises can finally be honoured.
- Additive and optional, so no existing record changes and no identifier moves. The gate that would have caught an omission — `scripts/validate-data.ts:81-114`, which fails on any emitted key absent from the context — passes.

### Negative / trade-offs

- Every work record grows an optional field that reviewers must check for accuracy. An alternative label is a curatorial claim, like a mapping, but unlike a mapping it carries no `source` and no `status`. It is asserted by the record and reviewed only in the pull request.
- Plain strings carry no language tag, so `Nikomachische Ethik` and `Ethica Nicomachea` sit in the same undifferentiated list. A client cannot filter labels by language or render the right one for its locale.
- If a later ADR moves to language-tagged objects, the field shape breaks for existing consumers. Deferring the question is the cost paid for shipping search in one release.
- Allowing cross-work duplicates means the browser can return two hits for one query with nothing to disambiguate them beyond the `key` shown in the row. That is correct, but it is a UI problem this ADR does not solve.
- Nothing checks `public/contexts/v1.jsonld` against its hand-maintained copy at `src/content/docs/standard/json-ld.md:58`. This ADR adds one more term that can drift between them.

### Follow-up actions

- [x] Add `alternative_labels: z.array(z.string().min(1)).optional()` to `WorkBase` in `standard/schema/work.ts`, after `preferred_label`.
- [x] Add `"alternative_labels": { "@id": "skos:altLabel", "@container": "@set" }` to `public/contexts/v1.jsonld`, and the same term to the copy in `src/content/docs/standard/json-ld.md`.
- [x] Add the field to the strict `work` block of `WorkSource` in `scripts/source-schema.ts` with `.min(1)`, plus the uniqueness check in its `superRefine`. Mirror both in the canonical `Work` schema, so the published record shape enforces what the specification asserts.
- [x] Project the field onto the compiled record in `scripts/compile.ts`, following the conditional-spread pattern the `creators` field uses. The record is built from an explicit field list, so an unlisted key is silently dropped.
- [x] Mirror the field on the `Work` schema in `api/openapi.yaml`, as an optional array carrying `minItems: 1` and `uniqueItems: true`, so a downstream client validates against the same constraints.
- [x] Fold the labels into the browser filter key in `src/pages/reg/index.astro`, and render them on `src/pages/id/work/[key]/index.astro`.
- [x] Update `specification.md` — the mermaid `class Work` block, the `plato.republic` example, the `Optional:` list, and one normative paragraph in §6 stating the identity and homonymy rules.
- [x] Replace the `alt_labels` promise in `src/content/docs/get-started/authoring.md` with a real `### alternative_labels` section.
- [x] Add the field to the fixture work in `src/lib/registry.fixture.ts`, so `npm run build:fast` exercises both the record page and the filter without submodule data.
- [x] Extend `scripts/compile.test.ts`: projection, omission, empty list, in-work duplicate, a label equal to `preferred_label`, a shared label across two works, and identifier stability under a label change — through the YAML path, and again directly against the canonical `Work` schema.
- [x] Fix the stale `alt_labels` promise at `data/AGENTS.md:36`. That file lives in `textrefs/registry`, so it needs a pull request to the submodule repository (textrefs/registry#21).
- [x] Seed alternative labels on `data/works/*.yaml` in a `textrefs/registry` pull request — `NE`/`EN` for the _Nicomachean Ethics_, `PI` for the _Philosophical Investigations_ — then bump the submodule pointer here. Follow the workflow in `CONTRIBUTING.md:135-140`. Every work carries the field as of the `7d10919` pin.
- [ ] **Separate ADR or issue:** disambiguate a duplicate hit in the registry browser ([#92](https://github.com/textrefs/textrefs.org/issues/92)). Two works sharing a label is legal by this decision, and the row shows only the `key`.
- [ ] **Separate ADR:** language tagging for labels, answered for `preferred_label` and `alternative_labels` together ([#109](https://github.com/textrefs/textrefs.org/issues/109)). See _Open questions_ 1.

## Open questions

Recorded, not answered here.

1. **Plain strings now, or language-tagged objects?** Deferring costs a breaking record-shape change later: consumers reading `alternative_labels` as `string[]` would have to move to `{ value, language }[]`. Answering it now would leave `preferred_label` a bare string and the two fields inconsistent, and fixing that inconsistency is itself breaking. The question belongs to both fields at once.
2. **One flat list, or separate `abbreviations` and alternate titles?** A search UI treats them differently — an abbreviation deserves an exact match, a full title a substring match. Option 4 above rejected the split on authoring cost, not on merit. Revisit if the browser gains ranked search.
3. **Does `CitationSystem` need the same field?** It has the same problem: `Bekker` and `Stephanus` are the names scholars use. Out of scope for v1. If the answer is yes, it is additive and non-breaking at that point.
4. **Is there an upper bound on the number of labels per work?** None is enforced. A work with thirty labels would bloat the filter haystack and the dump without an obvious benefit. No evidence yet on where a sensible limit sits.

## Links

- Related ADRs: ADR-0002 (the UUID seed — the reason a label can never move an identifier), ADR-0005 (introduces the Zod authoring schema this field extends), ADR-0006 (`alternateOf` is a mapping projection, not a label field)
- Related issues / PRs: textrefs/textrefs.org#85
- External references: [SKOS `altLabel`](https://www.w3.org/TR/skos-reference/#labels), [JSON-LD `@container: @set`](https://www.w3.org/TR/json-ld11/#sets-and-lists)
