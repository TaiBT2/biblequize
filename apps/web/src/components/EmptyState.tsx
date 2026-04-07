interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-4">{icon}</span>
      <h3 className="text-lg font-semibold text-on-surface mb-1">{title}</h3>
      {description && <p className="text-on-surface-variant text-center text-sm">{description}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 gold-gradient text-on-secondary px-5 py-2.5 rounded-xl font-semibold text-sm"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
