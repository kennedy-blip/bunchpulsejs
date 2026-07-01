// Default code snippets used in the Snippet Arena.
// Each snippet is the BODY of a function: `function(data) { <body> }`.
// `data` is an array of random integers supplied by the benchmark engine.

export const DEFAULT_A = `// Candidate A — Functional style
// Array.prototype.filter + map (allocates 2 intermediate arrays)
const evens = data.filter((x) => x % 2 === 0);
const doubled = evens.map((x) => x * 2);
return doubled.reduce((s, x) => s + x, 0);`;

export const DEFAULT_B = `// Candidate B — Imperative single loop
// One pass, no intermediate arrays, fewer allocations
let sum = 0;
for (let i = 0; i < data.length; i++) {
  const x = data[i];
  if (x % 2 === 0) sum += x * 2;
}
return sum;`;
