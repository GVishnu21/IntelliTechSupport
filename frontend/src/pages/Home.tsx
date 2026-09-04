import { Link } from 'react-router-dom'
import { CircleHelp, Router } from 'lucide-react'
import { CustomerLayout } from '../components/layout/CustomerLayout'
import { BUTTON_PRIMARY_CLASS, BUTTON_SECONDARY_CLASS } from '../components/ui/buttonStyles'

export default function Home() {
  return (
    <CustomerLayout
      rightAction={
        <button type="button" aria-label="Help" className="flex min-h-11 min-w-11 items-center justify-center">
          <CircleHelp size={22} className="text-text-secondary" />
        </button>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div
          role="img"
          aria-label="Router"
          className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card"
        >
          <Router size={48} className="text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="text-[28px] font-bold leading-8 text-text">Is your internet not working?</h2>
          <p className="text-base leading-6 text-text-secondary">
            Let's check your router and help you get back online.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Link to="/scan" className={BUTTON_PRIMARY_CLASS}>
            Scan My Router
          </Link>
          <Link to="/select-router" className={BUTTON_SECONDARY_CLASS}>
            Select Router Manually
          </Link>
        </div>
      </div>

      <div className="space-y-4 border-t border-border pt-4 text-center">
        <div>
          <p className="text-sm text-text-secondary">Already started troubleshooting?</p>
          <Link to="/troubleshoot" className="text-sm font-medium text-primary underline">
            Continue previous session
          </Link>
        </div>
        <div>
          <p className="text-sm text-text-secondary">Need help?</p>
          <button type="button" className="text-sm font-medium text-primary underline">
            View common internet issues
          </button>
        </div>
      </div>
    </CustomerLayout>
  )
}
