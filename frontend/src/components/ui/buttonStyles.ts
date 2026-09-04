// Shared class strings so Button/SecondaryButton and the two nav-style Links
// on Home (which must render <Link>, not <button>) stay visually identical
// without duplicating the literal class string in more than one place.
export const BUTTON_PRIMARY_CLASS =
  'flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50'

export const BUTTON_SECONDARY_CLASS =
  'flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-primary transition-colors duration-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-50'
