---
title: URL layout
description: How /id/, /reg/, /cite/, and /api/ fit together on textrefs.org.
sidebar:
  order: 7
---

TextRefs uses four URL prefixes, each with one job. Together they make every registry record citeable, browsable, machine-readable, and short-linkable.

| Prefix   | Role           | What lives there                                                                                                                                 |
| -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/id/`   | **Identifier** | The canonical, persistent URL of every record. Each record is published twice: `/id/.../` (HTML) and a sibling `/id/....json` (JSON-LD).         |
| `/reg/`  | **Browse**     | The human registry browser: filter works and citation systems, then browse paginated reference lists from those record pages. Links into `/id/`. |
| `/cite/` | **Cite**       | Short, memorable URLs (`/cite/{work}/{locator}`) that redirect to the canonical `/id/` URL.                                                      |
| `/api/`  | **API docs**   | The OpenAPI document describing the `/id/` URL contract, plus the JSON-LD `@context` at `/contexts/`.                                            |

In one line:

> **`/id/` is the registry. `/reg/` browses it. `/cite/` shortcuts to it. `/api/` documents it.**

## One record, four URLs

Plato's _Republic_ 514a — the Stephanus passage where Socrates begins the Allegory of the Cave — is one canonical reference. Here is what each prefix gives you for it:

- **Canonical identifier** — the URL you cite, link from a paper, or paste into a tool:
  - `https://textrefs.org/id/ref/884e8b51-b9cc-5f4b-9e49-60c636c0cd1a/` (HTML for browsers)
  - `https://textrefs.org/id/ref/884e8b51-b9cc-5f4b-9e49-60c636c0cd1a.json` (JSON-LD for machines)
- **Browseable index** — the registry's human entry point, where readers find works, citation systems, and (via the work page) every reference:
  - `https://textrefs.org/reg/`
- **Short alias** — a memorable, hand-typeable shortcut that redirects to the canonical URL:
  - `https://textrefs.org/cite/plato.republic/514a`
- **Machine contract** — the OpenAPI describing how `/id/` behaves, so a client knows it can append `.json` to any canonical URL:
  - `https://textrefs.org/api/`

## How machine clients discover the JSON

There is no `Accept`-header content negotiation. Every HTML record page advertises its JSON-LD sibling in the document head:

```html
<link rel="alternate" type="application/json" href="/id/ref/884e8b51-….json" />
```

A client either reads that `<link>` tag, or simply appends `.json` to the canonical URL. The JSON payload carries the JSON-LD `@context` at [`/contexts/v1.jsonld`](/contexts/v1.jsonld) and is valid JSON-LD by content.

This mirrors how arxiv.org publishes each paper at `/abs/{id}` and `/pdf/{id}` — two static URLs, two representations, no negotiation needed.

## Why four prefixes, not one

Persistent-identifier systems separate concerns. DOI and ORCID each have a canonical resolver URL that _is_ the API, with documentation living at a stable but distinct path. W3ID and PURL add short-alias redirects on top. TextRefs follows the same pattern:

- The identifier (`/id/`) is the contract — it must be persistent and stable across editions, providers, and resolver implementations.
- The browser (`/reg/`) is the discovery surface — it can change shape and add features without breaking citations.
- The alias (`/cite/`) is convenience — short URLs that always resolve back to the canonical identifier via `<link rel="canonical">`.
- The docs (`/api/`) describe the contract for anyone integrating against `/id/`.

If you only remember one thing: **cite the `/id/` URL, browse from `/reg/`, share the `/cite/` shortcut, and read `/api/` to integrate.**
