import { Link } from 'react-router-dom'
import { CircleHelp, Router } from 'lucide-react'

export default function Home() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 px-5 py-6">
      <header className="flex items-center justify-between">
        <span className="text-lg font-bold text-text">Intelli TechSupport</span>
        <button
          type="button"
          aria-label="Help"
          className="flex min-h-11 min-w-11 items-center justify-center"
        >
          <CircleHelp size={22} className="text-text-secondary" />
        </button>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <div
          role="img"
          aria-label="Router"
          className="flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card"
        >
          <Router size={48} className="text-primary" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h1 className="text-[28px] font-bold leading-8 text-text">Is your internet not working?</h1>
          <p className="text-base leading-6 text-text-secondary">
            Let's check your router and help you get back online.
          </p>
        </div>

        <div className="w-full space-y-3">
          <Link
            to="/scan"
            className="flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors duration-200 hover:bg-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Scan My Router
          </Link>
          <Link
            to="/select-router"
            className="flex min-h-11 w-full items-center justify-center rounded-lg border border-border bg-transparent px-6 text-base font-semibold text-primary transition-colors duration-200 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
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
    </div>
  )
}
