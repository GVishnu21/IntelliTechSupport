import type { OutageInfo, RouterCatalogEntry } from '../types'

export const MOCK_OUTAGE: OutageInfo = {
  active: false,
  area: 'Your area',
  estimatedRestoration: '4:30 PM',
  message: "We've detected a known service issue affecting your area.",
}

// Provider-branded display catalog for manual selection (spec section 22).
// Three of these (Airtel/Jio/ACT) don't have an operator-specific backend
// playbook yet, so they map to the generic one -- the customer still sees
// their own provider's branding, they just get the generic troubleshooting
// steps instead of SKU-specific ones. Keep backendEquipment in sync with
// backend/app/orchestration/playbooks.py's EQUIPMENT_CATALOG keys.
export const ROUTER_CATALOG: RouterCatalogEntry[] = [
  { id: 'airtel-nokia-g2425g', provider: 'Airtel', brand: 'Nokia', model: 'G-2425G', backendEquipment: 'Generic Router/Modem' },
  { id: 'jio-nokia-xs2426', provider: 'Jio', brand: 'Nokia', model: 'XS-2426', backendEquipment: 'Generic Router/Modem' },
  { id: 'act-huawei-hg8145v5', provider: 'ACT', brand: 'Huawei', model: 'HG8145V5', backendEquipment: 'Generic Router/Modem' },
  { id: 'other-tplink-archer-c6', provider: 'Other', brand: 'TP-Link', model: 'Archer C6', backendEquipment: 'TP-Link Archer C6' },
  { id: 'other-arris-sb8200', provider: 'Other', brand: 'Arris', model: 'SB8200', backendEquipment: 'Arris SB8200' },
  { id: 'other-netgear-r7000', provider: 'Other', brand: 'Netgear', model: 'Nighthawk R7000', backendEquipment: 'Netgear Nighthawk R7000' },
]

// The only admin metric left with no real data source: detecting "the same
// customer contacted us again" needs an identity, and there's no login.
export const MOCK_REPEAT_CONTACT_RATE = 0.09
