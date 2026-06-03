# Contributing to TextRefs

Thanks for helping build TextRefs. This guide covers how to get the site running locally, how the review process works, and the conventions PRs need to follow.

## Ground rules

- Be kind. Participation is governed by the [Code of Conduct](./CODE_OF_CONDUCT.md).
- Security issues do **not** go in public issues. See the [Security Policy](./SECURITY.md).
- Contributions are accepted under the project's licences:
  - code under **AGPL-3.0-or-later**;
  - documentation and standard text under **CC BY-SA 4.0**;
  - registry data under **CC0 1.0**.

  Submitting a contribution means you agree that your work can be released under the licence applicable to that file.

## What you can contribute

- Issues — bug reports, mapping inconsistencies, broken external links, documentation gaps.
- Pull requests — code, content, or data changes.
- Mapping proposals — additions, corrections, or status changes to external-identifier mappings.
- Domain feedback — comments on works, citation systems, normalization rules.

For registry-data contributions, first read [How it works](https://textrefs.org/get-started/how-it-works/) and [Mappings and resolver targets](https://textrefs.org/get-started/mappings-and-resolver-targets/). They explain how to distinguish canonical reference identity from external identifiers and reading URLs.

A contribution does not create a claim to acceptance, prioritization, publication, compensation, or membership. See the [governance regulation](https://textrefs.org/association/governance/) for the full review tracks.

## Review tracks

Changes are routed to one of two tracks:

- **Technical review** — typos, formatting, broken links, minor metadata, `last_checked` updates, uncontested aliases, build / tooling fixes. Needs automated validation and one technical reviewer.
- **Expert review** — new works, new citation systems, new corpora, contested mappings, changes to deterministic ID inputs, status changes (`active` / `deprecated` / `withdrawn` / `blocked`). Needs technical validation, a documented rationale with sources, and at least one expert reviewer.

The Board reserves decisions on legal or policy-sensitive matters (takedowns, blocking, licence policy).

```mermaid
flowchart TD
    S["Contribution<br/>(issue or PR)"] --> T{Triage}
    T -->|"typos, formatting, links, metadata, tooling"| TR[Technical review]
    T -->|"new work / system / corpus, contested mapping, ID inputs, status change"| ER[Expert review]
    T -->|"takedown, blocking, licence / policy"| BR[Board reservation]
    TR --> V{"Automated validation<br/>+ 1 technical reviewer"}
    ER --> V2{"Validation + rationale and sources<br/>+ 1 expert reviewer"}
    V -->|pass| A([Accepted / merged])
    V -->|fail| R([Rejected, with reason])
    V2 -->|pass| A
    V2 -->|fail| R
    BR -->|decision| A
    BR -->|decision| R
```

## Local development

Prerequisites: Node 24 and npm.

```sh
git clone --recurse-submodules https://github.com/textrefs/textrefs.org.git
cd textrefs.org
npm install              # also wires git hooks via husky
npm run dev              # http://localhost:4321
```

Registry data lives in [`textrefs/registry`](https://github.com/textrefs/registry), mounted here as a git submodule at `data/`. The registry uses `main` as its working branch. If you cloned without `--recurse-submodules`, run `git submodule update --init --recursive`. To bump the submodule to the latest `main`, run `git -C data pull origin main` and commit the new pointer.

Before pushing routine documentation, styling, or route work, run the fast local gate:

```sh
npm run verify:fast      # Prettier check + fixture-backed astro check + fixture-backed build
```

Run the full `npm run verify` before PRs that touch registry data, release output, production build behaviour, or CI behaviour. Run `npm run validate:data` as well for registry-data and standard PRs.

`npm run format` rewrites files in place if Prettier finds drift.

## Commit messages

This repo enforces [Conventional Commits](https://www.conventionalcommits.org/) via a `commit-msg` hook (commitlint). Non-conforming messages are rejected.

Use one of:

- `feat:`, `feat(scope):` — user-visible feature
- `fix:` — bug fix
- `docs:` — documentation only
- `refactor:` — code restructure without behaviour change
- `chore:`, `build:`, `ci:` — tooling, dependencies, CI
- `style:` — formatting
- `test:` — tests
- `perf:` — performance

The commit-msg hook (commitlint) rejects non-conforming messages, so a plain `git commit -m "feat(registry): add ..."` is enough.

The changelog is generated from this history via `npm run changelog` (git-cliff).

## Submitting a pull request

1. Branch from `main`.
2. Keep PRs focused — one logical change per PR.
3. Link related issues in the PR description.
4. Include local verification results: `npm run verify:fast` for routine work, or `npm run verify` plus `npm run validate:data` for registry-data, standard, release, production-build, or CI changes.
5. Open the PR against `main`. GitHub requests `@textrefs/maintainers` by default via `.github/CODEOWNERS`; maintainers may add technical or expert reviewers based on the track.

## Project layout

See [`AGENTS.md`](./AGENTS.md) for the high-level layout: where the brand assets live, how the bilingual association section is organised, and which docs are mirrored at the repo root vs under `src/content/docs/community/`.

## Maintainer release checklist

Two release trains. The Zenodo–GitHub webhook MUST be enabled once per repository (one-time, manual in the Zenodo UI under "GitHub" → toggle the repo on); after that, every GitHub Release auto-deposits.

**Standard + site** (this repo):

1. Bump `version` in `package.json` to match the new tag.
2. `npm run changelog` to regenerate `CHANGELOG.md`.
3. Update spec page frontmatter `maturity:` if the release transitions the ladder.
4. Commit, open PR, merge to `main`.
5. Tag `vX.Y.Z[-pre]` on `main`; push the tag.
6. Verify the GitHub Release fires and Zenodo mints the version DOI.
7. Fill the concept DOI into `CITATION.cff` `identifiers:` and the badge in `README.md` (once, after the first release).

**Registry** ([`textrefs/registry`](https://github.com/textrefs/registry)):

1. From a short-lived feature branch off `main`, open a PR into `main` containing the registry changes.
2. Once merged, tag `vYYYY.MM.N` on `main` and push the tag.
3. Verify the GitHub Release fires and Zenodo mints the version DOI for the registry source archive.
4. Back here in `textrefs.org`: bump the `data/` submodule pointer to the latest registry `main` commit and commit. This repo's compiler builds the published dump from that pinned submodule pointer.

## Questions

- General questions: open a GitHub Discussion or a low-priority issue.
- Code-of-Conduct concerns: <community@textrefs.org>.
- Security: see the [Security Policy](./SECURITY.md).
