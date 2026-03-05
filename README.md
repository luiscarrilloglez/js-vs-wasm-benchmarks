# JavaScript vs Rust + WebAssembly — Benchmark Suite

A single-page app that runs three CPU-intensive tests side by side, comparing plain JavaScript against Rust compiled to WebAssembly (WASM). Both sides run the **exact same algorithm** — the only difference is the runtime.

---

## What it does

| Test | What it measures |
|------|-----------------|
| **Matrix Multiplication 512×512** | ~134 million multiply-add operations |
| **Mandelbrot Set 800×600 px** | 480,000 pixels × up to 300 math iterations each |
| **Sieve of Eratosthenes to 5M** | Finding all prime numbers up to 5 million |

After each test the page shows the time for both runtimes and explains in plain language why one was faster.

---

## How the app works

The app is a single HTML page with no build step, no framework, and no dependencies beyond the compiled WASM binary. When you open it in a browser:

1. The WASM module (`rust_wasm_app_bg.wasm`) is fetched and instantiated via `main.js`.
2. You click **▶ Run All Benchmarks** to trigger all three tests sequentially.
3. Each test runs the JavaScript version first, then the WASM version, measuring wall-clock time with `performance.now()`.
4. Results are displayed side by side with a colour-coded winner and a plain-language explanation.

---

## The three benchmarks

### 1 · Matrix Multiplication 512×512

Multiplies two 512×512 matrices of 64-bit floats — roughly **134 million multiply-add operations**.

- Loop order is `i → k → j` for maximum cache locality.
- The return value is the count of result cells whose value exceeds 100 (used to prevent the compiler from optimising away the work).
- **Why it stresses the runtime:** sustained, regular floating-point arithmetic with predictable memory access. Rust/WASM can auto-vectorise the inner loop with SIMD; V8 cannot guarantee the same.

### 2 · Mandelbrot Set 800×600 px

Computes the classic Mandelbrot fractal over an 800 × 600 grid, allowing up to **300 iterations per pixel** (480 000 pixels total).

- Each pixel runs a tight `while` loop with early exit — highly **branchy** arithmetic.
- Returns the count of pixels that belong to the set (those that reached the iteration limit).
- **Why it stresses the runtime:** irregular branch patterns make speculative execution hard. This test reveals how well each runtime handles unpredictable loop lengths.

### 3 · Sieve of Eratosthenes to 5 000 000

Finds all prime numbers up to **5 million** using a boolean flag array.

- Allocates a `Uint8Array` / `Vec<bool>` and performs dense sequential writes (marking composites).
- Returns the total prime count (348 513).
- **Why it stresses the runtime:** integer arithmetic with large linear-memory writes. WASM's flat memory model gives it an edge over the JS heap for this access pattern.

---

## Understanding the results

| Scenario | What it means |
|----------|--------------|
| **WASM significantly faster** | The Rust compiler applied optimisations (SIMD, inlining, zero-cost abstractions) that V8's JIT cannot match for this workload. Typical for matrix multiplication. |
| **JS and WASM within ~20 %** | V8's JIT has fully warmed up and both runtimes are near their peak for this pattern. Common for the Mandelbrot and Sieve tests on modern Chrome/Firefox. |
| **JS faster** | Rare for pure compute, but can happen on short runs where WASM instantiation overhead is not amortised, or on engines with particularly strong JIT for scalar loops. |
| **Results vary between runs** | Normal — the OS scheduler, garbage collection pauses, and CPU thermal throttling all introduce noise. Run several times and compare averages. |

> **Note:** WASM does not have access to multiple threads or SIMD in this demo (it uses the `wasm32-unknown-unknown` target without the `atomics` or `simd128` features). Enabling those would widen the gap further in favour of WASM.

---

## Requirements

You need three tools installed before you can build and run this project.

### 1. Rust
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
Official guide: https://www.rust-lang.org/tools/install

### 2. WASM compilation target
```bash
rustup target add wasm32-unknown-unknown
```

### 3. wasm-bindgen CLI
```bash
cargo install wasm-bindgen-cli
```
Official repo: https://github.com/wasm-bindgen/wasm-bindgen

> **Note:** `wasm-pack` was previously used for this step but has been archived and is no longer maintained
> (see [sunsetting announcement](https://blog.rust-lang.org/inside-rust/2025/07/21/sunsetting-the-rustwasm-github-org/)).
> The recommended replacement is `cargo build` + `wasm-bindgen-cli` directly.

---

## Build

From inside the `rust-src/` folder, run:

```bash
cd rust-src
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen --target web --no-typescript --out-dir ../wasm \
  ./target/wasm32-unknown-unknown/release/rust_wasm_app.wasm
```

This places two files inside `wasm/`:
- `rust_wasm_app.js` — JavaScript glue that exposes the benchmark functions
- `rust_wasm_app_bg.wasm` — the compiled binary loaded by the browser

You only need to rebuild when you change `rust-src/src/lib.rs`.

---

## Run

Because browsers block WebAssembly from `file://` URLs, you need a local HTTP server.
From the project root:

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080 and click **▶ Run All Benchmarks**.

---

## Project structure

```
js-vs-wasm-benchmarks/
├── index.html       ← the page (layout, styles, benchmark descriptions)
├── main.js          ← WASM loader + UI logic
├── benchmarks.js    ← JavaScript benchmark implementations (independent module)
├── README.md        ← this file
├── wasm/            ← compiled output (generated by wasm-bindgen, do not edit)
│   ├── rust_wasm_app.js
│   └── rust_wasm_app_bg.wasm
└── rust-src/        ← Rust source code
    ├── Cargo.toml
    └── src/
        └── lib.rs
```

---

## Quick reference

```bash
# Compile Rust → WASM  (run from rust-src/)
cargo build --target wasm32-unknown-unknown --release
wasm-bindgen --target web --no-typescript --out-dir ../wasm \
  ./target/wasm32-unknown-unknown/release/rust_wasm_app.wasm

# Serve locally  (run from project root)
python3 -m http.server 8080
```

---

