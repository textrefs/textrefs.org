---
title: Identifier syntax
description: How TextRefs canonical-reference identifiers are deterministically generated.
maturity: working-draft
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

The UUID seed string is the following four-field sequence, in this exact order:

```text
work_key
citation_system_key
locator
normalization_version
```

Serialization rules:

- Encode the seed as UTF-8.
- Join the four values with a single line feed character, `U+000A`.
- Use each field exactly as normalized, with no leading or trailing whitespace.
- End the seed after `normalization_version`, with no final trailing line feed.
- Use the registry key fields themselves; labels, URIs, aliases, and external identifiers belong in metadata or mappings.
- Each field MUST already be normalized by its owning profile before UUID generation.

## Flat key syntax

`work_key` and `citation_system_key` are flat, opaque registry keys. Treat the whole string as the identifier when validating records, generating UUIDs, and constructing TextRefs URIs.

Keys MUST match this regular expression:

```text
^[a-z0-9][a-z0-9._-]*$
```

Keys therefore MUST start with a lowercase letter or digit and contain only ASCII lowercase letters, ASCII digits, `.`, `_`, and `-`.

The canonical Work URI is `https://textrefs.org/id/work/{work_key}`. The canonical CitationSystem URI is `https://textrefs.org/id/system/{citation_system_key}`. In both cases the key occupies exactly one URI path segment.

## Unicode normalization

Deterministic identifiers depend on byte-identical seed strings. Before validation and UUID generation:

- `work_key` and `citation_system_key` MUST follow the flat key syntax above.
- `locator` MUST be normalized to Unicode NFC.
- `locator` MUST NOT contain leading or trailing whitespace, control characters, or internal whitespace unless the citation-system profile explicitly allows it.
- Implementations MUST NOT apply NFKC, case folding, digit folding, punctuation folding, transliteration, or script conversion unless the citation-system profile explicitly defines that rule.
- Profiles for mixed-script locators MUST state the allowed scripts and enforce them through `locator_regex`.
- Any change to locator normalization that can change a normalized locator MUST change the citation system's `normalization_version`.

The seed bytes used for UUID v5 generation are ASCII-restricted (keys) and NFC-normalized UTF-8 (locators). This is independent of whether downstream TextRefs identifiers are expressed as URIs ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986)) or IRIs ([RFC 3987](https://www.rfc-editor.org/rfc/rfc3987)).

## Example

Input tuple:

```text
work_key = plato.republic
citation_system_key = stephanus
locator = 514a
normalization_version = 1.0.0
```

Seed string:

```text
plato.republic
stephanus
514a
1.0.0
```

Result:

```text
884e8b51-b9cc-5f4b-9e49-60c636c0cd1a
```

Canonical URI:

```text
https://textrefs.org/id/ref/884e8b51-b9cc-5f4b-9e49-60c636c0cd1a
```

## MappingAssertion seed

`MappingAssertion` identifiers are also deterministic UUID v5, derived from the assertion's content so that recompiling the same source produces a byte-identical record.

The mapping namespace UUID is:

```text
f16bb214-4241-549d-ad41-7b011f02befb
```

This namespace is derived from `uuidv5(uuid.NAMESPACE_DNS, "textrefs.org/mapping")` and is frozen for `v0.1.0-draft`.

The seed string is the following three-field sequence, joined with single line feed characters and no trailing newline:

```text
subject
relation
target.identifier
```

`subject` MUST be the canonical Work IRI (`https://textrefs.org/id/work/{work_key}`). `relation` MUST be the literal string `exactMatch` or `closeMatch`. `target.identifier` MUST be used as supplied by the source record, after any IRI normalization the source profile already applies. `target.target_kind` is a non-normative hint and does NOT enter the seed.

The canonical URI is `https://textrefs.org/id/mapping/{uuid}`.

## Immutability

Once a deterministic identifier is published, it is permanent. If a record is found to be wrong, it MUST be marked `deprecated`, `withdrawn`, or `blocked`; the original URI MUST remain dereferenceable as a tombstone.

See [Specification §11](/standard/specification/#11-identifier-policy) for the normative identifier policy.
