use wasm_bindgen::prelude::*;

// ── Benchmark 1: Matrix Multiplication ──────────────────────────────────────
// Multiplies two 512x512 f64 matrices (~134 M fused multiply-add operations).
// Uses an i→k→j loop order for maximum cache locality.
// rustc -O3 auto-vectorises the inner loop with SIMD; V8 cannot guarantee this.

const MAT_N: usize = 512;

#[wasm_bindgen]
pub fn bench_matrix() -> u32 {
    let a: Vec<f64> = (0..MAT_N * MAT_N)
        .map(|k| ((k / MAT_N) + (k % MAT_N) + 1) as f64 / MAT_N as f64)
        .collect();
    let b = a.clone();
    let mut c = vec![0.0f64; MAT_N * MAT_N];

    for i in 0..MAT_N {
        for k in 0..MAT_N {
            let a_ik = a[i * MAT_N + k];
            for j in 0..MAT_N {
                c[i * MAT_N + j] += a_ik * b[k * MAT_N + j];
            }
        }
    }

    c.iter().filter(|&&v| v > 100.0).count() as u32
}

// ── Benchmark 2: Mandelbrot Set ──────────────────────────────────────────────
// Computes the Mandelbrot set for an 800x600 grid, up to 300 iterations per pixel.
// Returns the count of pixels that belong to the set (iterations == MAX_ITER).
// Heavy on branchy f64 arithmetic — representative of visual/scientific workloads.

const MB_W: usize = 800;
const MB_H: usize = 600;
const MB_MAX_ITER: u32 = 300;

#[wasm_bindgen]
pub fn bench_mandelbrot() -> u32 {
    let mut count = 0u32;
    for py in 0..MB_H {
        let cy = (py as f64 / MB_H as f64) * 2.4 - 1.2;
        for px in 0..MB_W {
            let cx = (px as f64 / MB_W as f64) * 3.5 - 2.5;
            let (mut x, mut y) = (0.0f64, 0.0f64);
            let mut iter = 0u32;
            while x * x + y * y <= 4.0 && iter < MB_MAX_ITER {
                let xt = x * x - y * y + cx;
                y = 2.0 * x * y + cy;
                x = xt;
                iter += 1;
            }
            if iter == MB_MAX_ITER {
                count += 1;
            }
        }
    }
    count
}

// ── Benchmark 3: Sieve of Eratosthenes ───────────────────────────────────────
// Finds all primes up to 5 000 000 using a boolean array.
// Returns the total prime count.
// Tests integer arithmetic and dense sequential memory writes
// — a pattern where WASM's linear memory model outperforms JS heap allocation.

const SIEVE_LIMIT: usize = 5_000_000;

#[wasm_bindgen]
pub fn bench_sieve() -> u32 {
    let mut is_prime = vec![true; SIEVE_LIMIT + 1];
    is_prime[0] = false;
    is_prime[1] = false;

    let mut i = 2usize;
    while i * i <= SIEVE_LIMIT {
        if is_prime[i] {
            let mut j = i * i;
            while j <= SIEVE_LIMIT {
                is_prime[j] = false;
                j += i;
            }
        }
        i += 1;
    }

    is_prime.iter().filter(|&&v| v).count() as u32
}
