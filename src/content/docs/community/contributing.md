---
title: Contributing
description: How to contribute code, docs, or data to TextRefs.
sidebar:
  order: 2
---

Thanks for helping build TextRefs. This guide covers how to get the site running locally, how the review process works, and the conventions PRs need to follow.

## Ground rules

- Be kind. Participation is governed by the [Code of Conduct](/community/code-of-conduct/).
- Security issues do **not** go in public issues. See the [Security Policy](/community/security/).
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

For registry-data contributions, first read [How it works](/get-started/how-it-works/) and [Mappings and resolver targets](/get-started/mappings-and-resolver-targets/). They explain how to distinguish canonical reference identity from external identifiers and reading URLs.

A contribution does not create a claim to acceptance, prioritization, publication, compensation, or membership. See the [governance regulation](/association/governance/) for the full review tracks.

## Review tracks

Changes are routed to one of three tracks:

- **Technical review** — typos, formatting, broken links, minor metadata, `last_checked` updates, uncontested aliases, build / tooling fixes, and merging new registry data as `draft`. Needs automated validation and one technical reviewer.
- **Expert review** — new works, new citation systems, new corpora, contested mappings, changes to deterministic ID inputs, status changes (promotion `draft` → `active`, and `deprecated` / `withdrawn` / `blocked`). Needs technical validation, a documented rationale with sources, and at least one expert reviewer.
- **Board reservation** — takedowns, blocking, licence policy, and other legal or policy-sensitive matters. Decided by the Association Board.

```mermaid
flowchart TD
    S["Contribution<br/>(issue or PR)"] --> T{Triage}
    T -->|"typos, formatting, links, metadata, tooling"| TR[Technical review]
    T -->|"new work / system / corpus, contested mapping, ID inputs, status change / promotion"| ER[Expert review]
    T -->|"takedown, blocking, licence / policy"| BR[Board reservation]
    TR --> V{"Automated validation<br/>+ 1 technical reviewer"}
    ER --> V2{"Validation + rationale and sources<br/>+ 1 expert reviewer"}
    V -->|pass| A(["Accepted / merged<br/>(new data lands as draft)"])
    V -->|fail| R([Rejected, with reason])
    V2 -->|pass| A
    V2 -->|fail| R
    BR -->|decision| A
    BR -->|decision| R
```

New registry records enter at `status: draft` after technical review; they stay retractable until an expert review promotes them to `active`, which permanently freezes their identifier (see the [versioning rules](/standard/versioning/) and governance §5).

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
npm run verify:fast      # Prettier check + fixture-backed astro check + tests + fixture-backed build
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

## Branching model

The production site (`textrefs.org`) is built and deployed from `main`. To keep `main`'s history low-noise while still allowing many small content edits, day-to-day docs/blog/copy work batches on a long-lived `staging` branch and is squash-merged into `main` to publish.

- `main` — production source. Pushes here auto-deploy via `.github/workflows/pages.yml`. Release tags (`vX.Y.Z`) are cut from `main`; the registry's `vYYYY.MM.N` tags are cut in [`textrefs/registry`](https://github.com/textrefs/registry).
- `staging` — long-lived batching branch for docs, blog posts, copy, registry-pointer bumps, and other content edits. Does **not** auto-deploy. Edits accumulate here as many small commits.
- To publish: open a PR `staging → main` and squash-merge. The squash-commit lands on `main` as one conventional commit (so `git-cliff` stays clean) and triggers the production deploy.
- Manual preview / ad-hoc deploy: from the GitHub Actions UI, run the **Pages** workflow via `workflow_dispatch` and pick `staging` (or any branch) as the ref. This deploys that ref to production until the next push to `main`. There is no separate preview URL — GitHub Pages serves a single site per repo, so manual staging deploys temporarily replace production. Use sparingly.
- Infrastructure changes (CI, release workflow, build tooling, deploy config) target `main` directly so they are not gated on the next staging-to-main snapshot.

Squash merging is the only enabled merge style on the canonical repo, so `staging`'s noisy history is collapsed into a single conventional-commit message on `main` and `git-cliff` still produces a clean `CHANGELOG.md`.

## Submitting a pull request

1. Branch from `staging` for content/docs/blog; branch from `main` for infra, CI, or release-workflow changes.
2. Keep PRs focused — one logical change per PR.
3. Link related issues in the PR description.
4. Include local verification results: `npm run verify:fast` for routine work, or `npm run verify` plus `npm run validate:data` for registry-data, standard, release, production-build, or CI changes.
5. Open the PR against the branch you started from (`staging` or `main`). GitHub requests `@textrefs/maintainers` by default via `.github/CODEOWNERS`; maintainers may add technical or expert reviewers based on the track.

## Project layout

See [`AGENTS.md`](https://github.com/textrefs/textrefs.org/blob/main/AGENTS.md) for the high-level layout: where the brand assets live, how the bilingual association section is organised, and which docs are mirrored at the repo root vs under `src/content/docs/community/`.

## Maintainer release checklist

Two release trains. The Zenodo–GitHub webhook MUST be enabled once per repository (one-time, manual in the Zenodo UI under "GitHub" → toggle the repo on); after that, every GitHub Release auto-deposits.

**Standard + site** (this repo):

1. Bump `version` in `package.json` to match the new tag. The compiler reads it, so it also becomes the `datapackage.json` version of the published dump.
2. Set `version` and `date-released` in `CITATION.cff` to the same tag and its release date. Without them the file cannot say which release it describes.
3. `npx git-cliff --tag vX.Y.Z -o CHANGELOG.md` to regenerate `CHANGELOG.md`. Pass `--tag` explicitly: the tag does not exist yet at this point, and bare `npm run changelog` would file the commits under `## [Unreleased]`.
4. Update spec page frontmatter `maturity:` if the release transitions the ladder.
5. Dispatch the **Pages** workflow on `staging`. `main`'s ruleset requires a successful `github-pages` deployment for the exact SHA being merged, so the release PR stays blocked until the branch tip has one.
6. Open a PR `staging → main` and squash-merge it. The squash message should be a conventional commit (`docs(release): vX.Y.Z` or similar) so the changelog stays clean.
7. Tag `vX.Y.Z[-pre]` on `main`; push the tag.
8. Verify the GitHub Release fires and Zenodo mints the version DOI.
9. Fill the concept DOI into `CITATION.cff` `identifiers:` and the badge in `README.md` (once, after the first release).

**Registry** ([`textrefs/registry`](https://github.com/textrefs/registry)):

1. From a short-lived feature branch off `main`, open a PR into `main` containing the registry changes.
2. Once merged, tag `vYYYY.MM.N` on `main` and push the tag.
3. Verify the GitHub Release fires and Zenodo mints the version DOI for the registry source archive.
4. Back here in `textrefs.org`: bump the `data/` submodule pointer to the latest registry `main` commit and commit. This repo's compiler builds the published dump from that pinned submodule pointer.

## Questions

- General questions: open a GitHub Discussion or a low-priority issue.
- Code-of-Conduct concerns: <community@textrefs.org>.
- Security: see the [Security Policy](/community/security/).
