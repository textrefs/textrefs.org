---
title: Identifier syntax
description: How TextRefs canonical-reference identifiers are deterministically generated.
maturity: working-draft
sidebar:
  order: 3
---

TextRefs canonical-reference identifiers use deterministic UUID v5 generation. The algorithm is intentionally strict so that independent implementations produce identical identifiers from the same input.

## Purpose of determinism

Deterministic identity means anyone holding the semantic identity tuple — `work_key`, `citation_system_key`, and the canonical `locator` — can compute the registry UUID offline, without a lookup. The registry remains authoritative for which locators are canonical and attested: a computed UUID identifies a reference, but only a registered `CanonicalReference` makes it a valid TextRefs reference (see [Specification §14](/standard/specification/#14-validation-requirements)). See [ADR-0002](https://github.com/textrefs/textrefs.org/blob/main/decisions/ADR-0002-uuid-seed-semantic-identity.md) for the rationale.

## Namespace

The TextRefs reference namespace UUID is:

```text
b1a3670e-2ac7-544c-a1b9-396e0dc193f7
```

This namespace is derived from `uuidv5(uuid.NAMESPACE_DNS, "textrefs.org/reference")` and is frozen for `v0.1.0-draft`. (`NAMESPACE_DNS` here is only a frozen UUID constant used as salt; UUIDv5 treats its name input as opaque bytes, so the slash in the name string is intentional and valid.)

## Seed sequence

The UUID seed string is the following three-field sequence, in this exact order:

```text
work_key
citation_system_key
locator
```

Serialization rules:

- Encode the seed as UTF-8.
- Join the three values with a single line feed character, `U+000A`.
- Use each field exactly as normalized, with no leading or trailing whitespace.
- End the seed after `locator`, with no final trailing line feed.
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
- The `locator` stored on a `CanonicalReference` is the canonical spelling defined by the citation-system profile. Non-canonical spellings MUST be rejected at validation time, never silently folded into the canonical form.
- A profile change that would alter the canonical spelling of any accepted locator changes reference identity. It MUST be handled as a registry migration (pre-1.0), a breaking registry release, or — when the distinction is genuinely semantic — a new `citation_system_key`. It MUST NOT be applied silently.

The seed bytes used for UUID v5 generation are ASCII-restricted (keys) and NFC-normalized UTF-8 (locators). This is independent of whether downstream TextRefs identifiers are expressed as URIs ([RFC 3986](https://www.rfc-editor.org/rfc/rfc3986)) or IRIs ([RFC 3987](https://www.rfc-editor.org/rfc/rfc3987)).

## Example

Input tuple:

```text
work_key = plato.republic
citation_system_key = stephanus
locator = 514a
```

Seed string:

```text
plato.republic
stephanus
514a
```

Result:

```text
dc799d4b-9b17-5d76-85aa-dfd001c5321d
```

Canonical URI:

```text
https://textrefs.org/id/ref/dc799d4b-9b17-5d76-85aa-dfd001c5321d
```

## MappingAssertion seed

`MappingAssertion` identifiers are also deterministic UUID v5, derived from the assertion's content so that recompiling the same source produces a byte-identical record.

The mapping namespace UUID is:

```text
f16bb214-4241-549d-ad41-7b011f02befb
```

This namespace is derived from `uuidv5(uuid.NAMESPACE_DNS, "textrefs.org/mapping")` and is frozen for `v0.1.0-draft`. (As above, `NAMESPACE_DNS` is a frozen salt constant; the name input is opaque bytes, not a DNS label.)

The seed string is the following three-field sequence, joined with single line feed characters and no trailing newline:

```text
subject
relation
target.identifier
```

`subject` MUST be the canonical Work IRI (`https://textrefs.org/id/work/{work_key}`). `relation` MUST be the literal string `alternateOf` or `isReferencedBy`. `target.identifier` MUST be used as supplied by the source record, after any IRI normalization the source profile already applies. `target.conforms_to` is informative and does NOT enter the seed.

The canonical URI is `https://textrefs.org/id/mapping/{uuid}`.

## Immutability

Once a deterministic identifier is published at status `active`, it is permanent. If a promoted record is found to be wrong, it MUST be marked `deprecated`, `withdrawn`, or `blocked`; the original URI MUST remain dereferenceable as a tombstone.

Records at status `draft` are exempt: they MAY be corrected or retracted without a tombstone, and a retracted draft IRI simply ceases to resolve (see [Specification §11](/standard/specification/#11-identifier-policy) and [Versioning](/standard/versioning/#draft-records-and-retraction)). Because identity is deterministic, a retracted tuple that is later re-proposed regains the same UUID by construction.

See [Specification §11](/standard/specification/#11-identifier-policy) for the normative identifier policy.
