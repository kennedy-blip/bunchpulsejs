import type { ReactNode } from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(inputs));
}

/* ----------------------------- Panel ----------------------------- */
export function Panel({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: "emerald" | "cyan" | "amber" | null;
}) {
  const glowCls =
    glow === "emerald"
      ? "glow-emerald"
      : glow === "cyan"
      ? "glow-cyan"
      : glow === "amber"
      ? "glow-amber"
      : "";
  return (
    <div
      className={cn(
        "rounded-2xl border border-edge bg-panel/80 backdrop-blur-sm",
        "shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
        glowCls,
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  icon,
  title,
  subtitle,
  right,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-edge px-5 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-cyan">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500">{subtitle}</p>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ----------------------------- Badge ----------------------------- */
export function Badge({
  children,
  tone = "slate",
  className,
}: {
  children: ReactNode;
  tone?: "slate" | "emerald" | "amber" | "cyan" | "rose";
  className?: string;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-500/10 text-slate-300 ring-slate-400/30",
    emerald: "bg-emerald/10 text-emerald ring-emerald/30",
    amber: "bg-amber/10 text-amber ring-amber/30",
    cyan: "bg-cyan/10 text-cyan ring-cyan/30",
    rose: "bg-rose-500/10 text-rose-400 ring-rose-400/30",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ----------------------------- Meter ----------------------------- */
export function Meter({
  value,
  max,
  tone = "cyan",
  className,
  animate = false,
}: {
  value: number;
  max: number;
  tone?: "emerald" | "amber" | "cyan" | "rose";
  className?: string;
  animate?: boolean;
}) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const colors: Record<string, string> = {
    emerald: "bg-gradient-to-r from-emerald/70 to-emerald",
    amber: "bg-gradient-to-r from-amber/70 to-amber",
    cyan: "bg-gradient-to-r from-cyan/70 to-cyan",
    rose: "bg-gradient-to-r from-rose-500/70 to-rose-500",
  };
  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-white/5",
        className
      )}
    >
      <div
        className={cn(
          "relative h-full rounded-full transition-[width] duration-700 ease-out",
          colors[tone],
          animate && "shimmer"
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/* ----------------------------- Stat ------------------------------ */
export function Stat({
  label,
  value,
  unit,
  tone = "slate",
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: "slate" | "emerald" | "amber" | "cyan";
}) {
  const toneCls: Record<string, string> = {
    slate: "text-slate-100",
    emerald: "text-emerald",
    amber: "text-amber",
    cyan: "text-cyan",
  };
  return (
    <div className="rounded-xl border border-edge bg-ink-2/60 px-4 py-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className={cn("mt-1 font-mono text-lg font-semibold", toneCls[tone])}>
        {value}
        {unit && <span className="ml-1 text-xs text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}
