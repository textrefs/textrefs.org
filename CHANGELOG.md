# Changelog

All notable changes to this project are documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-12

### Added

- Replace target_kind with dcterms:conformsTo (#6)
- Seed CanonicalReference UUIDs from the semantic identity tuple (ADR-0002) (#21)
- Draft lifecycle with retractable pre-promotion identity (ADR-0003) (#23)
- Require explicit canonical ASCII digit and case forms in profiles (#24)
- Flag draft records and exclude them from search indexing (#26)
- Upgrade to Astro 7 / Starlight 0.41, all dependencies to latest (#29)
- Minimal static templates for reference pages (#30)
- Collapse record lifecycle to draft → active (ADR-0004) (#62)
- Preferred citation system and qualified /cite/ aliases (ADR-0005) (#63)
- Replace SKOS mapping relations with alternateOf and isReferencedBy (ADR-0006) (#67)
- Map locator variables into a provider's own vocabulary (#71) (#72)

### Documentation

- Revise get-started prose and document staging deploy flow
- Sync statutes board size and review tracks with dossier
- Tighten dereferenceable-location guidance to should (#7)
- Self-contained §13 example with @context (#8)
- Add ORCID for Luz Christopher Seiberth (#19)

### Fixed

- Repair URL extraction in link-check workflow
- Mark docs/404.mdx as draft to drop catch-all route conflict
- Repair link-check workflow + bump deps to zod 4 (#5)
- Erratum batch and spec-consistency fixes (#10, #11, #12, #14) (#25)
- Resolve normative contradictions before the v0.1.0 tag (#44)
- Add explicit whitespace between inline elements (#53) (#54)
- List works instead of references on CitationSystem pages (#55) (#56)
- Release hardening before v0.1.0 (#46, #47, #49, #50) (#75)

### Misc

- Add textrefs/.github as submodule at github-profile/
- Bump astro 6.4.4 and migrate to zod 4
- Bump submodule with second resolvers on single-resolver works
- Bump submodule to registry main (36cae56)
- Bump submodule to registry main (40af385)
- Astro 6.4.8, dompurify 3.4.11, actions/checkout v7
- Bump submodule to registry main (c0a3275, ORCID docs)
- Astro 7.1 + dependency refresh (#39) (#43)
- Bump registry pin to the ADR-0006 reclassification
- Bump registry pin to the resolver review
- Refresh all dependencies before v0.1.0 (#73)
