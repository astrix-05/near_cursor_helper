# Basic NEAR Contract Example

This folder contains a minimal NEAR Rust smart contract, similar to what `NEAR Cursor Helper` scaffolds.

## Structure
- `Cargo.toml`: Project configuration.
- `src/lib.rs`: Contract logic (Hello World).
- `scripts/`: Build and deploy scripts.

## How to Use with Extension

1. **Open this folder** in VS Code / Cursor.
2. Run command **"NEAR: Build & Deploy"**.
3. Select this folder when prompted.

The extension will:
1. Run `cargo build --target wasm32-unknown-unknown --release`.
2. Parse any errors.
3. If successful, run `scripts/deploy_testnet.sh`.
