# Iraq.ai MVP Runbook

## Run locally

```bash
npm start
```

The server also exposes a health check at <http://localhost:4173/health>.

Open <http://localhost:4173> in a local browser. If you are using Codespaces, Gitpod, Replit, Cursor cloud, or another remote container, open the forwarded port `4173` from that environment. Do not open `index.html` with `file://`; browser security blocks the JSON seed-data fetch.


## Enable OpenAI assistant

Do not hardcode API keys into this repository or any browser file. The assistant calls `/api/assistant`, and that server endpoint reads `OPENAI_API_KEY` from the server environment.

Local run:

```bash
export OPENAI_API_KEY="your_server_side_key"
npm start
```

Vercel run:

1. Open the Vercel project settings.
2. Go to **Environment Variables**.
3. Add `OPENAI_API_KEY` for Production/Preview.
4. Redeploy.

If `OPENAI_API_KEY` is missing or the provider request fails, the UI falls back to the local internal-record answer so demos still work.

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


## Deploy to Vercel

The repository includes `vercel.json`, so Vercel can deploy the static MVP without extra dashboard tweaks:

- Framework preset: **Other**
- Build command: `npm run build`
- Output directory: `dist`
- Serverless function: `/api/assistant`
- Required environment variable for real AI: `OPENAI_API_KEY`

From the Vercel dashboard, import the Git repository and deploy the current branch. From the CLI, run:

```bash
npm run build
vercel --prod
```

After deployment, open the Vercel URL and verify `/health` locally only if using `npm start`; production static deploys serve the app from `dist`.
