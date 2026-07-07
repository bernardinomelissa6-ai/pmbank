import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

interface FieldWrapperProps {
  label?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

export function FieldWrapper({ label, error, hint, className, children }: FieldWrapperProps) {
  return (
    <label className={cn("flex flex-col gap-1.5", className)}>
      {label ? <span className="text-sm font-medium text-text-primary">{label}</span> : null}
      {children}
      {error ? <span className="text-xs text-negative">{error}</span> : null}
      {!error && hint ? <span className="text-xs text-text-secondary">{hint}</span> : null}
    </label>
  );
}

const baseControlClasses =
  "h-11 w-full rounded-[var(--radius-control)] border border-border-subtle bg-surface px-3 text-sm text-text-primary outline-none transition-colors focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20 disabled:bg-slate-50 disabled:text-text-secondary";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint}>
      <input ref={ref} className={cn(baseControlClasses, className)} {...props} />
    </FieldWrapper>
  )
);
Input.displayName = "Input";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint}>
      <textarea ref={ref} className={cn(baseControlClasses, "h-auto min-h-24 py-2", className)} {...props} />
    </FieldWrapper>
  )
);
Textarea.displayName = "Textarea";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, children, ...props }, ref) => (
    <FieldWrapper label={label} error={error} hint={hint}>
      <select ref={ref} className={cn(baseControlClasses, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%2364748b%22><path d=%22M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.08 1.04l-4.25 4.25a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z%22/></svg>')] bg-[length:20px] bg-[right_10px_center] bg-no-repeat pr-9", className)} {...props}>
        {children}
      </select>
    </FieldWrapper>
  )
);
Select.displayName = "Select";
