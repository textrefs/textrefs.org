---
title: Use cases
description: Six scenarios where a persistent ID for a canonical reference changes the workflow.
sidebar:
  order: 3
---

These scenarios are illustrative, not exhaustive. Each pairs "what happens today" with "what TextRefs gives you" so the value is concrete.

## Researcher citing a passage across editions

**Today.** You write "Plato, _Rep._ 514a" in your manuscript. Your reader either knows the Stephanus convention and resolves the citation themselves, or they don't. If they want to follow up, they pick whichever edition is at hand. There is no shared link.

**With TextRefs.** You drop in `https://textrefs.org/id/ref/...` (or share the short alias `/cite/plato.republic/514a`). The reader resolves it to a landing page that lists every curated resolver target, for example Perseus, Scaife, Loeb where licensed, and a Wikisource transcript. The page also gives a JSON-LD record and downloadable CSL JSON for citation tools. You can switch editions with a click, not a search.

## Digital edition project linking to and from canonical references

**Today.** You publish a critical edition with project-local IDs. Other projects link to your URLs. Six months later you reorganise the site, and every inbound link breaks. You email three colleagues and apologise.

**With TextRefs.** You mint a TextRefs ID for each canonical reference that your edition surfaces, and link your project-local IDs to it. Inbound scholarly links can target the TextRefs URI. You control your internal URL scheme, and the citation graph does not break.

## Library or institutional repository indexing scholarly works

**Today.** Your full-text indexer extracts citations from a PDF — "Aristotle, _Eth. Nic._ 1094a1" — as a string. It can match other strings literally. It cannot cluster them, infer the work, or expand abbreviations to _Nicomachean Ethics_.

**With TextRefs.** The indexer parses the citation against the `bekker` `CitationSystem` and stores the resulting TextRefs ID. Now you have FRBR-style work clustering for free, cross-corpus passage search, and authority alignment with Wikidata via mappings.

## Theologian or legal scholar working with traditional reference systems

**Today.** Every tradition has its own implicit, untyped notation, for example Stephanus pagination, Bekker numbering, Homeric book-and-line references, or biblical book-chapter-verse. There is no machine-readable contract for what is a valid citation in each system.

**With TextRefs.** Each tradition is a `CitationSystem` with a documented `locator_regex` and a `description` that spells out the canonical locator form. A parser can validate "Vulg. Gen. 1:1" or reject "ST I-II.300.99" because no registered canonical reference exists for that locator. The reference identifier is independent of any single edition.

## AI/LLM grounding and retrieval

**Today.** Language models cite "Plato, _Republic_ 514a" verbatim from training data, including hallucinated passages. Retrieval-augmented systems have nothing to retrieve _against_ at the passage level — only documents.

**With TextRefs.** Each canonical reference is a structured anchor. Training pipelines can tag occurrences in source material. Retrievers can ground generations against `https://textrefs.org/id/ref/...` URIs. Verification tools can compare the model's claim to a known reference and flag drift.

## Citation-managing tools and scholarly markdown

**Today.** Citation managers store free-text such as "Rep. 514a". This text is searchable, but it is neither typed nor linkable. Hypothes.is annotations on canonical passages are tied to a specific edition's URL.

**With TextRefs.** Citation managers store a TextRefs URI as the primary key. The human-readable label is only a display string. Annotation tools can normalise edition-bound URLs to TextRefs IDs, so a marginal note on Plato 514a follows the passage rather than the edition.
