# Iraq.ai MVP Runbook

## Run locally

```bash
npm start
```

Open <http://localhost:4173> in a browser.

## Test locally

```bash
npm test
```

The test suite validates seeded city data, map coordinates, multilingual lookup, internal search, assistant retrieval, and partner routing scores.

## What is implemented

- Static, dependency-free MVP prototype in `index.html`, `src/styles.css`, and `src/app.js`.
- Seed data in `data/places.json` for Kirkuk, Erbil, and Baghdad.
- Text search with city, category, and language filters.
- Schematic interactive map pins synchronized with result cards and place details.
- Place details with call, directions, verification metadata, and partner routing CTA.
- Local AI-style answer generation that retrieves internal curated records first and returns a confidence score.
- Admin QA panel with freshness checks and locally persisted routing events.

## Production handoff

1. Replace `data/places.json` with Supabase reads from the MVP schema.
2. Replace local assistant retrieval with backend retrieval + LLM orchestration.
3. Replace `localStorage` event logging with the `routing_events` table.
4. Replace seeded partner links with approved affiliate partner deep links.
