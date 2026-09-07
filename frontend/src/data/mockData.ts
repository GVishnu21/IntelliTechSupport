import type { OutageInfo, RouterCatalogEntry, RouterDiagnosis } from '../types'

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
// and will correctly escalate rather than fake a resolution. No scanId either
// -- nothing to attach post-resolution feedback to since no real scan happened.
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

// The only admin metric left with no real data source: detecting "the same
// customer contacted us again" needs an identity, and there's no login.
export const MOCK_REPEAT_CONTACT_RATE = 0.09
