---
title: Governance
description: How decisions are made in the project.
sidebar:
  order: 6
---

TextRefs separates day-to-day project review from formal Association governance.

The community process keeps routine work moving while reserving legal, policy-sensitive, and contested decisions for the responsible maintainers or the Association Board.

## Decision spaces

- **Project maintenance** covers repository structure, site content, build tooling, schemas, issue triage, and pull-request review.
- **Standard and registry stewardship** covers citation-system definitions, canonical reference identity, mappings, resolver targets, and status changes.
- **Association governance** covers legal representation, finances, membership, Board responsibilities, and formal regulations.

Association rules are documented separately under [Association](/association/). If there is a conflict between this page and a formal Association document, the formal Association document controls.

## Review tracks

Most contributions follow the review tracks described in the [Contributing guide](/community/contributing/#review-tracks).

- **Technical review** is used for typos, formatting, broken links, minor metadata, uncontested aliases, build fixes, and tooling changes.
- **Expert review** is used for new works, new citation systems, new corpora, contested mappings, deterministic-ID inputs, and status changes.
- **Board reservation** is used for takedowns, blocking, licence policy, legal questions, and other policy-sensitive matters.

Maintainers may move a contribution between tracks during triage if the impact is larger or smaller than first expected.

## Decision records

Significant architectural, process, or scope decisions should be recorded as ADRs in [`decisions/`](https://github.com/textrefs/textrefs.org/tree/main/decisions).

Use an ADR when a decision will constrain later work, surprise future maintainers, or explain why an obvious alternative was rejected. Small editorial changes, routine data corrections, and implementation details normally do not need an ADR.

## Maintainer responsibilities

Maintainers are expected to:

- keep reviews focused on the applicable track;
- explain rejection or deferral clearly;
- avoid merging changes that weaken validation or licensing boundaries;
- request domain review when a change affects scholarly interpretation;
- treat Code-of-Conduct and security reports confidentially.

## Escalation

If a discussion cannot be resolved in an issue or pull request, maintainers may escalate it to a dedicated issue, an ADR, expert review, or the Association Board.

Security issues must follow the [Security Policy](/community/security/). Code-of-Conduct concerns must follow the [Code of Conduct](/community/code-of-conduct/).
