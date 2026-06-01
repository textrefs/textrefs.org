<!-- Thanks for your contribution! Please fill out the sections below. -->

## Summary

<!-- One sentence: what does this PR change, and why? -->

## Type of change

<!-- Tick all that apply. Matches the Conventional Commit prefix you'll use. -->

- [ ] `bug` — bug fix
- [ ] `feat` — new feature
- [ ] `docs` — documentation only
- [ ] `data` — registry data change
- [ ] `standard` — specification change
- [ ] `refactor` — code restructure without behaviour change
- [ ] `chore` / `build` / `ci` — tooling, dependencies, CI

## Related issues

<!-- e.g. Closes #123, Refs #45 -->

## Testing

- [ ] `npm run verify` passes locally (Prettier, astro check, build)
- [ ] `npm run validate:data` passes (for `data` and `standard` PRs)
- [ ] `npm test` passes (for `data` and `standard` PRs that touch the conformance suite, once available)

## Re-mint checklist (only if this PR renames a key or changes content of an existing reference / mapping)

Re-minting changes a record's IRI. The old IRI must continue to resolve as a tombstone. See the [tombstones section in versioning.md](https://textrefs.org/standard/versioning/#tombstones-and-re-minted-records).

- [ ] Old record retained with `status: superseded` and `superseded_by: <new IRI>` and `tombstone_reason: <short rationale>`
- [ ] New record carries `replaces: [<old IRI>]`
- [ ] All other records that reference the old IRI have been audited (re-targeted to the new IRI, or themselves marked `superseded`)
- [ ] Commit message uses `feat!:` / `fix!:` to signal the breaking IRI change

## Checklist

- [ ] Commit message follows [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] I have read the [Code of Conduct](../CODE_OF_CONDUCT.md) and the [Contributing Guide](../CONTRIBUTING.md)
- [ ] This PR introduces no copyrighted full text, critical apparatus, or protected translations
- [ ] I agree my contribution is released under the licence applicable to the changed files (AGPL-3.0-or-later for code, CC BY-SA 4.0 for docs/standard, CC0 1.0 for registry data)
