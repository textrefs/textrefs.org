---
title: Citation-system profiles
description: How citation systems constrain locators, with the seed Bekker and Stephanus profiles.
maturity: working-draft
sidebar:
  order: 4
---

Citation-system profiles constrain locator syntax through regular expressions and, where needed, additional documented validation rules. A pull request that adds or changes a citation system MUST include the profile record, examples of valid locators, and examples of invalid locators.

## Required profile fields

- `id`: persistent system URI.
- `key`: flat stable key used for deterministic UUID seeds.
- `type`: `CitationSystem`.
- `preferred_label`: human-readable label.
- `normalization_version`: SemVer version.
- `locator_regex`: ECMAScript regular expression for machine-checkable locator pre-validation.
- `examples.valid`: locator examples that MUST match.
- `examples.invalid`: locator examples that MUST NOT match.

See [Specification §7](/standard/specification/#7-citationsystem) for the full normative field list.

Profiles MUST follow the flat key and locator Unicode rules in [Identifier syntax](/standard/identifier-syntax/). A profile MAY add stricter locator rules for case, digits, punctuation, whitespace, allowed scripts, or non-regex-checkable constraints. Regex-checkable constraints MUST be reflected in examples and `locator_regex`; other constraints MUST be documented in the profile. The machine-actionable contract is the flat key, `normalization_version`, `locator_regex`, and examples.

## Seed profiles

Bekker profile (Aristotelian corpus). Implements **Bekker numbering**, the page-and-column-and-line citation introduced by August Immanuel Bekker's 1831 edition and used as the standard reference scheme for Aristotle:

```json
{
  "key": "bekker",
  "normalization_version": "1.0.0",
  "locator_regex": "^[0-9]{3,4}[ab][0-9]{1,2}$",
  "examples": {
    "valid": ["983b10", "1003a21"],
    "invalid": ["983", "983c10", "983b"]
  }
}
```

Stephanus profile (Platonic corpus). Implements **Stephanus pagination**, the page-and-section citation from Henri Estienne's 1578 edition and used as the standard reference scheme for Plato:

```json
{
  "key": "stephanus",
  "normalization_version": "1.0.0",
  "locator_regex": "^[0-9]{1,4}[a-e](?:[0-9]{1,2})?$",
  "examples": {
    "valid": ["514a", "514a1"],
    "invalid": ["514f", "514", "514a100"]
  }
}
```

## Validation rule

Every `CanonicalReference` MUST point to a known `CitationSystem`. Its `locator` MUST match that system's `locator_regex`, and its `normalization_version` MUST be the value fixed when the reference was minted (see [Specification §8](/standard/specification/#8-canonicalreference)); it need not equal the system's current `normalization_version`. Regex success is necessary but not sufficient: a usable TextRefs reference must resolve to a registered `CanonicalReference` and satisfy any additional profile validation rules.
