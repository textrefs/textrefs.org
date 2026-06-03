---
title: Get started
description: Why TextRefs exists, who it's for, and how it fits with existing identifier systems.
sidebar:
  order: 1
---

## The gap

Citations like "Plato, _Republic_ 514a" or "Aristotle, _Eth. Nic._ 1094a1" are foundational to scholarship in classics, theology, law, philosophy, and adjacent disciplines. Every serious edition, commentary, and database uses them. Yet none of them has a native, persistent, machine-readable identifier you can paste into a tool, link from a paper, or feed to an indexing pipeline. They live as plain text inside footnotes and prose, dependent on the reader knowing the citation convention.

That mismatch — central in scholarship, invisible to software — is what TextRefs addresses.

## What TextRefs is

TextRefs is an open registry. For each canonical reference we mint a persistent HTTP URI, attach curated mappings to relevant external identifiers (CTS URNs, Wikidata QIDs, DOIs, library and edition URLs), record resolver targets where readers can inspect the passage, document provenance and uncertainty, and publish everything as JSON-LD under non-profit governance. The registry is read-only and changes happen via reviewed pull requests; data is released under CC0 so it can flow into any tool that needs it.

The same model covers a Stephanus passage in Plato, a Bekker line in Aristotle, a chapter-and-verse in the Vulgate, an article in the _Summa_, and a fragment in the _Digesta_ — every traditional reference system is a `CitationSystem` with its own locator rules.

## Use TextRefs with existing systems

Use TextRefs for the stable citation identity: the passage, article, line, section, or fragment a scholar means when they write a traditional reference. Keep edition text, commentary, apparatus, translations, and platform-specific records in the systems that already curate them.

This division is deliberate. TextRefs stays small, persistent, and legally reusable; libraries, editions, catalogues, and reading platforms keep doing the richer work they are built for. The registry connects them through curated mappings instead of trying to replace them. See the [related systems comparison](/get-started/related-systems/) for the full picture.

## Keep reading

- [How it works](/get-started/how-it-works/) — the practical model: identity, mappings, resolver targets, and examples.
- [Use cases](/get-started/use-cases/) — concrete scenarios across research, libraries, digital editions, and AI grounding.
- [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/) — how to model external identifiers, reading URLs, and canonical-citation candidates.
- [Authoring registry data](/get-started/authoring/) — the contributor YAML format and the `npm run build:data` pipeline.
- [Related identifier systems](/get-started/related-systems/) — how TextRefs relates to DOI, ARK, CTS, DTS, Wikidata, VIAF, and friends.
- [The standard](/standard/) — the normative specification text (`v0.1.0-draft`).
- [The association](/association/) — the non-profit behind TextRefs, its statutes, and the open board search.

## Live examples

- [`/id/work/dhammapada/`](/id/work/dhammapada/) — Dhammapada with four real providers (Gutenberg, Wikisource, ancient-buddhist-texts.net, palikanon.com) across English and German.
- [`/id/work/plato.republic/`](/id/work/plato.republic/) — Plato's _Republic_ with Stephanus pagination.
- [`/cite/plato.republic/514a`](/cite/plato.republic/514a) — a short alias that redirects to the canonical reference URL.
- [`/reg/`](/reg/) — the registry browser.
- [URL layout](/get-started/url-layout/) — how `/id/`, `/reg/`, `/cite/`, and `/api/` fit together.
