import type { AnalyticsSummary, OutageInfo, RouterCatalogEntry, RouterDiagnosis, SupportTicket } from '../types'

export const MOCK_OUTAGE: OutageInfo = {
  active: false,
  area: 'Your area',
  estimatedRestoration: '4:30 PM',
  message: "We've detected a known service issue affecting your area.",
}

export const ROUTER_CATALOG: RouterCatalogEntry[] = [
  { id: 'airtel-nokia-g2425g', provider: 'Airtel', brand: 'Nokia', model: 'G-2425G' },
  { id: 'jio-nokia-xs2426', provider: 'Jio', brand: 'Nokia', model: 'XS-2426' },
  { id: 'act-huawei-hg8145v5', provider: 'ACT', brand: 'Huawei', model: 'HG8145V5' },
  { id: 'other-tplink-archer-c6', provider: 'Other', brand: 'TP-Link', model: 'Archer C6' },
  { id: 'other-arris-sb8200', provider: 'Other', brand: 'Arris', model: 'SB8200' },
  { id: 'other-netgear-r7000', provider: 'Other', brand: 'Netgear', model: 'Nighthawk R7000' },
]

// Used by the manual router-selection fallback (spec section 22), when there
// is no photo to run through the real vision pipeline. The resulting
// sessionId is not a real backend session — if the customer proceeds through
// Troubleshoot to Verify, the real /verify-step endpoint won't recognize it
// and will correctly escalate rather than fake a resolution.
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
    ],
    firstStep: {
      stepNumber: 1,
      totalSteps: 3,
      title: 'Step 1',
      description: "Unplug the router's power cable, wait 10 seconds, then plug it back in.",
      checklist: [],
    },
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
