# Intelli TechSupport Vertical Slice Implementation Plan

> **Supersedes the task ORDER (not the code) in** [2026-09-04-intelli-techsupport-foundation.md](2026-09-04-intelli-techsupport-foundation.md). **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Get the real, end-to-end customer flow (camera → real Gemini diagnosis → guided fix → verify → success/escalate) running and demoable as fast as possible, before investing in the full component library, admin dashboard polish, or test coverage. Types, services, and component code drafted in the Foundation plan are still the reference implementation — only the *order* and *scope-per-task* changes.

**Architecture:** Same as the Foundation plan (React Router, `src/services/api.ts` as the only network boundary, Tailwind v4 tokens). The difference: components are built *inside* each real page as needed, not pre-extracted into a full library up front. Extraction into shared `components/ui/*` happens opportunistically when a second page needs the same thing, and is finished off in Task 11.

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4, React Router v6, lucide-react. Vitest/RTL are added in Task 11, not before.

**Spec:** [docs/specs/intelli-techsupport-ui-ux-spec.md](../../specs/intelli-techsupport-ui-ux-spec.md)

## Global Constraints

(Same as the Foundation plan — copied here so this plan is self-contained.)

- Colors exactly: background `#F8FAFC`, primary `#2563EB`, primary-dark `#1D4ED8`, success `#16A34A`, warning `#D97706`, error `#DC2626`, text `#0F172A`, text-secondary `#64748B`, border `#E2E8F0`, card `#FFFFFF`. Tailwind `@theme` tokens, never raw hex in components.
- Typography: Inter. Page title 28/32, section heading 20/28, body 16/24, small 14/20.
- 12–16px radius, soft borders, subtle shadows only, no gradients/glassmorphism/neon.
- 44×44px minimum touch targets, visible focus rings.
- LED/status color is never the only signal — pair every colored dot/badge with a text label.
- Never expose raw AI confidence numbers — only bucketed `high`/`medium`/`low`.
- `src/services/api.ts` is the only module that calls `fetch`.
- Real backend wiring: `analyzeRouter`, `verifyStepWithPhoto`, `escalate` hit the real FastAPI endpoints. `checkOutage`, `getRouterCatalog`, `getTickets`, `getAnalytics` are mock-backed (no backend support exists).
- **New for this plan:** don't build a component before a second screen needs it. One-off page-local JSX is fine through Task 10; shared extraction and full test coverage happen in Task 11.

---

### Task 1: Get the frontend running

**Goal:** `npm run dev` serves a router-based app with design tokens applied, reachable at `/`.

**Files:**
- Modify: `frontend/package.json` (add `react-router-dom`, `lucide-react`)
- Modify: `frontend/src/index.css` (design tokens — copy verbatim from Foundation plan Task 2, Step 1)
- Modify: `frontend/index.html` (title)
- Delete: `frontend/src/App.css` (dead file)
- Modify: `frontend/src/main.tsx` (wrap in `BrowserRouter`)
- Rewrite: `frontend/src/App.tsx` (route table — same routes as Foundation plan Task 13, Step 5, but pointing to a single placeholder page for everything except `/` for now; other pages are built in Tasks 5–10, not stubbed all upfront)
- Create: `frontend/src/pages/Home.tsx` (real Home screen this time — spec section 7: headline, "Scan My Router" primary CTA linking to `/scan`, "Select Router Manually" secondary)

- [ ] Install `react-router-dom` and `lucide-react`
- [ ] Add design tokens to `index.css` (colors + Inter, exactly as in Foundation Task 2)
- [ ] Set `<title>Intelli TechSupport</title>`, delete `App.css`
- [ ] Wrap `main.tsx` in `BrowserRouter`
- [ ] Write real `pages/Home.tsx` per spec section 7
- [ ] Rewrite `App.tsx` with the full route table; every non-Home route can point at a one-line `<div>Coming soon</div>` placeholder for now — do not spend time on other pages' chrome yet
- [ ] Run `npm run dev`, confirm `/` renders styled with Inter + the blue primary button, no console errors
- [ ] Commit: `feat: get frontend running with routing and design tokens`

---

### Task 2: Get the camera working on mobile

**Goal:** A phone on the same network can open the dev server over HTTPS and get a live camera preview.

**Files:**
- Modify: `frontend/vite.config.ts` (confirm `basicSsl()` and add `server.host: true` so the dev server is reachable from other devices on the LAN)
- No changes needed to `frontend/src/components/CameraCapture.tsx` — it already exists, already requests the rear camera (`facingMode: 'environment'`), already handles permission/device errors, and already downsizes + exports a base64 JPEG. Reuse it as-is.

- [ ] Add `server: { host: true }` to `vite.config.ts` (alongside the existing proxy config) so `npm run dev` prints a LAN URL (e.g. `https://192.168.x.x:5173`)
- [ ] Temporarily mount `<CameraCapture busy={false} prompt="Test" onCapture={console.log}>` on the Home page (or a throwaway route) just to verify it renders
- [ ] On your phone, connect to the same Wi-Fi network, open the LAN HTTPS URL, accept the self-signed certificate warning, and grant camera permission
- [ ] Confirm the rear camera preview appears live and tapping capture logs a base64 string to the desktop devtools console (remote-debug the phone browser, or just trust the flow and verify visually that a frame freezes on capture)
- [ ] Remove the throwaway mount once confirmed working — the real mount happens in Task 5 (Scan page)
- [ ] Commit: `chore: expose dev server on LAN for mobile camera testing`

---

### Task 3: Connect `/diagnose` to FastAPI

**Goal:** A real photo POSTed from the frontend reaches the FastAPI backend and a real `DiagnosisResponse` comes back.

**Files:**
- Create: `frontend/src/types/index.ts` — for this task, only the types needed so far: `LedColor`, `LedState`, `LedSemanticStatus`, `LedReading`, `DetectionConfidence`, `RouterDiagnosis`, `TroubleshootingStep`, `VerifyResult` (skip ticket/analytics/catalog types until Task 9–10 need them)
- Create: `frontend/src/utils/led.ts` (exactly as in Foundation plan Task 4 — this is small, pure, and needed immediately by the response mapper)
- Create: `frontend/src/services/api.ts` — for this task, only `analyzeRouter()`, `verifyStepWithPhoto()`, `escalate()` (the real-backend-wired functions from Foundation plan Task 6; skip the mock-backed functions until their tasks)

- [ ] Start the backend: `cd backend && uvicorn app.main:app --reload` (confirm `GET /health` responds — a `GEMINI_API_KEY` is already configured in `backend/.env`, so this should use the real Gemini adapter, not the mock)
- [ ] Write `types/index.ts` with the subset of types above
- [ ] Write `utils/led.ts` (copy from Foundation plan Task 4, Step 3)
- [ ] Write `services/api.ts` with `analyzeRouter`, `verifyStepWithPhoto`, `escalate` only (copy the real-backend-wired portion from Foundation plan Task 6, Step 3 — skip the mock-backed exports for now)
- [ ] From the Home page's temporary camera mount (or a quick throwaway button), call `analyzeRouter(base64)` and `console.log` the result
- [ ] Confirm in the Network tab that the request hits `/api/diagnose`, proxies to `localhost:8000`, and a real (non-mock) `RouterDiagnosis` comes back — vary lighting/angle and confirm the equipment/LED reading actually changes, proving it's live Gemini output, not a canned mock response
- [ ] Commit: `feat: wire analyzeRouter/verifyStepWithPhoto/escalate to the real backend`

---

### Task 4: Confirm Gemini vision quality end-to-end

**Goal:** Validate the real vision pipeline is accurate enough to demo before building UI around it — this is a verification task, not a coding task.

- [ ] With the backend running against the real key, photograph 2–3 different real routers/modems (or the same one in a few different states — some LEDs covered, different angles) via the Task 3 throwaway test button
- [ ] For each, confirm the returned `equipment` string is reasonable, `confidence` is sensibly high for a clear photo and lower for a blurry/dark one, and `status_lights` correctly reflects what's actually lit
- [ ] If accuracy is poor: this is a prompt/backend problem (`backend/app/vision/gemini_adapter.py`), not a frontend one — note it now and file it as a fast-follow rather than blocking the UI build
- [ ] No commit for this task (verification only) — unless a backend prompt tweak is needed, in which case commit that fix separately with `fix: improve gemini vision prompt for <specific issue>`

---

### Task 5: Build the Diagnosis screen (and Scan + Analyzing to reach it)

**Goal:** A user can go Home → Scan (real camera) → Analyzing (brief transition) → Diagnosis (real data), matching spec sections 8–10.

**Files:**
- Create: `frontend/src/pages/Scan.tsx` — mounts `CameraCapture` for real, spec section 8's copy ("Show us your router", the three tips, error state passthrough from `CameraCapture`'s existing error handling). Skip the preview/retake/upload-photo flow for v1 — capture-and-go, matching how `CameraCapture` already works; note this as a known gap vs. the full spec, to close in Task 11 or a fast-follow.
- Create: `frontend/src/pages/Analyzing.tsx` — spec section 9's copy and 4-item checklist, purely a transition screen (no real "progress" data from the backend — animate through the 4 lines on a timer while the real `analyzeRouter` call is in flight, then navigate on completion)
- Create: `frontend/src/pages/Diagnosis.tsx` — spec section 10: router card (manufacturer/model/confidence bucket), LED list, "Possible issue" card, "Start Troubleshooting" primary CTA
- Create: `frontend/src/components/diagnosis/LedStatus.tsx`, `LedStatusList.tsx`, `DiagnosisCard.tsx`, `RouterImage.tsx` (copy from Foundation plan Tasks 10–11 — these are needed by more than one screen already, so extract now rather than inline)
- Modify: `frontend/src/App.tsx` (wire real `/scan`, `/analyzing`, `/diagnosis` routes)

**State handoff between pages:** use `useNavigate(path, { state })` / `useLocation().state` to pass the captured image from Scan→Analyzing and the `RouterDiagnosis` from Analyzing→Diagnosis. No global store needed yet — if a later screen needs the diagnosis again (Troubleshoot, Escalate), keep passing it forward through route state; introduce a `TroubleshootingSessionContext` only if that gets unwieldy (judgment call at Task 6/7 time, not now).

- [ ] Build `LedStatus`, `LedStatusList`, `DiagnosisCard`, `RouterImage` (copy from Foundation plan)
- [ ] Build `Scan.tsx`: real `CameraCapture`, on capture navigate to `/analyzing` with the image in route state
- [ ] Build `Analyzing.tsx`: on mount, call `analyzeRouter(imageBase64)`; while it's in flight, cycle through the 4 checklist lines every ~600ms; on success navigate to `/diagnosis` with the `RouterDiagnosis` in route state; on failure show an inline error with "Try another photo" back to `/scan`
- [ ] Build `Diagnosis.tsx`: render `DiagnosisCard`, "Start Troubleshooting" button (wired in Task 6)
- [ ] Manually walk the flow on your phone: Home → Scan → real photo → Analyzing → Diagnosis shows real equipment/LED data
- [ ] Commit: `feat: build real Scan, Analyzing, and Diagnosis screens`

---

### Task 6: Build the Troubleshooting flow

**Goal:** From Diagnosis, "Start Troubleshooting" shows the first real step from the backend, one step at a time (spec section 12).

**Files:**
- Create: `frontend/src/pages/Troubleshoot.tsx`
- Create: `frontend/src/components/troubleshooting/TroubleshootingCard.tsx` (copy from Foundation plan Task 11)
- Create: `frontend/src/components/ui/StepIndicator.tsx`, `ProgressBar.tsx` (copy from Foundation plan Task 8 — needed here for "Step X of Y")
- Modify: `frontend/src/App.tsx` (wire `/troubleshoot`)

**Note on step count:** the real backend's `next_step.step_number` increments but never tells the frontend the *total* step count up front. Use the `EQUIPMENT_CATALOG` step-count-per-router as a rough total if you want a real denominator (Nokia/Netgear/Arris entries all have 3 steps; Generic has 3 too — see `backend/app/orchestration/playbooks.py`), or just show "Step N" without "of Total" if that mapping feels fragile. Decide based on what looks right when you see it live — don't over-engineer this.

- [ ] Build `StepIndicator`, `ProgressBar`, `TroubleshootingCard`
- [ ] Build `Troubleshoot.tsx`: receives the current `TroubleshootingStep` + `sessionId` via route state, renders the card, "I've done this" (primary, sticky bottom) → `/verify`, "Skip this step" (secondary) — since the real backend has no "skip" concept, treat skip as equivalent to "I've done this" for now (advances via the same verify call) and note this as a deliberate simplification
- [ ] Wire Diagnosis's "Start Troubleshooting" button to navigate to `/troubleshoot` with the first step from the diagnosis response
- [ ] Commit: `feat: build real Troubleshoot screen`

---

### Task 7: Build Verify + Escalate

**Goal:** Close the loop — verifying a step against a fresh photo, resolving, advancing, or escalating with a real ticket ID (spec sections 13, 15).

**Files:**
- Create: `frontend/src/pages/Verify.tsx`
- Create: `frontend/src/pages/Escalate.tsx`

**Design decision (flagged, not silently resolved):** the spec's Verify screen (section 13) is button-only ("Yes, it's fixed" / "No, still not working"), but the real `/api/verify-step` endpoint determines resolution from a fresh photo of the router's LEDs, not a self-report. Resolve this by keeping it real: Verify re-mounts `CameraCapture` ("Take another photo so we can check it worked" — this is exactly what the original working `App.tsx` already did). Skip the button-only version of this screen; it would have to fake the result. If you want the spec's exact button copy as an *additional* quick-skip affordance for demo purposes, add "Not sure — let me tell you" as a tertiary option that falls back to a self-reported yes/no, but the primary path stays photo-based so the demo shows real verification, not a rigged one.

- [ ] Build `Verify.tsx`: mounts `CameraCapture` with prompt "Once you've done that, take another photo so we can check it worked", calls `verifyStepWithPhoto(sessionId, imageBase64)`; `resolved: true` → `/success`; `escalate: true` → call `escalate(sessionId)` then → `/escalate` with the ticket ID; otherwise → back to `/troubleshoot` with the new `nextStep`
- [ ] Build `Escalate.tsx`: spec section 15 copy, shows the ticket ID returned by the real `escalate()` call, "Start Over" → `/`
- [ ] Wire `App.tsx` routes for `/verify` and `/escalate`
- [ ] Manually walk a full failure path on your phone (skip/fail every step) and confirm you land on Escalate with a real ticket ID printed by the backend (check the backend terminal log — `escalate` is currently a `print()` stub, so the ticket ID is generated but not persisted; that's expected per the Foundation plan's addendum)
- [ ] Commit: `feat: build real Verify and Escalate screens`

---

### Task 8: Build the Success screen

**Goal:** Close the happy path (spec section 14).

**Files:**
- Create: `frontend/src/pages/Success.tsx`
- Create: `frontend/src/components/ui/StarRating.tsx` (copy from Foundation plan Task 8)

- [ ] Build `StarRating`
- [ ] Build `Success.tsx`: "You're back online!", a summary card (issue text + step count, both from route state passed forward since Diagnosis — track a simple `stepsCompleted` counter as you advance through Troubleshoot→Verify loops), star rating (local state only, no backend to submit it to — that's fine, it's cosmetic for the demo), "Finish" → `/`
- [ ] Wire `App.tsx` route for `/success`
- [ ] Walk the full happy path end to end once on your phone: Home → Scan → Analyzing → Diagnosis → Troubleshoot → Verify (yes, fixed) → Success
- [ ] Commit: `feat: build real Success screen`

---

### Task 9: Add outage handling

**Goal:** Known-outage short-circuit before troubleshooting starts (spec section 11 + the routing rule "known outages should be detected before unnecessary troubleshooting").

**Files:**
- Create: `frontend/src/data/mockData.ts` — for this task, only `MOCK_OUTAGE` and `OutageInfo` type (add the rest of the file's exports in Task 10)
- Add `OutageInfo` to `types/index.ts`
- Create: `frontend/src/pages/Outage.tsx`
- Create: `frontend/src/components/diagnosis/OutageCard.tsx`
- Add `checkOutage()` to `services/api.ts`
- Modify: `frontend/src/pages/Diagnosis.tsx` — on mount, call `checkOutage()`; if `active`, redirect to `/outage` instead of rendering the diagnosis (spec: outage check happens before troubleshooting, and Diagnosis is the natural point since that's where a real equipment problem vs. a network-wide outage would first be distinguishable)

- [ ] Add `OutageInfo` type, `MOCK_OUTAGE` mock data, `OutageCard` component, `checkOutage()` service function
- [ ] Build `Outage.tsx` per spec section 11 (reassuring copy, "Try Troubleshooting Anyway" secondary escape hatch back into the normal flow)
- [ ] Wire the Diagnosis-mount outage check and the `/outage` route
- [ ] Since there's no real outage backend, temporarily flip `MOCK_OUTAGE.active` to `true` to manually verify the redirect, then flip it back to `false` before committing
- [ ] Commit: `feat: add outage detection screen`

---

### Task 10: Build a minimal Admin dashboard

**Goal:** A simplified but real admin surface — per your own call, this can be cut down if time is tight. Minimum viable: Dashboard metrics + Tickets list. Ticket Details and Analytics are stretch goals, not blockers.

**Files:**
- Finish `frontend/src/data/mockData.ts` — add `ROUTER_CATALOG`, `MOCK_TICKETS`, `MOCK_ANALYTICS` (copy from Foundation plan Task 5)
- Finish `types/index.ts` — add `TicketStatus`, `SupportTicket`, `RouterCatalogEntry`, `AnalyticsSummary`, `TrendPoint`, `LabeledCount`
- Finish `services/api.ts` — add `getTickets()`, `getTicket()`, `getAnalytics()`, `getRouterCatalog()`
- Create: `frontend/src/pages/admin/Dashboard.tsx` — spec section 16's 4 metric cards only (skip the 4 charts if time is tight — a metrics-only dashboard is still a real, useful screen)
- Create: `frontend/src/pages/admin/Tickets.tsx` — spec section 17's table + `StatusBadge` (search/filter can be a simple client-side `Array.filter` on the mock list, no need for real query params)
- Create: `frontend/src/components/ui/StatusBadge.tsx` (copy from Foundation plan Task 7)
- **Stretch, only if time allows:** `frontend/src/pages/admin/TicketDetails.tsx` (spec section 18), `frontend/src/pages/admin/Analytics.tsx` (spec section 19, can start as the 6 stat numbers with charts added later)

- [ ] Finish `mockData.ts`, `types/index.ts`, `services/api.ts` for tickets/analytics/catalog
- [ ] Build `StatusBadge`
- [ ] Build `admin/Dashboard.tsx` (metric cards, real numbers from `getAnalytics()`)
- [ ] Build `admin/Tickets.tsx` (table from `getTickets()`, click-through wired to `/admin/tickets/:id` even if that route is still a placeholder)
- [ ] Wire `/admin` and `/admin/tickets` routes
- [ ] If time allows: `admin/TicketDetails.tsx`, `admin/Analytics.tsx`
- [ ] Commit: `feat: build minimal admin dashboard and tickets list`

---

### Task 11: Tests + cleanup

**Goal:** Now that the real product exists and the actually-needed component/service shape is known (not guessed upfront), add the test safety net and tidy up.

**Files:**
- Set up Vitest exactly as in Foundation plan Task 1
- Add tests for every file in `src/utils/`, `src/services/`, `src/data/` (copy the relevant test blocks from Foundation plan Tasks 4–6 — they still apply verbatim since those modules' shapes didn't change)
- Add smoke tests for every interactive component built along the way (`VerificationButtons`-equivalent logic wherever it landed, `StarRating`, any modal/toast added, `StatusBadge`)
- Delete `frontend/src/api/client.ts` if it wasn't already removed in Task 3
- Sweep for any inline JSX duplicated across 2+ pages and extract it into `components/ui/*` at this point (this is where the "full component library" from the Foundation plan actually gets finished, informed by what real screens turned out to need — likely a smaller, more accurate set than the Foundation plan's upfront guess)
- Run `npm run build` and `npm run lint` clean

- [ ] Set up Vitest + Testing Library
- [ ] Write tests for `utils/led.ts`, `services/api.ts`, `data/mockData.ts`
- [ ] Write smoke tests for interactive components
- [ ] Extract any duplicated inline markup into shared components
- [ ] Remove dead code (`api/client.ts` if still present, any throwaway test mounts from Tasks 1–2)
- [ ] `npm run build` and `npm run lint` clean
- [ ] Final commit: `test: add coverage and clean up after vertical slice build`
