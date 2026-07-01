import { useCallback, useState } from "react";
import { AlertCircle, Code2, Boxes } from "lucide-react";
import Header, { type BenchMode } from "./components/Header";
import SnippetArena, { type IterCount } from "./components/SnippetArena";
import BenchmarkResults from "./components/BenchmarkResults";
import MemoryProfiler from "./components/MemoryProfiler";
import BigOComplexity from "./components/BigOComplexity";
import { DEFAULT_A, DEFAULT_B } from "./lib/examples";
import { runBenchmark, type BenchmarkResult } from "./lib/benchmark";
import { Panel } from "./components/ui";

export default function App() {
  const [mode, setMode] = useState<BenchMode>("ops");
  const [codeA, setCodeA] = useState(DEFAULT_A);
  const [codeB, setCodeB] = useState(DEFAULT_B);
  const [iterations, setIterations] = useState<IterCount>(10000);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = useCallback(async () => {
    setRunning(true);
    setProgress(0);
    setError(null);
    try {
      const res = await runBenchmark({
        codeA,
        codeB,
        iterations,
        onProgress: (f) => setProgress(f),
      });
      setResult(res);
    } catch (e) {
      setError(
        e instanceof Error
          ? `Compile / runtime error: ${e.message}`
          : "Failed to run benchmark."
      );
    } finally {
      setRunning(false);
      setProgress(1);
    }
  }, [codeA, codeB, iterations]);

  const handleReset = useCallback(() => {
    setCodeA(DEFAULT_A);
    setCodeB(DEFAULT_B);
    setError(null);
  }, []);

  const handleSwap = useCallback(() => {
    const a = codeA;
    const b = codeB;
    setCodeA(b);
    setCodeB(a);
  }, [codeA, codeB]);

  const handleExport = useCallback(() => {
    if (!result) return;
    const payload = {
      tool: "BenchPulse",
      engine: "V8 JS Compiler",
      exportedAt: new Date().toISOString(),
      iterations: result.iterations,
      dataSize: result.dataSize,
      candidates: {
        A: {
          code: codeA,
          opsPerSec: Math.round(result.a.opsPerSec),
          p50_us: result.a.p50,
          p90_us: result.a.p90,
          p99_us: result.a.p99,
          memory: result.memoryA,
        },
        B: {
          code: codeB,
          opsPerSec: Math.round(result.b.opsPerSec),
          p50_us: result.b.p50,
          p90_us: result.b.p90,
          p99_us: result.b.p99,
          memory: result.memoryB,
        },
      },
      winner: result.winner,
      speedup: Number(result.speedup.toFixed(3)),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `benchpulse-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [result, codeA, codeB]);

  return (
    <div className="bg-grid min-h-screen">
      <div className="grid-overlay min-h-screen">
        <Header
          mode={mode}
          setMode={setMode}
          onRun={handleStart}
          onExport={handleExport}
          running={running}
          hasResult={!!result}
        />

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
          {error && (
            <Panel className="mb-6 border-rose-500/40 glow-amber">
              <div className="flex items-start gap-3 p-4">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <div>
                  <div className="text-sm font-semibold text-rose-300">
                    Benchmark failed
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-400">{error}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Tip: each snippet is the body of <code>function(data)</code> and
                    must <code>return</code> a value.
                  </p>
                </div>
              </div>
            </Panel>
          )}

          {mode === "bigo" ? (
            <BigOComplexity />
          ) : (
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <SnippetArena
                  codeA={codeA}
                  codeB={codeB}
                  setCodeA={setCodeA}
                  setCodeB={setCodeB}
                  iterations={iterations}
                  setIterations={setIterations}
                  onStart={handleStart}
                  onReset={handleReset}
                  onSwap={handleSwap}
                  running={running}
                  progress={progress}
                  result={result}
                />
              </div>
              <div className="lg:col-span-5">
                {mode === "ops" ? (
                  <BenchmarkResults result={result} />
                ) : (
                  <MemoryProfiler result={result} />
                )}
              </div>
            </div>
          )}

          {/* Footer / info */}
          <footer className="mt-10 flex flex-col items-center gap-2 border-t border-edge pt-6 text-center">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Boxes className="h-4 w-4 text-cyan" />
              <span>
                BenchPulse — Interactive JS Execution Benchmark, Memory &amp; CPU
                Profiler
              </span>
            </div>
            <p className="max-w-2xl text-xs text-slate-600">
              All benchmarks execute live in your browser's V8 engine. Metrics are
              measured with <code className="font-mono">performance.now()</code>;
              heap figures are estimated when the Performance Memory API is
              unavailable.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Code2 className="h-3.5 w-3.5" />
              Built for frontend engineers, data-science students &amp; algorithm
              builders.
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
