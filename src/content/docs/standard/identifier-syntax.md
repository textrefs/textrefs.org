---
title: Identifier syntax
description: How TextRefs canonical-reference identifiers are deterministically generated.
sidebar:
  order: 3
---

TextRefs canonical-reference identifiers use deterministic UUID v5 generation. The algorithm is intentionally strict so that independent implementations produce identical identifiers from the same input.

## Namespace

The TextRefs reference namespace UUID is:

```text
b1a3670e-2ac7-544c-a1b9-396e0dc193f7
```

This namespace is derived from `uuidv5(uuid.NAMESPACE_DNS, "textrefs.org/reference")` and is frozen for `v0.1.0-draft`.

## Seed sequence

The UUID seed string is the following five-field sequence, in this exact order:

```text
work_key
citation_system_key
locator
reference_type
normalization_version
```

Serialization rules:

- Encode the seed as UTF-8.
- Join the five values with a single line feed character, `U+000A`.
- Do not add leading or trailing whitespace.
- Do not add a final trailing line feed.
- Do not substitute labels, URIs, aliases, or external identifiers for the key fields.
- Each field MUST already be normalized by its owning profile before UUID generation.

## Unicode normalization

Deterministic identifiers depend on byte-identical seed strings. Before validation and UUID generation:

- `work_key` and `citation_system_key` MUST contain only ASCII lowercase letters, ASCII digits, `-`, `_`, and `:`.
- `locator` MUST be normalized to Unicode NFC.
- `locator` MUST NOT contain leading or trailing whitespace, control characters, or internal whitespace unless the citation-system profile explicitly allows it.
- Implementations MUST NOT apply NFKC, case folding, digit folding, punctuation folding, transliteration, or script conversion unless the citation-system profile explicitly defines that rule.
- Profiles for mixed-script locators MUST state the allowed scripts and enforce them through `locator_regex`.
- Any change to locator normalization that can change a normalized locator MUST change the citation system's `normalization_version`.

## Example

Input tuple:

```text
work_key = aristotle:metaphysics
citation_system_key = bekker
locator = 983b10
reference_type = point
normalization_version = 1.0.0
```

Seed string:

```text
aristotle:metaphysics
bekker
983b10
point
1.0.0
```

Result:

```text
a2e519e0-e45a-5ce1-8da0-4533210a632a
```

Canonical URI:

```text
https://textrefs.org/id/ref/a2e519e0-e45a-5ce1-8da0-4533210a632a
```

## Immutability

Once a deterministic identifier is published, it is permanent. If a record is found to be wrong, it MUST be marked `deprecated`, `withdrawn`, or `blocked`; the original URI MUST remain dereferenceable as a tombstone.

See [Specification §11](/standard/specification/#11-identifier-policy) for the normative identifier policy.
