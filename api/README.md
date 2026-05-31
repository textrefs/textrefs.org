# TextRefs API

Future home of the resolver/registry API. Empty by design — the directory exists so the first API file lands here rather than under `/src/`, keeping it co-located with the site for the planned "site & api" repo.

## Planned scope

- Resolver endpoints for `https://textrefs.org/id/work/{key}`, `/id/system/{key}`, `/id/ref/{uuid}`, `/id/mapping/{uuid}`.
- Content negotiation: HTML (Starlight-rendered detail page) vs JSON-LD (using `/contexts/v1.jsonld`).
- On `/id/ref/{uuid}`: HTTP 303 redirect to an embedded `resolver_targets` entry's external `url`, based on language / edition negotiation. Resolver-target entries do not have their own IRIs (see [specification §9](../src/content/docs/standard/specification.md)).

## Out of scope

- Spec authoring → `/standard/`
- Registry data → `/data/`
- Site chrome → `/src/`
