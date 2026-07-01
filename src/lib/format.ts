// Number / unit formatting helpers for BenchPulse

export function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

export function formatCompact(n: number): string {
  if (!isFinite(n)) return "—";
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(0);
}

export function formatOps(n: number): string {
  return formatInt(n) + " ops/sec";
}

export function formatMicros(n: number): string {
  if (n >= 1000) return (n / 1000).toFixed(2) + " ms";
  return n.toFixed(2) + " µs";
}

export function formatMbps(n: number): string {
  return n.toFixed(1) + " MB";
}

// Percentile from a sorted array (ascending)
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  const frac = idx - lo;
  return sorted[lo] * (1 - frac) + sorted[hi] * frac;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
