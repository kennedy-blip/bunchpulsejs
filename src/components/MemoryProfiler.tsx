import { MemoryStick, AlertTriangle, Trash2, Layers } from "lucide-react";
import type { BenchmarkResult, MemoryResult } from "../lib/benchmark";
import { Badge, Meter, Panel, PanelHeader, Stat, cn } from "./ui";

export default function MemoryProfiler({
  result,
}: {
  result: BenchmarkResult | null;
}) {
  if (!result) {
    return (
      <Panel className="p-10 text-center">
        <MemoryStick className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 text-sm text-slate-500">
          Run a benchmark to inspect heap allocation, GC frequency and leak risk.
        </p>
      </Panel>
    );
  }

  const heapMax = Math.max(
    result.memoryA.peakMb,
    result.memoryB.peakMb,
    32
  );

  const totalAlloc = result.memoryA.allocMb + result.memoryB.allocMb;
  const aShare = totalAlloc > 0 ? result.memoryA.allocMb / totalAlloc : 0.5;

  return (
    <div className="space-y-4 fade-up">
      {/* Visual heap allocator */}
      <Panel>
        <PanelHeader
          icon={<Layers className="h-5 w-5" />}
          title="Visual Heap Allocator"
          subtitle="Relative allocation footprint during the benchmark run"
        />
        <div className="p-5">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan">Candidate A</span>
            <span className="font-mono text-slate-400">
              {result.memoryA.allocMb.toFixed(1)} MB allocated
            </span>
            <span className="font-semibold text-emerald">Candidate B</span>
          </div>
          <div className="flex h-9 w-full overflow-hidden rounded-xl border border-edge bg-ink-2">
            <div
              className="flex items-center justify-center bg-gradient-to-r from-cyan/70 to-cyan/90 text-[11px] font-bold text-ink transition-[width] duration-700"
              style={{ width: `${aShare * 100}%` }}
            >
              {aShare > 0.12 && `${Math.round(aShare * 100)}%`}
            </div>
            <div
              className="flex items-center justify-center bg-gradient-to-r from-emerald/90 to-emerald/70 text-[11px] font-bold text-ink transition-[width] duration-700"
              style={{ width: `${(1 - aShare) * 100}%` }}
            >
              {1 - aShare > 0.12 && `${Math.round((1 - aShare) * 100)}%`}
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Live heap baseline:{" "}
            <span className="font-mono text-slate-300">
              {result.memoryA.usedMb.toFixed(1)} MB
            </span>{" "}
            · combined transient allocations:{" "}
            <span className="font-mono text-slate-300">
              {totalAlloc.toFixed(1)} MB
            </span>
          </p>
        </div>
      </Panel>

      {/* Per-candidate memory cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <MemCard
          label="Candidate A"
          accent="cyan"
          mem={result.memoryA}
          heapMax={heapMax}
        />
        <MemCard
          label="Candidate B"
          accent="emerald"
          mem={result.memoryB}
          heapMax={heapMax}
        />
      </div>
    </div>
  );
}

function MemCard({
  label,
  accent,
  mem,
  heapMax,
}: {
  label: string;
  accent: "cyan" | "emerald";
  mem: MemoryResult;
  heapMax: number;
}) {
  const accentText = accent === "cyan" ? "text-cyan" : "text-emerald";
  const ring = mem.leakRisk ? "ring-rose-500/40" : "ring-edge";
  return (
    <Panel className={cn("ring-1", ring)}>
      <div className="flex items-center justify-between border-b border-edge px-5 py-3">
        <span className={cn("text-sm font-semibold", accentText)}>{label}</span>
        {mem.leakRisk ? (
          <Badge tone="rose">
            <AlertTriangle className="h-3 w-3" /> Memory Leak Risk
          </Badge>
        ) : (
          <Badge tone="emerald">
            <Trash2 className="h-3 w-3" /> GC Healthy
          </Badge>
        )}
      </div>
      <div className="space-y-4 p-5">
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Used Heap</span>
            <span className="font-mono text-slate-200">
              {mem.usedMb.toFixed(1)} MB
            </span>
          </div>
          <Meter value={mem.usedMb} max={heapMax} tone={accent} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className="text-slate-400">Peak Allocations</span>
            <span className="font-mono text-slate-200">
              {mem.peakMb.toFixed(1)} MB
            </span>
          </div>
          <Meter value={mem.peakMb} max={heapMax} tone={accent} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="GC Events"
            value={`${mem.gcEvents}`}
            tone={accent === "cyan" ? "cyan" : "emerald"}
          />
          <Stat
            label="GC / sec"
            value={`${mem.gcPerSec.toFixed(1)}`}
            tone={accent === "cyan" ? "cyan" : "emerald"}
          />
        </div>

        <p className="rounded-lg bg-ink/60 px-3 py-2 text-[11px] leading-relaxed text-slate-400">
          {mem.note}
        </p>
      </div>
    </Panel>
  );
}
