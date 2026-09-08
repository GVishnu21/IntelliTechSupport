// Small, deliberately short list rather than the full ITU table -- covers
// the markets this product's provider catalog already targets (Airtel/Jio/
// ACT are Indian ISPs, see mockData.ts) plus a few common others.
export interface CountryCode {
  dialCode: string
  label: string
}

export const COUNTRY_CODES: CountryCode[] = [
  { dialCode: '+91', label: 'India' },
  { dialCode: '+1', label: 'United States' },
  { dialCode: '+44', label: 'United Kingdom' },
  { dialCode: '+971', label: 'UAE' },
  { dialCode: '+65', label: 'Singapore' },
  { dialCode: '+61', label: 'Australia' },
]

export const DEFAULT_COUNTRY_CODE = COUNTRY_CODES[0].dialCode
