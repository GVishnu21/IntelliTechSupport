# Intelli TechSupport — Phase 1

Camera-based troubleshooting for no-internet issues. Point a phone camera at a
modem/router, get the equipment and its light state read back, get one guided
corrective step at a time, verify each step worked, escalate to a human if it
doesn't.

Phase 1 scope covers the PRD's MUST requirements (IT-1 through IT-5) for two
equipment models (Arris SB8200, Netgear Nighthawk R7000). Outage awareness,
telemetry, per-operator branding, VoiceNexus handoff, and CSAT capture (all
SHOULD/COULD in the PRD) are intentionally out of scope for this phase.

## Architecture

- `frontend/` — React + TypeScript + Vite PWA. Camera capture via
  `getUserMedia`, calls the backend through a `/api` proxy.
- `backend/` — FastAPI. Three modules behind clean interfaces:
  - `app/vision/` — equipment + light-state recognition. `base.py` defines
    the interface; `mock_adapter.py` needs no API key and lets the whole
    app run without one; `gemini_adapter.py` calls the Gemini API when
    `GEMINI_API_KEY` is set. Swappable without touching orchestration.
  - `app/orchestration/` — per-equipment step playbooks and the
    diagnose → verify → resolve/escalate session state machine.
    In-memory session store (fine for one demo instance; would move to
    Postgres/Valkey for a real deployment).
  - `app/main.py` — the three HTTP endpoints: `/diagnose`, `/verify-step`,
    `/escalate`.

## Running it

**Backend**
```
cd backend
python -m venv venv
.\venv\Scripts\activate           # source venv/bin/activate on macOS/Linux
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```
Copy `.env.example` to `.env` first and fill in:
- `GEMINI_API_KEY` — leave unset to run against the mock vision engine (no
  key needed); set it for real recognition (free tier:
  https://aistudio.google.com).
- `DATABASE_URL` — a Postgres connection string. Needed for tickets, scans,
  and everything the admin Analytics/Dashboard pages show.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the credentials the `/admin` section's
  login page checks.

Skip `--reload` — restart manually (Ctrl+C, rerun) after editing backend
code instead. If a port ever looks stuck (a freshly-started process still
404s on a route you know exists in the code, "address already in use"),
check what's actually bound to that port before assuming it's a code bug —
`Ctrl+C` doesn't always release the OS-level socket immediately.

**Frontend**
```
cd frontend
npm install
npm run dev -- --port 5173
```
`vite.config.ts` already sets `host: true`, so this alone gives you an
HTTPS, LAN-accessible instance — open the printed URL on a device with a
camera (or a desktop browser that will prompt for webcam access). Customer
flow starts at `/`, admin login is at `/admin/login`.

## Known Phase-1 simplifications

- Sessions are in-memory — restarting the backend drops in-progress sessions.
- Equipment catalog is two hardcoded SKUs, not an operator-supplied catalog.
- Escalation is a stub — it logs the structured diagnostic payload instead of
  forwarding to a real care-agent system.
