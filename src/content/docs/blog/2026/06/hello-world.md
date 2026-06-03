---
title: 'Hello world: TextRefs is now open source'
date: 2026-06-03
authors: [moritz, luz]
excerpt: We are open-sourcing TextRefs — an open registry for canonical text references. It is very early stage, nothing is stable yet, and we are looking for collaborators, reviewers, and supporters.
tags: [announcement]
---

We are open-sourcing **TextRefs** — an open, persistent, machine-readable registry for canonical text references in the humanities (Stephanus pages, Bekker lines, chapter–verse, CTS URNs, and the long tail of system-specific locators that scholars actually cite).

## Why we started this

Referencing passages in the humanities is, to put it mildly, cumbersome and not well suited to 21st-century digital workflows. Every research database, edition viewer, and bibliographic tool reinvents its own way of pointing at "the same line of Plato," and none of them line up cleanly. There is no shared, dereferenceable identifier you can paste into a paper, a notebook, a knowledge graph, or a script and trust to still resolve in ten years.

We were annoyed enough by this to do something about it. TextRefs is our attempt at the missing piece: a small, boring, well-specified registry that gives canonical passages a stable URL, a JSON-LD body, and a documented contract — and then gets out of the way of editors, libraries, and downstream tools.

## Who is behind it

TextRefs is being set up as a Zürich-based association (_Verein_) in formation, run by:

- **Moritz Mähr** — digital humanities and open infrastructure ([moritzmaehr.ch](https://moritzmaehr.ch))
- **Luz Christopher Seiberth** — philosophy and classical reception

We are bootstrap-financed, non-commercial, and committed to the [Principles of Open Scholarly Infrastructure (POSI)](/association/posi/).

## Current state — and what "early" really means

This is **very** early stage. Concretely:

- The data model, the JSON-LD context, the URL layout, and the OpenAPI contract are all **working drafts** and **will change** without major version bumps until we ship v1.0.
- The registry is small and largely illustrative. Coverage of real citation systems is intentionally narrow while we settle the core.
- There is no service-level commitment yet. Treat every URL as experimental.

The site itself carries a top banner on every page to make this hard to miss. If you build something against TextRefs today, expect to chase breaking changes for a while.

## What we are looking for

If any of the following sounds like you, please get in touch:

- **Editors, philologists, librarians** who maintain canonical reference systems and want them represented properly.
- **Tool builders** (reference managers, edition viewers, annotation tools, knowledge graphs) who would benefit from stable identifiers and are willing to try the contract while it is still soft enough to change.
- **Reviewers** for the standard, the JSON-LD shapes, and the governance documents.
- **Supporters** — financial or in-kind — who want to help a small open-infrastructure project reach a sustainable footing.

The fastest ways to engage:

- File an issue or discussion on [GitHub](https://github.com/textrefs/textrefs.org).
- Read the [standard](/standard/) and the [API documentation](/api/), and tell us where they are wrong.
- See [Community → Contributing](/community/contributing/) for how to help in code.

Thanks for reading. More soon.
