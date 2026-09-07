import { createContext, useContext } from 'react'

// Recharts elements are styled via inline SVG props, not CSS classes, so they
// can't pick up the .dark scope through Tailwind's dark: variant the way
// everything else here does -- chart components read this context directly
// instead. Page headers also read it to render the theme toggle inline with
// their own title row instead of AdminLayout imposing a separate chrome bar.
// See AdminLayout.tsx for the provider.
export const AdminThemeContext = createContext<{ dark: boolean; toggleDark: () => void }>({
  dark: false,
  toggleDark: () => {},
})

export function useAdminTheme() {
  return useContext(AdminThemeContext)
}
