export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" aria-hidden="true" />
      <p className="text-base text-text-secondary">{message}</p>
    </div>
  )
}
