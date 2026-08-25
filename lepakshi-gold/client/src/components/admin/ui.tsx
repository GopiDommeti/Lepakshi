import { X } from "lucide-react";
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  InputHTMLAttributes,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------- surfaces */

export function Panel({
  title,
  description,
  actions,
  className,
  children,
}: {
  title?: string | undefined;
  description?: string | undefined;
  actions?: ReactNode | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <section className={cn("hairline rounded-xl bg-card", className)}>
      {title || actions ? (
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line-200 px-5 py-3.5">
          <div>
            {title ? <h2 className="font-display text-lg leading-tight">{title}</h2> : null}
            {description ? <p className="mt-0.5 text-xs text-ink-500">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
      ) : null}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line-200 bg-card px-4 py-3">
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string | undefined;
  action?: ReactNode | undefined;
}) {
  return (
    <div className="rounded-xl border border-dashed border-line-200 bg-cream-100/50 p-10 text-center">
      <p className="font-display text-lg">{title}</p>
      {hint ? <p className="mx-auto mt-2 max-w-[46ch] text-sm text-ink-500">{hint}</p> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function Pill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad" | "gold" | undefined;
  children: ReactNode;
}) {
  const tones = {
    neutral: "bg-cream-100 text-ink-900",
    good: "bg-green-900 text-cream-50",
    warn: "bg-warning/15 text-warning",
    bad: "bg-destructive/12 text-destructive",
    gold: "bg-gold-500 text-green-950",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string | undefined;
}) {
  return (
    <div className="hairline rounded-xl bg-card p-4">
      <p className="eyebrow text-ink-500">{label}</p>
      <p className="num mt-2 text-2xl font-semibold text-green-900">{value}</p>
      {hint ? <p className="mt-1 text-xs text-ink-500">{hint}</p> : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- table */

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line-200 text-left">
            {head.map((h, i) => (
              <th
                key={i}
                className="eyebrow sticky top-0 z-10 bg-card px-3 py-2.5 font-semibold text-ink-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line-200">{children}</tbody>
      </table>
    </div>
  );
}

export function Td({
  children,
  className,
  colSpan,
}: {
  children?: ReactNode | undefined;
  className?: string | undefined;
  colSpan?: number | undefined;
}) {
  return (
    <td colSpan={colSpan} className={cn("px-3 py-2.5 align-middle", className)}>
      {children}
    </td>
  );
}

/* --------------------------------------------------------------------- inputs */

export function Field({
  label,
  hint,
  error,
  className,
  children,
}: {
  label: string;
  hint?: string | undefined;
  error?: string | null | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-xs font-semibold text-ink-900">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-destructive">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-500">{hint}</span>
      ) : null}
    </label>
  );
}

const inputClass =
  "w-full rounded-md border border-line-200 bg-card px-3 py-2 text-sm text-ink-900 outline-none transition-colors placeholder:text-ink-500/60 focus:border-gold-500 disabled:opacity-60";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, className)} />;
}

export function NumberInput({
  value,
  onValue,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: number | string | null | undefined;
  onValue: (n: number) => void;
}) {
  return (
    <input
      {...props}
      type="number"
      value={value === null || value === undefined ? "" : String(value)}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onValue(Number(e.target.value || 0))}
      className={cn(inputClass, "num", className)}
    />
  );
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, "min-h-[96px] resize-y", className)} />;
}

export function Select({
  value,
  onValue,
  options,
  className,
  disabled,
}: {
  value: string;
  onValue: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string | undefined;
  disabled?: boolean | undefined;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onValue(e.target.value)}
      className={cn(inputClass, "cursor-pointer", className)}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onToggle(!checked)}
      className="flex items-center gap-2 text-sm"
    >
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors",
          checked ? "bg-green-700" : "bg-line-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-card transition-transform",
            checked ? "translate-x-4.5" : "translate-x-0.5",
          )}
        />
      </span>
      <span className="text-ink-900">{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------- buttons */

export function Btn({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "gold" | "outline" | "ghost" | "danger" | undefined;
}) {
  const variants = {
    primary: "bg-green-900 text-cream-50 hover:bg-green-700",
    gold: "bg-gold-500 text-green-950 hover:bg-amber-400",
    outline: "border border-line-200 bg-card text-ink-900 hover:border-gold-500",
    ghost: "text-ink-500 hover:text-ink-900",
    danger: "border border-destructive/40 text-destructive hover:bg-destructive/10",
  } as const;
  return (
    <button
      type="button"
      {...props}
      className={cn(
        "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-3.5 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:size-4",
        variants[variant],
        className,
      )}
    />
  );
}

/* --------------------------------------------------------------------- drawer */

export function Drawer({
  open,
  onClose,
  title,
  width = "max-w-2xl",
  footer,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  width?: string | undefined;
  footer?: ReactNode | undefined;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        className="absolute inset-0 bg-green-950/40"
        onClick={onClose}
        role="presentation"
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative flex h-full w-full flex-col bg-cream-50 shadow-xl",
          width,
        )}
      >
        <header className="flex items-center justify-between border-b border-line-200 bg-card px-5 py-3.5">
          <h2 className="font-display text-lg">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-ink-500 hover:bg-cream-100 hover:text-ink-900"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
        {footer ? (
          <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-line-200 bg-card px-5 py-3">
            {footer}
          </footer>
        ) : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------- helpers */

export function money(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: n % 1 === 0 ? 0 : 2 })}`;
}

export function Loading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-md bg-cream-100" />
      ))}
    </div>
  );
}
