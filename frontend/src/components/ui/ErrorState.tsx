import { Button } from './Button'

interface ErrorStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  /** Compact single-line variant for showing an error alongside other UI
   * (e.g. above a still-usable camera) instead of replacing the screen. */
  inline?: boolean
}

export function ErrorState({ title, description, actionLabel, onAction, inline = false }: ErrorStateProps) {
  if (inline) {
    return (
      <p role="alert" className="text-center text-error">
        {title}
      </p>
    )
  }

  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h2 className="text-xl font-bold text-text">{title}</h2>
      {description && <p className="text-base text-text-secondary">{description}</p>}
      {actionLabel && onAction && (
        <div className="w-full max-w-xs">
          <Button onClick={onAction}>{actionLabel}</Button>
        </div>
      )}
    </div>
  )
}
