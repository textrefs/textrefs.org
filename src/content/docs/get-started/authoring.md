---
title: Authoring registry data
description: How contributors add a work, references, and resolver URLs in compact YAML.
sidebar:
  order: 6
---

Hand-authored YAML lives in the separate [`textrefs/registry`](https://github.com/textrefs/registry) repository, mounted in this repo as a git submodule at `data/` (run `git submodule update --init --recursive` after cloning; see [`CONTRIBUTING.md`](https://github.com/textrefs/textrefs.org/blob/main/CONTRIBUTING.md) for the full workflow). Contributors edit `data/works/{work_key}.yaml` and `data/systems/{system_key}.yaml` there. The compiled registry — Works, CitationSystems, CanonicalReferences, MappingAssertions — is produced by `npm run build:data` from the pinned submodule pointer and written as JSONL resources plus `datapackage.json` under `dist/dump/`. Published dumps are attached to TextRefs Standard/site releases and long-term archived in the [TextRefs Zenodo community](https://zenodo.org/communities/textrefs/) with citable DOIs.

This page documents the YAML format.

## The two source directories

```
data/
├── works/{work_key}.yaml              # one file per Work
└── systems/{system_key}.yaml          # one file per CitationSystem
```

A `Work` source file declares the work itself, references the citation system it uses, lists references, optionally lists resolver templates, and optionally lists work-level mappings. A `CitationSystem` source file declares the locator regex and examples.

## A worked example

The Dhammapada has 423 verses across 26 chapters and is hosted on four different reading platforms with four different URL patterns. The whole work, with chapter 1 fully wired up, is roughly 60 lines of YAML:

```yaml
# data/works/dhammapada.yaml
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

### Optional: `creators`

Works MAY carry an optional `creators` array under `work:` for citation rendering. Two entry shapes:

```yaml
work:
  key: plato.republic
  preferred_label: Republic
  creators:
    - kind: person
      family: Plato # mononyms use `family` alone (CSL convention)

work:
  key: aristotle.de-mundo
  preferred_label: De mundo
  creators:
    - kind: literal
      name: '[Pseudo-]Aristotle' # institutions, collective, or pseudonymous attribution
```

Omit `creators` entirely for anonymous or non-authored works (e.g. the Dhammapada, the Bible). For attributed-but-disputed works, record the traditional attribution for citation rendering and document uncertainty through mappings or review notes. The field is purely optional; nothing in the registry depends on it.

## Naming and identity

Get `work.key`, `work.preferred_label`, and `work.creators` right on the first commit — renaming a key after publication is a tombstone event that mints new reference IRIs.

### `key`

Shape: `{author-slug}.{work-slug}` for attributed works; bare `{work-slug}` for anonymous, collective, or canonical corpora.

- `author-slug` — lowercased family name (or single mononym for antiquity); ASCII-folded; `-` for spaces; no initials. E.g. `homer`, `plato`, `aristotle`, `wittgenstein`, `confucius`, `laozi`, `murasaki-shikibu`.
- `work-slug` — the short form readers actually use: `iliad`, `republic`, `tractatus`, `analects`, `daodejing`. Avoid cryptic initialisms (`eth-nic`) and avoid full Latin titles unless that _is_ the short form.
- Bare slug for unattributed corpora: `tanakh`, `dhammapada`, `new-testament`, `quran`.
- Multiple works per author with the same short title: disambiguate inside the work-slug, not by promoting the author. E.g. `aristotle.nicomachean-ethics`, `aristotle.eudemian-ethics`.

### `preferred_label`

The display title. No parenthetical disambiguator — author goes in `creators`, edition (SBLGNT, OCT, …) goes on the resolver target, alt-names belong in a future `alt_labels` field.

- Attributed: just the title — `Iliad`, `Republic`, `Tractatus Logico-Philosophicus`.
- Anonymous / collective: the conventional English name — `Tanakh`, `Dhammapada`, `New Testament`.

### `creators`

Follow CSL-JSON conventions so citeproc-js / Zotero render correctly.

- Standard names: `kind: person` with `family` and `given`. E.g. `{ kind: person, family: Wittgenstein, given: Ludwig }`.
- Mononyms (Homer, Plato, Confucius, Laozi, Murasaki Shikibu, …): `kind: person` with `family` only and no `given`. CSL convention for single-name authors; matches Chicago's "Homer, _Iliad_ 1.1." output.
- Anonymous / collective: **omit `creators` entirely**. Don't write a literal "Anonymous" — absence is the correct CSL signal.
- Reserve `kind: literal` for names that genuinely should not decompose: corporate/institutional authors ("World Health Organization") or pseudonymous attribution strings ("[Pseudo-]Aristotle").
- Attributed-but-disputed (e.g. Laozi for _Daodejing_): record the traditional attribution as `kind: person, family: Laozi`; encode uncertainty via a `closeMatch` mapping, not in the name string.

## How URL templates work

The compiler treats every resolver `url` as an [RFC 6570](https://www.rfc-editor.org/rfc/rfc6570) Level 1 template. Variables are drawn from two sources:

1. **Named capture groups** in the citation system's `locator_regex`. For example, a regex like `^(?<chapter>\d+)\.(?<verse>\d+)$` exposes `{chapter}` and `{verse}` to every template.
2. **Zero-padded variants** of any numeric capture, generated automatically: `{chapter02}`, `{chapter03}`, `{chapter04}`, `{verse02}`, `{verse03}`. Use the padding width that matches the target site's URL.
3. **Roman-numeral variants** of any numeric capture in 1..3999, generated automatically: `{chapterRoman}` produces `I`, `VIII`, `XXVI`. Useful for sites that anchor sections by Roman chapter (e.g. Wikisource's `#I:8` Dhammapada verses).
4. **Cumulative `{verseGlobal}`** — for systems whose locators have numeric `chapter` and `verse` groups _and_ declare `chapter_sizes:` (see below), the compiler exposes a global 1..N verse counter. Useful for single-page resolvers (e.g. palikanon.com's `#dhp_8`, `#dhp_102`) whose anchors use one running index across all chapters.

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

For one-off URLs that don't fit any pattern (the typical case for older citation systems like Stephanus or Bekker pagination), put the URL directly on the reference using `extra_resolvers`:

```yaml
references:
  - locator: '514a'
    extra_resolvers:
      - provider: Perseus Digital Library
        edition: 'Plato, Republic'
        language: grc-Grek
        access: open
        url: 'https://www.perseus.tufts.edu/...'
        last_checked: '2026-01-01'
```

Top-level `resolvers:` and per-reference `extra_resolvers:` both contribute to the final `resolver_targets` array.

## Enumerating canonical reference sets

Hand-listing every verse of Genesis or every line of the Iliad is not the right shape for a YAML file. For works whose reference set is regular enough to describe in a few numbers, use `references_range:` instead of (or alongside) `references:`. Each entry is one named expander; the compiler concatenates every expansion with the explicit `references:` list, de-dupes, and validates each generated locator against the citation system's regex.

```yaml
# 81 references: '1', '2', …, '81'
references_range:
  - kind: integer
    from: 1
    to: 81

# Iliad — 15,693 references from per-book line counts (Allen OCT):
#   '1.1', '1.2', …, '24.804'
references_range:
  - kind: book_line
    counts:
      [
        611, 877, 461, 544, 909, 529, 482, 565, 713, 579, 848, 471, 837, 522,
        746, 867, 761, 617, 424, 503, 611, 515, 897, 804,
      ]

# Analects — 517 references from per-book chapter counts:
#   '1.1', …, '20.5'
references_range:
  - kind: book_chapter
    counts: [16, 24, 26, 26, 28, 30, 38, 21, 31, 27, 26, 24, 30, 47, 42, 14, 26, 11, 25, 5]

# Genesis — 1,533 references from per-chapter verse counts:
#   'Genesis.1.1', …, 'Genesis.50.26'
references_range:
  - kind: book_chapter_verse
    book: Genesis
    counts: [31, 25, 24, 26, 32, 22 /* …, 26 */]

# Dhammapada — 423 references from per-chapter verse counts (no book prefix):
#   '1.1', …, '26.41'
references_range:
  - kind: chapter_verse
    counts: [20, 12, 11, 16, 16, 14, 10, 16, 13, 17, 11, 10, 12, 18, 12, 12, 14, 21, 17, 17, 16, 14, 14, 26, 23, 41]

# Bekker — page × {a,b} × lines 1..N, with explicit per-book page ranges:
#   '1094a1', '1094a2', …, '1181b30'
references_range:
  - kind: bekker
    page_ranges:
      - [1094, 1103]
      # …one entry per Aristotelian book
    lines_per_column: 30

# Stephanus — page × sections {a..e}: '327a', '327b', …, '621e'
references_range:
  - kind: stephanus
    page_range: [327, 621]
```

Multiple `references_range` entries on one work are concatenated. Combine with explicit `references:` entries for one-off locators that don't fit any range.

## Citation system files

A citation system declares its locator format once and is reused by every work that cites it.

```yaml
# data/systems/dhammapada-chapter-verse.yaml
key: dhammapada-chapter-verse
preferred_label: Dhammapada chapter-and-verse
normalization_version: 1.0.0
locator_regex: '^(?<chapter>[1-9]|1[0-9]|2[0-6])\.(?<verse>[1-9][0-9]*)$'
# Optional: per-chapter verse counts. When present, the compiler exposes
# `{verseGlobal}` (cumulative 1..N) to URL templates of works using this system.
chapter_sizes:
  [
    20,
    12,
    11,
    16,
    16,
    14,
    10,
    16,
    13,
    17,
    11,
    10,
    12,
    18,
    12,
    12,
    14,
    21,
    17,
    17,
    16,
    14,
    14,
    26,
    23,
    41,
  ]
examples:
  valid: ['1.1', '1.20', '8.3', '26.41']
  invalid: ['0.1', '27.1', '1', '1.0']
status: candidate
created: 2026-05-31
modified: 2026-06-01
```

Name your capture groups deliberately — every URL template in every work that uses this system can refer to them. Add `chapter_sizes:` only when (a) the locator has numeric `chapter` and `verse` groups and (b) at least one resolver actually needs the global counter.

## Building, validating, and previewing

```sh
npm run compile:data    # expand YAML → JSONL resources plus datapackage.json under dist/dump/
npm run validate:data   # check every record against the canonical Zod schemas
npm run build:data      # both, in order
npm run dev             # browse at http://localhost:4321/reg/ ; records live under /id/
```

The compiler is deterministic: re-running `compile:data` against unchanged source produces zero diff. `MappingAssertion` and `CanonicalReference` UUIDs are derived from content per [Identifier syntax](/standard/identifier-syntax/), so the same YAML always produces the same identifiers.

## What lives where

- `/id/work/{key}/` — a Work's canonical landing page (mappings, references, citation systems). A sibling `/id/work/{key}.json` serves the same record as JSON-LD.
- `/id/system/{key}/` — a CitationSystem's canonical landing page (regex, examples, references). Plus `/id/system/{key}.json`.
- `/id/ref/{uuid}/` — a CanonicalReference page with every resolver URL grouped by language. Plus `/id/ref/{uuid}.json`.
- `/id/mapping/{uuid}/` — a MappingAssertion page. Plus `/id/mapping/{uuid}.json`.
- `/reg/` — the human registry browser (filter works and citation systems, then browse paginated reference lists from work/system pages).
- `/cite/{work_key}/{locator}/` — short alias that redirects to the canonical reference page.

A reader who types `https://textrefs.org/cite/dhammapada/1.1` lands on the canonical reference page; the alias index is generated alongside the records by the compiler. See [URL layout](/get-started/url-layout/) for the full four-prefix model.
