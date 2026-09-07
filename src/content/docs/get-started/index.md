---
title: Get started
description: Why a passage needs one persistent identity, and how TextRefs supplies it without replacing existing editions or identifiers.
sidebar:
  order: 1
---

A passage has one identity. The editions that carry it are many.

"Plato, _Republic_ 514a" is the same passage in Burnet's Oxford text, the Slings OCT that replaced it, Shorey's Loeb, and every translation that keeps the Stephanus numbers. Pagination, apparatus and language differ. The reference does not. It is the most durable thing in the scholarly record: central to classics, theology, law and philosophy, used by every edition and commentary, and understood across centuries.

To software it is invisible. The number lives as plain text in a footnote, dependent on a reader who knows the convention. No tool can resolve it, no link can carry it, no pipeline can index it. A reference that survived four hundred years on paper breaks in a decade online, because the edition behind it sits in a repository the citation cannot reach.

TextRefs closes that gap. Every canonical reference is minted as an identity of its own, a single HTTP URI for the passage a scholar means, permanent once the record is `active`. Editions, translations, corpora and databases attach to it: identifiers that name the same work — a CTS URN, a Wikidata QID, a DOI for the Loeb — and the reading URL that resolves this one passage in the archive that holds the text. The citation becomes the doorway, and everything that carries the passage is reachable through it.

This is the interoperability scholarship has lacked. Every scholar already keeps the map privately. Bekker for the _Metaphysics_, Corcilius for the _De anima_, Rashed for _On Generation and Corruption_. Exact, hard-won, and gone the moment the article closes. TextRefs makes it shared and machine-readable. Oxford and the Loeb, Leipzig and Perseus, Wikidata and VIAF keep their own identifiers, their own homes, their own richer work, joined through the one reference they share. No central host. No redundancy. Authority stays with the institutions that earned it, and the archive that digitised an edition is now one mapping away from every citation of the passage it holds.

The division is deliberate. TextRefs holds the reference layer only and nothing else. It hosts no text, replaces no edition, claims no apparatus. The same model covers every field that cites by structure: a Stephanus passage in Plato, a Bekker line in Aristotle, an article in the _Summa_, a chapter and verse in the Vulgate, a fragment in the _Digesta_. Each citation system carries its own locator rules. The registry stays small, persistent and legally reusable. It is released under CC0 so the data flows into any tool that needs it, curated by scholars through reviewed contributions, and governed as non-profit infrastructure, not owned by a press.

Four record types carry the model: `Work`, `CitationSystem`, `CanonicalReference`, and `MappingAssertion` for curated relations. TextRefs publishes all four as JSON-LD against SKOS, Dublin Core, PROV-O, and schema.org. Existing systems are layered, never displaced. A DOI still names the edition. A CTS URN still names the passage in Perseus. TextRefs holds the canonical reference they share, and makes it resolve.

[Find a reference](/find/). [Browse the registry](/reg/). [Read the standard](/standard/). [Bring your corpus in](/get-started/authoring/).

## Keep reading

- [Find a reference](/get-started/finding-references/) — how the finder turns a familiar citation into a canonical reference, and what it refuses to guess.
- [How it works](/get-started/how-it-works/) — the practical model: identity, mappings, resolver targets, and examples.
- [Use cases](/get-started/use-cases/) — concrete scenarios across research, libraries, digital editions, and AI grounding.
- [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/) — how to model external identifiers, reading URLs, and canonical-citation candidates.
- [Authoring registry data](/get-started/authoring/) — the contributor YAML format and the `npm run build:data` pipeline.
- [Related standards and systems](/get-started/related-systems/) — how TextRefs relates to identifier schemes, text APIs, bibliographic models, edition and annotation standards, digital surrogates, and reading platforms.
- [URL layout](/get-started/url-layout/) — how `/id/`, `/reg/`, `/cite/`, and `/api/` fit together.
- [The standard](/standard/) — the normative specification text (`v0.1.0-draft`).
- [The association](/association/) — the non-profit behind TextRefs, its statutes, and the open board search.

## Live examples

- [`/id/work/dhammapada/`](/id/work/dhammapada/) — Dhammapada with three real resolver entries across two providers (SuttaCentral in Pali and English, ancient-buddhist-texts.net).
- [`/id/work/plato.republic/`](/id/work/plato.republic/) — Plato's _Republic_ with Stephanus pagination.
- [`/cite/plato.republic/514a`](/cite/plato.republic/514a) — a short alias that redirects to the canonical reference URL. The qualified form, [`/cite/plato.republic/stephanus/514a`](/cite/plato.republic/stephanus/514a), resolves to the same page.
- [`/reg/`](/reg/) — the registry browser.
