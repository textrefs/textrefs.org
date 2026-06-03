# TextRefs

An open, persistent, machine-readable registry for canonical text references.

[![Status: pre-1.0](https://img.shields.io/badge/status-pre--1.0-orange)](https://textrefs.org)
[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)
[![Code: AGPL-3.0-or-later](https://img.shields.io/badge/code-AGPL--3.0--or--later-blue)](./LICENSE-AGPL.md)
[![Docs: CC BY-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--SA%204.0-blue)](./LICENSE-CC-BY-SA.md)
[![Data: CC0 1.0](https://img.shields.io/badge/data-CC0%201.0-blue)](./LICENSE-CC0.md)
[![POSI: v2.0](https://img.shields.io/badge/POSI-v2.0-blue)](https://textrefs.org/association/posi/)
[![GitHub issues](https://img.shields.io/github/issues/textrefs/textrefs.org.svg)](https://github.com/textrefs/textrefs.org/issues)
[![GitHub stars](https://img.shields.io/github/stars/textrefs/textrefs.org.svg)](https://github.com/textrefs/textrefs.org/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/textrefs/textrefs.org.svg)](https://github.com/textrefs/textrefs.org/network)

Site: <https://textrefs.org> · Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## About

TextRefs is a non-profit infrastructure project that builds, maintains, and publishes an open registry for canonical text references — the kind of identifiers used to cite a passage in Plato, a Bekker line in Aristotle, a Stephanus page, or any other established reference system in the humanities. It is being set up as a Zürich-based association (_Verein_) in formation, which will seek tax-exempt non-profit status.

**TextRefs is:**

- an open, persistent, machine-readable registry of canonical text references;
- a set of open standards, JSON-LD shapes, and reference implementations;
- a curated source of mappings between canonical references and external identifiers (CTS URNs, Wikidata IDs, DOIs, ARKs, Perseus URLs, etc.).

**TextRefs is _not_:**

- a full-text database or a critical edition;
- a publisher or commercial SaaS;
- a substitute for Perseus, Loeb, TLG, PHI, DTS, CTS, or any library catalogue.

## Quick links

- **Site**: <https://textrefs.org>
- **URL layout** (what `/id/`, `/reg/`, `/cite/`, `/api/` do): <https://textrefs.org/get-started/url-layout/>
- **Standard**: <https://textrefs.org/standard/>
- **API documentation**: <https://textrefs.org/api/>
- **Association** (mission, statutes, governance, expenses): <https://textrefs.org/association/>
- **POSI self-assessment** (Principles of Open Scholarly Infrastructure): <https://textrefs.org/association/posi/>
- **Zenodo community** (archived data dumps and DOIs): <https://zenodo.org/communities/textrefs/>
- **Statuten** (German original, legally binding): <https://textrefs.org/de/association/statutes/>

## Repository structure

```
.
├── public/                     # static assets (logo, favicon, Inter fonts)
├── src/
│   ├── components/             # Starlight component overrides (Footer)
│   ├── content/docs/           # site content (English at root, German under de/)
│   ├── styles/brand.css        # brand tokens (see public/BRAND notes)
│   └── content.config.ts
├── data/                       # git submodule → textrefs/registry (hand-authored YAML)
├── scripts/                    # data compile + validate pipeline
├── standard/, api/             # scaffolds reserved for future repo splits
├── decisions/                  # Architecture Decision Records (MADR)
├── docs-internal/              # maintainer-only notes, not published
├── astro.config.mjs            # Astro + Starlight config (i18n, sidebar)
├── cliff.toml                  # git-cliff config for CHANGELOG generation
├── commitlint.config.js        # conventional-commit enforcement
└── package.json
```

## Local development

Prerequisites: Node 24 and npm.

Configuration lives in `.env`; use [`.env.example`](./.env.example) as the starting point. `SITE_DOMAIN` controls Astro's canonical `site` URL and defaults to `textrefs.org` when unset.

| Command                 | Action                                                                                                                                                              |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm install`           | Install dependencies; wires git hooks (husky + lint-staged)                                                                                                         |
| `npm run dev`           | Start local dev server at `localhost:4321`                                                                                                                          |
| `npm run build`         | Build the production site to `./dist/`                                                                                                                              |
| `npm run build:fast`    | Build the site against a tiny fixture registry, without compiling full data                                                                                         |
| `npm run preview`       | Preview the build locally                                                                                                                                           |
| `npm run compile:data`  | Read hand-authored YAML under `data/works/` and `data/systems/`, expand the in-memory registry, and emit JSONL resources plus `datapackage.json` under `dist/dump/` |
| `npm run validate:data` | Validate every compiled record against the canonical Zod schemas                                                                                                    |
| `npm run build:data`    | `compile:data` then `validate:data` — the contributor data pipeline                                                                                                 |
| `npm run verify:fast`   | Fast local check using fixture registry data                                                                                                                        |
| `npm run verify`        | Prettier + `astro check` + production build — the CI gate                                                                                                           |
| `npm run changelog`     | Regenerate `CHANGELOG.md` from git history (git-cliff)                                                                                                              |

Contributors edit the YAML under [`data/works/`](https://github.com/textrefs/registry/tree/main/works) and [`data/systems/`](https://github.com/textrefs/registry/tree/main/systems); the directory is a git submodule pointing at [`textrefs/registry`](https://github.com/textrefs/registry). Run `git submodule update --init --recursive` after cloning. The compiler expands the pinned submodule into the flat registry dump (works, systems, refs, mappings) under `dist/dump/`. See [`docs/get-started/authoring`](https://textrefs.org/get-started/authoring/) for the format. For documentation, styling, and route work, use `npm run verify:fast` locally; run the full `npm run verify` before PRs that touch registry data, release output, production build behaviour, or CI behaviour.

See [`AGENTS.md`](./AGENTS.md) for the full layout and conventions.

## Deployment

GitHub Pages deployment is handled by [`.github/workflows/pages.yml`](./.github/workflows/pages.yml). On pushes to `main`, the workflow installs dependencies, builds the Astro site, writes `dist/CNAME` from `SITE_DOMAIN`, uploads the `dist/` artifact, and deploys it with the official GitHub Pages actions.

Set the repository variable `SITE_DOMAIN` under GitHub Actions variables to the custom domain, for example `textrefs.org`. If the variable is absent, CI falls back to `textrefs.org`. The same variable is also read by `astro.config.mjs` to set Astro's canonical `site` value.

## Citation

If you cite TextRefs, use the metadata in [`CITATION.cff`](./CITATION.cff) — GitHub renders a "Cite this repository" button in the sidebar that reads from this file.

Two distinct concept DOIs cover the project, minted via the [Zenodo GitHub integration](https://docs.github.com/en/repositories/archiving-a-github-repository/referencing-and-citing-content) once enabled:

- **TextRefs Standard** (this repository) — cite for the specification, JSON-LD context, Zod schemas, and site. DOI badge will be added once the first `v*` tag is released.
- **TextRefs Registry** ([`textrefs/registry`](https://github.com/textrefs/registry)) — cite for a specific registry data export. DOI badge will be added once the first `v*` tag is released there.

Both deposits live in the [TextRefs Zenodo community](https://zenodo.org/communities/textrefs/).

## Support

| Topic                             | Channel                                                                          |
| :-------------------------------- | :------------------------------------------------------------------------------- |
| 🚨 Bug reports                    | [GitHub Issues](https://github.com/textrefs/textrefs.org/issues)                 |
| 🎁 Feature requests               | [GitHub Issues](https://github.com/textrefs/textrefs.org/issues)                 |
| 📊 Bad data / mapping corrections | [GitHub Issues](https://github.com/textrefs/textrefs.org/issues) (label: `data`) |
| 📚 Docs issues                    | [GitHub Issues](https://github.com/textrefs/textrefs.org/issues)                 |
| 🛡 Security vulnerabilities       | See [`SECURITY.md`](./SECURITY.md) — private GitHub advisory                     |
| 🤝 Code-of-Conduct concerns       | <community@textrefs.org>                                                         |
| 💬 General questions              | [GitHub Discussions](https://github.com/textrefs/textrefs.org/discussions)       |

## Roadmap

TextRefs is **pre-1.0**: the association is being founded, the standard is being drafted, and the current registry examples are candidate data. Public milestones will appear on the [GitHub project board](https://github.com/textrefs/textrefs.org/projects) once it is set up. The statutes ([English](https://textrefs.org/association/statutes/), [Deutsch](https://textrefs.org/de/association/statutes/)) and governance regulation describe the long-term scope.

## Contributing

Contributions are welcome — issues, pull requests, mapping proposals, documentation improvements. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md) before opening a PR.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Pre-1.0 releases are considered unstable. The changelog is generated from Conventional Commits via `npm run changelog` (git-cliff).

Two release trains live in two repositories:

- **TextRefs Standard** (this repo) — tags `vMAJOR.MINOR.PATCH[-prerelease]` advance the spec, schemas, and site together. The spec's maturity level (`working-draft` → `candidate-recommendation` → `recommendation`) is encoded in each `/standard/*` page's frontmatter; the SemVer tag encodes pre-release status.
- **TextRefs Registry** ([`textrefs/registry`](https://github.com/textrefs/registry)) — calendar tags `vYYYY.MM.N` cut monthly registry exports. The data-package `version` inside `datapackage.json` follows SemVer-without-`v`.

Records can be re-minted (e.g. when a `work` key is renamed). The old IRI continues to resolve as a tombstone (`status: withdrawn`); successors are linked by an `exactMatch` `MappingAssertion`. See [versioning policy](https://textrefs.org/standard/versioning/) for the full rules.

## Contributors and roles

Contributor roles follow the [CRediT taxonomy](https://credit.niso.org/) (NISO ANSI/NISO Z39.104-2022). CITATION.cff has no native CRediT field today, so this README is the canonical record.

- **Moritz Mähr** ([@maehr](https://github.com/maehr), [moritzmaehr.ch](https://moritzmaehr.ch)) — Conceptualization, Data curation, Funding acquisition, Investigation, Methodology, Project administration, Resources, Software, Supervision, Validation, Visualization, Writing – original draft, Writing – review & editing.
- **Luz Christopher Seiberth** — Conceptualization, Data curation, Funding acquisition, Writing – review & editing.

See also the [GitHub contributors graph](https://github.com/textrefs/textrefs.org/graphs/contributors).

## License

This repository carries three kinds of work under three licences:

- **Code** — [AGPL-3.0-or-later](./LICENSE-AGPL.md)
- **Docs & standard text** — [CC BY-SA 4.0](./LICENSE-CC-BY-SA.md)
- **Registry data** — [CC0 1.0](./LICENSE-CC0.md)

See [`LICENSE.md`](./LICENSE.md) for the index and what each licence covers.
