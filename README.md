# Iraq.ai

Iraq.ai is a multilingual AI city assistant for Iraqi cities, starting with Kirkuk, Erbil, and Baghdad.

## Vision
One mobile app that gives users trusted local information and instant answers in Arabic, Kurdish, and English.

## Core Scope (Phase 1)
- Cities: Kirkuk, Erbil, Baghdad
- Categories: restaurants, cafés, hospitals, pharmacies, government offices, real estate, construction, cars, schools, hotels, news, public services
- Features:
  - AI search (text/voice)
  - Interactive map
  - Place detail pages
  - Affiliate routing for services
  - Ads and basic web admin panel

## Tech Stack (Proposed MVP)
- Flutter mobile app (iOS/Android)
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions)
- Optional migration path: Firestore
- RAG:
  - Internal first retrieval from curated city DB
  - External enrichment (official websites, news, places providers)
  - Vector index: Pinecone or Milvus
  - LLM answer with confidence score

## Affiliate Routing
Service requests are routed to partners using weighted ranking:

`score = 0.7 * user_satisfaction + 0.3 * commission_rate`

The best partner deep-link is opened and click is logged for commission tracking.

## Milestones
1. MVP Kirkuk (4 months): 1000 trusted places + basic AI chat + simple routing + admin panel
2. Expand to Erbil/Baghdad (3 months): more categories + daily refresh + ads + pilot launch
3. Full RAG Launch (6 months): vector + LLM integration + verification + wider city rollout

## App Map
See the detailed Phase 1 app map and parallel execution plan in [docs/app-map.md](docs/app-map.md).

## Next Step
Build and ship the Kirkuk-focused MVP with strong data quality controls.
