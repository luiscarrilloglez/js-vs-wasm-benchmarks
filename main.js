import init, { bench_matrix, bench_mandelbrot, bench_sieve } from './wasm/rust_wasm_app.js';
import { jsMatrix, jsMandelbrot, jsSieve } from './benchmarks.js';

// ─────────────────────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Update a single result cell. */
function setResult(id, side, time, count) {
  const timeEl  = document.getElementById(`${id}-${side}-time`);
  const countEl = document.getElementById(`${id}-${side}-count`);
  const stateEl = document.getElementById(`${id}-${side}-state`);

  timeEl.textContent  = time  !== null ? `${time.toFixed(2)} ms`  : '—';
  countEl.textContent = count !== null ? count.toLocaleString()    : '—';
  stateEl.textContent = time  !== null ? 'Done'                    : 'Running…';

  if (time !== null) timeEl.classList.add('done');
  else               timeEl.classList.remove('done');
}

/** Reset all panels to idle. */
function resetAll() {
  for (const id of ['matrix', 'mandelbrot', 'sieve'])
    for (const side of ['js', 'wasm'])
      setResult(id, side, null, null);
  document.querySelectorAll('.state-label').forEach(el => el.textContent = 'Waiting…');
  document.querySelectorAll('.mismatch-alert').forEach(el => el.style.display = 'none');
}

/** Fill in the insight box once both sides have results. */
function setInsight(id, jsTime, wasmTime) {
  const box      = document.getElementById(`${id}-insight`);
  const headline = document.getElementById(`${id}-insight-headline`);
  if (!box || !headline) return;

  const diff = jsTime - wasmTime;
  // Percentage of time saved relative to the slower side
  const pct  = Math.abs(diff) / Math.max(jsTime, wasmTime) * 100;

  // Within 10%: treat as a tie — within measurement noise
  if (pct < 10) {
    box.style.borderLeftColor = 'var(--border)';
    headline.innerHTML =
      `Essentially tied <span style="font-weight:400;color:var(--muted)">` +
      `(${jsTime.toFixed(0)} ms vs ${wasmTime.toFixed(0)} ms, less than 10% difference)</span>.`;
  } else if (diff > 0) {
    // WASM faster
    box.style.borderLeftColor = 'var(--wasm-accent)';
    headline.innerHTML =
      `WASM was <span class="speedup">${pct.toFixed(0)}% faster</span> than JavaScript ` +
      `(${wasmTime.toFixed(0)} ms vs ${jsTime.toFixed(0)} ms).`;
  } else {
    // JS faster
    box.style.borderLeftColor = 'var(--js-accent)';
    headline.innerHTML =
      `JavaScript was <span class="speedup" style="color:var(--js-accent)">${pct.toFixed(0)}% faster</span> this run ` +
      `(${jsTime.toFixed(0)} ms vs ${wasmTime.toFixed(0)} ms) — try running again.`;
  }

  box.style.display = 'flex';
}

/** Reset all insight boxes to hidden. */
function resetInsights() {
  for (const id of ['matrix', 'mandelbrot', 'sieve']) {
    const box = document.getElementById(`${id}-insight`);
    if (box) box.style.display = 'none';
  }
}

/** Show a mismatch warning if JS and WASM counts differ (should never happen). */
function checkMismatch(id, jsCount, wasmCount) {
  const el = document.getElementById(`${id}-mismatch`);
  if (el) el.style.display = jsCount !== wasmCount ? 'block' : 'none';
}

function setButton(running) {
  const btn = document.getElementById('run-btn');
  btn.disabled    = running;
  btn.textContent = running ? 'Running…' : '▶  Run All Benchmarks';
}

// ─────────────────────────────────────────────────────────────────────────────
// Run a single benchmark pair (JS + WASM) and update its panel.
// We yield to the browser between runs so the UI can repaint.
// ─────────────────────────────────────────────────────────────────────────────
async function runPair(id, jsFn, wasmFn) {
  // Mark both sides as running
  setResult(id, 'js',   null, null);
  setResult(id, 'wasm', null, null);
  await new Promise(r => setTimeout(r, 16));

  // JS
  const jsStart = performance.now();
  const jsCount = jsFn();
  const jsTime = performance.now() - jsStart;
  setResult(id, 'js', jsTime, jsCount);
  await new Promise(r => setTimeout(r, 16));

  // WASM
  const wasmStart = performance.now();
  const wasmCount = wasmFn();
  const wasmTime = performance.now() - wasmStart;
  setResult(id, 'wasm', wasmTime, wasmCount);

  checkMismatch(id, jsCount, wasmCount);
  setInsight(id, jsTime, wasmTime);
}

// ─────────────────────────────────────────────────────────────────────────────
// Entry point
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  await init(); // instantiate the WASM module once

  document.getElementById('run-btn').addEventListener('click', async () => {
    setButton(true);
    resetAll();
    resetInsights();

    await runPair('matrix',    jsMatrix,    bench_matrix);
    await runPair('mandelbrot', jsMandelbrot, bench_mandelbrot);
    await runPair('sieve',     jsSieve,     bench_sieve);

    setButton(false);
  });

  document.getElementById('run-btn').disabled    = false;
  document.getElementById('run-btn').textContent = '▶  Run All Benchmarks';
}

main();

