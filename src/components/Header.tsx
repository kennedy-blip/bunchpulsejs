import { Gauge, Zap, Download, Cpu, Activity, MemoryStick } from "lucide-react";
import { Badge, cn } from "./ui";

export type BenchMode = "ops" | "memory" | "bigo";

const TABS: { id: BenchMode; label: string; icon: typeof Cpu }[] = [
  { id: "ops", label: "Ops/Sec Benchmark", icon: Zap },
  { id: "memory", label: "Memory Allocation", icon: MemoryStick },
  { id: "bigo", label: "Big-O Complexity", icon: Cpu },
];

export default function Header({
  mode,
  setMode,
  onRun,
  onExport,
  running,
  hasResult,
}: {
  mode: BenchMode;
  setMode: (m: BenchMode) => void;
  onRun: () => void;
  onExport: () => void;
  running: boolean;
  hasResult: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-ink/85 backdrop-blur-md">
      <div className="mx-auto max-w-[1400px] px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan/30 to-emerald/20 ring-1 ring-cyan/40">
              <span className="absolute inset-0 rounded-2xl glow-cyan" />
              <Gauge className="relative h-6 w-6 text-cyan spin-slow" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-white">
                Bench<span className="text-cyan">Pulse</span>
              </h1>
              <div className="mt-0.5 flex items-center gap-2">
                <span className="pulse-dot h-2 w-2 rounded-full bg-emerald shadow-[0_0_8px_#10b981]" />
                <Badge tone="emerald" className="font-mono">
                  Engine: V8 JS Compiler
                </Badge>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRun}
              disabled={running}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition",
                "bg-gradient-to-r from-cyan to-emerald text-ink shadow-[0_6px_20px_-6px_rgba(6,182,212,0.7)]",
                "hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              )}
            >
              <Activity className={cn("h-4 w-4", running && "animate-pulse")} />
              {running ? "Running Suite…" : "Run Benchmark Suite"}
            </button>
            <button
              onClick={onExport}
              disabled={!hasResult}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl border border-edge bg-panel px-4 py-2.5 text-sm font-semibold text-slate-200 transition",
                "hover:border-cyan/50 hover:text-white active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              )}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export Benchmark JSON</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Mode tabs */}
        <nav className="no-select mt-3 flex gap-1 overflow-x-auto rounded-xl border border-edge bg-ink-2/70 p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = mode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition",
                  active
                    ? "bg-gradient-to-r from-cyan/20 to-emerald/10 text-white ring-1 ring-cyan/40"
                    : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-cyan")} />
                {t.label}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
