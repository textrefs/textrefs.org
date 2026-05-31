---
title: Authoring registry data
description: How contributors add a work, references, and resolver URLs in compact YAML.
sidebar:
  order: 6
---

The published registry under `data/` is **compiler output**: flat JSON files, one per record, validated against the canonical Zod schemas. Contributors do not edit those files by hand. Instead, every work is described by one compact YAML file under `data/source/`, and a reference compiler expands it into the flat records when you run `npm run build:data`.

This page documents the YAML format.

## The two source directories

```
data/source/
├── {work_key}.yaml              # one file per Work
└── systems/{system_key}.yaml    # one file per CitationSystem
```

A `Work` source file declares the work itself, references the citation system it uses, lists references, optionally lists resolver templates, and optionally lists work-level mappings. A `CitationSystem` source file declares the locator regex and examples.

## A worked example

The Dhammapada has 423 verses across 26 chapters and is hosted on four different reading platforms with four different URL patterns. The whole work, with chapter 1 fully wired up, is roughly 60 lines of YAML:

```yaml
# data/source/dhammapada.yaml
work:
  key: dhammapada
  preferred_label: Dhammapada
  status: candidate
  created: 2026-05-31
  modified: 2026-05-31

citation_system: dhammapada-chapter-verse

mappings:
  - relation: exactMatch
    target_kind: wikidata
    identifier: 'https://www.wikidata.org/entity/Q220114'
    source: manual-curation
    status: candidate
    created: 2026-05-31
    modified: 2026-05-31

resolvers:
  - provider: Project Gutenberg
    edition: 'Müller (1881), Gutenberg ebook #2017'
    language: en
    access: open
    url: 'https://www.gutenberg.org/files/2017/2017-h/2017-h.htm#link2HCH{chapter04}'

  - provider: Wikisource
    language: en
    access: open
    url_by:
      chapter:
        1: 'https://en.wikisource.org/wiki/Dhammapada_(Muller)#Chapter_I:_The_Twin-Verses'
        2: 'https://en.wikisource.org/wiki/Dhammapada_(Muller)#Chapter_II:_On_Earnestness'
        # … one per chapter you have registered references for

  - provider: palikanon.com
    language: de
    access: open
    url: 'https://palikanon.com/khuddaka/dhp/dhp.html#dhp_{verse}'

references:
  - '1.1'
  - '1.2'
  - '1.3'
  # …
```

Each reference gets one entry per resolver. The compiler expands `{chapter04}` and `{verse}` from the named capture groups in the citation system's `locator_regex`, and looks up `url_by.chapter[N]` for providers whose URL structure isn't templatable.

## How URL templates work

The compiler treats every resolver `url` as an [RFC 6570](https://www.rfc-editor.org/rfc/rfc6570) Level 1 template. Variables are drawn from two sources:

1. **Named capture groups** in the citation system's `locator_regex`. For example, a regex like `^(?<chapter>\d+)\.(?<verse>\d+)$` exposes `{chapter}` and `{verse}` to every template.
2. **Zero-padded variants** of any numeric capture, generated automatically: `{chapter02}`, `{chapter03}`, `{chapter04}`, `{verse02}`, `{verse03}`. Use the padding width that matches the target site's URL.

If a template references a variable that doesn't exist for a given reference, the compiler skips that resolver entry for that reference and warns. Empty `resolver_targets` arrays are valid; references stay registered.

## When a URL pattern isn't templatable

Some providers use chapter or section names that don't fit a formula (e.g. `01-Pairs.htm`, `02-Heedfulness.htm`). For those, replace `url:` with a per-key map:

```yaml
- provider: ancient-buddhist-texts.net
  language: en
  access: open
  url_by:
    chapter:
      1: 'https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/01-Pairs.htm'
      2: 'https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/02-Heedfulness.htm'
```

The compiler looks up the value of the chosen variable (`chapter`) in the map and uses the matching URL. References for chapters not in the map are silently skipped for this provider — finish the map at your own pace.

## When even that isn't enough

For one-off URLs that don't fit any pattern (the typical case for older citation systems like Kant's A/B pagination), put the URL directly on the reference using `extra_resolvers`:

```yaml
references:
  - locator: 'A51/B75'
    extra_resolvers:
      - provider: Korpora.org
        edition: 'Akademie-Ausgabe Band III'
        language: de
        access: open
        url: 'https://korpora.zim.uni-duisburg-essen.de/kant/aa03/057.html'
        last_checked: '2026-01-01'
```

Top-level `resolvers:` and per-reference `extra_resolvers:` both contribute to the final `resolver_targets` array.

## Citation system files

A citation system declares its locator format once and is reused by every work that cites it.

```yaml
# data/source/systems/dhammapada-chapter-verse.yaml
key: dhammapada-chapter-verse
preferred_label: Dhammapada chapter-and-verse
normalization_version: 1.0.0
locator_regex: '^(?<chapter>[1-9]|1[0-9]|2[0-6])\.(?<verse>[1-9][0-9]*)$'
examples:
  valid: ['1.1', '1.20', '26.423']
  invalid: ['0.1', '27.1', '1', '1.0']
status: candidate
created: 2026-05-31
modified: 2026-05-31
```

Name your capture groups deliberately — every URL template in every work that uses this system can refer to them.

## Building, validating, and previewing

```sh
npm run compile:data    # expand YAML → flat JSON records under data/
npm run validate:data   # check every record against the canonical Zod schemas
npm run build:data      # both, in order
npm run dev             # browse the result at http://localhost:4321/reg/
```

The compiler is deterministic: re-running `compile:data` against unchanged source produces zero diff. `MappingAssertion` and `CanonicalReference` UUIDs are derived from content per [Identifier syntax](/standard/identifier-syntax/), so the same YAML always produces the same identifiers.

## What lives where

- `/reg/work/{key}/` — a Work's landing page (mappings, references, citation systems).
- `/reg/system/{key}/` — a CitationSystem's landing page (regex, examples, references).
- `/reg/id/{uuid}/` — a CanonicalReference page with every resolver URL grouped by language.
- `/a/{work_key}/{locator}/` — alias redirect to the canonical reference page.

A reader who types `https://textrefs.org/a/dhammapada/1.1` lands on the canonical reference page; the alias index is generated alongside the records by the compiler.
