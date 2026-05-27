# TextRefs

An open, persistent, machine-readable registry for canonical text references.

[![Status: pre-implementation](https://img.shields.io/badge/status-pre--implementation-orange)](https://textrefs.org)
[![Built with Starlight](https://astro.badg.es/v2/built-with-starlight/tiny.svg)](https://starlight.astro.build)
[![Code: AGPL-3.0-or-later](https://img.shields.io/badge/code-AGPL--3.0--or--later-blue)](./LICENSE-AGPL.md)
[![Docs: CC BY-SA 4.0](https://img.shields.io/badge/docs-CC%20BY--SA%204.0-blue)](./LICENSE-CC-BY-SA.md)
[![Data: CC0 1.0](https://img.shields.io/badge/data-CC0%201.0-blue)](./LICENSE-CC0.md)
[![GitHub issues](https://img.shields.io/github/issues/textrefs/textrefs.org.svg)](https://github.com/textrefs/textrefs.org/issues)
[![GitHub stars](https://img.shields.io/github/stars/textrefs/textrefs.org.svg)](https://github.com/textrefs/textrefs.org/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/textrefs/textrefs.org.svg)](https://github.com/textrefs/textrefs.org/network)

Site: <https://textrefs.org> · Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## About

TextRefs is a non-profit infrastructure project that builds, maintains, and publishes an open registry for canonical text references — the kind of identifiers used to cite a passage in Plato, a Bekker line in Aristotle, a Stephanus page, or any other established reference system in the humanities. It is run by a Zürich-based association (_Verein_) and aims for tax-exempt non-profit status.

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
- **Standard**: <https://textrefs.org/standard/>
- **API reference**: <https://textrefs.org/api/>
- **Association** (mission, statutes, governance, expenses): <https://textrefs.org/association/>
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
├── astro.config.mjs            # Astro + Starlight config (i18n, sidebar)
├── cliff.toml                  # git-cliff config for CHANGELOG generation
├── commitlint.config.js        # conventional-commit enforcement
└── package.json
```

## Local development

Prerequisites: Node 20+ and npm.

| Command             | Action                                                      |
| :------------------ | :---------------------------------------------------------- |
| `npm install`       | Install dependencies; wires git hooks (husky + lint-staged) |
| `npm run dev`       | Start local dev server at `localhost:4321`                  |
| `npm run build`     | Build the production site to `./dist/`                      |
| `npm run preview`   | Preview the build locally                                   |
| `npm run verify`    | Prettier + `astro check` + build — the CI gate              |
| `npm run commit`    | Guided Conventional Commit prompt (cz-git)                  |
| `npm run changelog` | Regenerate `CHANGELOG.md` from git history (git-cliff)      |

See [`AGENTS.md`](./AGENTS.md) for the full layout and conventions.

## Citation

If you cite TextRefs, use the metadata in [`CITATION.cff`](./CITATION.cff) — GitHub renders a "Cite this repository" button in the sidebar that reads from this file. The first tagged release will also archive on Zenodo (via [`.zenodo.json`](./.zenodo.json)) and acquire a DOI; the DOI badge will be added here once minted.

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

TextRefs is **pre-implementation**: the association is being founded, the standard is being drafted, and no live data is published yet. Public milestones will appear on the [GitHub project board](https://github.com/textrefs/textrefs.org/projects) once it is set up. The statutes ([English](https://textrefs.org/association/statutes/), [Deutsch](https://textrefs.org/de/association/statutes/)) and governance regulation describe the long-term scope.

## Contributing

Contributions are welcome — issues, pull requests, mapping proposals, documentation improvements. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) and the [Code of Conduct](./CODE_OF_CONDUCT.md) before opening a PR.

## Versioning

This project follows [Semantic Versioning](https://semver.org/). Pre-1.0 releases are considered unstable. The changelog is generated from Conventional Commits via `npm run changelog` (git-cliff).

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
