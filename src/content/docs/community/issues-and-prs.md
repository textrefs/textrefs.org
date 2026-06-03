---
title: Issues and pull requests
description: Conventions for filing issues and opening PRs.
sidebar:
  order: 5
---

Use GitHub issues for public discussion and pull requests for concrete changes.

Security problems are the exception: do not open a public issue for them. Follow the [Security Policy](/community/security/) instead.

## Before opening an issue

Check whether the topic is already covered by:

- the [roadmap](/community/roadmap/);
- the [standard](/standard/);
- the [Get started](/get-started/) guides;
- existing GitHub issues and pull requests.

If the issue concerns registry data, include enough information for someone else to verify the claim from public sources.

## Choosing an issue template

Use the closest matching template:

- **Bug report** for broken site behavior, build failures, or unexpected output.
- **Documentation** for unclear, missing, or outdated docs.
- **Data correction** for wrong labels, aliases, mappings, resolver targets, or citation data.
- **Standard proposal** for new standard features or larger model changes.
- **Standard change** for focused changes to existing standard text.
- **Conformance failure** for cases where tooling or data appears to disagree with the published standard.

If none fits, open a general issue and explain the expected outcome.

## What makes an issue actionable

A useful issue includes:

- the affected URL, file path, identifier, or registry key;
- the expected behavior or corrected data;
- the actual behavior or current data;
- sources or references for data and standard questions;
- screenshots, logs, or reproduction steps when relevant.

For registry data, do not paste copyrighted full text, critical apparatus, or protected translations. Cite public sources and quote only the minimum needed for review.

## Pull requests

Before opening a PR, read the [Contributing guide](/community/contributing/).

Keep PRs focused. A good PR changes one logical thing: one documentation correction, one data correction set, one schema change, or one tooling change.

A PR should include:

- a short summary of the change;
- links to related issues;
- notes on review track if expert review may be needed;
- verification results: `npm run verify:fast` for routine work, or `npm run verify` plus `npm run validate:data` for registry-data, standard, release, production-build, or CI changes;
- sources for registry-data or standard changes.

## Review expectations

Maintainers may ask for narrower scope, clearer sources, or a different review track.

Not every valid proposal is merged immediately. Some changes may be deferred until a related standard version, registry batch, or API milestone.
