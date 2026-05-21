# Iraq.ai Implementation Plan

## 1) Product Modules

### A. Mobile App (Flutter)
- Auth (guest + optional phone/email)
- Home search bar (text/voice)
- City/category browsing
- Map + list synced results
- Place detail (description, images, hours, rating, call, directions)
- AI chat assistant with city-aware context
- Partner routing CTA (Order / Book / Request)

### B. Web Admin Panel
- Place CRUD + moderation workflow
- Ads management
- Affiliate partners management
- Click/conversion reporting
- Data QA queue

### C. Backend Services
- API gateway
- Retrieval service (internal index + external connectors)
- LLM orchestration service
- Partner ranking/routing service
- Event tracking service

## 2) Data Model (MVP)
- `cities(id, name_ar, name_ku, name_en)`
- `places(id, city_id, category_id, name_*, description_*, lat, lng, phone, hours, rating, source, verified_at)`
- `categories(id, key, name_*)`
- `place_media(id, place_id, url, type)`
- `partners(id, name, commission_rate, deep_link_template, is_active)`
- `routing_events(id, user_id, place_id, partner_id, score, clicked_at)`
- `ads(id, partner_id, city_id, category_id, budget, start_at, end_at)`
- `qa_flags(id, place_id, reason, status, created_at)`

## 3) RAG Flow
1. Detect language and intent.
2. Query internal curated DB and vector index.
3. If confidence is low, enrich with approved external sources.
4. Re-rank results by relevance + distance + verification freshness.
5. Generate answer with:
   - concise response
   - cited source labels (internal/external)
   - confidence score

## 4) Affiliate Routing Logic
Given candidate partners:
- compute normalized satisfaction score from ETA/rating/success history
- compute normalized commission score
- final score = `0.7*satisfaction + 0.3*commission`
- choose highest score above policy threshold
- log click and route through deep-link

## 5) Quality & Trust
- Human review queue for high-impact edits
- Source freshness checks (daily)
- Conflict resolution policy for opening hours/phone numbers
- Trust badge by verification recency

## 6) MVP Delivery Sprints (16 weeks)
- Weeks 1-2: architecture, schema, CI/CD baseline
- Weeks 3-6: place ingestion + admin CRUD + moderation
- Weeks 7-9: mobile search/map/detail core
- Weeks 10-12: AI retrieval + multilingual responses
- Weeks 13-14: affiliate routing + tracking
- Weeks 15-16: QA, pilot launch, analytics dashboard

## 7) KPIs
- 1000 verified places (Kirkuk)
- answer latency < 3.5s p95
- routing CTR > 8%
- 30-day retention > 20%
- data freshness SLA: 90% updated within 30 days
