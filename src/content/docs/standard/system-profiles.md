---
title: Citation-system profiles
description: How citation systems constrain locators, with the seed Bekker and Stephanus profiles.
sidebar:
  order: 4
---

Citation-system profiles constrain locators through strict regular expressions and reference-type lists. A pull request that adds or changes a citation system MUST include the profile record, examples of valid locators, and examples of invalid locators.

## Required profile fields

- `id`: persistent system URI.
- `key`: stable key used for deterministic UUID seeds.
- `type`: `CitationSystem`.
- `preferred_label`: human-readable label.
- `scope`: corpus or tradition scope.
- `normalization_version`: SemVer version.
- `locator_regex`: anchored ECMAScript regular expression.
- `valid_reference_types`: allowed types.
- `examples.valid`: locator examples that MUST match.
- `examples.invalid`: locator examples that MUST NOT match.

See [Specification §7](/standard/specification/#7-citationsystem) for the full normative field list.

## Seed profiles

Bekker profile (Aristotelian corpus):

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

Stephanus profile (Platonic corpus):

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

Every `CanonicalReference` MUST point to a known `CitationSystem`. Its `locator` MUST match that system's `locator_regex`, its `reference_type` MUST be listed in `valid_reference_types`, and its `normalization_version` MUST match the referenced system unless a migration note explicitly says otherwise.
