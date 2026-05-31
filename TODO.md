# TODO

## API

- Implement `/api/` documentation or redirect behaviour before treating the public API reference as live.
- Implement resolver routes for persistent TextRefs IDs: `/id/work/{key}`, `/id/system/{key}`, `/id/ref/{uuid}`, `/id/target/{uuid}`, and `/id/mapping/{uuid}`.
- Add content negotiation for resolver routes: human-readable landing pages by default and JSON-LD when requested.
- Serve the generated JSON Schema at `/schemas/v1/textrefs.schema.json` or update the specification if the publication path changes.
- Keep `/contexts/v1.jsonld` served from `public/contexts/v1.jsonld` as the JSON-LD context used by the API.
