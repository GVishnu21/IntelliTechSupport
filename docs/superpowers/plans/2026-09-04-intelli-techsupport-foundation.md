# Intelli TechSupport Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the design system, shared types, mock data, API service layer, and reusable component library for the Intelli TechSupport frontend, plus a fully-routed (but placeholder-content) page skeleton covering every route in the spec — so Plan B (customer flow) and Plan C (admin flow) can each build real screens on a stable, tested foundation.

**Architecture:** React Router v6 drives navigation; a thin `src/services/api.ts` layer is the only place that talks to the network, wiring `analyzeRouter`/`verifyStepWithPhoto`/`escalate` to the real FastAPI backend and everything else (outage, tickets, analytics, router catalog) to `src/data/mockData.ts`. Presentational components live under `src/components/{ui,diagnosis,troubleshooting,layout}`, typed against `src/types/index.ts`, styled entirely with Tailwind v4 theme tokens (no raw hex in components).

**Tech Stack:** React 19, TypeScript, Vite 8, Tailwind CSS v4 (CSS-first `@theme`, no `tailwind.config.js`), React Router v6, lucide-react, Vitest + React Testing Library.

**Spec:** [docs/specs/intelli-techsupport-ui-ux-spec.md](../../specs/intelli-techsupport-ui-ux-spec.md) (sections 1–5, 20, 21, 24, 26, 27, 29 and the Addendum are what this plan implements; sections 6–19, 22–23, 25, 28 are implemented by the follow-up Customer Flow and Admin Flow plans on top of this foundation).

## Global Constraints

- Colors are exactly: background `#F8FAFC`, primary `#2563EB`, primary-dark `#1D4ED8`, success `#16A34A`, warning `#D97706`, error `#DC2626`, text `#0F172A`, text-secondary `#64748B`, border `#E2E8F0`, card `#FFFFFF`. Defined once as Tailwind `@theme` tokens; components reference `bg-primary`/`text-error`/etc., never raw hex.
- Typography is Inter. Page title 28/32, section heading 20/28, body 16/24, small 14/20.
- Border radius 12–16px, soft borders, subtle shadows only (no glassmorphism, no gradients, no neon).
- Every interactive element has a minimum 44×44px touch target and a visible focus ring (`focus-visible:outline`).
- LED/status color is never the only signal — every colored dot/badge carries a text label next to it (spec section 24).
- Never expose raw AI confidence numbers to the customer — only the bucketed `high`/`medium`/`low` label (spec section 10).
- `src/services/api.ts` is the only module that calls `fetch`. No component calls `fetch` directly.
- Real backend wiring: `analyzeRouter`, `verifyStepWithPhoto`, `escalate` hit the real FastAPI endpoints (`/api/diagnose`, `/api/verify-step`, `/api/escalate`) proxied via `vite.config.ts`. `checkOutage`, `getRouterCatalog`, `getMockDiagnosis`, `createSupportTicket`, `getTickets`, `getTicket`, `getAnalytics` return `src/data/mockData.ts` data — there is no backend support for outages, the router catalog, or the admin surface yet (see the spec's Addendum).
- Test calibration: every function with branching logic, computed output, or a user-triggered callback (utils, services, mock data invariants, interactive components) gets a Vitest + React Testing Library test. Purely static presentational markup gets one smoke test asserting required text/ARIA roles render — not exhaustive style assertions.
- Tailwind v4 is CSS-first: theme tokens go in `src/index.css` under `@theme { ... }`. Do not create a `tailwind.config.js`.

---

## File Structure

```
frontend/
├── index.html                              (edit: title)
├── vite.config.ts                          (edit: vitest config)
├── package.json                            (edit: deps + test scripts)
├── src/
│   ├── main.tsx                            (edit: wrap in BrowserRouter)
│   ├── App.tsx                             (rewrite: route table)
│   ├── App.test.tsx                        (new)
│   ├── index.css                           (rewrite: design tokens)
│   ├── App.css                             (delete: dead file)
│   ├── api/client.ts                       (delete: superseded by services/api.ts)
│   ├── test/setup.ts                       (new)
│   ├── test/sanity.test.ts                 (new)
│   ├── types/index.ts                      (new: shared types)
│   ├── utils/led.ts                        (new: LED parsing/semantics)
│   ├── utils/led.test.ts                   (new)
│   ├── data/mockData.ts                    (new: catalog, outage, tickets, analytics)
│   ├── data/mockData.test.ts               (new)
│   ├── services/api.ts                     (new: real + mock API layer)
│   ├── services/api.test.ts                (new)
│   ├── components/CameraCapture.tsx        (unchanged — reused as-is by Plan B)
│   ├── components/ui/Button.tsx            (new)
│   ├── components/ui/SecondaryButton.tsx   (new)
│   ├── components/ui/Card.tsx              (new)
│   ├── components/ui/StatusBadge.tsx       (new)
│   ├── components/ui/ProgressBar.tsx       (new)
│   ├── components/ui/StepIndicator.tsx     (new)
│   ├── components/ui/StarRating.tsx        (new)
│   ├── components/ui/LoadingState.tsx      (new)
│   ├── components/ui/ErrorState.tsx        (new)
│   ├── components/ui/EmptyState.tsx        (new)
│   ├── components/ui/Toast.tsx             (new)
│   ├── components/ui/Modal.tsx             (new)
│   ├── components/ui/*.test.tsx            (new, one per component above)
│   ├── components/diagnosis/LedStatus.tsx  (new)
│   ├── components/diagnosis/LedStatusList.tsx (new)
│   ├── components/diagnosis/RouterImage.tsx (new)
│   ├── components/diagnosis/DiagnosisCard.tsx (new)
│   ├── components/diagnosis/OutageCard.tsx  (new)
│   ├── components/diagnosis/*.test.tsx      (new)
│   ├── components/troubleshooting/TroubleshootingCard.tsx (new)
│   ├── components/troubleshooting/VerificationButtons.tsx (new)
│   ├── components/troubleshooting/*.test.tsx (new)
│   ├── components/layout/Header.tsx        (new)
│   ├── components/layout/MobileHeader.tsx  (new)
│   ├── components/layout/CustomerLayout.tsx (new)
│   ├── components/layout/*.test.tsx        (new)
│   └── pages/
│       ├── Home.tsx, Scan.tsx, Analyzing.tsx, Diagnosis.tsx, Outage.tsx,
│       │   Troubleshoot.tsx, Verify.tsx, Success.tsx, Escalate.tsx  (new, placeholders)
│       └── admin/Dashboard.tsx, Tickets.tsx, TicketDetails.tsx, Analytics.tsx (new, placeholders)
```

Out of scope for this plan (deferred to Plan B / Plan C): `CameraFrame`, `TicketCard`, `MetricCard`, `ChartCard`, `Sidebar`, real screen content for every page listed above, the manual-router-selection modal, admin layout.

---

### Task 1: Test tooling and core dependencies

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/test/sanity.test.ts`

**Interfaces:**
- Produces: `npm test` (single run) and `npm run test:watch` scripts every later task's tests rely on.

- [ ] **Step 1: Install dependencies**

```bash
cd frontend
npm install react-router-dom lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

- [ ] **Step 2: Configure Vitest in `vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), tailwindcss(), basicSsl()],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },

  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
```

- [ ] **Step 3: Write the test setup file**

`frontend/src/test/setup.ts`:
```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 4: Write a sanity test**

`frontend/src/test/sanity.test.ts`:
```ts
import { describe, expect, it } from 'vitest'

describe('vitest setup', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

- [ ] **Step 5: Add test scripts to `package.json`**

In the `"scripts"` block, add:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 6: Run the test suite**

Run: `npm test`
Expected: 1 passed test (`vitest setup > runs`).

- [ ] **Step 7: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/vite.config.ts frontend/src/test
git commit -m "chore: add vitest + testing-library and react-router/lucide deps"
```

---

### Task 2: Design tokens

**Files:**
- Modify: `frontend/src/index.css`
- Modify: `frontend/index.html`
- Delete: `frontend/src/App.css` (dead file — not imported anywhere)

**Interfaces:**
- Produces: Tailwind utility classes `bg-background`, `bg-primary`, `bg-card`, `text-primary`, `text-error`, `text-success`, `text-warning`, `text-text`, `text-text-secondary`, `border-border`, etc. — every later component task uses these, never raw hex.

- [ ] **Step 1: Replace `frontend/src/index.css`**

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

@theme {
  --color-background: #F8FAFC;
  --color-primary: #2563EB;
  --color-primary-dark: #1D4ED8;
  --color-success: #16A34A;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-text: #0F172A;
  --color-text-secondary: #64748B;
  --color-border: #E2E8F0;
  --color-card: #FFFFFF;

  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
}

:root {
  color-scheme: light;
}

body {
  margin: 0;
  min-height: 100svh;
  background-color: #F8FAFC;
  font-family: var(--font-sans);
}
```

- [ ] **Step 2: Update the page title in `frontend/index.html`**

Change `<title>frontend</title>` to `<title>Intelli TechSupport</title>`.

- [ ] **Step 3: Delete the dead CSS file**

```bash
rm frontend/src/App.css
```

- [ ] **Step 4: Verify the build still compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds with no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/index.css frontend/index.html
git rm frontend/src/App.css
git commit -m "feat: add Intelli TechSupport design tokens (colors, Inter font)"
```

---

### Task 3: Shared types

**Files:**
- Create: `frontend/src/types/index.ts`

**Interfaces:**
- Produces: `LedColor`, `LedState`, `LedSemanticStatus`, `LedReading`, `DetectionConfidence`, `RouterDiagnosis`, `TroubleshootingStep`, `VerifyResult`, `OutageInfo`, `TicketStatus`, `TroubleshootingHistoryItem`, `SupportTicket`, `RouterCatalogEntry`, `AnalyticsSummary` — every subsequent task imports from this file.

- [ ] **Step 1: Write the types**

`frontend/src/types/index.ts`:
```ts
export type LedColor = 'green' | 'red' | 'amber' | 'gray'
export type LedState = 'solid' | 'blinking' | 'off'
export type LedSemanticStatus = 'normal' | 'problem' | 'attention' | 'unknown'

export interface LedReading {
  name: string
  color: LedColor
  state: LedState
}

export type DetectionConfidence = 'high' | 'medium' | 'low'

export interface RouterDiagnosis {
  sessionId: string
  manufacturer: string
  model: string
  confidence: DetectionConfidence
  issue: string
  lowConfidence: boolean
  lights: LedReading[]
}

export interface TroubleshootingStep {
  stepNumber: number
  totalSteps: number
  title: string
  description: string
  checklist: string[]
  note?: string
}

export interface VerifyResult {
  resolved: boolean
  escalate: boolean
  nextStep: TroubleshootingStep | null
}

export interface OutageInfo {
  active: boolean
  area: string
  estimatedRestoration: string
  message: string
}

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'escalated'

export interface TroubleshootingHistoryItem {
  step: string
  outcome: 'completed' | 'failed' | 'skipped'
}

export interface SupportTicket {
  id: string
  customer: string
  issue: string
  router: string
  status: TicketStatus
  createdAt: string
  ledStatus: LedReading[]
  history: TroubleshootingHistoryItem[]
  aiDiagnosis: string
}

export interface RouterCatalogEntry {
  id: string
  provider: string
  brand: string
  model: string
}

export interface TrendPoint {
  date: string
  value: number
}

export interface LabeledCount {
  label: string
  count: number
}

export interface AnalyticsSummary {
  totalScans: number
  resolutionRate: number
  escalationRate: number
  avgResolutionTime: string
  firstContactResolution: number
  repeatContactRate: number
  csat: number
  resolutionTrend: TrendPoint[]
  escalationTrend: TrendPoint[]
  commonIssues: LabeledCount[]
  commonRouterModels: LabeledCount[]
}
```

- [ ] **Step 2: Verify it type-checks**

Run: `cd frontend && npx tsc -b --noEmit`
Expected: no errors (no other file imports this yet, so this only checks the file parses).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/index.ts
git commit -m "feat: add shared frontend types"
```

---

### Task 4: LED status utility

**Files:**
- Create: `frontend/src/utils/led.ts`
- Test: `frontend/src/utils/led.test.ts`

**Interfaces:**
- Consumes: `LedColor`, `LedState`, `LedSemanticStatus`, `LedReading` from `../types` (Task 3).
- Produces: `parseLedString(raw: string): { color: LedColor; state: LedState }`, `ledSemanticStatus(color, state): LedSemanticStatus`, `ledStatusLabel(status): string`, `ledDisplayName(key: string): string`, `parseLedReadings(statusLights: Record<string,string>): LedReading[]` — consumed by `services/api.ts` (Task 6) and `components/diagnosis/LedStatus.tsx` (Task 10).

- [ ] **Step 1: Write the failing tests**

`frontend/src/utils/led.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { ledDisplayName, ledSemanticStatus, ledStatusLabel, parseLedReadings, parseLedString } from './led'

describe('parseLedString', () => {
  it('parses solid_green', () => {
    expect(parseLedString('solid_green')).toEqual({ color: 'green', state: 'solid' })
  })

  it('parses blinking_red', () => {
    expect(parseLedString('blinking_red')).toEqual({ color: 'red', state: 'blinking' })
  })

  it('treats "off" as gray/off', () => {
    expect(parseLedString('off')).toEqual({ color: 'gray', state: 'off' })
  })

  it('falls back to gray for an unrecognized color', () => {
    expect(parseLedString('solid_purple')).toEqual({ color: 'gray', state: 'solid' })
  })
})

describe('ledSemanticStatus', () => {
  it('green is normal', () => {
    expect(ledSemanticStatus('green', 'solid')).toBe('normal')
  })

  it('red is problem', () => {
    expect(ledSemanticStatus('red', 'blinking')).toBe('problem')
  })

  it('amber is attention', () => {
    expect(ledSemanticStatus('amber', 'blinking')).toBe('attention')
  })

  it('gray or off is unknown', () => {
    expect(ledSemanticStatus('gray', 'off')).toBe('unknown')
    expect(ledSemanticStatus('green', 'off')).toBe('unknown')
  })
})

describe('ledStatusLabel', () => {
  it('labels every semantic status', () => {
    expect(ledStatusLabel('normal')).toBe('Normal')
    expect(ledStatusLabel('problem')).toBe('Problem')
    expect(ledStatusLabel('attention')).toBe('Attention')
    expect(ledStatusLabel('unknown')).toBe('Unknown')
  })
})

describe('ledDisplayName', () => {
  it('maps known backend light keys to friendly names', () => {
    expect(ledDisplayName('power')).toBe('Power')
    expect(ledDisplayName('internet')).toBe('Internet')
    expect(ledDisplayName('online')).toBe('Internet')
    expect(ledDisplayName('wifi')).toBe('Wi-Fi')
  })

  it('capitalizes unknown keys as a fallback', () => {
    expect(ledDisplayName('downstream')).toBe('Signal')
    expect(ledDisplayName('mystery')).toBe('Mystery')
  })
})

describe('parseLedReadings', () => {
  it('converts a backend status_lights map into LedReading[]', () => {
    const result = parseLedReadings({ power: 'solid_green', internet: 'blinking_red' })
    expect(result).toEqual([
      { name: 'Power', color: 'green', state: 'solid' },
      { name: 'Internet', color: 'red', state: 'blinking' },
    ])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — `./led` module not found.

- [ ] **Step 3: Implement**

`frontend/src/utils/led.ts`:
```ts
import type { LedColor, LedReading, LedSemanticStatus, LedState } from '../types'

const KNOWN_COLORS: LedColor[] = ['green', 'red', 'amber', 'gray']

export function parseLedString(raw: string): { color: LedColor; state: LedState } {
  if (!raw || raw === 'off') {
    return { color: 'gray', state: 'off' }
  }
  const [statePart, colorPart] = raw.split('_')
  const state: LedState = statePart === 'blinking' ? 'blinking' : 'solid'
  const color: LedColor = (KNOWN_COLORS as string[]).includes(colorPart)
    ? (colorPart as LedColor)
    : 'gray'
  return { color, state }
}

export function ledSemanticStatus(color: LedColor, state: LedState): LedSemanticStatus {
  if (color === 'gray' || state === 'off') return 'unknown'
  if (color === 'green') return 'normal'
  if (color === 'amber') return 'attention'
  return 'problem'
}

export function ledStatusLabel(status: LedSemanticStatus): string {
  switch (status) {
    case 'normal':
      return 'Normal'
    case 'problem':
      return 'Problem'
    case 'attention':
      return 'Attention'
    default:
      return 'Unknown'
  }
}

const LIGHT_DISPLAY_NAMES: Record<string, string> = {
  power: 'Power',
  online: 'Internet',
  internet: 'Internet',
  downstream: 'Signal',
  wifi: 'Wi-Fi',
  los: 'LOS',
}

export function ledDisplayName(key: string): string {
  const known = LIGHT_DISPLAY_NAMES[key.toLowerCase()]
  if (known) return known
  return key.charAt(0).toUpperCase() + key.slice(1)
}

export function parseLedReadings(statusLights: Record<string, string>): LedReading[] {
  return Object.entries(statusLights).map(([key, raw]) => {
    const { color, state } = parseLedString(raw)
    return { name: ledDisplayName(key), color, state }
  })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS — all `led.test.ts` cases green.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/utils/led.ts frontend/src/utils/led.test.ts
git commit -m "feat: add LED status parsing/semantics utility"
```

---

### Task 5: Mock data

**Files:**
- Create: `frontend/src/data/mockData.ts`
- Test: `frontend/src/data/mockData.test.ts`

**Interfaces:**
- Consumes: `RouterCatalogEntry`, `OutageInfo`, `SupportTicket`, `AnalyticsSummary`, `RouterDiagnosis` from `../types` (Task 3).
- Produces: `ROUTER_CATALOG: RouterCatalogEntry[]`, `MOCK_OUTAGE: OutageInfo`, `mockDiagnosisForRouter(entry): RouterDiagnosis`, `MOCK_TICKETS: SupportTicket[]`, `MOCK_ANALYTICS: AnalyticsSummary` — consumed by `services/api.ts` (Task 6).

- [ ] **Step 1: Write the failing tests**

`frontend/src/data/mockData.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { MOCK_ANALYTICS, MOCK_OUTAGE, MOCK_TICKETS, ROUTER_CATALOG, mockDiagnosisForRouter } from './mockData'

describe('ROUTER_CATALOG', () => {
  it('has unique ids', () => {
    const ids = ROUTER_CATALOG.map((r) => r.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every entry has provider, brand, and model', () => {
    for (const entry of ROUTER_CATALOG) {
      expect(entry.provider).toBeTruthy()
      expect(entry.brand).toBeTruthy()
      expect(entry.model).toBeTruthy()
    }
  })
})

describe('mockDiagnosisForRouter', () => {
  it('uses the catalog entry brand/model', () => {
    const entry = ROUTER_CATALOG[0]
    const diagnosis = mockDiagnosisForRouter(entry)
    expect(diagnosis.manufacturer).toBe(entry.brand)
    expect(diagnosis.model).toBe(entry.model)
    expect(diagnosis.lights.length).toBeGreaterThan(0)
  })
})

describe('MOCK_OUTAGE', () => {
  it('has a restoration estimate and area', () => {
    expect(MOCK_OUTAGE.estimatedRestoration).toBeTruthy()
    expect(MOCK_OUTAGE.area).toBeTruthy()
  })
})

describe('MOCK_TICKETS', () => {
  const validStatuses = new Set(['open', 'in_progress', 'resolved', 'escalated'])

  it('every ticket has a valid status', () => {
    for (const ticket of MOCK_TICKETS) {
      expect(validStatuses.has(ticket.status)).toBe(true)
    }
  })

  it('every ticket has a non-empty history', () => {
    for (const ticket of MOCK_TICKETS) {
      expect(ticket.history.length).toBeGreaterThan(0)
    }
  })
})

describe('MOCK_ANALYTICS', () => {
  it('rates are between 0 and 1', () => {
    expect(MOCK_ANALYTICS.resolutionRate).toBeGreaterThanOrEqual(0)
    expect(MOCK_ANALYTICS.resolutionRate).toBeLessThanOrEqual(1)
    expect(MOCK_ANALYTICS.escalationRate).toBeGreaterThanOrEqual(0)
    expect(MOCK_ANALYTICS.escalationRate).toBeLessThanOrEqual(1)
  })

  it('has non-empty trend series', () => {
    expect(MOCK_ANALYTICS.resolutionTrend.length).toBeGreaterThan(0)
    expect(MOCK_ANALYTICS.escalationTrend.length).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — `./mockData` module not found.

- [ ] **Step 3: Implement**

`frontend/src/data/mockData.ts`:
```ts
import type {
  AnalyticsSummary,
  OutageInfo,
  RouterCatalogEntry,
  RouterDiagnosis,
  SupportTicket,
} from '../types'

export const ROUTER_CATALOG: RouterCatalogEntry[] = [
  { id: 'airtel-nokia-g2425g', provider: 'Airtel', brand: 'Nokia', model: 'G-2425G' },
  { id: 'jio-nokia-xs2426', provider: 'Jio', brand: 'Nokia', model: 'XS-2426' },
  { id: 'act-huawei-hg8145v5', provider: 'ACT', brand: 'Huawei', model: 'HG8145V5' },
  { id: 'other-tplink-archer-c6', provider: 'Other', brand: 'TP-Link', model: 'Archer C6' },
  { id: 'other-arris-sb8200', provider: 'Other', brand: 'Arris', model: 'SB8200' },
  { id: 'other-netgear-r7000', provider: 'Other', brand: 'Netgear', model: 'Nighthawk R7000' },
]

export const MOCK_OUTAGE: OutageInfo = {
  active: false,
  area: 'Your area',
  estimatedRestoration: '4:30 PM',
  message: "We've detected a known service issue affecting your area.",
}

export function mockDiagnosisForRouter(entry: RouterCatalogEntry): RouterDiagnosis {
  return {
    sessionId: `manual-${entry.id}-${Date.now()}`,
    manufacturer: entry.brand,
    model: entry.model,
    confidence: 'high',
    issue: "We're not receiving a fiber signal.",
    lowConfidence: false,
    lights: [
      { name: 'Power', color: 'green', state: 'solid' },
      { name: 'Internet', color: 'red', state: 'off' },
      { name: 'Wi-Fi', color: 'green', state: 'solid' },
      { name: 'LOS', color: 'red', state: 'blinking' },
    ],
  }
}

export const MOCK_TICKETS: SupportTicket[] = [
  {
    id: 'TS-1024',
    customer: 'Customer #1024',
    issue: 'Fiber signal problem',
    router: 'Nokia G-2425G',
    status: 'open',
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    ledStatus: [
      { name: 'Power', color: 'green', state: 'solid' },
      { name: 'Internet', color: 'gray', state: 'off' },
      { name: 'Wi-Fi', color: 'green', state: 'solid' },
      { name: 'LOS', color: 'red', state: 'blinking' },
    ],
    history: [
      { step: 'Restart router', outcome: 'completed' },
      { step: 'Check fiber cable', outcome: 'completed' },
      { step: 'Wait 2 minutes', outcome: 'failed' },
    ],
    aiDiagnosis: 'Possible fiber signal loss.',
  },
  {
    id: 'TS-1023',
    customer: 'Customer #1023',
    issue: 'Wi-Fi disabled',
    router: 'TP-Link Archer C6',
    status: 'resolved',
    createdAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    ledStatus: [
      { name: 'Power', color: 'green', state: 'solid' },
      { name: 'Wi-Fi', color: 'amber', state: 'blinking' },
    ],
    history: [{ step: 'Restart router', outcome: 'completed' }],
    aiDiagnosis: 'Wi-Fi radio was disabled by a software toggle.',
  },
  {
    id: 'TS-1022',
    customer: 'Customer #1022',
    issue: 'Power issue',
    router: 'Netgear Nighthawk R7000',
    status: 'escalated',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    ledStatus: [{ name: 'Power', color: 'gray', state: 'off' }],
    history: [
      { step: 'Check power cable', outcome: 'failed' },
      { step: 'Try a different outlet', outcome: 'failed' },
    ],
    aiDiagnosis: 'Device is not receiving power; likely a hardware fault.',
  },
]

export const MOCK_ANALYTICS: AnalyticsSummary = {
  totalScans: 1248,
  resolutionRate: 0.72,
  escalationRate: 0.18,
  avgResolutionTime: '4m 32s',
  firstContactResolution: 0.68,
  repeatContactRate: 0.09,
  csat: 4.4,
  resolutionTrend: [
    { date: '2026-08-29', value: 0.65 },
    { date: '2026-08-30', value: 0.68 },
    { date: '2026-08-31', value: 0.7 },
    { date: '2026-09-01', value: 0.69 },
    { date: '2026-09-02', value: 0.71 },
    { date: '2026-09-03', value: 0.73 },
    { date: '2026-09-04', value: 0.72 },
  ],
  escalationTrend: [
    { date: '2026-08-29', value: 0.22 },
    { date: '2026-08-30', value: 0.2 },
    { date: '2026-08-31', value: 0.19 },
    { date: '2026-09-01', value: 0.21 },
    { date: '2026-09-02', value: 0.18 },
    { date: '2026-09-03', value: 0.17 },
    { date: '2026-09-04', value: 0.18 },
  ],
  commonIssues: [
    { label: 'LOS / Fiber signal', count: 412 },
    { label: 'Internet disconnected', count: 298 },
    { label: 'Wi-Fi disabled', count: 187 },
    { label: 'Power issue', count: 94 },
  ],
  commonRouterModels: [
    { label: 'Nokia G-2425G', count: 356 },
    { label: 'Huawei HG8145V5', count: 241 },
    { label: 'TP-Link Archer C6', count: 189 },
    { label: 'Netgear Nighthawk R7000', count: 122 },
  ],
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/data/mockData.ts frontend/src/data/mockData.test.ts
git commit -m "feat: add mock data for outage, tickets, analytics, and router catalog"
```

---

### Task 6: API service layer

**Files:**
- Create: `frontend/src/services/api.ts`
- Test: `frontend/src/services/api.test.ts`
- Delete: `frontend/src/api/client.ts` (superseded — no remaining importer once Task 13 rewrites `App.tsx`, but delete now since nothing outside this task references it after this point)

**Interfaces:**
- Consumes: `parseLedReadings` from `../utils/led` (Task 4); `RouterDiagnosis`, `VerifyResult`, `OutageInfo`, `SupportTicket`, `AnalyticsSummary`, `RouterCatalogEntry`, `DetectionConfidence`, `TroubleshootingStep` from `../types` (Task 3); `MOCK_OUTAGE`, `MOCK_TICKETS`, `MOCK_ANALYTICS`, `ROUTER_CATALOG`, `mockDiagnosisForRouter` from `../data/mockData` (Task 5).
- Produces: `analyzeRouter(imageBase64): Promise<RouterDiagnosis>`, `verifyStepWithPhoto(sessionId, imageBase64): Promise<VerifyResult>`, `escalate(sessionId): Promise<{ ticketId: string }>`, `getRouterCatalog(): RouterCatalogEntry[]`, `getMockDiagnosis(entry): RouterDiagnosis`, `checkOutage(): Promise<OutageInfo>`, `createSupportTicket(diagnosis): Promise<{ ticketId: string }>`, `getTickets(): Promise<SupportTicket[]>`, `getTicket(id): Promise<SupportTicket | undefined>`, `getAnalytics(): Promise<AnalyticsSummary>` — every page component in Plan B/C calls only these.

- [ ] **Step 1: Write the failing tests**

`frontend/src/services/api.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  analyzeRouter,
  checkOutage,
  escalate,
  getAnalytics,
  getMockDiagnosis,
  getTicket,
  getTickets,
  verifyStepWithPhoto,
} from './api'
import { ROUTER_CATALOG } from '../data/mockData'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('analyzeRouter', () => {
  it('maps a real backend diagnosis response into RouterDiagnosis', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        session_id: 'abc-123',
        equipment: 'Netgear Nighthawk R7000',
        confidence: 0.92,
        status_lights: { power: 'solid_green', internet: 'blinking_red', wifi: 'solid_green' },
        next_step: { instruction: 'Restart your router.', step_number: 1 },
        low_confidence: false,
      }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await analyzeRouter('base64-image-data')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/diagnose',
      expect.objectContaining({ method: 'POST' })
    )
    expect(result.sessionId).toBe('abc-123')
    expect(result.manufacturer).toBe('Netgear')
    expect(result.model).toBe('Nighthawk R7000')
    expect(result.confidence).toBe('high')
    expect(result.lowConfidence).toBe(false)
    expect(result.issue).toBe("We're not receiving an internet signal.")
    expect(result.lights).toEqual([
      { name: 'Power', color: 'green', state: 'solid' },
      { name: 'Internet', color: 'red', state: 'blinking' },
      { name: 'Wi-Fi', color: 'green', state: 'solid' },
    ])
  })

  it('bucket a low confidence score as low', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          session_id: 'x',
          equipment: 'unknown',
          confidence: 0.1,
          status_lights: {},
          next_step: null,
          low_confidence: true,
        }),
      })
    )

    const result = await analyzeRouter('img')
    expect(result.confidence).toBe('low')
    expect(result.manufacturer).toBe('Unknown')
    expect(result.lowConfidence).toBe(true)
  })

  it('throws when the backend responds with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    await expect(analyzeRouter('img')).rejects.toThrow('Request failed: 500')
  })
})

describe('verifyStepWithPhoto', () => {
  it('maps a resolved verify-step response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resolved: true,
          escalate: false,
          next_step: null,
          status_lights: { internet: 'solid_green' },
        }),
      })
    )

    const result = await verifyStepWithPhoto('session-1', 'img')
    expect(result).toEqual({ resolved: true, escalate: false, nextStep: null })
  })

  it('maps a next-step verify-step response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          resolved: false,
          escalate: false,
          next_step: { instruction: 'Check the cable.', step_number: 2 },
          status_lights: {},
        }),
      })
    )

    const result = await verifyStepWithPhoto('session-1', 'img')
    expect(result.resolved).toBe(false)
    expect(result.nextStep).toEqual({
      stepNumber: 2,
      totalSteps: 2,
      title: 'Step 2',
      description: 'Check the cable.',
      checklist: [],
    })
  })
})

describe('escalate', () => {
  it('returns a ticketId from the real backend', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ticket_id: 'TS-9001' }) })
    )
    const result = await escalate('session-1')
    expect(result).toEqual({ ticketId: 'TS-9001' })
  })
})

describe('mock-backed functions', () => {
  it('checkOutage resolves the mock outage', async () => {
    const outage = await checkOutage()
    expect(outage.area).toBe('Your area')
  })

  it('getMockDiagnosis matches the given catalog entry', () => {
    const entry = ROUTER_CATALOG[0]
    const diagnosis = getMockDiagnosis(entry)
    expect(diagnosis.manufacturer).toBe(entry.brand)
  })

  it('getTickets resolves the mock ticket list', async () => {
    const tickets = await getTickets()
    expect(tickets.length).toBeGreaterThan(0)
  })

  it('getTicket finds a ticket by id and returns undefined for unknown ids', async () => {
    const tickets = await getTickets()
    const found = await getTicket(tickets[0].id)
    expect(found?.id).toBe(tickets[0].id)
    expect(await getTicket('does-not-exist')).toBeUndefined()
  })

  it('getAnalytics resolves the mock analytics summary', async () => {
    const analytics = await getAnalytics()
    expect(analytics.totalScans).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — `./api` module not found.

- [ ] **Step 3: Implement**

`frontend/src/services/api.ts`:
```ts
import type {
  AnalyticsSummary,
  DetectionConfidence,
  OutageInfo,
  RouterCatalogEntry,
  RouterDiagnosis,
  SupportTicket,
  TroubleshootingStep,
  VerifyResult,
} from '../types'
import { parseLedReadings } from '../utils/led'
import {
  MOCK_ANALYTICS,
  MOCK_OUTAGE,
  MOCK_TICKETS,
  ROUTER_CATALOG,
  mockDiagnosisForRouter,
} from '../data/mockData'

interface BackendStepInfo {
  instruction: string
  step_number: number
}

interface BackendDiagnosisResponse {
  session_id: string
  equipment: string
  confidence: number
  status_lights: Record<string, string>
  next_step: BackendStepInfo | null
  low_confidence: boolean
}

interface BackendVerifyStepResponse {
  resolved: boolean
  escalate: boolean
  next_step: BackendStepInfo | null
  status_lights: Record<string, string>
}

function toConfidenceLevel(value: number): DetectionConfidence {
  if (value >= 0.75) return 'high'
  if (value >= 0.4) return 'medium'
  return 'low'
}

function splitEquipmentName(equipment: string): { manufacturer: string; model: string } {
  if (equipment === 'unknown') {
    return { manufacturer: 'Unknown', model: 'Router' }
  }
  if (equipment === 'Generic Router/Modem') {
    return { manufacturer: 'Unknown', model: equipment }
  }
  const [manufacturer, ...rest] = equipment.split(' ')
  return { manufacturer, model: rest.join(' ') || equipment }
}

const FAULT_ISSUE_MESSAGES: Record<string, string> = {
  internet: "We're not receiving an internet signal.",
  online: "We're not receiving a signal from your provider.",
  downstream: "We're not receiving a signal from your provider.",
  wifi: 'Your Wi-Fi is currently off.',
  power: 'Your device is not receiving power.',
}

function deriveIssueMessage(statusLights: Record<string, string>): string {
  for (const [light, raw] of Object.entries(statusLights)) {
    if (raw !== 'solid_green') {
      return FAULT_ISSUE_MESSAGES[light] ?? 'We found an issue with your equipment.'
    }
  }
  return "We're not receiving a fiber signal."
}

function toStep(step: BackendStepInfo | null): TroubleshootingStep | null {
  if (!step) return null
  return {
    stepNumber: step.step_number,
    totalSteps: step.step_number,
    title: `Step ${step.step_number}`,
    description: step.instruction,
    checklist: [],
  }
}

function toDiagnosis(res: BackendDiagnosisResponse): RouterDiagnosis {
  const { manufacturer, model } = splitEquipmentName(res.equipment)
  return {
    sessionId: res.session_id,
    manufacturer,
    model,
    confidence: toConfidenceLevel(res.confidence),
    issue: deriveIssueMessage(res.status_lights),
    lowConfidence: res.low_confidence,
    lights: parseLedReadings(res.status_lights),
  }
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

// --- Real backend-wired functions ---

export async function analyzeRouter(imageBase64: string): Promise<RouterDiagnosis> {
  const res = await postJson<BackendDiagnosisResponse>('/diagnose', { image_base64: imageBase64 })
  return toDiagnosis(res)
}

export async function verifyStepWithPhoto(sessionId: string, imageBase64: string): Promise<VerifyResult> {
  const res = await postJson<BackendVerifyStepResponse>('/verify-step', {
    image_base64: imageBase64,
    session_id: sessionId,
  })
  return {
    resolved: res.resolved,
    escalate: res.escalate,
    nextStep: toStep(res.next_step),
  }
}

export async function escalate(sessionId: string): Promise<{ ticketId: string }> {
  const res = await postJson<{ ticket_id: string }>('/escalate', { session_id: sessionId })
  return { ticketId: res.ticket_id }
}

// --- Mock-backed functions (no backend support yet) ---

export function getRouterCatalog(): RouterCatalogEntry[] {
  return ROUTER_CATALOG
}

export function getMockDiagnosis(entry: RouterCatalogEntry): RouterDiagnosis {
  return mockDiagnosisForRouter(entry)
}

export async function checkOutage(): Promise<OutageInfo> {
  return MOCK_OUTAGE
}

export async function createSupportTicket(diagnosis: RouterDiagnosis): Promise<{ ticketId: string }> {
  void diagnosis
  const ticketId = `TS-${1000 + Math.floor(Math.random() * 900)}`
  return { ticketId }
}

export async function getTickets(): Promise<SupportTicket[]> {
  return MOCK_TICKETS
}

export async function getTicket(id: string): Promise<SupportTicket | undefined> {
  return MOCK_TICKETS.find((ticket) => ticket.id === id)
}

export async function getAnalytics(): Promise<AnalyticsSummary> {
  return MOCK_ANALYTICS
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS.

- [ ] **Step 5: Delete the superseded client**

```bash
rm frontend/src/api/client.ts
rmdir frontend/src/api 2>/dev/null || true
```

Note: `frontend/src/App.tsx` still imports from `./api/client` at this point — that import is removed in Task 13 when `App.tsx` is rewritten. If you run `npm run build` right now it will fail on that missing import; that is expected and resolved by Task 13. Do not skip this deletion — leaving both `api/client.ts` and `services/api.ts` alive violates the "one API layer" constraint.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/services/api.ts frontend/src/services/api.test.ts
git rm frontend/src/api/client.ts
git commit -m "feat: add API service layer wiring real diagnose/verify/escalate endpoints"
```

---

### Task 7: Core UI primitives — Button, SecondaryButton, Card, StatusBadge

**Files:**
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/SecondaryButton.tsx`
- Create: `frontend/src/components/ui/Card.tsx`
- Create: `frontend/src/components/ui/StatusBadge.tsx`
- Test: `frontend/src/components/ui/Button.test.tsx`
- Test: `frontend/src/components/ui/Card.test.tsx`
- Test: `frontend/src/components/ui/StatusBadge.test.tsx`

**Interfaces:**
- Consumes: `TicketStatus` from `../../types` (Task 3).
- Produces: `Button`, `SecondaryButton`, `Card`, `StatusBadge` React components — used throughout Plan B/C.

- [ ] **Step 1: Write the failing tests**

`frontend/src/components/ui/Button.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { SecondaryButton } from './SecondaryButton'

describe('Button', () => {
  it('renders children and responds to clicks', () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Scan My Router</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Scan My Router' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Scan My Router
      </Button>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Scan My Router' }))
    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('SecondaryButton', () => {
  it('renders children and responds to clicks', () => {
    const onClick = vi.fn()
    render(<SecondaryButton onClick={onClick}>Select Router Manually</SecondaryButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Select Router Manually' }))
    expect(onClick).toHaveBeenCalledOnce()
  })
})
```

`frontend/src/components/ui/Card.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('renders its children', () => {
    render(<Card>Hello</Card>)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

`frontend/src/components/ui/StatusBadge.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from './StatusBadge'
import type { TicketStatus } from '../../types'

describe('StatusBadge', () => {
  const cases: Array<[TicketStatus, string]> = [
    ['open', 'Open'],
    ['in_progress', 'In Progress'],
    ['resolved', 'Resolved'],
    ['escalated', 'Escalated'],
  ]

  it.each(cases)('renders the label for status %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`frontend/src/components/ui/Button.tsx`:
```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function Button({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

`frontend/src/components/ui/SecondaryButton.tsx`:
```tsx
import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function SecondaryButton({ children, className = '', ...props }: SecondaryButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-primary transition-colors duration-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
```

`frontend/src/components/ui/Card.tsx`:
```tsx
import type { HTMLAttributes, ReactNode } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div className={`rounded-2xl border border-border bg-card p-4 shadow-sm ${className}`} {...props}>
      {children}
    </div>
  )
}
```

`frontend/src/components/ui/StatusBadge.tsx`:
```tsx
import type { TicketStatus } from '../../types'

const STATUS_CONFIG: Record<TicketStatus, { label: string; className: string }> = {
  open: { label: 'Open', className: 'bg-blue-50 text-primary border-blue-200' },
  in_progress: { label: 'In Progress', className: 'bg-amber-50 text-warning border-amber-200' },
  resolved: { label: 'Resolved', className: 'bg-green-50 text-success border-green-200' },
  escalated: { label: 'Escalated', className: 'bg-red-50 text-error border-red-200' },
}

export function StatusBadge({ status }: { status: TicketStatus }) {
  const config = STATUS_CONFIG[status]
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${config.className}`}>
      {config.label}
    </span>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Button.tsx frontend/src/components/ui/SecondaryButton.tsx frontend/src/components/ui/Card.tsx frontend/src/components/ui/StatusBadge.tsx frontend/src/components/ui/Button.test.tsx frontend/src/components/ui/Card.test.tsx frontend/src/components/ui/StatusBadge.test.tsx
git commit -m "feat: add Button, SecondaryButton, Card, StatusBadge components"
```

---

### Task 8: Core UI primitives — ProgressBar, StepIndicator, StarRating

**Files:**
- Create: `frontend/src/components/ui/ProgressBar.tsx`
- Create: `frontend/src/components/ui/StepIndicator.tsx`
- Create: `frontend/src/components/ui/StarRating.tsx`
- Test: `frontend/src/components/ui/ProgressBar.test.tsx`
- Test: `frontend/src/components/ui/StepIndicator.test.tsx`
- Test: `frontend/src/components/ui/StarRating.test.tsx`

**Interfaces:**
- Produces: `ProgressBar`, `StepIndicator`, `StarRating` — `StepIndicator` composes `ProgressBar`; used by the Troubleshoot page (Plan B) and Success page's rating (Plan B).

- [ ] **Step 1: Write the failing tests**

`frontend/src/components/ui/ProgressBar.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ProgressBar } from './ProgressBar'

describe('ProgressBar', () => {
  it('clamps value into 0-100 and exposes it via aria-valuenow', () => {
    render(<ProgressBar value={150} label="progress" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
  })

  it('clamps negative values to 0', () => {
    render(<ProgressBar value={-10} label="progress" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  })
})
```

`frontend/src/components/ui/StepIndicator.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StepIndicator } from './StepIndicator'

describe('StepIndicator', () => {
  it('renders "Step X of Y"', () => {
    render(<StepIndicator currentStep={2} totalSteps={4} />)
    expect(screen.getByText('Step 2 of 4')).toBeInTheDocument()
  })

  it('sets progress to 50% for step 2 of 4', () => {
    render(<StepIndicator currentStep={2} totalSteps={4} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50')
  })
})
```

`frontend/src/components/ui/StarRating.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('marks the selected star as checked', () => {
    render(<StarRating value={3} onChange={vi.fn()} />)
    expect(screen.getByRole('radio', { name: '3 stars' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: '4 stars' })).toHaveAttribute('aria-checked', 'false')
  })

  it('calls onChange with the clicked star value', () => {
    const onChange = vi.fn()
    render(<StarRating value={0} onChange={onChange} />)
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }))
    expect(onChange).toHaveBeenCalledWith(5)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`frontend/src/components/ui/ProgressBar.tsx`:
```tsx
interface ProgressBarProps {
  value: number
  label: string
}

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-border"
    >
      <div
        className="h-full rounded-full bg-primary transition-all duration-300"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
```

`frontend/src/components/ui/StepIndicator.tsx`:
```tsx
import { ProgressBar } from './ProgressBar'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
}

export function StepIndicator({ currentStep, totalSteps }: StepIndicatorProps) {
  const percent = totalSteps === 0 ? 0 : (currentStep / totalSteps) * 100
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-text-secondary">
        Step {currentStep} of {totalSteps}
      </p>
      <ProgressBar value={percent} label={`Step ${currentStep} of ${totalSteps}`} />
    </div>
  )
}
```

`frontend/src/components/ui/StarRating.tsx`:
```tsx
import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
}

export function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = useState<number | null>(null)
  const display = hovered ?? value

  return (
    <div role="radiogroup" aria-label="Rate your experience" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} star${star > 1 ? 's' : ''}`}
          className="flex min-h-11 min-w-11 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(star)}
        >
          <Star className={star <= display ? 'fill-warning text-warning' : 'fill-none text-border'} size={28} />
        </button>
      ))}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/ProgressBar.tsx frontend/src/components/ui/StepIndicator.tsx frontend/src/components/ui/StarRating.tsx frontend/src/components/ui/ProgressBar.test.tsx frontend/src/components/ui/StepIndicator.test.tsx frontend/src/components/ui/StarRating.test.tsx
git commit -m "feat: add ProgressBar, StepIndicator, StarRating components"
```

---

### Task 9: Feedback and overlay components — LoadingState, ErrorState, EmptyState, Toast, Modal

**Files:**
- Create: `frontend/src/components/ui/LoadingState.tsx`
- Create: `frontend/src/components/ui/ErrorState.tsx`
- Create: `frontend/src/components/ui/EmptyState.tsx`
- Create: `frontend/src/components/ui/Toast.tsx`
- Create: `frontend/src/components/ui/Modal.tsx`
- Test: `frontend/src/components/ui/ErrorState.test.tsx`
- Test: `frontend/src/components/ui/Toast.test.tsx`
- Test: `frontend/src/components/ui/Modal.test.tsx`

**Interfaces:**
- Consumes: `Button` from `./Button` (Task 7).
- Produces: `LoadingState`, `ErrorState`, `EmptyState`, `Toast`, `Modal` — used by every page in Plan B/C for their loading/error/empty states (spec section 21).

- [ ] **Step 1: Write the failing tests**

`frontend/src/components/ui/ErrorState.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ErrorState } from './ErrorState'

describe('ErrorState', () => {
  it('renders title, description, and calls onAction when the button is clicked', () => {
    const onAction = vi.fn()
    render(
      <ErrorState
        title="We're having trouble connecting."
        description="Check your connection and try again."
        actionLabel="Try Again"
        onAction={onAction}
      />
    )
    expect(screen.getByRole('alert')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Try Again' }))
    expect(onAction).toHaveBeenCalledOnce()
  })

  it('renders without an action button when none is given', () => {
    render(<ErrorState title="Oops" description="Something went wrong." />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
```

`frontend/src/components/ui/Toast.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toast } from './Toast'

describe('Toast', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('calls onDismiss automatically after the duration elapses', () => {
    const onDismiss = vi.fn()
    render(<Toast message="Saved" onDismiss={onDismiss} durationMs={3000} />)
    vi.advanceTimersByTime(3000)
    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('calls onDismiss when the dismiss button is clicked', () => {
    const onDismiss = vi.fn()
    render(<Toast message="Saved" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
```

`frontend/src/components/ui/Modal.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Modal } from './Modal'

describe('Modal', () => {
  it('renders nothing when closed', () => {
    render(
      <Modal title="Select your router" isOpen={false} onClose={vi.fn()}>
        content
      </Modal>
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders content and title when open', () => {
    render(
      <Modal title="Select your router" isOpen onClose={vi.fn()}>
        <p>content</p>
      </Modal>
    )
    expect(screen.getByRole('dialog', { name: 'Select your router' })).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('calls onClose on Escape and on close button click', () => {
    const onClose = vi.fn()
    render(
      <Modal title="Select your router" isOpen onClose={onClose}>
        content
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`frontend/src/components/ui/LoadingState.tsx`:
```tsx
export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary" />
      <p className="text-base text-text-secondary">{message}</p>
    </div>
  )
}
```

`frontend/src/components/ui/ErrorState.tsx`:
```tsx
import { Button } from './Button'

interface ErrorStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function ErrorState({ title, description, actionLabel, onAction }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-12 text-center">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <p className="text-base text-text-secondary">{description}</p>
      {actionLabel && onAction && (
        <div className="w-full max-w-xs">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
```

`frontend/src/components/ui/EmptyState.tsx`:
```tsx
interface EmptyStateProps {
  title: string
  description: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-2 py-12 text-center">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      <p className="text-base text-text-secondary">{description}</p>
    </div>
  )
}
```

`frontend/src/components/ui/Toast.tsx`:
```tsx
import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error' | 'info'

interface ToastProps {
  message: string
  variant?: ToastVariant
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, variant = 'info', onDismiss, durationMs = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, durationMs)
    return () => clearTimeout(timer)
  }, [onDismiss, durationMs])

  const Icon = variant === 'success' ? CheckCircle2 : AlertTriangle
  const iconColor = variant === 'error' ? 'text-error' : variant === 'success' ? 'text-success' : 'text-primary'

  return (
    <div role="status" aria-live="polite" className="flex items-center gap-3 rounded-lg border border-border bg-card p-4 shadow-md">
      <Icon className={iconColor} size={20} aria-hidden="true" />
      <p className="flex-1 text-sm text-text">{message}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        className="flex min-h-11 min-w-11 items-center justify-center"
        onClick={onDismiss}
      >
        <X size={18} className="text-text-secondary" />
      </button>
    </div>
  )
}
```

`frontend/src/components/ui/Modal.tsx`:
```tsx
import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
}

export function Modal({ title, isOpen, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    dialogRef.current?.focus()
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-card p-6 shadow-lg focus:outline-none sm:rounded-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-text">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            className="flex min-h-11 min-w-11 items-center justify-center"
            onClick={onClose}
          >
            <X size={20} className="text-text-secondary" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/LoadingState.tsx frontend/src/components/ui/ErrorState.tsx frontend/src/components/ui/EmptyState.tsx frontend/src/components/ui/Toast.tsx frontend/src/components/ui/Modal.tsx frontend/src/components/ui/ErrorState.test.tsx frontend/src/components/ui/Toast.test.tsx frontend/src/components/ui/Modal.test.tsx
git commit -m "feat: add LoadingState, ErrorState, EmptyState, Toast, Modal components"
```

---

### Task 10: LED display components

**Files:**
- Create: `frontend/src/components/diagnosis/LedStatus.tsx`
- Create: `frontend/src/components/diagnosis/LedStatusList.tsx`
- Test: `frontend/src/components/diagnosis/LedStatus.test.tsx`

**Interfaces:**
- Consumes: `LedReading` from `../../types` (Task 3); `ledSemanticStatus`, `ledStatusLabel` from `../../utils/led` (Task 4).
- Produces: `LedStatus`, `LedStatusList` — used by `DiagnosisCard` (Task 11) and the admin ticket details page (Plan C).

- [ ] **Step 1: Write the failing tests**

`frontend/src/components/diagnosis/LedStatus.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LedStatus } from './LedStatus'
import { LedStatusList } from './LedStatusList'

describe('LedStatus', () => {
  it('always pairs color with a text label, never color alone', () => {
    render(<LedStatus light={{ name: 'Internet', color: 'red', state: 'blinking' }} />)
    expect(screen.getByText('Internet')).toBeInTheDocument()
    expect(screen.getByText(/Red — Problem/)).toBeInTheDocument()
    expect(screen.getByText(/Blinking/)).toBeInTheDocument()
  })

  it('labels a normal green light', () => {
    render(<LedStatus light={{ name: 'Power', color: 'green', state: 'solid' }} />)
    expect(screen.getByText(/Green — Normal/)).toBeInTheDocument()
  })
})

describe('LedStatusList', () => {
  it('renders one row per light', () => {
    render(
      <LedStatusList
        lights={[
          { name: 'Power', color: 'green', state: 'solid' },
          { name: 'Wi-Fi', color: 'green', state: 'solid' },
        ]}
      />
    )
    expect(screen.getByText('Power')).toBeInTheDocument()
    expect(screen.getByText('Wi-Fi')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`frontend/src/components/diagnosis/LedStatus.tsx`:
```tsx
import type { LedReading } from '../../types'
import { ledSemanticStatus, ledStatusLabel } from '../../utils/led'

const DOT_COLOR: Record<LedReading['color'], string> = {
  green: 'bg-success',
  red: 'bg-error',
  amber: 'bg-warning',
  gray: 'bg-slate-300',
}

export function LedStatus({ light }: { light: LedReading }) {
  const status = ledSemanticStatus(light.color, light.state)
  const colorLabel = light.color.charAt(0).toUpperCase() + light.color.slice(1)

  return (
    <div className="flex items-center justify-between rounded-lg border border-border px-4 py-3">
      <span className="text-base font-medium text-text">{light.name}</span>
      <span className="flex items-center gap-2 text-sm text-text-secondary">
        <span className={`h-3 w-3 rounded-full ${DOT_COLOR[light.color]}`} aria-hidden="true" />
        {colorLabel} — {ledStatusLabel(status)}
        {light.state === 'blinking' && ' (Blinking)'}
      </span>
    </div>
  )
}
```

`frontend/src/components/diagnosis/LedStatusList.tsx`:
```tsx
import type { LedReading } from '../../types'
import { LedStatus } from './LedStatus'

export function LedStatusList({ lights }: { lights: LedReading[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-lg font-bold text-text">Indicator Lights</h3>
      <div className="space-y-2">
        {lights.map((light) => (
          <LedStatus key={light.name} light={light} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/diagnosis/LedStatus.tsx frontend/src/components/diagnosis/LedStatusList.tsx frontend/src/components/diagnosis/LedStatus.test.tsx
git commit -m "feat: add LedStatus and LedStatusList components"
```

---

### Task 11: Domain composite components

**Files:**
- Create: `frontend/src/components/diagnosis/RouterImage.tsx`
- Create: `frontend/src/components/diagnosis/DiagnosisCard.tsx`
- Create: `frontend/src/components/diagnosis/OutageCard.tsx`
- Create: `frontend/src/components/troubleshooting/TroubleshootingCard.tsx`
- Create: `frontend/src/components/troubleshooting/VerificationButtons.tsx`
- Test: `frontend/src/components/diagnosis/DiagnosisCard.test.tsx`
- Test: `frontend/src/components/troubleshooting/TroubleshootingCard.test.tsx`
- Test: `frontend/src/components/troubleshooting/VerificationButtons.test.tsx`

**Interfaces:**
- Consumes: `RouterDiagnosis`, `OutageInfo`, `TroubleshootingStep` from `../../types` (Task 3); `Card` from `../ui/Card` (Task 7); `Button`, `SecondaryButton` from `../ui/*` (Task 7); `LedStatusList` from `../diagnosis/LedStatusList` (Task 10).
- Produces: `RouterImage`, `DiagnosisCard`, `OutageCard`, `TroubleshootingCard`, `VerificationButtons` — the Diagnosis, Outage, Troubleshoot, and Verify pages (Plan B) are built almost entirely from these.

- [ ] **Step 1: Write the failing tests**

`frontend/src/components/diagnosis/DiagnosisCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DiagnosisCard } from './DiagnosisCard'
import type { RouterDiagnosis } from '../../types'

const diagnosis: RouterDiagnosis = {
  sessionId: 's1',
  manufacturer: 'Nokia',
  model: 'G-2425G',
  confidence: 'high',
  issue: "We're not receiving a fiber signal.",
  lowConfidence: false,
  lights: [{ name: 'Power', color: 'green', state: 'solid' }],
}

describe('DiagnosisCard', () => {
  it('renders manufacturer, model, confidence label, and issue, never a raw number', () => {
    render(<DiagnosisCard diagnosis={diagnosis} />)
    expect(screen.getByText('Nokia')).toBeInTheDocument()
    expect(screen.getByText('G-2425G')).toBeInTheDocument()
    expect(screen.getByText('High confidence')).toBeInTheDocument()
    expect(screen.getByText("We're not receiving a fiber signal.")).toBeInTheDocument()
    expect(screen.queryByText(/0\.\d/)).not.toBeInTheDocument()
  })
})
```

`frontend/src/components/troubleshooting/TroubleshootingCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TroubleshootingCard } from './TroubleshootingCard'
import type { TroubleshootingStep } from '../../types'

const step: TroubleshootingStep = {
  stepNumber: 2,
  totalSteps: 4,
  title: 'Check the fiber cable',
  description: 'Make sure the fiber cable is securely connected to the router.',
  checklist: ['Cable is connected to the correct port', 'Cable is firmly connected'],
  note: "Don't bend the fiber cable sharply.",
}

describe('TroubleshootingCard', () => {
  it('renders exactly one step worth of content', () => {
    render(<TroubleshootingCard step={step} />)
    expect(screen.getByText('Check the fiber cable')).toBeInTheDocument()
    expect(screen.getByText('Cable is connected to the correct port')).toBeInTheDocument()
    expect(screen.getByText("Don't bend the fiber cable sharply.")).toBeInTheDocument()
  })
})
```

`frontend/src/components/troubleshooting/VerificationButtons.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VerificationButtons } from './VerificationButtons'

describe('VerificationButtons', () => {
  it('calls onYes and onNo from the respective buttons', () => {
    const onYes = vi.fn()
    const onNo = vi.fn()
    render(<VerificationButtons onYes={onYes} onNo={onNo} />)
    fireEvent.click(screen.getByRole('button', { name: "Yes, it's fixed" }))
    fireEvent.click(screen.getByRole('button', { name: 'No, still not working' }))
    expect(onYes).toHaveBeenCalledOnce()
    expect(onNo).toHaveBeenCalledOnce()
  })

  it('only renders "Not sure" when onNotSure is passed', () => {
    const { rerender } = render(<VerificationButtons onYes={vi.fn()} onNo={vi.fn()} />)
    expect(screen.queryByText('Not sure')).not.toBeInTheDocument()
    rerender(<VerificationButtons onYes={vi.fn()} onNo={vi.fn()} onNotSure={vi.fn()} />)
    expect(screen.getByText('Not sure')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`frontend/src/components/diagnosis/RouterImage.tsx`:
```tsx
import { Router } from 'lucide-react'

export function RouterImage({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return <img src={src} alt={alt} className="h-32 w-32 rounded-xl border border-border object-cover" />
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className="flex h-32 w-32 items-center justify-center rounded-xl border border-border bg-slate-50"
    >
      <Router size={48} className="text-text-secondary" aria-hidden="true" />
    </div>
  )
}
```

`frontend/src/components/diagnosis/DiagnosisCard.tsx`:
```tsx
import type { RouterDiagnosis } from '../../types'
import { Card } from '../ui/Card'
import { RouterImage } from './RouterImage'
import { LedStatusList } from './LedStatusList'

const CONFIDENCE_LABEL: Record<RouterDiagnosis['confidence'], string> = {
  high: 'High confidence',
  medium: 'Some uncertainty',
  low: 'Low confidence',
}

export function DiagnosisCard({ diagnosis }: { diagnosis: RouterDiagnosis }) {
  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-4">
        <RouterImage alt={`${diagnosis.manufacturer} ${diagnosis.model}`} />
        <div>
          <p className="text-lg font-bold text-text">{diagnosis.manufacturer}</p>
          <p className="text-base text-text-secondary">{diagnosis.model}</p>
          <p className="mt-1 text-sm text-text-secondary">{CONFIDENCE_LABEL[diagnosis.confidence]}</p>
        </div>
      </Card>
      <LedStatusList lights={diagnosis.lights} />
      <Card>
        <h3 className="text-lg font-bold text-text">Possible issue</h3>
        <p className="mt-1 text-base text-text">{diagnosis.issue}</p>
        <p className="mt-2 text-sm text-text-secondary">We'll guide you through a few quick checks.</p>
      </Card>
    </div>
  )
}
```

`frontend/src/components/diagnosis/OutageCard.tsx`:
```tsx
import type { OutageInfo } from '../../types'
import { Card } from '../ui/Card'

export function OutageCard({ outage }: { outage: OutageInfo }) {
  return (
    <Card className="space-y-2">
      <p className="text-base font-bold text-text">Service interruption</p>
      <p className="text-sm text-text-secondary">Estimated restoration</p>
      <p className="text-lg font-semibold text-text">{outage.estimatedRestoration}</p>
      <p className="text-sm text-text-secondary">Location: {outage.area}</p>
    </Card>
  )
}
```

`frontend/src/components/troubleshooting/TroubleshootingCard.tsx`:
```tsx
import type { TroubleshootingStep } from '../../types'
import { Card } from '../ui/Card'

export function TroubleshootingCard({ step }: { step: TroubleshootingStep }) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-text">{step.title}</h2>
      <p className="text-base text-text-secondary">{step.description}</p>
      {step.checklist.length > 0 && (
        <Card>
          <ul className="space-y-2">
            {step.checklist.map((item) => (
              <li key={item} className="flex items-start gap-2 text-base text-text">
                <span className="text-success" aria-hidden="true">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}
      {step.note && <p className="rounded-lg bg-amber-50 p-3 text-sm text-warning">{step.note}</p>}
    </div>
  )
}
```

`frontend/src/components/troubleshooting/VerificationButtons.tsx`:
```tsx
import { Button } from '../ui/Button'
import { SecondaryButton } from '../ui/SecondaryButton'

interface VerificationButtonsProps {
  onYes: () => void
  onNo: () => void
  onNotSure?: () => void
}

export function VerificationButtons({ onYes, onNo, onNotSure }: VerificationButtonsProps) {
  return (
    <div className="space-y-3">
      <Button onClick={onYes}>Yes, it's fixed</Button>
      <SecondaryButton onClick={onNo}>No, still not working</SecondaryButton>
      {onNotSure && (
        <button
          type="button"
          onClick={onNotSure}
          className="mx-auto block min-h-11 text-sm font-medium text-text-secondary underline"
        >
          Not sure
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/diagnosis/RouterImage.tsx frontend/src/components/diagnosis/DiagnosisCard.tsx frontend/src/components/diagnosis/OutageCard.tsx frontend/src/components/troubleshooting/TroubleshootingCard.tsx frontend/src/components/troubleshooting/VerificationButtons.tsx frontend/src/components/diagnosis/DiagnosisCard.test.tsx frontend/src/components/troubleshooting/TroubleshootingCard.test.tsx frontend/src/components/troubleshooting/VerificationButtons.test.tsx
git commit -m "feat: add DiagnosisCard, OutageCard, TroubleshootingCard, VerificationButtons"
```

---

### Task 12: Navigation shell

**Files:**
- Create: `frontend/src/components/layout/Header.tsx`
- Create: `frontend/src/components/layout/MobileHeader.tsx`
- Create: `frontend/src/components/layout/CustomerLayout.tsx`
- Test: `frontend/src/components/layout/Header.test.tsx`
- Test: `frontend/src/components/layout/MobileHeader.test.tsx`

**Interfaces:**
- Consumes: `react-router-dom`'s `NavLink`/`useNavigate` (Task 1).
- Produces: `Header`, `MobileHeader`, `CustomerLayout` — every customer page (Plan B) wraps its content in `CustomerLayout`.

- [ ] **Step 1: Write the failing tests**

`frontend/src/components/layout/Header.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'

describe('Header', () => {
  it('renders the brand name and a Home link', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )
    expect(screen.getByText('Intelli TechSupport')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument()
  })
})
```

`frontend/src/components/layout/MobileHeader.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { MobileHeader } from './MobileHeader'

describe('MobileHeader', () => {
  it('shows the title and hides the back button by default', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Diagnosis" />
      </MemoryRouter>
    )
    expect(screen.getByText('Diagnosis')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Go back' })).not.toBeInTheDocument()
  })

  it('shows a back button when showBack is true', () => {
    render(
      <MemoryRouter>
        <MobileHeader title="Diagnosis" showBack />
      </MemoryRouter>
    )
    expect(screen.getByRole('button', { name: 'Go back' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd frontend && npm test`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`frontend/src/components/layout/Header.tsx`:
```tsx
import { NavLink } from 'react-router-dom'
import { UserCircle } from 'lucide-react'

export function Header() {
  return (
    <header className="hidden border-b border-border bg-card px-8 py-4 md:block">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <NavLink to="/" className="text-lg font-bold text-text">
          Intelli TechSupport
        </NavLink>
        <nav className="flex items-center gap-6">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `text-base font-medium ${isActive ? 'text-primary' : 'text-text-secondary hover:text-text'}`
            }
          >
            Home
          </NavLink>
          <span className="text-base font-medium text-text-secondary/50" aria-disabled="true">
            My Issues
          </span>
          <span className="text-base font-medium text-text-secondary/50" aria-disabled="true">
            Help
          </span>
        </nav>
        <button type="button" aria-label="Profile" className="flex min-h-11 min-w-11 items-center justify-center">
          <UserCircle size={24} className="text-text-secondary" />
        </button>
      </div>
    </header>
  )
}
```

`frontend/src/components/layout/MobileHeader.tsx`:
```tsx
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, MoreVertical } from 'lucide-react'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  showMenu?: boolean
}

export function MobileHeader({ title = 'Intelli TechSupport', showBack = false, showMenu = true }: MobileHeaderProps) {
  const navigate = useNavigate()
  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
      <div className="flex min-h-11 min-w-11 items-center">
        {showBack && (
          <button
            type="button"
            aria-label="Go back"
            onClick={() => navigate(-1)}
            className="flex min-h-11 min-w-11 items-center justify-center"
          >
            <ChevronLeft size={24} className="text-text" />
          </button>
        )}
      </div>
      <h1 className="text-base font-bold text-text">{title}</h1>
      <div className="flex min-h-11 min-w-11 items-center justify-end">
        {showMenu && (
          <button type="button" aria-label="More options" className="flex min-h-11 min-w-11 items-center justify-center">
            <MoreVertical size={22} className="text-text" />
          </button>
        )}
      </div>
    </header>
  )
}
```

`frontend/src/components/layout/CustomerLayout.tsx`:
```tsx
import type { ReactNode } from 'react'
import { Header } from './Header'
import { MobileHeader } from './MobileHeader'

interface CustomerLayoutProps {
  children: ReactNode
  title?: string
  showBack?: boolean
}

export function CustomerLayout({ children, title, showBack = false }: CustomerLayoutProps) {
  return (
    <div className="min-h-dvh bg-background">
      <Header />
      <MobileHeader title={title} showBack={showBack} showMenu={!showBack} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 md:px-8">{children}</main>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/layout
git commit -m "feat: add Header, MobileHeader, CustomerLayout"
```

---

### Task 13: Routing skeleton

**Files:**
- Modify: `frontend/src/main.tsx`
- Rewrite: `frontend/src/App.tsx`
- Test: `frontend/src/App.test.tsx`
- Create: `frontend/src/pages/Home.tsx`, `Scan.tsx`, `Analyzing.tsx`, `Diagnosis.tsx`, `Outage.tsx`, `Troubleshoot.tsx`, `Verify.tsx`, `Success.tsx`, `Escalate.tsx`
- Create: `frontend/src/pages/admin/Dashboard.tsx`, `Tickets.tsx`, `TicketDetails.tsx`, `Analytics.tsx`

**Interfaces:**
- Consumes: `CustomerLayout` from `../components/layout/CustomerLayout` (Task 12); `EmptyState` from `../components/ui/EmptyState` (Task 9).
- Produces: every route from spec section 5, reachable and rendering placeholder content — Plan B replaces the customer page bodies, Plan C replaces the admin page bodies. Page file names and default-export shape are the contract those plans build on.

- [ ] **Step 1: Write the failing route test**

`frontend/src/App.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

const ROUTES_AND_HEADINGS: Array<[string, string]> = [
  ['/', 'Home'],
  ['/scan', 'Scan'],
  ['/analyzing', 'Analyzing'],
  ['/diagnosis', 'Diagnosis'],
  ['/outage', 'Outage'],
  ['/troubleshoot', 'Troubleshoot'],
  ['/verify', 'Verify'],
  ['/success', 'Success'],
  ['/escalate', 'Escalate'],
]

describe('App routing', () => {
  it.each(ROUTES_AND_HEADINGS)('renders something for customer route %s', (path, heading) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText(heading)).toBeInTheDocument()
  })

  it('renders the admin dashboard route', () => {
    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('renders the admin tickets route', () => {
    render(
      <MemoryRouter initialEntries={['/admin/tickets']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Support Tickets')).toBeInTheDocument()
  })

  it('renders the admin ticket details route with the :id param', () => {
    render(
      <MemoryRouter initialEntries={['/admin/tickets/TS-1024']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Ticket #TS-1024')).toBeInTheDocument()
  })

  it('renders the admin analytics route', () => {
    render(
      <MemoryRouter initialEntries={['/admin/analytics']}>
        <App />
      </MemoryRouter>
    )
    expect(screen.getByText('Analytics')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test`
Expected: FAIL — `./App` still exports the old single-screen component with none of these headings, and imports `./api/client` which no longer exists (deleted in Task 6).

- [ ] **Step 3: Create the customer placeholder pages**

`frontend/src/pages/Home.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Home() {
  return (
    <CustomerLayout title="Intelli TechSupport">
      <EmptyState title="Home" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

`frontend/src/pages/Scan.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Scan() {
  return (
    <CustomerLayout title="Scan Your Router" showBack>
      <EmptyState title="Scan" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

`frontend/src/pages/Analyzing.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Analyzing() {
  return (
    <CustomerLayout title="Analyzing">
      <EmptyState title="Analyzing" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

`frontend/src/pages/Diagnosis.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Diagnosis() {
  return (
    <CustomerLayout title="Diagnosis" showBack>
      <EmptyState title="Diagnosis" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

`frontend/src/pages/Outage.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Outage() {
  return (
    <CustomerLayout title="Service Status">
      <EmptyState title="Outage" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

`frontend/src/pages/Troubleshoot.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Troubleshoot() {
  return (
    <CustomerLayout title="Troubleshooting" showBack>
      <EmptyState title="Troubleshoot" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

`frontend/src/pages/Verify.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Verify() {
  return (
    <CustomerLayout title="Step complete?">
      <EmptyState title="Verify" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

`frontend/src/pages/Success.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Success() {
  return (
    <CustomerLayout title="You're back online!">
      <EmptyState title="Success" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

`frontend/src/pages/Escalate.tsx`:
```tsx
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { EmptyState } from '../components/ui/EmptyState'

export default function Escalate() {
  return (
    <CustomerLayout title="We couldn't fix it">
      <EmptyState title="Escalate" description="Coming soon in the customer flow build." />
    </CustomerLayout>
  )
}
```

- [ ] **Step 4: Create the admin placeholder pages**

`frontend/src/pages/admin/Dashboard.tsx`:
```tsx
export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text">Admin Dashboard</h1>
      <p className="text-text-secondary">Coming soon in the admin flow build.</p>
    </div>
  )
}
```

`frontend/src/pages/admin/Tickets.tsx`:
```tsx
export default function AdminTickets() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text">Support Tickets</h1>
      <p className="text-text-secondary">Coming soon in the admin flow build.</p>
    </div>
  )
}
```

`frontend/src/pages/admin/TicketDetails.tsx`:
```tsx
import { useParams } from 'react-router-dom'

export default function AdminTicketDetails() {
  const { id } = useParams()
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text">Ticket #{id}</h1>
      <p className="text-text-secondary">Coming soon in the admin flow build.</p>
    </div>
  )
}
```

`frontend/src/pages/admin/Analytics.tsx`:
```tsx
export default function AdminAnalytics() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-text">Analytics</h1>
      <p className="text-text-secondary">Coming soon in the admin flow build.</p>
    </div>
  )
}
```

- [ ] **Step 5: Rewrite `App.tsx` as the route table**

`frontend/src/App.tsx`:
```tsx
import { Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Scan from './pages/Scan'
import Analyzing from './pages/Analyzing'
import Diagnosis from './pages/Diagnosis'
import Outage from './pages/Outage'
import Troubleshoot from './pages/Troubleshoot'
import Verify from './pages/Verify'
import Success from './pages/Success'
import Escalate from './pages/Escalate'
import AdminDashboard from './pages/admin/Dashboard'
import AdminTickets from './pages/admin/Tickets'
import AdminTicketDetails from './pages/admin/TicketDetails'
import AdminAnalytics from './pages/admin/Analytics'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/scan" element={<Scan />} />
      <Route path="/analyzing" element={<Analyzing />} />
      <Route path="/diagnosis" element={<Diagnosis />} />
      <Route path="/outage" element={<Outage />} />
      <Route path="/troubleshoot" element={<Troubleshoot />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/success" element={<Success />} />
      <Route path="/escalate" element={<Escalate />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/tickets" element={<AdminTickets />} />
      <Route path="/admin/tickets/:id" element={<AdminTicketDetails />} />
      <Route path="/admin/analytics" element={<AdminAnalytics />} />
    </Routes>
  )
}
```

- [ ] **Step 6: Wrap `main.tsx` in `BrowserRouter`**

`frontend/src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `cd frontend && npm test`
Expected: PASS — every route test green.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/main.tsx frontend/src/App.tsx frontend/src/App.test.tsx frontend/src/pages
git commit -m "feat: wire React Router route table across all customer and admin routes"
```

---

### Task 14: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `cd frontend && npm test`
Expected: all test files pass, 0 failures.

- [ ] **Step 2: Type-check and build**

Run: `cd frontend && npm run build`
Expected: `tsc -b` reports no type errors and `vite build` completes successfully (this also confirms no file still imports the deleted `src/api/client.ts`).

- [ ] **Step 3: Lint**

Run: `cd frontend && npm run lint`
Expected: no errors (warnings acceptable if pre-existing).

- [ ] **Step 4: Manual smoke check**

Run: `cd frontend && npm run dev`, open the printed local URL, and manually visit `/`, `/scan`, `/diagnosis`, `/troubleshoot`, `/verify`, `/success`, `/escalate`, `/outage`, `/admin`, `/admin/tickets`, `/admin/tickets/TS-1024`, `/admin/analytics`. Confirm each renders its placeholder without a console error, the desktop nav bar appears ≥768px wide and the mobile bar appears below that, and Inter renders (check computed font-family in devtools).

- [ ] **Step 5: Commit any fixes found during manual verification, then stop**

If Steps 1–4 all pass with no changes needed, there is nothing to commit — the plan is complete as of Task 13's commit. Otherwise fix, re-run the affected step, and commit with a `fix:` message describing what manual verification caught.
