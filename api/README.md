# TextRefs API documentation

`/api/` documents the HTTP contract for the canonical `/id/` namespace. The API itself is `/id/`; this directory holds the OpenAPI document that describes how it behaves.

## How it works

Every TextRefs record is served at two static URLs:

- `/id/{type}/{key}/` — HTML for browsers (Starlight-rendered).
- `/id/{type}/{key}.json` — JSON-LD for machines (uses [`/contexts/v1.jsonld`](../public/contexts/v1.jsonld)).

There is no `Accept`-header content negotiation. Clients either follow the `<link rel="alternate" type="application/json" href="…json">` advertised in the HTML head, or simply append `.json` to the canonical URL.

The four record types are `work`, `system`, `ref`, and `mapping`. See [URL layout](../src/content/docs/get-started/url-layout.md) for the user-facing explainer.

## Planned

- `Accept-Language` and `edition`-based 303 redirect on `/id/ref/{uuid}` to a matching `resolver_targets` entry's external URL. Resolver-target entries do not have their own IRIs (see [specification §9](../src/content/docs/standard/specification.md)).

## Out of scope here

- Spec authoring → `/standard/`
- Registry data → `/data/`
- Site chrome → `/src/`
