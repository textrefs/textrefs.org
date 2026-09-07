---
title: URL layout
description: How /id/, /reg/, /cite/, and /api/ fit together on textrefs.org.
sidebar:
  order: 8
---

TextRefs uses four URL prefixes, each with one job. Together they make every registry record citeable, browsable, machine-readable, and short-linkable.

| Prefix   | Role           | What lives there                                                                                                                                                                                                                                                         |
| -------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/id/`   | **Identifier** | The canonical URL of every record, persistent once the record is `active`. Each record is published twice: `/id/.../` (HTML) and a sibling `/id/....json` (JSON-LD).                                                                                                     |
| `/reg/`  | **Browse**     | The human registry browser: filter works and citation systems, then browse paginated reference lists from work pages. Links into `/id/`. Also serves two JSON-LD collections and one locator index for each work, so a client can find a record without a key or a UUID. |
| `/cite/` | **Cite**       | Short, memorable URLs (`/cite/{work}/{system}/{locator}` always, and bare `/cite/{work}/{locator}` for the work's preferred system) that redirect to the canonical `/id/` URL. Convenience only. Bare aliases MAY be retargeted. An `active` `/id/` URL is permanent.    |
| `/api/`  | **API docs**   | The OpenAPI document that describes the `/id/` URL contract, plus the JSON-LD `@context` at `/contexts/`.                                                                                                                                                                |

In one line:

> **`/id/` is the registry. `/reg/` browses it. `/cite/` shortcuts to it. `/api/` documents it.**

## One record, four URLs

Plato's _Republic_ 514a — the Stephanus passage where Socrates begins the Allegory of the Cave — is one canonical reference. Here is what each prefix gives you for it:

- **Canonical identifier** — the URL you cite, link from a paper, or paste into a tool:
  - `https://textrefs.org/id/ref/dc799d4b-9b17-5d76-85aa-dfd001c5321d/` (HTML for browsers)
  - `https://textrefs.org/id/ref/dc799d4b-9b17-5d76-85aa-dfd001c5321d.json` (JSON-LD for machines)
- **Browseable index** — the registry's human entry point, where readers find works, citation systems, and (via the work page) every reference:
  - `https://textrefs.org/reg/`
- **Short alias** — a memorable, hand-typeable shortcut that redirects to the canonical URL. Every reference has a qualified alias. The bare form exists only for the work's preferred citation system:
  - `https://textrefs.org/cite/plato.republic/stephanus/514a` (qualified — always minted)
  - `https://textrefs.org/cite/plato.republic/514a` (bare — minted because Stephanus is Republic's preferred system)
- **Machine contract** — the OpenAPI that describes how `/id/` behaves, so a client knows it can append `.json` to any canonical URL:
  - `https://textrefs.org/api/`

## How machine clients discover the JSON

There is no `Accept`-header content negotiation. Every HTML record page advertises its JSON-LD sibling in the document head:

```html
<link
  rel="alternate"
  type="application/ld+json"
  href="/id/ref/dc799d4b-….json"
/>
```

A client either reads that `<link>` tag, or appends `.json` to the canonical URL. The JSON payload carries the JSON-LD `@context` at [`/contexts/v1.jsonld`](/contexts/v1.jsonld) and is valid JSON-LD by content.

This mirrors how arxiv.org publishes each paper at `/abs/{id}` and `/pdf/{id}` — two static URLs, two representations, no negotiation needed.

## Collections and bulk data

Every `/id/` URL needs a key you already know. The `/reg/` collections give a client a starting point when it does not have one yet.

`/reg/` serves two static JSON-LD collections:

- `https://textrefs.org/reg/works.json` — every work in the registry
- `https://textrefs.org/reg/systems.json` — every citation system in the registry

Each collection wraps its records in one `@context` and one `@graph` array:

```json
{
  "@context": "https://textrefs.org/contexts/v1.jsonld",
  "@graph": [
    {
      "id": "https://textrefs.org/id/work/plato.republic",
      "key": "plato.republic",
      "type": "Work",
      "…": "…"
    }
  ]
}
```

Each item carries no `@context` of its own. The collection lists records of every status — active, draft, and retired — sorted by `key`.

For bulk use, six artifacts live under `/dump/`:

- `https://textrefs.org/dump/works.jsonl`
- `https://textrefs.org/dump/citation-systems.jsonl`
- `https://textrefs.org/dump/references.jsonl`
- `https://textrefs.org/dump/mappings.jsonl`
- `https://textrefs.org/dump/aliases.json` — the complete alias table. Each key is a `/cite/` alias or an external identifier. Each value is the canonical `/id/` URL that the key resolves to.
- `https://textrefs.org/dump/datapackage.json` — a Frictionless data-package descriptor. It lists the five resources with a byte count and a `sha256:` hash for each.

Each `.jsonl` file holds one record per line, with no `@context`. The alias table is one JSON object with sorted keys. Together they are the bulk-archive form of the registry.

The site is static, and the host sets each `Content-Type` from the file extension. A record or collection `.json` body is JSON-LD by content, but it arrives as `application/json`. The two alias artifacts are plain JSON, and they arrive the same way. A `.jsonl` body arrives as `application/octet-stream`. Parse each body by its documented shape. Do not parse it by the response header.

Use the small JSON-LD collection for a browser client. Use the `/dump/` files for a bulk consumer. See [`/api/`](/api/) for the full contract.

## Find a reference by its locator

This section is the machine path. For the same lookup by hand, use the finder at [`/find/`](/find/), which does exactly these steps in the browser; [Find a reference](/get-started/finding-references/) describes it.

The UUID of a reference is a UUIDv5 of three fields: the work key, the citation system key, and the locator. A client can compute that UUID, but only with a UUIDv5 implementation. The registry therefore publishes the result as a static file.

Each work has a locator index at `/reg/work/{work_key}/aliases.json`. The index maps each locator to the UUID of its canonical reference, grouped by citation system key. The body is plain JSON. It is not JSON-LD, and it carries no `@context`.

To resolve a locator, do these steps:

1. Send a GET request to `https://textrefs.org/reg/work/plato.republic/aliases.json`.
2. Read the value at `refs["stephanus"]["514a"]`. The value is `dc799d4b-9b17-5d76-85aa-dfd001c5321d`.
3. Send a GET request to `https://textrefs.org/id/ref/dc799d4b-9b17-5d76-85aa-dfd001c5321d.json`.

Two requests give you the record. No UUID computation is necessary.

The index has this shape:

```json
{
  "work_key": "plato.republic",
  "preferred_citation_system_key": "stephanus",
  "refs": {
    "stephanus": {
      "327a": "cecef712-e8cf-5878-9d48-419f7d185a56",
      "514a": "dc799d4b-9b17-5d76-85aa-dfd001c5321d"
    }
  }
}
```

Obey these rules when you read an index:

- Build the canonical URL yourself. Add the UUID to `https://textrefs.org/id/ref/`. Add `.json` for the JSON-LD record.
- Use the citation system that you cite. A work with more than one system carries one entry in `refs` for each system. The same locator under two systems denotes a different passage each time.
- Read `preferred_citation_system_key` only for the bare `/cite/{work_key}/{locator}` alias. It is a default for presentation. It does not change identity.
- Do not read a status from the index. The index lists references of every status. Read the canonical record for the status and for the resolver targets.
- Expect an empty `refs` object for a work that has no references yet.

The largest index is about 1.2 MB, and most are smaller than 70 KB. Use `/dump/aliases.json` if you must resolve locators for many works at one time.

## Why four prefixes, not one

Persistent-identifier systems separate concerns. DOI and ORCID each have a canonical resolver URL that _is_ the API. Their documentation lives at a stable but distinct path. W3ID and PURL add short-alias redirects on top. TextRefs follows the same pattern:

- The identifier (`/id/`) is the contract. It must be stable across editions, providers, and resolver implementations, and persistent once the record is `active`.
- The browser (`/reg/`) is the discovery surface. It can change shape and add features, and citations do not break.
- The alias (`/cite/`) is convenience. Short URLs resolve back to the canonical identifier via `<link rel="canonical">`. The qualified form (`/cite/{work}/{system}/{locator}`) exists for every reference. The bare form (`/cite/{work}/{locator}`) exists only for a work's preferred system and MAY be retargeted if that preference changes. `/id/` is never retargeted.
- The docs (`/api/`) describe the contract for anyone who integrates against `/id/`.

If you only remember one thing: **cite the `/id/` URL, browse from `/reg/`, share the `/cite/` shortcut, and read `/api/` to integrate.**
