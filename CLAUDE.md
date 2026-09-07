# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Intelli TechSupport: camera-based troubleshooting for no-internet issues. A customer points
their phone camera at a modem/router, the backend reads the equipment and its light state via
Gemini vision, returns one guided corrective step at a time, the customer verifies each step
against a fresh photo, and either resolves or escalates to a support ticket. There's also an
internal admin surface (dashboard, tickets, analytics) for support staff.

Two independent apps in one repo, talking over HTTP:

- `backend/` — FastAPI, Python
- `frontend/` — React + TypeScript + Vite, proxies `/api/*` to the backend

## Commands

**Backend** (from `backend/`, with `venv` activated — `venv\Scripts\activate` on Windows):
```
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
`--host 0.0.0.0` isn't required but matches how the frontend's LAN dev setup expects it. No
lint config, formatter, or test suite exists for the backend yet — verify backend changes by
running it and hitting the endpoints (`GET /health`, `POST /diagnose`, etc.) directly or through
the frontend.

Runs against the mock vision engine by default. To exercise the real Gemini pipeline, copy
`backend/.env.example` to `backend/.env` and set `GEMINI_API_KEY` (free tier at
https://aistudio.google.com). `USE_MOCK_VISION` in `app/config.py` is derived automatically from
whether that key is set — there's no separate flag to flip.

Escalated tickets need `DATABASE_URL` set in `backend/.env` (any Postgres — this project uses
Neon). `init_db()` runs at import time in `main.py` and creates the `tickets` table if it doesn't
exist, so there's no separate migration step. If the password has special characters, they must
be percent-encoded (`@` → `%40`) or the connection string parses wrong.

**Frontend** (from `frontend/`):
```
npm run dev              # dev server (Vite + basicSsl plugin -> serves HTTPS)
npm run build             # tsc -b && vite build — always run before considering a change done
npm run lint              # oxlint
npm test                  # vitest run — full suite, single run
npm run test:watch        # vitest watch mode
npx vitest run src/utils/led.test.ts          # single test file
npx vitest run -t "parses solid_green"        # single test by name
npx tsc -b --noEmit       # type-check only, faster than a full build
```
The dev server needs the backend running separately at `localhost:8000` for anything beyond the
static shell to work — `/api` requests are proxied there (see `vite.config.ts`).

To test the camera on a physical phone: the dev server's `server.host: true` (in
`vite.config.ts`) exposes it on the LAN over HTTPS (self-signed cert — accept the browser
warning). Find the LAN URL in the `npm run dev` output.

## Architecture

### Backend: vision engine + playbook-driven orchestration

`backend/app/vision/` defines the equipment/light-reading interface (`base.py`) with two
interchangeable implementations selected automatically by `config.py`: `mock_adapter.py` (no API
key needed) and `gemini_adapter.py` (real Gemini call). Neither the orchestration layer nor the
HTTP layer knows or cares which one is active.

`backend/app/orchestration/playbooks.py` is the single source of truth for what equipment the
system recognizes: `EQUIPMENT_CATALOG` maps an exact equipment name to its `lights`,
`fault_light`, and ordered `steps`. This dict is read by two different places, so changing it has
two effects at once:
- `gemini_adapter.py` builds its vision prompt's list of "named SKUs" from this dict at import
  time (`_CATALOG_DESCRIPTION`) — the model is told to use one of these exact names, or fall back
  to `"Generic Router/Modem"` (also a literal key in the catalog, with a broader light-reporting
  rule in the prompt) or `"unknown"`.
- `orchestration/engine.py`'s in-memory session state machine (`start_session`/`verify_step`)
  looks up `EQUIPMENT_CATALOG[reading.equipment]` to drive the step-by-step flow, and calls a
  reading "healthy" when `status_lights[fault_light] == HEALTHY_STATE` (`"solid_green"`).

So: adding a new recognized router model is a one-file change in `playbooks.py` — the prompt and
the orchestration logic both pick it up automatically. Sessions are in-memory (`_SESSIONS` dict in
`engine.py`) — restarting the backend drops all in-progress sessions, and a `session_id` the
backend doesn't recognize (e.g. one the frontend fabricated for a non-photo flow) causes
`verify_step` to escalate immediately rather than error.

`app/main.py` exposes `/diagnose`, `/verify-step`, `/escalate`, `/tickets`, `/tickets/{id}`, plus
`/health`. `/escalate` persists a real row to Postgres (`app/db.py`) rather than just logging —
`Session` (in `engine.py`) now tracks `last_status_lights` and a per-step `history` list precisely
so escalate has real data to save instead of just the equipment name. A `session_id` the backend
doesn't recognize (e.g. one the frontend fabricated for a non-photo/manual-selection flow) still
creates a ticket, just with `equipment="unknown"`, empty `status_lights`, and empty `history` —
escalation is never blocked on having a real session behind it.

`app/db.py` opens one connection per call rather than pooling (fine at this scale) and has no
migration framework — `_SCHEMA` in that file is the only source of truth for the `tickets` table
shape; edit it directly and it re-applies (idempotent `CREATE TABLE IF NOT EXISTS`) next restart.

### Frontend: one fetch boundary, route-state-driven flow, real backend + mock hybrid

`frontend/src/services/api.ts` is the *only* module allowed to call `fetch`. It's split into two
groups, commented accordingly:
- Real backend-wired: `analyzeRouter`, `verifyStepWithPhoto`, `escalate`, `getTickets`, `getTicket`
  — these hit the actual FastAPI endpoints and translate the backend's snake_case/flat response
  shapes into the richer frontend types in `src/types/index.ts` (e.g. a raw
  `status_lights: {"internet": "blinking_red"}` map becomes `LedReading[]` with semantic
  color/state via `src/utils/led.ts`, and a raw numeric `confidence` becomes a bucketed
  `high`/`medium`/`low` — the UI never shows a raw AI confidence number). Real tickets have no
  customer identity behind them (no login exists), so `toSupportTicket()` sets
  `customer: 'Anonymous customer'` rather than fabricating a fake name/number.
- Mock-backed: `checkOutage`, `getRouterCatalog`, `getMockDiagnosis`, `getAnalytics` — there's no
  backend support for outage detection, a router catalog, or the admin analytics/dashboard
  aggregates, so these read from `src/data/mockData.ts`. When adding backend support for one of
  these later, only `api.ts` needs to change — page components never know the difference.

`admin/Dashboard.tsx` and `admin/Analytics.tsx` mix both sources on the same page, chart by chart
— common issues/router models/LED patterns and the escalation trend are computed for real from
`getTickets()` via `src/utils/ticketStats.ts` (pure `deriveX()` functions, easy to unit test
without a live DB), marked with a `LiveBadge`; the metric tiles (total scans, resolution rate,
CSAT, etc.) and the resolution trend stay on `getAnalytics()`'s mock data because nothing persists
successful (non-escalated) sessions yet, so there's no real denominator to compute a rate from.
Unmarked numbers are demo data — don't assume a number without a `LiveBadge` is real just because
it sits next to one that is.

There's no global state store. Flow state (the diagnosis, the current troubleshooting step, the
session id, steps-completed count) is threaded page-to-page via React Router's navigation state
(`navigate(path, { state })` / `useLocation().state`), following the route graph
Home → Scan → Analyzing → Diagnosis → (Outage |) Troubleshoot → Verify → (Success | Escalate). A
page that finds its expected `location.state` missing redirects back to `/scan` (see the
`useEffect` guard pattern in `Diagnosis.tsx`, `Troubleshoot.tsx`, `Verify.tsx`) rather than
crashing on `undefined`. The one piece of state that isn't route-based is the flow's start
timestamp, kept in `sessionStorage` (`flowStartedAt`) since threading it through every route's
state would be unnecessary — see `Scan.tsx`/`Success.tsx`.

`Verify.tsx` re-opens the camera rather than showing a plain yes/no button, because the real
`/verify-step` endpoint determines resolution from a fresh photo, not a self-report — matching
what the endpoint actually does mattered more than the simpler UI a self-report would allow.

Design tokens (colors, font) live as a Tailwind v4 `@theme` block directly in `src/index.css` —
this project has no `tailwind.config.js` by design (CSS-first Tailwind v4 config).

### Reference docs

`docs/specs/intelli-techsupport-ui-ux-spec.md` is the full UI/UX design contract (colors,
copy, per-screen layout, all 13 customer/admin routes). Its addendum documents which parts are
wired to the real backend vs. mock data and why.

`docs/superpowers/plans/*.md` are the implementation plans this codebase was built from. The
vertical-slice plan superseded the foundation plan's task *ordering* (build one working
end-to-end flow first, then breadth) but not its type/interface decisions — both are worth
checking before assuming a piece of the architecture is undecided.
