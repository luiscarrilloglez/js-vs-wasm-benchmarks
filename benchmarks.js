// ── Benchmark 1: Matrix Multiplication ──────────────────────────────────────
// Multiplies two 512×512 Float64 matrices (~134 M multiply-add operations).
// Uses an i→k→j loop order for maximum cache locality.
// Returns the count of result cells whose value exceeds 100.
const MAT_N = 512;

export function jsMatrix() {
  const a = new Float64Array(MAT_N * MAT_N);
  const b = new Float64Array(MAT_N * MAT_N);
  const c = new Float64Array(MAT_N * MAT_N);

  for (let i = 0; i < MAT_N; i++)
    for (let j = 0; j < MAT_N; j++)
      a[i * MAT_N + j] = b[i * MAT_N + j] = (i + j + 1) / MAT_N;

  for (let i = 0; i < MAT_N; i++) {
    for (let k = 0; k < MAT_N; k++) {
      const a_ik = a[i * MAT_N + k];
      for (let j = 0; j < MAT_N; j++)
        c[i * MAT_N + j] += a_ik * b[k * MAT_N + j];
    }
  }

  let count = 0;
  for (const v of c) if (v > 100.0) count++;
  return count;
}

// ── Benchmark 2: Mandelbrot Set ──────────────────────────────────────────────
// Computes the Mandelbrot set for an 800×600 grid, up to 300 iterations per pixel.
// Returns the count of pixels that belong to the set (iterations === MAX_ITER).
// Heavy on branchy f64 arithmetic — representative of visual/scientific workloads.
const MB_W = 800, MB_H = 600, MB_MAX_ITER = 300;

export function jsMandelbrot() {
  let count = 0;
  for (let py = 0; py < MB_H; py++) {
    const cy = (py / MB_H) * 2.4 - 1.2;
    for (let px = 0; px < MB_W; px++) {
      const cx = (px / MB_W) * 3.5 - 2.5;
      let x = 0, y = 0, iter = 0;
      while (x * x + y * y <= 4.0 && iter < MB_MAX_ITER) {
        const xt = x * x - y * y + cx;
        y = 2.0 * x * y + cy;
        x = xt;
        iter++;
      }
      if (iter === MB_MAX_ITER) count++;
    }
  }
  return count;
}

// ── Benchmark 3: Sieve of Eratosthenes ───────────────────────────────────────
// Finds all primes up to 5 000 000 using a Uint8Array as a boolean flag array.
// Returns the total prime count.
// Tests integer arithmetic and dense sequential memory writes.
const SIEVE_LIMIT = 5_000_000;

export function jsSieve() {
  const isPrime = new Uint8Array(SIEVE_LIMIT + 1).fill(1);
  isPrime[0] = 0;
  isPrime[1] = 0;

  for (let i = 2; i * i <= SIEVE_LIMIT; i++) {
    if (isPrime[i]) {
      for (let j = i * i; j <= SIEVE_LIMIT; j += i)
        isPrime[j] = 0;
    }
  }

  let count = 0;
  for (let i = 2; i <= SIEVE_LIMIT; i++) if (isPrime[i]) count++;
  return count;
}
