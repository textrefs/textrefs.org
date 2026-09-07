---
title: Organizational and governance regulation
description: Organization, responsibilities, and decision-making processes of TextRefs.
sidebar:
  order: 4
---

:::caution[Non-binding translation]
This English translation is provided for convenience only and is **not legally binding**. The [German original](/de/association/governance/) is the authoritative text.
:::

## 1. Purpose of the regulation

This regulation gives concrete form to the organization, responsibilities, and decision-making processes of TextRefs. It is intended to ensure that the association is run in a non-profit, transparent, open, scientifically accountable, and legally sound manner.

## 2. Governance principles

The governance of the association rests on the following principles:

1. **Public benefit:** all activities serve scholarship, education, culture, and open digital infrastructure.
2. **Openness:** public registry data and documentation are freely accessible as a matter of principle.
3. **Persistence:** published identifiers shall remain durably reachable.
4. **Transparency:** changes, decisions, releases, and status changes are documented.
5. **Community curation:** contributions from the specialist community are welcome and reviewed by transparent procedures.
6. **Risk-based review:** simple technical changes require technical review; contested or structure-shaping changes require expert review.
7. **Rights safety:** the association avoids hosting protected content and documents rights and access information for external targets.
8. **Neutrality:** no external resolver, platform, or identifier system enjoys privileged status as primary internal identity.
9. **Non-discrimination in use:** the use of public data does not depend on membership.
10. **Avoidance of self-dealing:** financial or reputational conflicts of interest are disclosed and regulated.

## 3. Roles

### 3.1 Board

The Board carries overall responsibility for the association, its finances, tax exemption, legal compliance, institutional strategy, and pursuit of purpose.

It decides in particular on:

- the budget and financial planning;
- grant applications and major cooperations;
- expense and compensation matters;
- the appointment of maintainers and expert councils;
- guidelines on data, rights, takedown, and releases;
- escalations from the curation process;
- legally or reputationally sensitive publications.

### 3.2 Technical Maintainers

Technical Maintainers look after the technical infrastructure, schemata, validation, build processes, releases, and technical pull-request review.

Their tasks include in particular:

- checking data formats and schema conformity;
- maintaining JSON-LD contexts, Zod schemas, and JSON-Schema-compatible exports;
- checking referential integrity;
- checking for prohibited full-text content;
- maintaining CI/CD and release automation;
- producing changelogs and data exports;
- technical documentation.

### 3.3 Domain Reviewers

Domain Reviewers are subject-matter qualified persons for specific text corpora, languages, periods, disciplines, or citation traditions.

They review in particular:

- new works;
- new citation and reference systems;
- new corpora;
- contested reference points;
- complex mapping statements;
- normalization decisions;
- changes that affect persistent IDs or established citation logic.

### 3.4 Advisory Board

The Board may establish a scientific or institutional advisory board.

The advisory board has an advisory function. It may provide recommendations on strategy, scientific quality, partnerships, priorities, sustainability, and international compatibility.

### 3.5 Contributors

Contributors are individuals or institutions who submit issues, pull requests, mapping proposals, documentation improvements, data corrections, or other contributions.

A contribution does not establish a claim to acceptance, prioritization, publication, compensation, or membership.

## 4. Review tracks

### 4.1 Technical review

A technical review is usually sufficient for:

- typos;
- formatting corrections;
- broken links;
- minor metadata corrections;
- updates to `last_checked` fields;
- adding uncontested aliases;
- documentation corrections without expert implications;
- entry of new records as `draft` (merging validated data into the registry).

Prerequisites:

- automated validation passing;
- no prohibited full-text content;
- no rights or takedown concerns;
- no changes to persistent IDs with expert-level impact;
- at least one technical review by an authorized person.

### 4.2 Expert review

An expert review is required for:

- new corpora;
- new works;
- new citation or reference systems;
- new normalization rules;
- changes to deterministic ID inputs;
- contested mapping statements;
- conflicting external identifiers;
- changes with significant expert or reputational impact;
- promotion of records from `draft` to `active` (the point at which the persistence guarantee attaches);
- status changes to `deprecated`, `withdrawn`, or `blocked`, where these are subject-matter decisions.

Prerequisites:

- technical validation passing;
- a documented rationale;
- sources or evidence;
- at least one expert review;
- for contested decisions, a documented decision with rationale.

### 4.3 Board reservation

The Board decides or confirms:

- legally sensitive publications;
- takedown decisions;
- blocking of mapping statements on legal or policy grounds;
- cooperations with financial, legal, or strategic binding effect;
- changes to licence policy, persistence policy, or matters relevant to tax exemption;
- paid engagements for Board members or persons close to them.

## 5. Status model

### 5.1 General record status

- **draft:** work-in-progress record; correctable or retractable without a tombstone; excluded from the persistence guarantee;
- **active:** valid and recommended; permanently identified from this point on;
- **deprecated:** no longer recommended, but retained for historical reasons;
- **withdrawn:** withdrawn, landing page retained;
- **blocked:** blocked on legal, policy, or serious quality grounds.

### 5.2 Mapping status

- **draft:** work-in-progress mapping; correctable or retractable without a tombstone;
- **active:** reviewed and recommended mapping; permanently identified from this point on;
- **deprecated:** mapping no longer recommended;
- **withdrawn:** withdrawn mapping;
- **blocked:** blocked mapping.

Contested mappings remain in the appropriate schema status and carry the documented rationale, review history, or replacement relationship in accompanying metadata or decision records.

### 5.3 Tombstone principle

Active IDs (status `active` or a tombstone status) are, as a matter of principle, not hard-deleted. Records in `draft` status may be retracted without a landing page.

In the event of withdrawal, blocking, or deprecation, a landing page is retained with:

- status;
- date of the status change;
- rationale;
- responsible decision level;
- replacement ID, if any;
- a note on takedown or rights grounds, where relevant.

## 6. ID and persistence policy

1. Primary TextRefs IDs are independent HTTP URIs.
2. External identifiers such as CTS URNs, Wikidata IDs, DOIs, ARKs, Perseus URLs, or Scaife URLs are not primary TextRefs IDs.
3. All registry records carry deterministic IDs computable from their identity fields.
4. Provisional records are expressed through the `draft` status, which is excluded from the persistence guarantee; their IDs may disappear or change until promotion to `active`.
5. Once published, IDs are not changed merely because labels, titles, aliases, or external mappings are improved.
6. Human-readable citation URLs are aliases and may be redirected, changed, deprecated, or retargeted to a different record; only the primary `/id/` identifiers are permanent.

## 7. Contribution process

### 7.1 Submission

Contributions should, as a rule, be submitted via public GitHub issues or pull requests.

A contribution should include:

- the entity concerned or the proposed new entity;
- the type of change;
- a rationale;
- sources or evidence;
- an assessment of uncertainty;
- rights and licence notes where relevant.

### 7.2 Review

The contribution is triaged and assigned to a review track:

- technical change;
- expert change;
- legally or policy-sensitive change;
- incomplete or unreviewable contribution.

### 7.3 Acceptance

A contribution may be accepted when:

- automated validation passes;
- the required reviews have taken place;
- rights and licence questions are sufficiently clarified;
- the contribution is compatible with the purpose, data model, and governance;
- status, provenance, and uncertainties are appropriately documented.

### 7.4 Rejection

A contribution may be rejected, in particular when:

- it contains prohibited full-text content;
- the rights or licence situation is unclear or problematic;
- the evidence is insufficient;
- it violates the data model or the persistence policy;
- it favours commercial, proprietary, or exclusive interests in an incompatible manner;
- it is incompatible with the non-profit purpose.

Rejections should be briefly justified.

## 8. Release and archiving policy

1. The association publishes regular versioned dataset releases.
2. Each release contains a changelog.
3. Releases shall be reproducible.
4. Data exports may be provided in particular as JSON-LD and JSONL.
5. Important releases shall be archived durably via Git tags and, where possible, via [Zenodo](https://zenodo.org/communities/textrefs/) or a comparable archiving infrastructure.
6. Schema changes are versioned.
7. Breaking changes to schemata require a new major version.

## 9. Rights and takedown process

### 9.1 Principle

TextRefs does not, as a matter of principle, host copyright-protected edition texts, critical apparatus, commentaries, or translations from protected editions.

The association primarily publishes reference data, metadata, external identifiers, resolver targets, mapping statements, provenance, and status information.

### 9.2 Rights metadata

Resolver targets and mapping statements shall, where possible, include information on:

- provider or source;
- access status;
- rights or licence status;
- licence URL, if any;
- date of last check;
- provenance;
- confidence level.

### 9.3 Prohibited content

The following shall in particular not be ingested:

- copyright-protected full texts without a licence;
- critical apparatus from protected editions;
- protected commentaries or translations without a licence;
- proprietary segmentation or mapping data from sources with unclear rights;
- data that circumvent technical protection measures or paywalls;
- bulk imports from sources without a clear rights or licence basis.

### 9.4 Takedown requests

A takedown request should include:

1. verifiable contact information;
2. the precise TextRefs URL or record ID;
3. a precise description of the contested material;
4. the basis of the alleged rights or policy violation;
5. a statement that the information is true to the best of the requester's knowledge.

### 9.5 Handling

The Board or a body designated by it reviews the request.

Possible measures:

- no action where the request is manifestly unfounded;
- correction of metadata;
- change of access or rights status;
- deprecation of a mapping statement;
- blocking of a resolver target;
- redaction of certain fields;
- temporary de-publication pending clarification;
- publication of a tombstone or takedown notice.

CanonicalReference, Work, and CitationSystem IDs shall not be deleted merely because an external link or mapping is problematic.

## 10. Financial and compensation principles

1. The association's funds may be used only for the non-profit purpose.
2. The Board serves in an honorary capacity.
3. Effective, necessary, and documented expenses are reimbursed.
4. Compensation for special or operational services is excluded.
5. Affected persons recuse themselves from decisions on their own expenses.
6. Engagements of Board members or of persons close to them are excluded.
7. Donations and grants are used in accordance with their purpose.
8. Purpose-bound funds are documented separately in a traceable manner.

## 11. International activity

TextRefs addresses an international user base in scholarship, education, culture, and digital infrastructure.

International impact is compatible with public benefit because the activity is open, non-commercial, scholarship- and education-related, and serves the general public.

The registered office in Zürich serves as the legal and organizational anchor. The association maintains transparency, accounting, dedication of funds, and governance according to Swiss standards.
