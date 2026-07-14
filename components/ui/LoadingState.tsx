export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 rounded-[var(--radius-card)] border border-border-subtle bg-surface px-6 py-12 text-sm text-text-secondary">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-blue border-t-transparent" />
      {label}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-surface-hover ${className ?? ""}`} />;
}
