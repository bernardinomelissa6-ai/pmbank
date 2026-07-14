import { cn } from "@/lib/utils";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const tone = clamped >= 100 ? "bg-positive" : "bg-brand-blue";

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-hover", className)}>
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${clamped}%` }} />
    </div>
  );
}
