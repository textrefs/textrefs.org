---
title: Citation-system profiles
description: How citation systems constrain locators, with the seed Bekker and Stephanus profiles.
maturity: working-draft
sidebar:
  order: 4
---

Citation-system profiles constrain locator syntax through regular expressions and, where needed, additional documented validation rules. A pull request that adds or changes a citation system MUST include the full profile record.

## Required profile fields

- `id`: persistent system URI.
- `key`: flat stable key used for deterministic UUID seeds.
- `type`: `CitationSystem`.
- `preferred_label`: human-readable label.
- `description`: prose description of the citation tradition and its canonical locator form.
- `locator_regex`: ECMAScript regular expression for machine-checkable locator pre-validation.

See [Specification §7](/standard/specification/#7-citationsystem) for the full normative field list.

## Canonical locator form

Every profile defines exactly one canonical spelling for each reference point. Profiles MUST follow the flat key and locator Unicode rules in [Identifier syntax](/standard/identifier-syntax/). Along two ASCII axes the profile MUST take an explicit position:

1. **Digit sequences.** The profile MUST state whether leading zeros are permitted in numeric components. Unless the citation tradition itself uses them, leading zeros MUST be forbidden.
2. **Letter case.** The profile MUST declare the canonical case of letter components. Locators are matched case-sensitively against that declared casing; case variants are non-canonical spellings.

A profile MAY add further locator rules for punctuation, whitespace, allowed scripts, or non-regex-checkable constraints (such as a pinned book vocabulary). Regex-checkable constraints — including the two axes above — SHOULD be encoded in `locator_regex`; other constraints MUST be documented in `description`. The machine-actionable contract is the flat key and `locator_regex`.

Because the canonical locator seeds the deterministic reference UUID, alternative spellings of the same reference point (`John.3.16` vs `john.3.16`, `514a1` vs `514a01`) would mint distinct permanent identities. Validators MUST reject non-canonical spellings; they MUST NOT fold them into the canonical form. The enumerated reference data in the registry is the authority on which locators are canonical and attested; `locator_regex` is the machine-checkable floor beneath it.

## Seed profiles

Bekker profile (Aristotelian corpus). Implements **Bekker numbering**, the page-and-column-and-line citation introduced by August Immanuel Bekker's 1831 edition and used as the standard reference scheme for Aristotle:

```json
{
  "key": "bekker",
  "description": "Bekker numbering: page, column (a or b), and line, after August Immanuel Bekker's 1831 Berlin edition. Pages span the whole corpus from 1 (Categories 1a1) to roughly 1462. Canonical form: page and line are positive integers without leading zeros; the column letter is lowercase.",
  "locator_regex": "^[1-9][0-9]{0,3}[ab][1-9][0-9]?$"
}
```

Stephanus profile (Platonic corpus). Implements **Stephanus pagination**, the page-and-section citation from Henri Estienne's 1578 edition and used as the standard reference scheme for Plato:

```json
{
  "key": "stephanus",
  "description": "Stephanus pagination: page, section (a–e), and optional sub-line, after Henri Estienne's 1578 edition of Plato's works. Canonical form: page and sub-line are positive integers without leading zeros; the section letter is lowercase.",
  "locator_regex": "^[1-9][0-9]{0,3}[a-e](?:[1-9][0-9]?)?$"
}
```

## Validation rule

Every `CanonicalReference` MUST point to a known `CitationSystem`. Its `locator` MUST be the profile's canonical spelling and MUST match that system's `locator_regex` (see [Specification §8](/standard/specification/#8-canonicalreference)). Regex success is necessary but not sufficient: a usable TextRefs reference must resolve to a registered `CanonicalReference` and satisfy any additional profile validation rules.
