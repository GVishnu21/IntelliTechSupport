import type { ReactNode } from 'react'
import { Header } from './Header'
import { MobileHeader } from './MobileHeader'

interface CustomerLayoutProps {
  children: ReactNode
  title?: string
  showBack?: boolean
  rightAction?: ReactNode
  /**
   * Hides the full desktop nav bar and the mobile menu action so the
   * customer's attention stays on the current step (spec section 6: "Do not
   * show a complicated navigation menu during troubleshooting").
   */
  focused?: boolean
}

export function CustomerLayout({ children, title, showBack = false, rightAction, focused = false }: CustomerLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {!focused && <Header />}
      <MobileHeader title={title} showBack={showBack} rightAction={focused ? undefined : rightAction} />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-4">{children}</main>
    </div>
  )
}
