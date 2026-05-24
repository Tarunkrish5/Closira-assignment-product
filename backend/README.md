# Closira Backend — Enquiry-Handling Pipeline

A Python + FastAPI service that powers Closira's customer enquiry workflow: it
accepts inbound messages from WhatsApp / email / phone, asynchronously matches
them against business SOPs, and either qualifies the lead with a suggested
response or escalates to a human agent.

---

## Quick start

> Requires **Python 3.11+**.

```bash
# 1. Clone & enter
cd backend

# 2. Create a venv and install deps
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# 3. (Optional) copy the env template
cp .env.example .env

# 4. Run the API (auto-reload, SQLite at ./closira.db)
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the interactive Swagger UI. Every
endpoint has a description and a working example payload — you can click "Try
it out" and exercise the whole pipeline from the browser.

### Run the test suite

```bash
pytest -q
```

The suite hits every endpoint and verifies the async SOP-matching path. All 6
tests pass on a clean checkout.

### Try the API manually

Three options, pick whichever fits your workflow:

| Tool | File |
| --- | --- |
| VS Code REST Client / JetBrains HTTP | `tests/api.http` |
| Postman / Insomnia | `tests/postman_collection.json` |
| curl | see the [curl recipes](#curl-recipes) below |

---

## API surface

| Method | Path | Description |
| --- | --- | --- |
| `GET`  | `/health` | API + DB connectivity probe |
| `POST` | `/enquiry` | Create an inbound enquiry — returns `202 Accepted` + `job_id` immediately |
| `POST` | `/enquiry/{id}/followup` | Schedule a follow-up after N minutes |
| `POST` | `/enquiry/{id}/escalate` | Mark an enquiry as escalated, with a reason |
| `GET`  | `/enquiry/{id}/history` | Full conversation thread + status timeline + follow-ups |

Every request is tenant-scoped via the `X-Tenant-Id` header (defaults to
`tenant_demo`).

---

## Architecture at a glance

```
                ┌────────────────────┐
   HTTP ───────►│   FastAPI routers  │
                └─────────┬──────────┘
                          │ (thin)
                          ▼
                ┌────────────────────┐
                │  enquiry_service   │  ◄── pure domain logic
                └─────────┬──────────┘
                          │
        ┌─────────────────┼──────────────────┐
        ▼                 ▼                  ▼
  ┌──────────┐    ┌──────────────┐   ┌────────────────┐
  │  models  │    │  sop_matcher │   │   structlog    │
  │  (ORM)   │    │  (keywords)  │   │  JSON logging  │
  └──────────┘    └──────────────┘   └────────────────┘
        │
        ▼
   SQLite / Postgres
```

Routers are deliberately thin — every non-trivial action lives in
`app/services/enquiry_service.py`. That single module is the only place that
mutates the database, which means invariants (status events always written on
transition, the first conversation message always seeded, idempotent
escalation) are enforced in one place.

### Folder layout

```
backend/
├── app/
│   ├── main.py              # FastAPI app + global exception handlers
│   ├── config.py            # pydantic-settings, env-driven
│   ├── database.py          # SQLAlchemy engine, session, Base
│   ├── dependencies.py      # X-Tenant-Id dependency
│   ├── logger.py            # structlog JSON config
│   ├── models.py            # ORM models (Enquiry, ConversationMessage,
│   │                        #             StatusEvent, FollowUp)
│   ├── schemas.py           # Pydantic request/response models
│   ├── routers/
│   │   ├── enquiry.py       # The 4 enquiry endpoints
│   │   └── health.py        # The health endpoint
│   ├── services/
│   │   ├── enquiry_service.py  # Domain operations + background task
│   │   └── sop_matcher.py      # Pure keyword matcher
│   └── tasks/               # (placeholder for future Celery tasks)
├── tests/
│   ├── api.http             # REST Client file — every endpoint
│   ├── postman_collection.json
│   └── test_api.py          # pytest end-to-end tests
├── requirements.txt
├── .env.example
└── README.md
```

---

## Database schema & reasoning

Four tables form an **append-only, audit-friendly** model:

```
┌──────────────────────┐       1   *   ┌───────────────────────────┐
│      enquiries       │◄──────────────│  conversation_messages    │
│ ─────────────────── │               │ ─────────────────────────  │
│ id (uuid, pk)        │               │ id, enquiry_id, role,     │
│ tenant_id            │               │ content, created_at       │
│ channel              │               └───────────────────────────┘
│ customer_name        │       1   *   ┌───────────────────────────┐
│ message              │◄──────────────│      status_events         │
│ status               │               │ id, enquiry_id,           │
│ matched_sop          │               │ from_status, to_status,   │
│ suggested_response   │               │ reason, created_at        │
│ created_at,          │               └───────────────────────────┘
│ updated_at           │       1   *   ┌───────────────────────────┐
└──────────────────────┘◄──────────────│       followups            │
                                        │ id, enquiry_id,           │
                                        │ scheduled_for,            │
                                        │ message_template, status  │
                                        └───────────────────────────┘
```

Key choices and why:

- **`tenant_id` lives on every row.** Auth is stubbed for the assignment, but
  the schema is multi-tenant from day one. Every query in
  `enquiry_service.py` filters by both `id` *and* `tenant_id`, so a tenant
  can never read another tenant's enquiry — even by guessing a UUID.
  Composite indexes on `(tenant_id, status)` and `(tenant_id, created_at)`
  make the obvious dashboard queries fast.
- **Status timeline is derived from `status_events`, not just the
  `enquiries.status` column.** That column is convenient cached state. The
  timeline is the source of truth, which makes audits and rebuilding state
  trivial.
- **`conversation_messages` is append-only.** No edits, no deletes. The
  history endpoint becomes a single ordered read, and audit trails are
  free.
- **UUIDs as primary keys.** Lets us return the `job_id` to the client
  *before* the row is necessarily flushed to all replicas, and avoids
  leaking row counts via sequential IDs.
- **String constants, not DB enums.** Portable across SQLite and Postgres
  with no migrations. The allowed values are also encoded in Pydantic
  `Literal` types so the OpenAPI schema still advertises them.

### Why SQLite for the default?

Zero installation, zero configuration, fits on disk, and SQLAlchemy speaks
both dialects. Flipping to Postgres for production is one env var:

```bash
DATABASE_URL=postgresql+psycopg://user:pass@host:5432/closira
```

No code changes needed.

---

## Async processing — `BackgroundTasks` over Celery (for now)

The assignment lets us choose, so we chose **FastAPI `BackgroundTasks`**:

**Why BackgroundTasks now:**

- The SOP-matching job is sub-millisecond keyword logic. There's no I/O to
  parallelise across workers, no rate limit to spread across machines, no
  retry-with-backoff that benefits from a real queue.
- It works out of the box with the existing process — no Redis, no broker,
  no separate `celery -A app worker` to start for evaluation.
- The background path is already a one-line function call
  (`enquiry_service.process_enquiry`), which is exactly the same signature
  a Celery task would expose. **Promoting it to Celery later is mechanical**:

  ```python
  # celery_app.py
  app.task(name="enquiry.process")(enquiry_service.process_enquiry)
  ```

  …and the router swaps `background_tasks.add_task(...)` for
  `process_enquiry.delay(...)`.

**When we would move to Celery:**

- When SOP matching becomes a real ML call (LLM, fine-tuned classifier)
  taking seconds — those calls *do* deserve a separate worker pool so a
  burst of inbound messages can't starve the API event loop.
- When we need scheduled retries with exponential backoff on third-party
  failures (sending the WhatsApp reply, e.g.).
- When the follow-up scheduler grows up: today `followups.scheduled_for` is
  just a timestamp; a real product needs a periodic worker (Celery Beat or
  similar) to scan and dispatch them.

In short: BackgroundTasks is the right call for the assignment, and the
codebase is shaped so promoting to Celery is a small, isolated change.

---

## Logging

We use **structlog with the JSON renderer**, configured once in
`app/logger.py`. Every key event in the pipeline emits a single JSON object:

| Event | When |
| --- | --- |
| `enquiry.created` | A new enquiry has been persisted |
| `enquiry.task.processed` | Background worker finished |
| `enquiry.sop.matched` | An SOP was matched (with `sop` + `sop_label`) |
| `enquiry.escalation.triggered` | Auto-escalation because no SOP matched |
| `enquiry.escalation.manual` | Human-triggered escalation |
| `followup.scheduled` | Follow-up persisted |
| `request.validation_error` / `request.db_error` / `request.unhandled_exception` | Centralised error paths |

Sample line:

```json
{"event":"enquiry.sop.matched","level":"info","enquiry_id":"f4b8…","tenant_id":"tenant_demo","sop":"pricing_question","sop_label":"Pricing question","timestamp":"2025-05-24T12:31:08.412Z"}
```

These ship cleanly into Datadog / ELK / CloudWatch without any further
parsing.

---

## Error handling

Three global exception handlers in `app/main.py` guarantee no unhandled
exception ever reaches the client:

| Exception type | Status | Response shape |
| --- | --- | --- |
| `RequestValidationError` (Pydantic) | 422 | `{ detail, code: "validation_error", errors }` |
| `SQLAlchemyError` | 503 | `{ detail, code: "db_error" }` |
| Any other `Exception` | 500 | `{ detail, code: "internal_error" }` |

Endpoint-level errors use the same envelope shape (`detail`, optional
`code`) so clients only ever parse one structure.

Status codes used by design:

- `202 Accepted` — `POST /enquiry` (the async contract is explicit in the code)
- `201 Created` — `POST /enquiry/{id}/followup`
- `200 OK` — every read + `POST /enquiry/{id}/escalate`
- `404 Not Found` — unknown enquiry id (or one that belongs to a different tenant)
- `409 Conflict` — scheduling a follow-up on a resolved enquiry
- `422 Unprocessable Entity` — bad payload
- `503 Service Unavailable` — DB unreachable

---

## SOPs

Defined in `app/services/sop_matcher.py`. Five SOPs, with priorities so that
overlapping messages route to the most urgent bucket:

| Priority | Code | Trigger keywords |
| --- | --- | --- |
| 50 | `after_hours` | closed, open, hours, timing, when do you, still open |
| 40 | `complaint` | complaint, unhappy, refund, dissatisfied, issue, problem, terrible, bad, worst, angry, manager |
| 30 | `booking_enquiry` | book, booking, appointment, schedule, reserve, slot |
| 20 | `pricing_question` | price, cost, quote, how much, pricing, rate, charges |
| 10 | `product_info` | features, details, about, info, what is, tell me about |

If nothing matches → the enquiry is automatically escalated.

The matcher is **pure** (no DB, no I/O), making it trivial to unit-test and
trivial to swap for an ML classifier later — same function signature.

---

## curl recipes

```bash
HOST=http://localhost:8000
T=tenant_demo

# Health
curl -s $HOST/health | jq

# Create enquiry — capture the job id
JOB=$(curl -s -X POST $HOST/enquiry \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $T" \
  -d '{"channel":"whatsapp","customer_name":"Sarah M.","message":"Can I get a quote? How much does it cost?"}' \
  | jq -r .job_id)
echo "Job: $JOB"

# Read history (wait a beat for the background task)
sleep 1 && curl -s $HOST/enquiry/$JOB/history -H "X-Tenant-Id: $T" | jq

# Schedule a follow-up
curl -s -X POST $HOST/enquiry/$JOB/followup \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $T" \
  -d '{"delay_minutes":60,"message_template":"Hi {{customer_name}}!"}' | jq

# Escalate
curl -s -X POST $HOST/enquiry/$JOB/escalate \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Id: $T" \
  -d '{"reason":"Customer asked for the manager."}' | jq
```

---

## Trade-offs & known limitations

- **BackgroundTasks runs in-process.** If the API process restarts between
  accepting an enquiry and the worker firing, that enquiry stays in the
  `new` state. A real deployment would use Celery + Redis (or RQ + Postgres
  LISTEN/NOTIFY) so tasks survive restarts. The path to switch is laid out
  above.
- **No actual follow-up sender.** We persist scheduled follow-ups but
  there's no Celery Beat / cron loop reading the table and firing
  messages. That belongs in a separate worker process and was out of scope
  for the assignment.
- **SOP matcher is keyword-based.** Production would replace this with a
  small classifier or an LLM call. The `match_sop(message) -> SOP | None`
  signature is intentionally stable so the upgrade doesn't touch the
  service layer.
- **Auth is stubbed.** `X-Tenant-Id` is trusted as-is. Production would
  validate a JWT and derive the tenant from a claim. Everything else in the
  stack is already tenant-aware — the only thing to swap is the
  `get_tenant_id` dependency.
- **No rate limiting.** Would add `slowapi` (or an API-gateway rule) before
  exposing publicly.
- **`init_db()` instead of Alembic.** Fine for an assignment that ships
  with a one-table schema; production would absolutely use Alembic.
- **The history endpoint returns *everything*.** Fine for a conversation
  detail screen, but a paginated cursor would matter once threads grow long.

---

## Engineering decisions, in one place

1. **FastAPI** — async-friendly, auto-generated `/docs`, Pydantic v2 for
   robust I/O validation, well-supported in production.
2. **SQLAlchemy 2.0 typed ORM** — modern Mapped/`mapped_column` API gives
   us static typing on every column.
3. **structlog JSON logging** — machine-parseable from day one.
4. **Service layer, thin routers** — easier to test, easier to reuse from
   a future Celery worker or admin script.
5. **Multi-tenant schema from day one** — adding tenants later is more
   painful than adding tenant filters now.
6. **Append-only history tables** — audits are free, replays are free, no
   "what did this look like last Tuesday?" debugging headaches.
