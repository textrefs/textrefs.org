---
title: Get started
description: Why TextRefs exists, who it's for, and how it fits with existing identifier systems.
---

## The gap

Citations like "Plato, _Republic_ 514a" or "Aquinas, _ST_ I-II.94.2" are foundational to scholarship in classics, theology, law, philosophy, and adjacent disciplines. Every serious edition, commentary, and database uses them. Yet none of them has a native, persistent, machine-readable identifier you can paste into a tool, link from a paper, or feed to an indexing pipeline. They live as plain text inside footnotes and prose, dependent on the reader knowing the citation convention.

That mismatch — central in scholarship, invisible to software — is what TextRefs addresses.

## What TextRefs is

TextRefs is an open registry. For each canonical reference we mint a persistent HTTP URI, attach curated mappings to relevant external identifiers (CTS URNs, Wikidata QIDs, DOIs, library and edition URLs), record provenance and uncertainty, and publish everything as JSON-LD under non-profit governance. The registry is read-only and changes happen via reviewed pull requests; data is released under CC0 so it can flow into any tool that needs it.

The same model covers a Stephanus passage in Plato, a Bekker line in Aristotle, a chapter-and-verse in the Vulgate, an article in the _Summa_, and a fragment in the _Digesta_ — every traditional reference system is a `CitationSystem` with its own locator rules.

## What TextRefs is not

- not a full-text database — we do not host copyrighted edition texts, critical apparatus, commentaries, or protected translations;
- not a publisher or critical edition;
- not a substitute for Perseus, Loeb, TLG, PHI, DTS, CTS, Wikidata, library catalogues, or any of the other systems we map to.

We are explicitly **adjacent** to those systems, not replacing them. See the [related systems comparison](/get-started/related-systems/) for the full picture.

## Keep reading

- [Use cases](/get-started/use-cases/) — concrete scenarios across research, libraries, digital editions, and AI grounding.
- [Related identifier systems](/get-started/related-systems/) — how TextRefs relates to DOI, ARK, CTS, DTS, Wikidata, VIAF, and friends.
- [The standard](/standard/) — the normative specification text (`v0.1.0-draft`).
- [The association](/association/) — the non-profit behind TextRefs, its statutes, and the open board search.
