# TextRefs API

Future home of the resolver/registry API. Empty by design — the directory exists so the first API file lands here rather than under `/src/`, keeping it co-located with the site for the planned "site & api" repo.

## Planned scope

- Resolver endpoints for `https://textrefs.org/id/work/{key}`, `/id/system/{key}`, `/id/ref/{uuid}`, `/id/target/{uuid}`, `/id/mapping/{uuid}`.
- Content negotiation: HTML (Starlight-rendered detail page) vs JSON-LD (using `/contexts/v1.jsonld`).
- For `ResolverTarget`: HTTP 303 redirect to the external `url` based on language / edition negotiation.
- Validation endpoint exposing the Zod schemas in [`../standard/schema/`](../standard/schema/).

## Out of scope

- Spec authoring → `/standard/`
- Registry data → `/data/`
- Site chrome → `/src/`
