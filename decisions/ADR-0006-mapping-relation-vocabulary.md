# ADR-0006: MappingAssertion relation vocabulary — `alternateOf` and `isReferencedBy`

- **Status:** Accepted
- **Date:** 2026-08-11
- **Deciders:** @maehr
- **Tags:** spec, data-model

## Context and problem statement

`MappingAssertion.relation` is a two-value enum — `z.enum(['exactMatch', 'closeMatch'])` (`standard/schema/mapping-assertion.ts:21`) — published as `skos:exactMatch` and `skos:closeMatch` (`public/contexts/v1.jsonld:40-47`). Two community issues filed by @stephenhart8, both marked breaking, argue that both values are wrong for the way the registry actually uses them. (Both issues name `v0.2.0-draft`; the repository is on `v0.1.0-draft`, `ROADMAP.md:7` and `specification.md:9`. See _Versioning_ below.)

**[#59](https://github.com/textrefs/textrefs.org/issues/59)** — `skos:closeMatch` is the wrong property for linking a Work to a _page about_ it. Every one of the 12 `closeMatch` mappings in `data/works/*.yaml` is a Wikipedia article URL: a document that describes the work, not a weaker identifier for it. @stephenhart8 proposed `dcterms:isReferencedBy`; @julsraemy agreed.

**[#58](https://github.com/textrefs/textrefs.org/issues/58)** — `skos:exactMatch` is a category error for Work ↔ Wikidata co-reference. SKOS mapping properties have domain and range `skos:Concept`; a `Work` is not a `skos:Concept`. @stephenhart8 proposed `owl:sameAs`. @julsraemy objected that `owl:sameAs` entails indiscernibility, symmetry and transitivity into the whole `sameAs` closure — pulling Wikidata's fused VIAF/GND identities and all their assertions in under TextRefs' semantics — and that `schema:sameAs` fails in the opposite direction, being underspecified and itself defined around a _reference web page_, which is closer to #59's relation. The thread converged on three acceptable candidates (`skos:exactMatch` retained, a minted `equivalent` à la Linked Art, or `prov:alternateOf`), and both @julsraemy and @stephenhart8 ruled out `skos:exactMatch` as genuinely wrong rather than cosmetically imprecise.

The two issues are one change. `relation` appears in the authoring shape (`scripts/compile.ts:133`), the record schema, the Work projection (`standard/schema/work.ts:24-28`), the published context, the OpenAPI spec (`api/openapi.yaml:288`), eight documentation files, and — decisively — **the deterministic UUID seed**: `subject \n relation \n target.identifier` (`src/content/docs/standard/identifier-syntax.md:114-122`, ADR-0002). Changing a relation value re-mints every affected mapping IRI. Settling the two issues separately would mean two breaking spec bumps, two rounds of edits to the same paragraphs, two identifier churns, and an interim vocabulary in which one relation is SKOS and its sibling is not — precisely the incoherence #58 objects to.

Timing forces the question now rather than later. Every record in the `data/` submodule is `status: draft` and the repository carries no tags. Under ADR-0004 a `draft` identifier carries no persistence promise and may be retracted without a tombstone, so re-minting mapping UUIDs today costs nothing. After the first promotion to `active` it costs a migration, permanently.

## Decision drivers

- A published relation must be semantically defensible against the domain and range its vocabulary actually declares — the objection in #58 is that `skos:exactMatch` fails this, not that it is imprecise.
- The relation must not entail more than TextRefs can vouch for across independently modelled graphs. TextRefs asserts "same real-world referent, go here for more", not co-reference in all contexts.
- One breaking change, not two. Both issues target `v0.2.0-draft` and touch the same enum, the same context block, the same UUID seed, and the same documentation paragraphs.
- ADR-0002's seed shape (`subject`, `relation`, `target.identifier`) must survive unchanged; only the seed _values_ may move.
- ADR-0004's draft-only registry makes identifier churn free exactly once. This decision has to land inside that window.
- The vocabulary must be selectable by an author without judgement calls about confidence — see the decision below.

## Considered options

### For the Work ↔ external entity relation (#58)

1. **Keep `skos:exactMatch`.** Zero work, and @julsraemy initially rated the domain/range problem cosmetic. Rejected: both issue participants ultimately agreed it is a real category error, not a typing artefact, and retaining it leaves the standard asserting a concept-mapping property between things that are not concepts.
2. **`owl:sameAs`.** The de-facto LOD idiom for cross-KG entity links, as @stephenhart8 noted. Rejected: it entails indiscernibility — every assertion about one IRI holds for the other, in both directions — and its transitive closure imports whatever else the target has been fused with. TextRefs cannot guarantee that an external item sits at the same level of abstraction as its own Work.
3. **`schema:sameAs`.** Widely deployed and JSON-LD-friendly (@maehr). Rejected: underspecified, so consumers read it differently, and its own definition is framed around a reference web page — which makes it a candidate for #59's relation, not this one.
4. **Mint a TextRefs `equivalent` property**, following Linked Art's precedent (linked-art/linked.art#307). Semantically exact and fully under our control. Rejected for now on cost: `https://textrefs.org/ontology#` is declared in the context (`public/contexts/v1.jsonld:3`) but nothing is published there, so a minted term would be the first relation whose definition is undereferenceable and normatively load-bearing.
5. **`prov:alternateOf`.** ← chosen

### For the Work ↔ page-about-it relation (#59)

1. **Keep `skos:closeMatch`.** Rejected: a Wikipedia article is not a weaker identifier for the work, it is a document about it. The relation is the wrong kind, not the wrong strength.
2. **`dcterms:isReferencedBy`.** ← chosen
3. **`schema:subjectOf` / `foaf:page`.** Viable but narrower; `dcterms:isReferencedBy` already has a sibling in the context (`superseded_by` → `dcterms:isReplacedBy`) and no competing reading.

## Decision

The relation vocabulary is selected by **what the target is**, never by how confident the author feels. Two values:

| `relation`       | Published as             | Use when the target is                |
| ---------------- | ------------------------ | ------------------------------------- |
| `alternateOf`    | `prov:alternateOf`       | another entity denoting the same work |
| `isReferencedBy` | `dcterms:isReferencedBy` | a document or page _about_ the work   |

**`alternateOf` → `prov:alternateOf`** (#58). Per @maehr on the thread: "I guess `prov:alternateOf` is more commonly used, let's go with that", closing a discussion in which @julsraemy ("I'd be really happy with `prov:alternateOf` or `la:equivalent`") and @stephenhart8 ("both `prov:alternateOf` and `la:equivalent` seem to do the job") had already converged.

`prov:alternateOf` relates two `prov:Entity` instances that present the same thing from different perspectives or at different levels of abstraction. Under PROV-CONSTRAINTS it is reflexive, symmetric and transitive — but, unlike `owl:sameAs`, **it does not entail indiscernibility**. Alternates may carry different attributes and sit at different levels of abstraction; that is what the property is _for_. This is the exact gap @julsraemy identified between what TextRefs wants to say and what `owl:sameAs` says, and it means the Wikidata-item objection (edition- and translation-level facts hanging off `Q35160`) does not bite: those facts are not licensed onto the TextRefs Work.

**`isReferencedBy` → `dcterms:isReferencedBy`** (#59). The thread's one objection — that `dcterms:isReferencedBy` is "intended to be used with non-literal values" — only applies if the value is emitted as a string literal. Every mapping term in the published context already carries `"@type": "@id"`, which makes values node references, exactly as `superseded_by` → `dcterms:isReplacedBy` already does (`public/contexts/v1.jsonld:78-81`). The new term is declared the same way. Recorded here so the objection does not resurface.

**`closeMatch` is removed entirely.** After the two reclassifications above, no SKOS mapping property is asserted with a `Work` as its subject — which is what #58's category argument actually requires. That leaves `closeMatch` with no valid use at all, because every one of its four documented jobs is either reassigned or unauthorable:

- Work → proxy page (`data/AGENTS.md:14`, `mappings-and-resolver-targets.md:35`) → now `isReferencedBy`.
- Work → whole edition, scan, or digital object, i.e. scope mismatch (`mappings-and-resolver-targets.md:119`) → a Work-subject SKOS assertion, so it falls to the same category objection. Such a target is either an alternate presentation of the work (`alternateOf`) or a resolver target, which is a different record type entirely; it is not a mapping.
- Disputed authorship attribution (`authoring.md:126`, `data/AGENTS.md:41`) → `closeMatch` never expressed attribution uncertainty in the first place, and the guidance matches no record in the registry. Withdrawn without replacement; see follow-ups.
- System ↔ system divergent versification (`specification.md:368`, `how-it-works.md:128`, `mappings-and-resolver-targets.md:117`) → the one case where `skos:closeMatch` is semantically defensible, since two citation systems genuinely are concept-scheme-like vocabularies of locators. But `MappingAssertion.subject` MUST be a Work IRI (`standard/schema/mapping-assertion.ts:6-11,20`), so this assertion cannot be authored at all. Specification §13 has been describing a record the schema forbids — a contradiction that predates this ADR.

Retaining `closeMatch` for that last case was considered and rejected. It would leave a value in a published enum and in `api/openapi.yaml:288` that no valid record may carry, which is a trap for implementers reading the vocabulary as a menu. The asymmetry is decisive: **removing an enum value is breaking, adding one is not.** This change is already breaking, so the removal is free; re-introducing `closeMatch` once `subject` is widened to admit a CitationSystem IRI is an additive, non-breaking change at that point. Keeping it costs a permanently dead value; dropping it costs nothing.

**Work projection.** The compiler's read-only projection onto `Work` becomes `alternateOf` and `isReferencedBy` (`standard/schema/work.ts:24-28`).

**Identity.** ADR-0002's seed shape is unchanged, and the mapping namespace UUID `f16bb214-4241-549d-ad41-7b011f02befb` stays frozen (`identifier-syntax.md:106-112`). Only the seed _values_ change, re-minting all 24 existing mapping IRIs. This is deliberate and is why the change lands now, while ADR-0004 makes draft identifiers retractable without tombstones. Both axes ship as a single breaking change.

**Versioning.** No spec version bump. The standard stays `v0.1.0-draft` (`ROADMAP.md:7`, `specification.md:9`) and carries `maturity: working-draft`, which `/standard/versioning/` defines as "Unstable. Data model and prose may change without notice and without a version bump while the core is settled." ADR-0004 was itself a breaking enum change and invoked exactly this clause to decline a bump; this ADR follows that precedent rather than inventing a `v0.2.0-draft` the repository has never been on. The issues' `v0.2.0-draft` label reflects their authors' expectation, not repository state. The **data package** is a separate artefact and does take a breaking SemVer bump under `/standard/versioning/#semver-rules-for-data-packages`, as ADR-0004's did.

## Consequences

### Positive

- No relation in the vocabulary asserts a property outside its declared domain and range.
- The vocabulary is chosen by target kind, so authoring needs no confidence judgement — the ambiguity that let one `closeMatch` value do four unrelated jobs is gone by construction.
- `prov:alternateOf` gives cross-KG reconciliation without OWL identity: no indiscernibility, no imported `sameAs` closure.
- One breaking change instead of two, with no interim state in which one relation is SKOS and its sibling is not.
- `validate-data.ts` independently recomputes every mapping UUID from `[subject, relation, target.identifier]` (`scripts/validate-data.ts:71-75`), so the re-mint is verified by the existing build rather than by inspection.

### Negative / trade-offs

- All 24 existing mapping IRIs change. Any external reference to `https://textrefs.org/id/mapping/{uuid}` breaks. Permitted only because every record is `draft` under ADR-0004; this window does not reopen.
- Breaking for the data package's SemVer under `/standard/versioning/#semver-rules-for-data-packages`, exercised under the pre-1.0 latitude ADR-0001 and ADR-0002 already established.
- Specification §13's divergent-versification mechanism is left with no vocabulary at all until `subject` is widened. This makes an existing latent contradiction visible rather than creating a new one — the record §13 describes was never authorable — but the spec must now say so plainly instead of implying a usable relation.
- The registry loses its documented mechanism for disputed attribution without gaining a replacement in this ADR.
- `prov:alternateOf` is less immediately recognisable to consumers than `owl:sameAs`; naive `sameAs`-following clients will not traverse it. That is the intended behaviour, but it is a real interoperability cost.
- A PROV vocabulary appears in the context solely for this one term, adding a namespace whose other machinery TextRefs does not use.

### Follow-up actions

Line anchors below are against `feat/preferred-citation-system` (PR [#63](https://github.com/textrefs/textrefs.org/pull/63)), which this work stacks on — see _Sequencing_ under Links.

- [x] Replace the enum with `z.enum(['alternateOf', 'isReferencedBy'])` in `scripts/source-schema.ts:73` and `standard/schema/mapping-assertion.ts:21`, keeping the two in lockstep. ADR-0005's Zod `MappingSource` makes an unknown relation fail at parse time; before it, the authoring shape was an unvalidated TypeScript type.
- [x] Replace the hard-coded two-way branch in `scripts/compile.ts:447-455,474-475` with an enum-keyed accumulator, so a further relation needs no new branch; update the `// Direct SKOS mapping edges` comment at `:447`, which no longer describes the projection at all.
- [x] Add `"prov": "http://www.w3.org/ns/prov#"` to the namespace block in `public/contexts/v1.jsonld:2-7`; replace the `exactMatch` and `closeMatch` terms with `alternateOf` → `prov:alternateOf` and `isReferencedBy` → `dcterms:isReferencedBy`, both `"@type": "@id"`.
- [x] Rename the projection fields in `standard/schema/work.ts:33-34` and rewrite the comment at `:31`, which names SKOS explicitly.
- [x] Reclassify all 12 Wikidata mappings to `alternateOf` and all 12 Wikipedia mappings to `isReferencedBy` in `data/works/*.yaml`, via a PR to `textrefs/registry`; bump each `modified`.
- [x] Confirm in the spec that `isReferencedBy` targets remain lookup aliases (`scripts/compile.ts:518`, `setAlias(aliases, mapping.identifier, workIri)`). Recommended: yes — the alias table is a lookup convenience, not an identity claim — but it must be stated rather than inherited.
- [x] Sweep the prose: `specification.md:131,140,247,264,373`, `json-ld.md:31-36,72-73`, `identifier-syntax.md:122` (the seed's enumerated literal values), `mappings-and-resolver-targets.md:35,41,117,119,130`, `authoring.md:38,126`, `how-it-works.md:97,128`, `data/AGENTS.md:14,41`, and `api/openapi.yaml:220-230,297`.
- [x] Decide what the re-mint checklists mean now: `README.md:135`, `.github/PULL_REQUEST_TEMPLATE.md:39` and `data/.github/PULL_REQUEST_TEMPLATE.md:19` link a withdrawn record to its successor with `relation: exactMatch`. `alternateOf` fits (same referent, different presentation), but `superseded_by` → `dcterms:isReplacedBy` already covers succession — this may be a redundant instruction rather than one to translate.
- [x] Extend `scripts/compile.test.ts` (260 lines from ADR-0005, no mapping coverage): projection grouping, tombstone exclusion, `mappingUuid` stability for a fixed triple, and rejection of an out-of-enum relation. Add an `isReferencedBy` mapping alongside `src/lib/registry.fixture.ts:93`.
- [ ] **Separate ADR:** widen `MappingAssertion.subject` to admit a CitationSystem IRI, then re-introduce `closeMatch` as an additive change ([#106](https://github.com/textrefs/textrefs.org/issues/106)). Until then specification §13 must state that the equivalence it describes is not yet expressible — it does.
- [ ] **Separate ADR or issue:** how to express disputed authorship attribution, now that `closeMatch` no longer pretends to ([#107](https://github.com/textrefs/textrefs.org/issues/107)).
- [ ] Publish an ontology stub at `https://textrefs.org/ontology#` ([#108](https://github.com/textrefs/textrefs.org/issues/108)). Pre-existing debt (`tr:Work`, `tr:relation`, `tr:locator` are all undereferenceable), not created here, but option 4 above was rejected partly on its account.

## Links

- Related ADRs: ADR-0002 (UUID seed — the reason a relation change re-mints identifiers), ADR-0004 (draft-only lifecycle — the reason the re-mint is free now, and the precedent for a breaking change without a spec version bump), ADR-0005 (introduces the Zod authoring schema this change extends)
- Related issues / PRs: textrefs/textrefs.org#58, textrefs/textrefs.org#59
- **Sequencing:** this ADR and its implementation stack on PR [#63](https://github.com/textrefs/textrefs.org/pull/63) (ADR-0005, `feat/preferred-citation-system` → `staging`), not directly on `staging`. #63 introduces `scripts/source-schema.ts` — the runtime validation this change's enum needs — and `scripts/compile.test.ts`, where the missing mapping coverage belongs. Basing on `staging` instead would mean editing an unvalidated TypeScript type and then resolving the same conflict when #63 merges. Retarget this PR's base to `staging` once #63 lands.
- External references: [PROV-O `alternateOf`](https://www.w3.org/TR/prov-o/#alternateOf), [PROV-CONSTRAINTS §alternate](https://www.w3.org/TR/prov-constraints/#term-alternate), [DCMI Metadata Terms `isReferencedBy`](https://www.dublincore.org/specifications/dublin-core/dcmi-terms/#http://purl.org/dc/terms/isReferencedBy), [SKOS mapping properties](https://www.w3.org/TR/skos-reference/#mapping), linked-art/linked.art#307
