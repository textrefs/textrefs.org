# Security Policy

## Reporting a vulnerability

**Do not open a public GitHub issue for security problems.** Use GitHub's private vulnerability reporting instead:

→ <https://github.com/textrefs/textrefs.org/security/advisories/new>

This opens a private advisory visible only to repository maintainers. If you cannot use the advisory form (no GitHub account, accessibility reasons), email **community@textrefs.org** instead and we will open the advisory on your behalf.

## What to include

A useful report includes:

- a description of the issue and its impact;
- steps to reproduce, or a proof-of-concept;
- the affected version, commit, or URL;
- any known mitigations or workarounds;
- whether you intend to disclose publicly and on what timeline.

If you used an AI coding assistant while investigating, keep the initial report private — agents can help reproduce, draft a fix, or check documentation, but the disclosure decision rests with maintainers.

## Our commitments

- We acknowledge new advisories within 5 working days.
- We aim to assess and triage within 10 working days of acknowledgement.
- We follow a **90-day disclosure timeline** from the date you report. If a fix is not available by then, we will coordinate with you on a revised date.
- We credit reporters in the advisory and release notes, unless you ask to remain anonymous.

## Scope

In scope:

- the textrefs.org website and its build pipeline;
- the data model, JSON-LD context, and any published API endpoints;
- the registry data (mappings, identifiers, exports) once published.

Out of scope:

- vulnerabilities in third-party platforms we link to (Perseus, Wikidata, etc.) — report those upstream;
- denial-of-service through obviously expensive but documented queries;
- social-engineering reports against maintainers.
