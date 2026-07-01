import { Trophy, Gauge, Timer, Zap } from "lucide-react";
import type { BenchmarkResult, CandidateResult } from "../lib/benchmark";
import { formatInt, formatMicros, formatOps, formatCompact } from "../lib/format";
import { Badge, Meter, Panel, PanelHeader, cn } from "./ui";

export default function BenchmarkResults({
  result,
}: {
  result: BenchmarkResult | null;
}) {
  if (!result) {
    return (
      <Panel className="p-10 text-center">
        <Gauge className="mx-auto h-10 w-10 text-slate-600" />
        <p className="mt-3 text-sm text-slate-500">
          Run a benchmark to see live Ops/Sec, latency percentiles and the speed
          winner.
        </p>
      </Panel>
    );
  }

  const winnerLabel = result.winner === "a" ? "Candidate A" : "Candidate B";
  const loserLabel = result.loser === "a" ? "Candidate A" : "Candidate B";
  const maxOps = Math.max(result.a.opsPerSec, result.b.opsPerSec);

  return (
    <div className="space-y-4 fade-up">
      {/* Speed winner */}
      <Panel glow="emerald" className="overflow-hidden">
        <div className="flex flex-col items-center gap-3 px-6 py-5 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald/15 ring-1 ring-emerald/40">
              <Trophy className="h-6 w-6 text-emerald" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider text-emerald">
                Speed Winner
              </div>
              <div className="text-lg font-bold text-white">{winnerLabel}</div>
            </div>
          </div>
          <div className="text-center">
            <div className="font-mono text-3xl font-extrabold text-emerald">
              {result.speedup.toFixed(2)}x
            </div>
            <div className="text-xs text-slate-400">
              faster than {loserLabel} · +{Math.round(result.fasterPct)}% throughput
            </div>
          </div>
        </div>
      </Panel>

      {/* Ops / sec meters */}
      <Panel>
        <PanelHeader
          icon={<Zap className="h-5 w-5" />}
          title="Operations Per Second"
          subtitle={`Measured across ${formatInt(result.iterations)} iterations · dataset ${formatInt(
            result.dataSize
          )}`}
        />
        <div className="space-y-5 p-5">
          <OpsRow
            label="Candidate A"
            tone="emerald"
            isWinner={result.winner === "a"}
            ops={result.a.opsPerSec}
            maxOps={maxOps}
          />
          <OpsRow
            label="Candidate B"
            tone="amber"
            isWinner={result.winner === "b"}
            ops={result.b.opsPerSec}
            maxOps={maxOps}
          />
        </div>
      </Panel>

      {/* Latency percentile cards */}
      <Panel>
        <PanelHeader
          icon={<Timer className="h-5 w-5" />}
          title="Latency Percentiles"
          subtitle="Per-operation timing (microseconds — lower is better)"
        />
        <div className="grid gap-4 p-5 md:grid-cols-2">
          <PercentileCard candidate={result.a} label="Candidate A" winner={result.winner === "a"} accent="emerald" />
          <PercentileCard candidate={result.b} label="Candidate B" winner={result.winner === "b"} accent="amber" />
        </div>
      </Panel>
    </div>
  );
}

function OpsRow({
  label,
  ops,
  maxOps,
  tone,
  isWinner,
}: {
  label: string;
  ops: number;
  maxOps: number;
  tone: "emerald" | "amber";
  isWinner: boolean;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-200">{label}</span>
          {isWinner && <Badge tone="emerald">fastest</Badge>}
        </div>
        <div className="font-mono text-sm font-semibold text-slate-100">
          {formatOps(ops)}
        </div>
      </div>
      <Meter value={ops} max={maxOps} tone={tone} className="h-3" />
      <div className="mt-1 text-right font-mono text-[11px] text-slate-500">
        {formatCompact(ops)} ops/s
      </div>
    </div>
  );
}

function PercentileCard({
  candidate,
  label,
  winner,
  accent,
}: {
  candidate: CandidateResult;
  label: string;
  winner: boolean;
  accent: "emerald" | "amber";
}) {
  const accentText = accent === "emerald" ? "text-emerald" : "text-amber";
  const ring = winner ? "ring-emerald/40" : "ring-edge";
  const cards: { k: string; v: number }[] = [
    { k: "p50", v: candidate.p50 },
    { k: "p90", v: candidate.p90 },
    { k: "p99", v: candidate.p99 },
  ];
  return (
    <div className={cn("rounded-xl border border-edge bg-ink-2/60 p-4 ring-1", ring)}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-200">{label}</span>
        {winner && <Badge tone="emerald">lowest latency</Badge>}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {cards.map((c) => (
          <div key={c.k} className="rounded-lg bg-ink/60 px-2 py-3 text-center">
            <div className={cn("font-mono text-base font-bold", accentText)}>
              {formatMicros(c.v)}
            </div>
            <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-500">
              {c.k}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
