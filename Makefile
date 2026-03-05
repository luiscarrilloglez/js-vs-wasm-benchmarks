.PHONY: all build serve clean

WASM_SRC     := rust-src/target/wasm32-unknown-unknown/release/rust_wasm_app.wasm
WASM_OUT_JS  := wasm/rust_wasm_app.js
WASM_OUT_BIN := wasm/rust_wasm_app_bg.wasm

# Default: build then serve
all: build serve

## Compile Rust → WASM and generate JS glue
build: $(WASM_OUT_JS)

$(WASM_OUT_JS): rust-src/src/lib.rs rust-src/Cargo.toml
	cd rust-src && cargo build --target wasm32-unknown-unknown --release
	wasm-bindgen --target web --no-typescript --out-dir wasm \
	  $(WASM_SRC)

## Start local HTTP server (Ctrl+C to stop)
serve:
	@echo "Open http://localhost:8080"
	python3 -m http.server 8080

## Remove generated WASM output and Cargo build cache
clean:
	rm -f $(WASM_OUT_JS) $(WASM_OUT_BIN)
	cargo clean --manifest-path rust-src/Cargo.toml
