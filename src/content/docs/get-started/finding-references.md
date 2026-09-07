---
title: Find a reference
description: How the finder at /find/ turns a familiar citation into a canonical TextRefs reference, and what it refuses to guess.
sidebar:
  order: 2
---

You know the citation. TextRefs finds the reference.

The finder at [`/find/`](/find/) takes the string a scholar already writes — "Plato Republic 514a" — and returns the canonical reference for that passage: a canonical link, the editions that carry the passage, and a citation to copy.

It runs entirely in your browser against the public registry files. There is no search server, and the finder reads nothing that a client cannot read for itself. See [URL layout](/get-started/url-layout/#find-a-reference-by-its-locator) for the same lookup done from code.

## What you can type

| You type                    | The finder reads it as |
| --------------------------- | ---------------------- |
| `Republic`                  | a work, by its title   |
| `Plato`                     | a work, by its creator |
| `plato.republic`            | a work, by its key     |
| `Plato Republic 514a`       | a work and a passage   |
| `Nicomachean Ethics 1094a1` | a work and a passage   |

The last whitespace-separated token becomes the passage when it contains a digit and some registered citation system accepts its shape. That rule keeps `1 Corinthians` intact: `Corinthians` has no digit, so nothing is split off.

Punctuation and accents are optional. `tractatus logico philosophicus` finds the same work as the hyphenated title.

## How matches are ranked

Ranking is a fixed ladder. It is deterministic, it carries no model, and the same query always returns the same order.

1. Exact work key.
2. Exact preferred title.
3. Exact alternative title, which is where abbreviations and translated titles live. See [`alternative_labels`](/get-started/authoring/#alternative_labels).
4. Creator plus exact title.
5. Title prefix.
6. Token match, across titles, key, and creator names.
7. Fuzzy match, bounded to a small edit distance.

Only the best tier that matched anything decides the outcome. An exact title is never weighed against a fuzzy near-miss, so a weak match cannot turn a good one into an ambiguity.

## What the finder will not guess

This is the part that matters for citation. TextRefs is the authority for identity, so the finder asks rather than picks whenever a query has more than one honest reading.

**A passage with no work stays a question.** Type `514a` and you get candidates, not a result — even when only one registered work is numbered that way. The query named no text, and today's single candidate becomes several as the registry grows.

**A shared name stays two hits.** Two works may carry the same alternative label; `Ethics` fits Aristotle and Spinoza. The registry allows this deliberately, and a consumer must treat the match as ambiguous rather than resolve it.

**One passage number under two systems stays a choice.** A work cited under more than one citation system can repeat a locator string and mean a different passage each time. The finder lists the systems and lets you pick.

**Fuzzy matching never reaches identity.** It helps find a work and stops there. A reference is identified by an exact lookup of its work, citation system, and locator, so a near-miss cannot invent one. `Republik` finds the _Republic_; `514b` never resolves to `514a`.

When a passage is rejected, the finder names the numbering the work actually uses and quotes that citation system's own description. It does not work out which rule your locator broke. How much that explains depends on the description: ask for `Republic 327` and the Stephanus entry spells out the locator form, and ask for `Iliad 25.1` and the Homeric entry happens to mention the 24 books that make `25` wrong.

## What you get back

A resolved reference shows, in this order:

- **the work and the passage**, in words — never a UUID as the label;
- **where to read it**: the registered editions, with their language and whether access is open;
- **how to cite it**: a formatted citation, and the canonical link;
- **the registry record** itself, folded away until you ask for it — work key, citation system, status, and the HTML and JSON-LD records.

The canonical link names the passage, not one edition of it. It keeps working when the editions behind it change. That is the whole point of the reference layer, and [how it works](/get-started/how-it-works/) explains the model underneath.

A record still marked `draft` is flagged where you would otherwise copy the citation. A draft identifier carries no persistence promise: the record may be corrected, which mints a different identifier, or retracted without a tombstone. Its link can then stop resolving. Only an `active` record is permanent.

## When a passage is missing

The registry is filled in work by work and passage by passage. A well-formed passage that is not registered yet says so plainly, and that is a gap in the data rather than a failed lookup. [Browse the registry](/reg/) to see what is in it, or [add a work](/get-started/authoring/).
