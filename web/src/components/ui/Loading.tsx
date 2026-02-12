export function Loading() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-4 border-[var(--bg-muted)] rounded-full"></div>
          <div className="absolute inset-0 border-4 border-transparent border-t-[var(--brand)] rounded-full animate-spin"></div>
        </div>

        {/* Loading Text */}
        <p className="text-sm text-[var(--text-secondary)]">Loading...</p>
      </div>
    </div>
  )
}

/**
 * Inline spinner for smaller contexts
 */
export function Spinner({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 border-2 border-[var(--bg-muted)] rounded-full"></div>
      <div className="absolute inset-0 border-2 border-transparent border-t-[var(--brand)] rounded-full animate-spin"></div>
    </div>
  )
}
