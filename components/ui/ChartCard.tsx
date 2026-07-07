export function ChartCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-border-subtle bg-surface p-4 sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
          {subtitle ? <p className="text-xs text-text-secondary">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className="h-64 w-full">{children}</div>
    </div>
  );
}
