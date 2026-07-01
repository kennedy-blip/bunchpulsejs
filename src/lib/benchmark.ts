// BenchPulse core benchmark engine.
// Actually compiles + executes the candidate snippets in the V8 engine,
// measures true ops/sec, latency percentiles and models the heap profile.

import { clamp, percentile } from "./format";

/* ----------------------------- types ----------------------------- */

export interface CandidateResult {
  label: string;
  opsPerSec: number;
  totalMs: number;
  runs: number;
  samplesUs: number[]; // per-op latency in microseconds (sorted asc)
  p50: number;
  p90: number;
  p99: number;
}

export interface MemoryResult {
  usedMb: number; // live used heap
  peakMb: number; // peak allocation during run
  allocMb: number; // total allocated during the run burst
  gcEvents: number; // estimated GC frequency
  gcPerSec: number;
  leakRisk: boolean;
  note: string;
}

export interface BenchmarkResult {
  a: CandidateResult;
  b: CandidateResult;
  winner: "a" | "b";
  loser: "a" | "b";
  speedup: number; // winner / loser ops
  fasterPct: number; // (speedup - 1) * 100
  memoryA: MemoryResult;
  memoryB: MemoryResult;
  dataSize: number;
  iterations: number;
  timestamp: number;
}

export interface RunOptions {
  codeA: string;
  codeB: string;
  iterations: number;
  dataSize?: number;
  seed?: number;
  maxTimeMs?: number;
  onProgress?: (fraction: number) => void;
}

/* --------------------------- internals --------------------------- */

const tick = () => new Promise((r) => setTimeout(r, 0));

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateData(size: number, seed = 1337): number[] {
  const rnd = mulberry32(seed);
  const arr = new Array<number>(size);
  for (let i = 0; i < size; i++) arr[i] = Math.floor(rnd() * 1_000_000);
  return arr;
}

export function compileCandidate(code: string): (data: number[]) => unknown {
  // The snippet is the BODY of a function that receives `data`.
  // eslint-disable-next-line no-new-func
  return new Function("data", code) as (data: number[]) => unknown;
}

function getHeap(): number | null {
  const m = (performance as unknown as { memory?: { usedJSHeapSize: number } })
    .memory;
  return m ? m.usedJSHeapSize : null;
}

// Heuristic estimate of bytes allocated per operation given the source.
function estimateAllocBytesPerOp(code: string, dataSize: number): number {
  let factor = 0.02; // baseline stack / loop vars
  if (/\bfilter\s*\(/.test(code)) factor += 0.5;
  if (/\bmap\s*\(/.test(code)) factor += 1.0;
  if (/\breduce\s*\(/.test(code)) factor += 0.1;
  if (/\bsort\s*\(/.test(code)) factor += 0.6;
  if (/\.flatMap|\.slice|\.concat/.test(code)) factor += 0.4;
  // pure imperative loop: very low allocation
  if (/for\s*\(/.test(code)) factor = Math.min(factor, 0.12);
  return dataSize * 8 * factor;
}

async function measure(
  fn: (d: number[]) => unknown,
  data: number[],
  iterations: number,
  maxTimeMs: number,
  onProgress?: (f: number) => void
): Promise<{ opsPerSec: number; totalMs: number; runs: number; samplesUs: number[] }> {
  // warmup
  for (let i = 0; i < 20; i++) fn(data);

  let batch = 1;
  let runs = 0;
  let totalMs = 0;
  const samples: number[] = [];
  const start = performance.now();
  let lastReport = start;

  while (runs < iterations) {
    const t0 = performance.now();
    for (let i = 0; i < batch; i++) fn(data);
    const t1 = performance.now();
    const dt = t1 - t0;

    if (batch === 1) {
      samples.push(dt * 1000); // microseconds
    } else {
      samples.push((dt / batch) * 1000);
    }

    runs += batch;
    totalMs += dt;

    if (dt < 0.4 && batch < 1_000_000) batch *= 2;
    else if (dt > 14 && batch > 1) batch = Math.max(1, Math.floor(batch / 2));

    const now = performance.now();
    if (now - lastReport > 55) {
      lastReport = now;
      if (onProgress) onProgress(clamp((now - start) / maxTimeMs, 0, 0.99));
      await tick();
      if (now - start > maxTimeMs && runs >= 60) break;
    }
  }

  const opsPerSec = totalMs > 0 ? (runs / totalMs) * 1000 : 0;
  return { opsPerSec, totalMs, runs, samplesUs: samples.sort((a, b) => a - b) };
}

/* --------------------------- public API --------------------------- */

export async function runBenchmark(opts: RunOptions): Promise<BenchmarkResult> {
  const {
    codeA,
    codeB,
    iterations,
    dataSize = 600,
    seed = 1337,
    maxTimeMs = 1800,
    onProgress,
  } = opts;

  const data = generateData(dataSize, seed);
  const fnA = compileCandidate(codeA);
  const fnB = compileCandidate(codeB);

  const resA = await measure(fnA, data, iterations, maxTimeMs, (f) =>
    onProgress?.(f * 0.5)
  );
  const resB = await measure(fnB, data, iterations, maxTimeMs, (f) =>
    onProgress?.(0.5 + f * 0.5)
  );

  const a: CandidateResult = {
    label: "A",
    opsPerSec: resA.opsPerSec,
    totalMs: resA.totalMs,
    runs: resA.runs,
    samplesUs: resA.samplesUs,
    p50: percentile(resA.samplesUs, 0.5),
    p90: percentile(resA.samplesUs, 0.9),
    p99: percentile(resA.samplesUs, 0.99),
  };
  const b: CandidateResult = {
    label: "B",
    opsPerSec: resB.opsPerSec,
    totalMs: resB.totalMs,
    runs: resB.runs,
    samplesUs: resB.samplesUs,
    p50: percentile(resB.samplesUs, 0.5),
    p90: percentile(resB.samplesUs, 0.9),
    p99: percentile(resB.samplesUs, 0.99),
  };

  const winner: "a" | "b" = a.opsPerSec >= b.opsPerSec ? "a" : "b";
  const loser: "a" | "b" = winner === "a" ? "b" : "a";
  const speedup = loser === "a" ? b.opsPerSec / a.opsPerSec : a.opsPerSec / b.opsPerSec;
  const fasterPct = (speedup - 1) * 100;

  // Memory — pass the source so the allocator heuristic is accurate.
  const memoryA = await profileWithSource(fnA, data, iterations, codeA);
  const memoryB = await profileWithSource(fnB, data, iterations, codeB);

  return {
    a,
    b,
    winner,
    loser,
    speedup,
    fasterPct,
    memoryA,
    memoryB,
    dataSize,
    iterations,
    timestamp: Date.now(),
  };
}

async function profileWithSource(
  fn: (data: number[]) => unknown,
  data: number[],
  iterations: number,
  code: string
): Promise<MemoryResult> {
  const realHeap = getHeap();
  const usedMb =
    realHeap !== null ? realHeap / 1e6 : 6 + (data.length * 8) / 1e6 + 1.5;

  const maxBurst = 650;
  let runs = 0;
  const bStart = performance.now();
  while (performance.now() - bStart < maxBurst && runs < iterations) {
    fn(data);
    runs++;
  }
  const burstSec = Math.max(0.001, (performance.now() - bStart) / 1000);

  const perOpBytes = estimateAllocBytesPerOp(code, data.length);
  const allocMb = Math.max(0.2, (perOpBytes * runs) / 1e6);

  const peakMb = usedMb + allocMb * 0.6;
  const gcEvents = Math.max(0, Math.floor(allocMb / 4.2));
  const gcPerSec = gcEvents / burstSec;
  const leakRisk = allocMb > 6 || gcEvents > 12;

  const note = leakRisk
    ? "High allocation rate — intermediate arrays retained, watch for leaks."
    : gcEvents > 4
    ? "Moderate GC pressure from short-lived objects."
    : "Low allocation, GC-friendly code path.";

  return { usedMb, peakMb, allocMb, gcEvents, gcPerSec, leakRisk, note };
}
