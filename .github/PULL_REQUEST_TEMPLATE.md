<!-- Thanks for your contribution! Please fill out the sections below. -->

## Summary

<!-- One sentence: what does this PR change, and why? -->

## Commit type

<!-- Tick the Conventional Commit type you expect to use. -->

- [ ] `fix` — bug fix
- [ ] `feat` — new feature
- [ ] `docs` — documentation only
- [ ] `refactor` — code restructure without behaviour change
- [ ] `chore` / `build` / `ci` — tooling, dependencies, CI

## Area

- [ ] site / docs
- [ ] standard
- [ ] registry data
- [ ] release / CI / tooling

## Related issues

<!-- e.g. Closes #123, Refs #45 -->

## Testing

- [ ] `npm run verify:fast` passes locally for routine docs, styling, or route work
- [ ] `npm run verify` passes locally for registry-data, standard, release, production-build, or CI changes
- [ ] `npm run validate:data` passes locally for registry-data and standard PRs

## Re-mint checklist (only if this PR renames a key or changes content of an existing reference / mapping)

Re-minting changes a record's IRI. The old IRI must continue to resolve as a tombstone. See the [tombstones section in versioning.md](https://textrefs.org/standard/versioning/#tombstones-and-re-minted-records).

- [ ] Old record retained with `status: withdrawn`
- [ ] A new `MappingAssertion` with `relation: exactMatch`, `subject: <old IRI>`, `target: <new IRI>` links the old record to its successor (omit if there is no successor)
- [ ] All other records that reference the old IRI have been audited (re-targeted to the new IRI, or themselves marked `withdrawn`)
- [ ] Commit message uses `feat!:` / `fix!:` or `feat(scope)!:` / `fix(scope)!:` to signal the breaking IRI change

## Checklist

- [ ] Commit message follows [Conventional Commits](https://www.conventionalcommits.org/)
- [ ] I have read the [Code of Conduct](../CODE_OF_CONDUCT.md) and the [Contributing Guide](../CONTRIBUTING.md)
- [ ] This PR introduces no copyrighted full text, critical apparatus, or protected translations
- [ ] I agree my contribution is released under the licence applicable to the changed files (AGPL-3.0-or-later for code, CC BY-SA 4.0 for docs/standard, CC0 1.0 for registry data)
