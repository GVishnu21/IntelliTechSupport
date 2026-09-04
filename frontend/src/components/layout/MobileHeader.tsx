import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  rightAction?: ReactNode
}

export function MobileHeader({ title = 'Intelli TechSupport', showBack = false, rightAction }: MobileHeaderProps) {
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
      <div className="flex min-h-11 min-w-11 items-center justify-end">{rightAction}</div>
    </header>
  )
}
