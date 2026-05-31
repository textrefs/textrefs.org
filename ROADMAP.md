# TextRefs roadmap

This is the public roadmap. The same content is mirrored on the docs site at <https://textrefs.org/community/roadmap/>.

## Status

- **Current spec version:** `v0.1.0-draft` (frozen baseline, unreleased).
- **Phase:** pre-implementation. The site, governance, and spec workspace are in place; the first canonical data set is the next milestone.

Status legend: 🟢 done · 🟡 in progress · ⚪ planned · 🔵 blocked.

## Now

- 🟢 GitHub issue & PR templates and PR-template Conventional-Commit checklist.
- 🟢 ADR directory and template (`decisions/`).
- 🟢 This roadmap, mirrored on the site.
- 🟢 Removed the empty `/association/history/` page.
- 🟢 Added the Get-started section (welcome, use cases, related identifier systems).

## Next

- ⚪ Publish the Standard draft v0.1.0 on the site.
- ⚪ Ship a static API MVP (landing pages + JSON-LD + monthly exports).
- ⚪ Grow the registry with the first canonical data examples across several citation systems.

## How this roadmap is maintained

- The canonical text is `ROADMAP.md` at the repo root; `src/content/docs/community/roadmap.md` mirrors it with Starlight frontmatter. Edits update both in the same PR.
- Smaller changes go through normal PR review; significant scope shifts get an ADR.
