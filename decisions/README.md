# Architecture Decision Records

This directory holds **Architecture Decision Records (ADRs)** — short documents capturing significant design and process decisions, their context, the alternatives considered, and the consequences. They survive past the originating PR so future contributors can find out _why_ something is the way it is.

We follow the [MADR](https://adr.github.io/madr/) format (Markdown ADR). Start from [`ADR-TEMPLATE.md`](./ADR-TEMPLATE.md).

## Conventions

- Filename: `ADR-NNNN-{kebab-case-slug}.md`, with `NNNN` zero-padded and monotonically increasing.
- Status field: `Proposed` → `Accepted` → optionally `Deprecated` or `Superseded by ADR-XXXX`.
- One decision per ADR. Split rather than expand.
- ADRs are immutable once accepted; corrections happen via a new ADR that supersedes the old one.

## When to write an ADR

- Choices that cross PR or repo boundaries (e.g. merging two repos, choosing a UUID namespace, picking a licence split).
- Decisions whose rationale isn't obvious from the diff and would surprise a future maintainer.
- Architectural commitments that constrain future work.

For day-to-day code review, a clear commit message and PR description are enough — don't write an ADR for every routine change.

## Process

1. Open a `Decision record (ADR)` issue via the GitHub issue templates.
2. Open a PR adding `ADR-NNNN-{slug}.md` with status `Proposed`.
3. Discuss in the PR until consensus among maintainers; mark the ADR `Accepted` and merge.
4. If a later ADR supersedes this one, set status to `Superseded by ADR-XXXX` and link from both.
