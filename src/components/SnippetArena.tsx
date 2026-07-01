import { Play, RotateCcw, ArrowLeftRight, Code2, Terminal } from "lucide-react";
import type { BenchmarkResult } from "../lib/benchmark";
import { DEFAULT_A, DEFAULT_B } from "../lib/examples";
import { cn, Panel, PanelHeader, Meter, Badge } from "./ui";

export type IterCount = 1000 | 10000 | 100000;
const ITERS: { v: IterCount; label: string }[] = [
  { v: 1000, label: "1,000" },
  { v: 10000, label: "10,000" },
  { v: 100000, label: "100,000" },
];

export default function SnippetArena({
  codeA,
  codeB,
  setCodeA,
  setCodeB,
  iterations,
  setIterations,
  onStart,
  onReset,
  onSwap,
  running,
  progress,
  result,
}: {
  codeA: string;
  codeB: string;
  setCodeA: (s: string) => void;
  setCodeB: (s: string) => void;
  iterations: IterCount;
  setIterations: (v: IterCount) => void;
  onStart: () => void;
  onReset: () => void;
  onSwap: () => void;
  running: boolean;
  progress: number; // 0..1
  result: BenchmarkResult | null;
}) {
  return (
    <Panel className="overflow-hidden">
      <PanelHeader
        icon={<Code2 className="h-5 w-5" />}
        title="Code Snippet Arena"
        subtitle="Two candidates compete on the same dataset — V8 executes each live."
        right={
          <div className="flex items-center gap-2">
            <button
              onClick={onSwap}
              title="Swap A / B"
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-ink-2 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-cyan/40 hover:text-white"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" /> Swap
            </button>
            <button
              onClick={onReset}
              title="Reset to examples"
              className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-ink-2 px-2.5 py-1.5 text-xs text-slate-300 transition hover:border-cyan/40 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        }
      />

      <div className="grid gap-4 p-4 md:grid-cols-2">
        <Editor
          label="Candidate A"
          accent="cyan"
          code={codeA}
          onChange={setCodeA}
          tag="Functional"
          running={running && result === null ? progress < 0.5 : false}
        />
        <Editor
          label="Candidate B"
          accent="emerald"
          code={codeB}
          onChange={setCodeB}
          tag="Imperative"
          running={running && result === null ? progress >= 0.5 : false}
        />
      </div>

      {/* Run controls */}
      <div className="flex flex-col gap-4 border-t border-edge px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wider text-slate-500">
            Sample iterations
          </div>
          <div className="inline-flex rounded-xl border border-edge bg-ink-2 p-1">
            {ITERS.map((it) => (
              <button
                key={it.v}
                onClick={() => setIterations(it.v)}
                disabled={running}
                className={cn(
                  "rounded-lg px-3 py-1.5 font-mono text-xs font-medium transition disabled:opacity-50",
                  iterations === it.v
                    ? "bg-cyan/20 text-cyan ring-1 ring-cyan/40"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {it.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 sm:max-w-sm">
          {running ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-cyan">Executing in V8…</span>
                <span className="font-mono text-slate-400">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <Meter value={progress} max={1} tone="cyan" animate />
            </div>
          ) : (
            <button
              onClick={onStart}
              className={cn(
                "group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-emerald px-4 py-3 text-sm font-bold text-ink shadow-[0_8px_24px_-8px_rgba(6,182,212,0.8)] transition",
                "hover:brightness-110 active:scale-[0.99]"
              )}
            >
              <Play className="h-4 w-4 fill-ink" />
              Start Benchmark
            </button>
          )}
        </div>
      </div>
    </Panel>
  );
}

function Editor({
  label,
  accent,
  code,
  onChange,
  tag,
  running,
}: {
  label: string;
  accent: "cyan" | "emerald";
  code: string;
  onChange: (s: string) => void;
  tag: string;
  running: boolean;
}) {
  const barColor = accent === "cyan" ? "bg-cyan" : "bg-emerald";
  const textColor = accent === "cyan" ? "text-cyan" : "text-emerald";
  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-ink-2">
      <div className="flex items-center justify-between border-b border-edge bg-white/[0.03] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", barColor)} />
          <span className={cn("text-sm font-semibold", textColor)}>{label}</span>
          <span className="font-mono text-[11px] text-slate-500">function(data)</span>
        </div>
        <Badge tone={accent === "cyan" ? "cyan" : "emerald"}>{tag}</Badge>
      </div>
      <div className="relative">
        {running && (
          <div className="pointer-events-none absolute right-2 top-2 flex items-center gap-1 rounded-md bg-ink/80 px-2 py-1 text-[10px] font-mono text-cyan">
            <Terminal className="h-3 w-3 animate-pulse" /> running
          </div>
        )}
        <textarea
          spellCheck={false}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-64 w-full resize-none bg-transparent p-3 font-mono text-[12.5px] leading-relaxed text-slate-200 outline-none",
            "focus:bg-white/[0.02]"
          )}
        />
      </div>
    </div>
  );
}

export function exampleCode() {
  return { a: DEFAULT_A, b: DEFAULT_B };
}
