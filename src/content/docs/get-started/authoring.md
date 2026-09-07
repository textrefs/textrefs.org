---
title: Authoring registry data
description: How contributors add a work, references, and resolver URLs in compact YAML.
sidebar:
  order: 7
---

Hand-authored YAML lives in the separate [`textrefs/registry`](https://github.com/textrefs/registry) repository. This repo mounts it as a git submodule at `data/`. After cloning, run `git submodule update --init --recursive`. See [`CONTRIBUTING.md`](https://github.com/textrefs/textrefs.org/blob/main/CONTRIBUTING.md) for the full workflow. Contributors edit `data/works/{work_key}.yaml` and `data/systems/{system_key}.yaml` there.

`npm run build:data` produces the compiled registry from the pinned submodule pointer. The compiled registry holds Works, CitationSystems, CanonicalReferences, and MappingAssertions. The command writes them as JSONL resources under `dist/dump/`, together with the alias table `aliases.json` and the descriptor `datapackage.json`. Published dumps are attached to TextRefs Standard releases and site releases. They are also archived long-term in the [TextRefs Zenodo community](https://zenodo.org/communities/textrefs/) with citable DOIs.

This page documents the YAML format.

## The two source directories

```
data/
├── works/{work_key}.yaml              # one file per Work
└── systems/{system_key}.yaml          # one file per CitationSystem
```

A `Work` source file declares:

- the work itself;
- its preferred citation system, and any fallback systems (see [Additional citation systems](#additional-citation-systems-and-reference_status));
- its references;
- its resolver templates, which are optional;
- its work-level mappings, which are also optional.

A `CitationSystem` source file declares the locator regex and a prose description of the locator format.

## A worked example

The Dhammapada has 423 verses across 26 chapters and is hosted on two different reading platforms with two different URL patterns. The whole work, with chapter 1 fully wired up, is roughly 60 lines of YAML:

```yaml
# data/works/dhammapada.yaml
work:
  key: dhammapada
  preferred_label: Dhammapada
  alternative_labels:
    - 'Dhp'
    - 'Dhammapāda'
  status: draft
  created: 2026-05-31
  modified: 2026-05-31

citation_system: dhammapada-chapter-verse # the work's PREFERRED citation system

mappings:
  - relation: alternateOf
    identifier: 'https://www.wikidata.org/entity/Q748878'
    conforms_to: 'https://www.wikidata.org/'
    source: manual-curation
    status: draft
    created: 2026-05-31
    modified: 2026-05-31

resolvers:
  - provider: SuttaCentral
    edition: 'Bhikkhu Sujato translation'
    language: en
    access: open
    url: 'https://suttacentral.net/dhp{verseGlobal}/en/sujato'

  - provider: ancient-buddhist-texts.net
    language: en
    access: open
    url_by:
      chapter:
        1: 'https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/01-Pairs.htm'
        2: 'https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/02-Heedfulness.htm'
        # … one per chapter you have registered references for

references:
  - '1.1'
  - '1.2'
  - '1.3'
  # …
```

Each reference gets one entry per resolver. The compiler derives `{verseGlobal}` from the citation system's `chapter_sizes`. See [How URL templates work](#how-url-templates-work). For providers whose URL structure is not templatable, the compiler looks up `url_by.chapter[N]` instead.

Every resolver must address the cited passage. A URL with no locator variable resolves every reference in the work to the same landing page. That is worse than having no resolver at all: the registry says "here is 1.1" and hands the reader a book.

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

Omit `creators` entirely for anonymous or non-authored works, for example the Dhammapada or the Bible. For attributed-but-disputed works, record the traditional attribution for citation rendering. Document the uncertainty through mappings or review notes instead. The field is optional. Nothing in the registry depends on it.

## Naming and identity

Get `work.key`, `work.preferred_label`, and `work.creators` right on the first commit. Renaming a key after publication is a tombstone event. It mints new reference IRIs.

### `key`

The key has two shapes. Attributed works use `{author-slug}.{work-slug}`. Anonymous, collective, or canonical corpora use a bare `{work-slug}`.

- `author-slug`: the lowercased family name, or a single mononym for antiquity. ASCII-fold it. Use `-` for spaces. Do not use initials. For example: `homer`, `plato`, `aristotle`, `wittgenstein`, `confucius`, `laozi`, `murasaki-shikibu`.
- `work-slug`: the short form readers use, for example `iliad`, `republic`, `tractatus`, `analects`, `daodejing`. Avoid cryptic initialisms such as `eth-nic`. Avoid full Latin titles unless the Latin title is the short form.
- Bare slug for unattributed corpora: `tanakh`, `dhammapada`, `new-testament`, `quran`.
- If an author has multiple works with the same short title, disambiguate inside the work-slug rather than by promoting the author. For example: `aristotle.nicomachean-ethics`, `aristotle.eudemian-ethics`.

### `preferred_label`

The display title. Do not add a parenthetical disambiguator:

- the author goes in `creators`;
- the edition, such as SBLGNT or OCT, goes on the resolver target;
- alt-names go in `alternative_labels`.

Use these forms:

- Attributed works: just the title, for example `Iliad`, `Republic`, `Tractatus Logico-Philosophicus`.
- Anonymous or collective works: the conventional English name, for example `Tanakh`, `Dhammapada`, `New Testament`.

### `alternative_labels`

The other names a scholar searches by. The registry browser matches this list, so a reader who types `NE` or `Nikomachische Ethik` still finds the work.

```yaml
work:
  key: aristotle.nicomachean-ethics
  preferred_label: Nicomachean Ethics
  alternative_labels:
    - 'NE'
    - 'EN'
    - 'Ethica Nicomachea'
    - 'Nikomachische Ethik'
```

Rules:

- Add established forms only: a recognised abbreviation, a Latin or Greek title, or a translated title in a language scholars cite in. Do not invent a short form.
- Keep each entry unique inside the work. Do not repeat the `preferred_label`. The compiler rejects both.
- Two different works may share an entry. `Ethics` fits Aristotle and Spinoza. This is allowed.
- Omit the key when there is nothing to add. Do not author an empty list.
- The field never changes an identifier. It is not part of any UUID seed, so you may add or correct a label at any time.

Do not put these in the list:

- the author, which goes in `creators`;
- the edition, such as SBLGNT or OCT, which goes on the resolver target;
- an external identifier, such as a Wikidata Q-ID, which goes in `mappings`.

### `creators`

Follow CSL-JSON conventions so citeproc-js and Zotero render correctly.

- Standard names: `kind: person` with `family` and `given`. For example: `{ kind: person, family: Wittgenstein, given: Ludwig }`.
- Mononyms, for example Homer, Plato, Confucius, Laozi, or Murasaki Shikibu: use `kind: person` with `family` only and no `given`. This is the CSL convention for single-name authors. It matches Chicago's output "Homer, _Iliad_ 1.1."
- Anonymous or collective: **omit `creators` entirely**. Do not write a literal "Anonymous". The absence of the field is the correct CSL signal.
- Reserve `kind: literal` for names that should not decompose: corporate or institutional authors, for example "World Health Organization", or pseudonymous attribution strings, for example "[Pseudo-]Aristotle".
- Attributed-but-disputed works, for example Laozi for _Daodejing_: record the traditional attribution as `kind: person, family: Laozi`. Do not encode the dispute in the name string. TextRefs has no relation for attribution uncertainty in this version.

## How URL templates work

The compiler treats every resolver `url` as an [RFC 6570](https://www.rfc-editor.org/rfc/rfc6570) Level 1 template. Variables are drawn from five sources:

1. **Named capture groups** in the citation system's `locator_regex`. For example, a regex like `^(?<chapter>\d+)\.(?<verse>\d+)$` exposes `{chapter}` and `{verse}` to every template.
2. **Zero-padded variants** of any numeric capture, generated automatically: `{chapter02}`, `{chapter03}`, `{chapter04}`, `{verse02}`, `{verse03}`. Use the padding width that matches the target site's URL.
3. **Roman-numeral variants** of any numeric capture in 1..3999, generated automatically: `{chapterRoman}` produces `I`, `VIII`, `XXVI`. These variants are useful for sites that anchor sections by Roman chapter, for example Wikisource's `#I:8` Dhammapada verses.
4. **Cumulative `{verseGlobal}`**: for systems whose locators have numeric `chapter` and `verse` groups and also declare `chapter_sizes:` (see below), the compiler exposes a global 1..N verse counter. This is useful for single-page resolvers, for example SuttaCentral's `/dhp8` and `/dhp102`, whose URLs use one running index across all chapters.
5. **Provider-specific spellings**, declared per resolver with `vars:`. See below.

If a template references a variable that does not exist for a given reference, the compiler skips that resolver entry for that reference and warns. Empty `resolver_targets` arrays are valid. References stay registered.

## When a provider spells a locator value differently

A locator carries one canonical vocabulary. For `bible-book-chapter-verse` that is the [OSIS book codes](https://wiki.crosswire.org/OSIS_Book_Abbreviations), for example `Gen`, `John`, `1Cor`. Providers do not all agree with it: die-bibel.de addresses the same books with USFM codes, for example `GEN`, `JHN`, `1CO`. `vars:` declares that translation for one resolver, and leaves the rest of the template intact:

```yaml
- provider: Deutsche Bibelgesellschaft
  edition: 'Nestle-Aland, Novum Testamentum Graece, 28th edn (NA28)'
  language: grc
  access: open
  vars:
    bookUsfm:
      from: book
      map:
        Matt: MAT
        John: JHN
        1Cor: 1CO
  url: 'https://www.die-bibel.de/bibel/NA28/{bookUsfm}.{chapter}/#{bookUsfm}.{chapter}.{verse}'
```

Each entry takes the value of `from` and looks it up in `map`. The result becomes a new variable, usable anywhere in `url` or as the `url_by` key. The name must be new. A `vars` name that shadows a locator capture group is rejected, so `{book}` always means the canonical code, no matter which resolver you read.

A value with no entry in the map is treated like a missing template variable: the entry is skipped and the compiler warns. A hole in a book table therefore shows up in the build output, instead of quietly producing a wrong URL. Watch the skipped-entry count when you fill one in.

Use `vars:` when a provider renames part of the URL. Use `url_by:` (described below) when the whole URL is arbitrary.

## When a URL pattern isn't templatable

Some providers use chapter or section names that do not fit a formula, for example `01-Pairs.htm` or `02-Heedfulness.htm`. For those providers, replace `url:` with a per-key map:

```yaml
- provider: ancient-buddhist-texts.net
  language: en
  access: open
  url_by:
    chapter:
      1: 'https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/01-Pairs.htm'
      2: 'https://ancient-buddhist-texts.net/Texts-and-Translations/Dhammapada/02-Heedfulness.htm'
```

The compiler looks up the value of the chosen variable, `chapter`, in the map and uses the matching URL. A chapter not in the map is treated like a missing template variable: the entry is skipped and the compiler warns. Finish the map at your own pace, and watch the skipped-entry count.

## When even that isn't enough

For one-off URLs that do not fit any pattern, put the URL directly on the reference using `extra_resolvers`. This is the typical case for older citation systems, for example Stephanus or Bekker pagination.

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

Hand-listing every verse of Genesis or every line of the Iliad is not the right shape for a YAML file. For works whose reference set is regular enough to describe in a few numbers, use `references_range:` instead of, or alongside, `references:`. Each entry is one named expander. The compiler concatenates every expansion with the explicit `references:` list, removes duplicates, and validates each generated locator against the citation system's regex.

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
        611,
        877,
        461,
        544,
        909,
        529,
        482,
        565,
        713,
        579,
        848,
        471,
        837,
        522,
        746,
        867,
        761,
        617,
        424,
        503,
        611,
        515,
        897,
        804,
      ]

# Analects — 517 references from per-book chapter counts:
#   '1.1', …, '20.5'
references_range:
  - kind: book_chapter
    counts:
      [
        16,
        24,
        26,
        26,
        28,
        30,
        38,
        21,
        31,
        27,
        26,
        24,
        30,
        47,
        42,
        14,
        26,
        11,
        25,
        5,
      ]

# Genesis — 1,533 references from per-chapter verse counts:
#   'Gen.1.1', …, 'Gen.50.26'
references_range:
  - kind: book_chapter_verse
    book: Gen
    counts: [31, 25, 24, 26, 32, 22 /* …, 26 */]

# Dhammapada — 423 references from per-chapter verse counts (no book prefix):
#   '1.1', …, '26.41'
references_range:
  - kind: chapter_verse
    counts:
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

Multiple `references_range` entries on one work are concatenated. Combine them with explicit `references:` entries for one-off locators that do not fit any range.

## Additional citation systems and reference_status

The top-level `citation_system:` block is the work's **preferred** system. Its references also get the bare `/cite/{work_key}/{locator}/` alias. It is also what `Work.preferred_citation_system_key` points at in the compiled record. A work MAY carry `additional_systems:` as well: a list of fallback blocks, each with its own `citation_system:`, `resolvers:`, `references:`, and `references_range:`, scoped exactly like the top-level block:

```yaml
work:
  key: plato.republic
  preferred_label: Republic
  status: draft
  created: 2026-05-31
  modified: 2026-05-31

citation_system: stephanus # preferred system
references:
  - '514a'

additional_systems:
  - citation_system: book-chapter # fallback system — must already exist as data/systems/book-chapter.yaml
    reference_status: draft # optional; explicit here for clarity
    references:
      - '7.1'
```

`book-chapter` here is illustrative only. Every `citation_system` key must already be registered under `data/systems/`, whether at the top level or inside `additional_systems`. An unregistered key is a build-time error: the compiler throws `references unknown citation_system "…"` for that work.

The status default is **asymmetric**. The top-level block's `reference_status` defaults to the work's own `status`. An `additional_systems` block's `reference_status` defaults to `draft` instead, never to the work's status. Adding a fallback system to an already-active work never silently promotes its references to `active`. Each fallback is reviewed on its own.

Declaring the same `citation_system` twice for one work is rejected when the source file is parsed. This applies whether it appears as the preferred system and again under `additional_systems`, or twice within `additional_systems`.

Resolver URL templates stay scoped to their own block. Their template variables come from the `locator_regex` capture groups of that block's citation system.

## Citation system files

A citation system declares its locator format once. Every work that cites it reuses that declaration.

```yaml
# data/systems/dhammapada-chapter-verse.yaml
key: dhammapada-chapter-verse
preferred_label: Dhammapada chapter-and-verse
description: >-
  Dhammapada cited by chapter and verse (`chapter.verse`), e.g. 1.1 through
  26.41, following the standard Pali Text Society numbering of 423 verses
  in 26 chapters.
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
status: draft
created: 2026-05-31
modified: 2026-06-01
```

Name your capture groups deliberately. Every URL template in every work that uses this system can refer to them. Add `chapter_sizes:` only when both conditions hold:

- the locator has numeric `chapter` and `verse` groups;
- at least one resolver needs the global counter.

## Building, validating, and previewing

```sh
npm run compile:data    # expand YAML → JSONL resources, aliases.json, and datapackage.json under dist/dump/
npm run validate:data   # check every record against the canonical Zod schemas
npm run build:data      # both, in order
npm run dev             # browse at http://localhost:4321/reg/ ; records live under /id/
```

The compiler is deterministic. Re-running `compile:data` against unchanged source produces zero diff. `MappingAssertion` and `CanonicalReference` UUIDs are derived from content, per [Identifier syntax](/standard/identifier-syntax/). The same YAML therefore always produces the same identifiers.

## What lives where

- `/id/work/{key}/`: a Work's canonical landing page (mappings, references, citation systems). A sibling `/id/work/{key}.json` serves the same record as JSON-LD.
- `/id/system/{key}/`: a CitationSystem's canonical landing page (description, regex, works using it with reference counts). Plus `/id/system/{key}.json`.
- `/id/ref/{uuid}/`: a CanonicalReference page with every resolver URL grouped by language. Plus `/id/ref/{uuid}.json`.
- `/id/mapping/{uuid}/`: a MappingAssertion page. Plus `/id/mapping/{uuid}.json`.
- `/reg/`: the human registry browser (filter works and citation systems, then browse paginated reference lists from work pages).
- `/cite/{work_key}/{citation_system_key}/{locator}/`: qualified short alias, minted for every reference.
- `/cite/{work_key}/{locator}/`: a bare short alias, minted only for a work's preferred citation system. It MAY be retargeted if that preference changes.

A reader who types `https://textrefs.org/cite/plato.republic/stephanus/514a` (qualified) or `https://textrefs.org/cite/plato.republic/514a` (bare) lands on the same canonical reference page. The compiler generates the alias index alongside the records, and publishes it at `/reg/work/{work_key}/aliases.json` and `/dump/aliases.json`. See [URL layout](/get-started/url-layout/) for the full four-prefix model and alias-permanence rules.
