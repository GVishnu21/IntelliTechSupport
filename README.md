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
./venv/Scripts/pip install -r requirements.txt   # venv/bin/pip on macOS/Linux
./venv/Scripts/python -m uvicorn app.main:app --port 8000
```
Runs against the mock vision engine by default — no API key needed. To use
real image recognition, copy `.env.example` to `.env` and set
`GEMINI_API_KEY` (free tier: https://aistudio.google.com).

**Frontend**
```
cd frontend
npm install
npm run dev
```
Open the printed localhost URL on a device with a camera (or a desktop
browser that will prompt for webcam access).

## Known Phase-1 simplifications

- Sessions are in-memory — restarting the backend drops in-progress sessions.
- Equipment catalog is two hardcoded SKUs, not an operator-supplied catalog.
- Escalation is a stub — it logs the structured diagnostic payload instead of
  forwarding to a real care-agent system.
