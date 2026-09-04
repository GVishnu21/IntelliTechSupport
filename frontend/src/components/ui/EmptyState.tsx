interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1 py-12 text-center">
      <p className="text-base font-medium text-text">{title}</p>
      {description && <p className="text-sm text-text-secondary">{description}</p>}
    </div>
  )
}
