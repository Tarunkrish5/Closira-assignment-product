# Closira — Engineering Intern Assignment

A complete, two-track submission for Closira's engineering-intern assignment:

- **`/backend`** — Python + FastAPI service that powers the customer-enquiry
  pipeline (REST API + async worker + SQLite + structured logging).
- **`/frontend`** — React Native + Expo mobile dashboard that gives a
  business owner an at-a-glance view of leads, escalations, and follow-ups.

Both tracks are independently runnable and independently documented. This
top-level README is a one-stop tour for evaluators; deep technical
documentation lives in [`backend/README.md`](./backend/README.md) and
[`frontend/README.md`](./frontend/README.md).

---

## Running the whole thing in two terminals

```bash
# Terminal 1 — backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
# → http://localhost:8000/docs for the interactive Swagger UI

# Terminal 2 — frontend
cd frontend
npm install
npm start
# → press i (iOS sim), a (Android sim), w (browser), or scan with Expo Go
```

Run the backend test suite end-to-end:

```bash
cd backend && pytest -q
# 6 passed
```

Type-check the frontend:

```bash
cd frontend && npm run lint
```

---

## Repo layout

```
.
├── README.md                  ← you are here
├── backend/                   ← Track 1: FastAPI + async worker
│   ├── app/
│   │   ├── main.py            ← FastAPI app, global error handlers
│   │   ├── config.py          ← pydantic-settings
│   │   ├── database.py        ← SQLAlchemy 2.0 engine + session
│   │   ├── dependencies.py    ← X-Tenant-Id dependency
│   │   ├── logger.py          ← structlog JSON renderer
│   │   ├── models.py          ← 4 ORM models, multi-tenant indexes
│   │   ├── schemas.py         ← Pydantic v2 request/response models
│   │   ├── routers/
│   │   │   ├── enquiry.py     ← 4 endpoints with rich OpenAPI docs
│   │   │   └── health.py      ← /health endpoint
│   │   └── services/
│   │       ├── enquiry_service.py  ← domain operations + BG worker
│   │       └── sop_matcher.py      ← pure keyword matcher, 5 SOPs
│   ├── tests/
│   │   ├── api.http           ← REST Client file
│   │   ├── postman_collection.json
│   │   └── test_api.py        ← 6 end-to-end tests, all green
│   ├── requirements.txt
│   ├── .env.example
│   └── README.md              ← deep dive
└── frontend/                  ← Track 2: React Native + Expo
    ├── App.tsx
    ├── src/
    │   ├── components/        ← 13 reusable components
    │   ├── screens/           ← 5 screens — Dashboard, Leads,
    │   │                        Escalations, Follow-ups, ConversationDetail
    │   ├── navigation/        ← typed bottom-tabs + stack
    │   ├── theme/             ← colors / spacing / typography tokens
    │   ├── types/             ← shared TS types (mirror backend schemas)
    │   ├── utils/             ← time helpers
    │   └── mock/              ← API-shaped mock data
    ├── package.json
    ├── tsconfig.json          ← strict mode
    └── README.md              ← deep dive
```

---

## Track 1 — Backend at a glance

**Endpoints**

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | API + DB connectivity |
| `POST` | `/enquiry` | Create an enquiry — returns `202 Accepted` + `job_id` |
| `POST` | `/enquiry/{id}/followup` | Schedule a follow-up |
| `POST` | `/enquiry/{id}/escalate` | Mark as escalated to a human agent |
| `GET` | `/enquiry/{id}/history` | Full conversation + status timeline + follow-ups |

**Async story.** `POST /enquiry` queues a `BackgroundTasks` job that:

1. Transitions the enquiry to `processing`.
2. Runs the keyword matcher against 5 hardcoded SOPs
   (`after_hours`, `complaint`, `booking_enquiry`, `pricing_question`,
   `product_info`) with priority-based selection.
3. Either qualifies the enquiry with a suggested response **or** auto-escalates
   if no SOP matched. Either way, a `status_event` is appended.
4. Logs a structured JSON event at every step.

We chose **`BackgroundTasks` over Celery** because today's work is
sub-millisecond keyword logic — Celery would add Redis + a separate worker
process for no gain. The path to promoting to Celery later is laid out in
the backend README; it's a one-file change.

**Schema.** Four tables — `enquiries`, `conversation_messages`,
`status_events`, `followups` — with `tenant_id` on every row and composite
indexes on `(tenant_id, status)` and `(tenant_id, created_at)`. Append-only
history tables make audits and replays free.

**Logging.** structlog JSON renderer, single line per event:
`enquiry.created`, `enquiry.sop.matched`, `enquiry.escalation.triggered`,
`followup.scheduled`, and so on.

**Errors.** Three global handlers ensure no unhandled exception ever
reaches the client — every error path returns the same `{detail, code}`
envelope. Status codes are deliberate: `202 / 201 / 200 / 404 / 409 / 422 /
503`.

→ Full breakdown in [`backend/README.md`](./backend/README.md).

---

## Track 2 — Frontend at a glance

**Five screens**, **four-tab bottom navigation**, **mock data shaped exactly
like the backend response**:

- **Dashboard (Home)** — 4 KPI tiles (leads today, missed enquiries, open
  escalations, follow-ups due), 3 quick-action buttons, recent-activity feed.
- **Leads** — filterable list (All / New / Qualified / Escalated), each
  card shows customer, preview, channel badge, status pill, relative time.
- **Escalations** — sorted by urgency, high-urgency cards get a red accent
  stripe, in-card "Mark resolved" action.
- **Follow-ups** — sorted by due time, clock + relative-time display,
  in-card "Mark as done".
- **Conversation Detail** (stack screen) — customer header, AI summary
  card, matched SOP, full message thread (customer / AI / system bubble
  variants), vertical-rail status timeline.

**Design system.** Centralised `theme/colors.ts` (with channel colors
WhatsApp/green, Email/blue, Call/amber and status colors New/blue,
Qualified/green, Escalated/red), 4px-based spacing scale, 6-step type
scale. Strict TypeScript, every prop and route typed.

**Styling choice.** `StyleSheet` + tokens, not NativeWind — zero build
setup, full TypeScript autocomplete on every design token, one file owns
the visual language. Reasoning in the frontend README.

**Component thinking.** Thirteen small reusable components — `ChannelBadge`,
`StatusPill`, `UrgencyPill`, `LeadCard`, `EscalationCard`, `FollowupCard`,
`StatCard`, `QuickActionButton`, `ActivityItem`, `MessageBubble`,
`TimelineEntry`, `ScreenHeader`, `SectionHeader`, `EmptyState` — and zero
monolithic screen files.

**Polish.**

- Empty states on every list — never a blank screen.
- Bottom-tab badges on Escalations / Follow-ups.
- Active vs. inactive icon variants in the tab bar.
- High-urgency cards get a red accent stripe.
- Resolved / done states dim the card and swap the action for a green pill.
- AI summary card uses a sparkle icon + brand tint to distinguish AI
  content from raw conversation.
- Mock timestamps recomputed against "now" at app start so the feed never
  feels stale.

→ Full breakdown in [`frontend/README.md`](./frontend/README.md).

---

## Walkthrough script (2–5 min video)

A suggested flow for the video walkthrough :

1. **Open `backend/README.md`** — narrate the architecture, why
   BackgroundTasks over Celery, why the schema looks the way it does.
2. **Start the backend** — `uvicorn app.main:app --reload` — open
   `http://localhost:8000/docs`. Show the 5 endpoints with their example
   payloads.
3. **Run one end-to-end flow** from `/docs`:
   - `POST /enquiry` with the pricing example → copy the `job_id`.
   - `GET /enquiry/{id}/history` → show the status transitions
     `new → processing → qualified` and the AI message that was appended.
4. **Show a structured log line** in the terminal —
   `{"event":"enquiry.sop.matched", ...}` — and note how it would land in
   Datadog/ELK as-is.
5. **`pytest -q`** — six green tests in under a second.
6. **Switch to the frontend** — `npm start`, open Expo Go.
7. **Walk every screen**:
   - Dashboard → tap a quick action → it deep-links to the relevant tab.
   - Leads → switch filters → empty state appears for a filter with no
     matches.
   - Tap a lead → conversation detail with AI summary, matched SOP,
     thread, timeline.
   - Escalations → high-urgency stripe → mark one resolved → resolved
     banner replaces the action button.
   - Follow-ups → mark one as done → strike-through + green pill.
8. **Wrap up** — point at one trade-off explicitly (e.g. "Celery is the
   right next step; here's the one-file path").

---

## Submission checklist

| Deliverable | Backend | Frontend |
| --- | --- | --- |
| GitHub repo with clean folder structure | ✅ | ✅ |
| README with setup, design reasoning, trade-offs | [✅](./backend/README.md) | [✅](./frontend/README.md) |
| Combined README at the root | ✅ (this file) | ✅ (this file) |
| All 5 backend endpoints with `/docs` examples | ✅ | — |
| Async background task (BackgroundTasks) | ✅ | — |
| Structured JSON logging | ✅ | — |
| Postman collection / `.http` file | ✅ | — |
| Six end-to-end tests, green | ✅ | — |
| Bottom-tab navigation, 4 tabs | — | ✅ |
| All 5 screens | — | ✅ |
| Mock data structured as if from the API (in `/mock`) | — | ✅ |
| Channel + status badges, consistent everywhere | — | ✅ |
| Empty states | — | ✅ |
| 2–5 min video walkthrough | (done using the scripts above) | (done using the scripts above) |
