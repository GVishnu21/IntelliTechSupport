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

`app/main.py` exposes exactly three stateful endpoints (`/diagnose`, `/verify-step`, `/escalate`)
plus `/health`. `/escalate` is a stub — it logs the structured payload instead of forwarding to a
real care-agent system.

### Frontend: one fetch boundary, route-state-driven flow, real backend + mock hybrid

`frontend/src/services/api.ts` is the *only* module allowed to call `fetch`. It's split into two
groups, commented accordingly:
- Real backend-wired: `analyzeRouter`, `verifyStepWithPhoto`, `escalate` — these hit the actual
  FastAPI endpoints and translate the backend's snake_case/flat response shapes into the richer
  frontend types in `src/types/index.ts` (e.g. a raw `status_lights: {"internet": "blinking_red"}`
  map becomes `LedReading[]` with semantic color/state via `src/utils/led.ts`, and a raw numeric
  `confidence` becomes a bucketed `high`/`medium`/`low` — the UI never shows a raw AI confidence
  number).
- Mock-backed: `checkOutage`, `getRouterCatalog`, `getMockDiagnosis`, `getTickets`, `getTicket`,
  `getAnalytics` — there's no backend support for outage detection, a router catalog, or the
  admin surface, so these read from `src/data/mockData.ts`. When adding backend support for one of
  these later, only `api.ts` needs to change — page components never know the difference.

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
