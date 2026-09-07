import { Router } from 'lucide-react'

export function RouterImage({ src, alt }: { src?: string; alt: string }) {
  if (src) {
    return <img src={src} alt={alt} className="h-32 w-32 rounded-xl border border-border object-cover" />
  }
  return (
    <div
      role="img"
      aria-label={alt}
      className="flex h-32 w-32 items-center justify-center rounded-xl border border-border bg-slate-50 dark:bg-slate-800"
    >
      <Router size={48} className="text-text-secondary" aria-hidden="true" />
    </div>
  )
}
