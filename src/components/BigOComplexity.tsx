import { useState } from "react";
import { Cpu, Play, TrendingUp, AlertCircle, LineChart } from "lucide-react";
import { Badge, Panel, PanelHeader, cn } from "./ui";

/* ----------------------- reference algorithms ----------------------- */
type AlgoRun = (n: number) => number;
interface Algo {
  id: string;
  name: string;
  trueComplexity: string;
  run: AlgoRun;
}

const ALGORITHMS: Algo[] = [
  {
    id: "constant",
    name: "Constant Op",
    trueComplexity: "O(1)",
    run: (n) => {
      void n;
      let s = 0;
      for (let i = 0; i < 8; i++) s += i;
      return s;
    },
  },
  {
    id: "binary",
    name: "Binary Search",
    trueComplexity: "O(log n)",
    run: (n) => {
      let lo = 0,
      hi = n - 1,
      t = n >> 1;
      while (lo <= hi) {
        const m = (lo + hi) >> 1;
        if (m === t) return m;
        if (m < t) lo = m + 1;
        else hi = m - 1;
      }
      return -1;
    },
  },
  {
    id: "linear",
    name: "Linear Scan (sum)",
    trueComplexity: "O(n)",
    run: (n) => {
      let s = 0;
      for (let i = 0; i < n; i++) s += i;
      return s;
    },
  },
  {
    id: "sort",
    name: "Array.sort()",
    trueComplexity: "O(n log n)",
    run: (n) => {
      const a = new Array(n);
      for (let i = 0; i < n; i++) a[i] = Math.random();
      a.sort((x, y) => x - y);
      return a[0];
    },
  },
  {
    id: "bubble",
    name: "Bubble Sort",
    trueComplexity: "O(n²)",
    run: (n) => {
      const a = new Array(n);
      for (let i = 0; i < n; i++) a[i] = Math.random();
      for (let i = 0; i < n - 1; i++)
        for (let j = 0; j < n - 1 - i; j++)
          if (a[j] > a[j + 1]) {
            const t = a[j];
            a[j] = a[j + 1];
            a[j + 1] = t;
          }
      return a[0];
    },
  },
];

const COMPLEXITIES = [
  { id: "O(1)", f: (_n: number) => 1 },
  { id: "O(log n)", f: (n: number) => Math.log2(n) },
  { id: "O(n)", f: (n: number) => n },
  { id: "O(n log n)", f: (n: number) => n * Math.log2(n) },
  { id: "O(n²)", f: (n: number) => n * n },
];

const SIZES = [128, 256, 512, 1024, 2048, 4096];

function measureAlgo(run: AlgoRun, n: number): number {
  for (let i = 0; i < 3; i++) run(n); // warmup
  const target = 22;
  const start = performance.now();
  let total = 0;
  let runs = 0;
  while (performance.now() - start < target && runs < 300) {
    const t0 = performance.now();
    run(n);
    total += performance.now() - t0;
    runs++;
  }
  return total / Math.max(1, runs);
}

function fitComplexity(ms: number[]): { id: string; k: number; conf: number }[] {
  return COMPLEXITIES.map((c) => {
    let sFF = 0,
      sFM = 0,
      sMM = 0;
    for (let i = 0; i < SIZES.length; i++) {
      const f = c.f(SIZES[i]);
      const m = Math.max(ms[i], 1e-4);
      sFF += f * f;
      sFM += f * m;
      sMM += m * m;
    }
    const k = sFM / sFF;
    let err = 0;
    for (let i = 0; i < SIZES.length; i++) {
      const pred = k * c.f(SIZES[i]);
      err += (pred - ms[i]) ** 2;
    }
    const conf = Math.max(0, 1 - Math.sqrt(err) / Math.sqrt(sMM));
    return { id: c.id, k, conf };
  }).sort((a, b) => b.conf - a.conf);
}

/* ------------------------------- chart ------------------------------- */
const W = 600,
  H = 280,
  PAD = { l: 52, r: 18, t: 18, b: 36 };
const PW = W - PAD.l - PAD.r;
const PH = H - PAD.t - PAD.b;

function xPos(n: number) {
  const lo = Math.log10(SIZES[0]);
  const hi = Math.log10(SIZES[SIZES.length - 1]);
  return PAD.l + ((Math.log10(n) - lo) / (hi - lo)) * PW;
}
function yPos(ms: number, lo: number, hi: number) {
  const v = Math.max(ms, 1e-4);
  const ly = Math.log10(v);
  const span = Math.max(hi - lo, 1e-6);
  return PAD.t + (1 - (ly - lo) / span) * PH;
}

export default function BigOComplexity() {
  const [algoId, setAlgoId] = useState("bubble");
  const [sweeping, setSweeping] = useState(false);
  const [ms, setMs] = useState<number[] | null>(null);
  const [fits, setFits] = useState<{ id: string; k: number; conf: number }[]>([]);

  const algo = ALGORITHMS.find((a) => a.id === algoId)!;

  async function runSweep() {
    setSweeping(true);
    setMs(null);
    // allow paint
    await new Promise((r) => setTimeout(r, 30));
    const measured = SIZES.map((n) => measureAlgo(algo.run, n));
    setMs(measured);
    setFits(fitComplexity(measured));
    setSweeping(false);
  }

  const best = fits[0];
  const lo =
    ms && ms.length
      ? Math.log10(Math.max(Math.min(...ms), 1e-4))
      : -1;
  const hi = ms && ms.length ? Math.log10(Math.max(...ms)) : 1;

  return (
    <div className="space-y-4 fade-up">
      {/* Controls */}
      <Panel>
        <PanelHeader
          icon={<Cpu className="h-5 w-5" />}
          title="Big-O Complexity Lab"
          subtitle="Sweep CPU execution time across growing input sizes and fit the curve"
          right={
            <button
              onClick={runSweep}
              disabled={sweeping}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan to-emerald px-4 py-2.5 text-sm font-bold text-ink shadow-[0_6px_20px_-6px_rgba(6,182,212,0.7)] transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
              )}
            >
              <Play className="h-4 w-4 fill-ink" />
              {sweeping ? "Sweeping…" : "Run Complexity Sweep"}
            </button>
          }
        />
        <div className="flex flex-wrap items-center gap-2 p-4">
          <span className="text-xs text-slate-500">Algorithm:</span>
          {ALGORITHMS.map((a) => (
            <button
              key={a.id}
              onClick={() => {
                setAlgoId(a.id);
                setMs(null);
                setFits([]);
              }}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs font-medium transition",
                algoId === a.id
                  ? "border-cyan/50 bg-cyan/10 text-cyan"
                  : "border-edge bg-ink-2 text-slate-400 hover:text-slate-200"
              )}
            >
              {a.name}
            </button>
          ))}
        </div>
      </Panel>

      {/* Chart */}
      <Panel>
        <PanelHeader
          icon={<LineChart className="h-5 w-5" />}
          title="Execution Time vs Input Size"
          subtitle="Log–log scale · measured run (cyan) vs theoretical Big-O (emerald)"
        />
        <div className="p-4">
          {!ms ? (
            <div className="flex h-[280px] items-center justify-center text-sm text-slate-500">
              {sweeping ? (
                <span className="font-mono text-cyan">profiling CPU loops…</span>
              ) : (
                "Run a sweep to plot the complexity curve."
              )}
            </div>
          ) : (
            <Chart ms={ms} fits={fits} lo={lo} hi={hi} />
          )}
        </div>
      </Panel>

      {/* Verdict + fit table */}
      {best && ms && (
        <div className="grid gap-4 md:grid-cols-3">
          <Panel glow="emerald" className="md:col-span-1">
            <div className="p-5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-emerald">
                <TrendingUp className="h-4 w-4" /> Detected Complexity
              </div>
              <div className="mt-2 font-mono text-3xl font-extrabold text-white">
                {best.id}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                Reference algorithm true class:{" "}
                <span className="font-mono text-slate-200">{algo.trueComplexity}</span>
              </div>
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Fit confidence</span>
                  <span className="font-mono text-emerald">
                    {(best.conf * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan to-emerald transition-[width] duration-700"
                    style={{ width: `${best.conf * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="md:col-span-2">
            <div className="border-b border-edge px-5 py-3 text-sm font-semibold text-slate-200">
              Complexity Fit Scores
            </div>
            <div className="divide-y divide-edge">
              {fits.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between px-5 py-2.5"
                >
                  <span className="flex items-center gap-2 font-mono text-sm">
                    {f.id}
                    {f.id === best.id && <Badge tone="emerald">best</Badge>}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-40 overflow-hidden rounded-full bg-white/5">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] duration-700",
                          f.id === best.id
                            ? "bg-gradient-to-r from-cyan to-emerald"
                            : "bg-slate-600"
                        )}
                        style={{ width: `${f.conf * 100}%` }}
                      />
                    </div>
                    <span className="w-14 text-right font-mono text-xs text-slate-400">
                      {(f.conf * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}

      <div className="flex items-start gap-2 rounded-xl border border-edge bg-ink-2/50 px-4 py-3 text-xs text-slate-500">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-cyan" />
        Benchmarks run in your browser's V8 engine. Absolute timings vary by
        device; the relative Big-O shape is what matters for complexity analysis.
      </div>
    </div>
  );
}

function Chart({
  ms,
  fits,
  lo,
  hi,
}: {
  ms: number[];
  fits: { id: string; k: number; conf: number }[];
  lo: number;
  hi: number;
}) {
  const best = fits[0];
  const yTicks = [lo, (lo + hi) / 2, hi];

  const measuredPath = SIZES.map(
    (n, i) => `${xPos(n)},${yPos(ms[i], lo, hi)}`
  ).join(" ");

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {/* grid + y ticks */}
      {yTicks.map((t, i) => {
        const y = PAD.t + (i / 2) * PH;
        return (
          <g key={i}>
            <line
              x1={PAD.l}
              y1={y}
              x2={W - PAD.r}
              y2={y}
              stroke="#1f2937"
              strokeDasharray="3 4"
            />
            <text x={PAD.l - 8} y={y + 4} textAnchor="end" className="fill-slate-500" fontSize="10">
              {10 ** t < 1 ? `${(10 ** t * 1000).toFixed(0)}µs` : `${(10 ** t).toFixed(1)}ms`}
            </text>
          </g>
        );
      })}
      {/* x ticks */}
      {SIZES.map((n) => (
        <text
          key={n}
          x={xPos(n)}
          y={H - PAD.b + 18}
          textAnchor="middle"
          className="fill-slate-500"
          fontSize="10"
        >
          {n}
        </text>
      ))}
      <text x={(W) / 2} y={H - 4} textAnchor="middle" className="fill-slate-500" fontSize="10">
        input size n (log scale)
      </text>

      {/* theoretical curves */}
      {fits.map((f) => {
        const c = COMPLEXITIES.find((x) => x.id === f.id)!;
        const isBest = f.id === best.id;
        const pts = SIZES.map(
          (n) => `${xPos(n)},${yPos(f.k * c.f(n), lo, hi)}`
        ).join(" ");
        return (
          <polyline
            key={f.id}
            points={pts}
            fill="none"
            stroke={isBest ? "#10b981" : "#334155"}
            strokeWidth={isBest ? 2.5 : 1.2}
            strokeDasharray={isBest ? "0" : "4 4"}
            opacity={isBest ? 1 : 0.55}
          />
        );
      })}

      {/* measured */}
      <polyline
        points={measuredPath}
        fill="none"
        stroke="#06b6d4"
        strokeWidth={2.5}
      />
      {SIZES.map((n, i) => (
        <circle key={n} cx={xPos(n)} cy={yPos(ms[i], lo, hi)} r={3.5} fill="#06b6d4" />
      ))}

      {/* legend */}
      <g transform={`translate(${W - 190}, ${PAD.t + 4})`}>
        <rect width={14} height={3} y={2} fill="#06b6d4" />
        <text x={20} y={6} className="fill-slate-400" fontSize="10">measured</text>
        <rect width={14} height={3} y={18} fill="#10b981" />
        <text x={20} y={22} className="fill-slate-400" fontSize="10">best fit O()</text>
      </g>
    </svg>
  );
}
