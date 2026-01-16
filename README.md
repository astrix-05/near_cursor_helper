# NEAR Cursor Helper

## Overview
NEAR Cursor Helper is a VS Code/Cursor extension that accelerates NEAR smart contract development by providing intelligent scaffolding, opinionated templates, and streamlined build workflows. It helps you spin up production-ready NEAR Rust contracts in seconds and keeps build and diagnostics feedback inside your editor.

## Features
- Auto-generate NEAR Rust contract boilerplate with best practices
- Built-in project structure following NEAR SDK conventions
- One-click build and deploy workflows for NEAR testnet/mainnet (via scripts)
- Integrated error diagnostics for common NEAR contract issues
- Rust contract templates (lib.rs, Cargo.toml, helper scripts)
- Pre-configured build scripts for `wasm32-unknown-unknown` target
- Deploy scripts for both testnet and mainnet (customizable)

## Requirements
- VS Code **1.90.0+** (or Cursor IDE)
- Node.js **16+**
- Rust toolchain with `wasm32-unknown-unknown` target:
  ```bash
  rustup target add wasm32-unknown-unknown
  ```
- NEAR CLI **v4.0+**:
  ```bash
  npm install -g near-cli
  ```

## Installation
1. **From VS Code Marketplace**
   - Install from the Marketplace (link to be added when published).

2. **From source**
   ```bash
   npm install
   npm run compile
   # Package with your preferred tool, e.g. vsce:
   # vsce package
   code --install-extension near-cursor-helper-*.vsix
   ```

## Commands
### NEAR: New Rust Contract (Cursor)
- Command ID: `nearCursor.newRustContract`
- Prompts for a folder name.
- Creates a new folder in the workspace root and scaffolds a NEAR Rust contract:
  - `Cargo.toml` with `near-sdk` dependency, `edition = "2021"`, and `cdylib` crate type.
  - `src/lib.rs` containing a minimal `HelloNear` contract using `#[near_bindgen]` that stores and reads a greeting string.
  - `scripts/build.sh` to build a release Wasm for `wasm32-unknown-unknown`.
  - Optional deploy scripts (e.g. `scripts/deploy_testnet.sh`) that use NEAR CLI and are easy to customize.

### NEAR: Build & Deploy to Testnet (Cursor)
- Command ID: `nearCursor.buildAndDeploy`
- Asks you to pick a contract folder containing `Cargo.toml`.
- Runs:
  ```bash
  cargo build --target wasm32-unknown-unknown --release --message-format json
  ```
- Streams both `stdout` and `stderr` to the `NEAR Cursor` Output channel.
- Parses Cargo JSON output, surfaces Rust/NEAR errors as inline diagnostics, and shows a success/failure notification.
- Deploy behavior is driven by the project’s scripts (for example, `scripts/deploy_testnet.sh` using NEAR CLI). You can adapt these scripts for testnet or mainnet.

## Scaffolding Details
The Rust contract template is based on current NEAR Rust SDK patterns:
- Uses `near-sdk` 5.x and `#[near_bindgen]` (or the newer `near` macros, depending on template version).
- Provides a simple `Contract` type with:
  - A stored greeting string.
  - Methods like `set_greeting` and `get_greeting`.
- Includes comments in the generated `lib.rs` explaining the main NEAR concepts used.

The generated `Cargo.toml`:
- Targets Rust 2021 edition.
- Sets `crate-type = ["cdylib"]` for Wasm contracts.
- Uses release profile settings optimized for small Wasm size where appropriate.

The build script:
- Compiles to `wasm32-unknown-unknown` in release mode.
- Optionally copies the resulting `.wasm` artifact into a `res/` directory for easier deployment.

## Diagnostics & Logging
- Build output is streamed in real time to the `NEAR Cursor` Output channel.
- When using JSON-formatted Cargo output, the extension:
  - Parses compiler messages.
  - Maps errors and warnings to the correct Rust source files.
  - Shows inline red/yellow squiggles via `vscode.DiagnosticCollection`.
- Errors mentioning `near_sdk` or `wasm` are annotated with clickable codes that open the relevant NEAR Rust documentation.

## Usage
1. Open a folder in VS Code or Cursor.
2. Run **NEAR: New Rust Contract (Cursor)** to scaffold a new NEAR Rust contract.
3. Open the generated `src/lib.rs`, review or customize the contract.
4. Run **NEAR: Build & Deploy to Testnet (Cursor)**:
   - Select the scaffolded contract folder.
   - Watch the `NEAR Cursor` Output channel for build logs.
   - Fix any inline diagnostics that appear in your Rust files.
5. Adjust deploy scripts (account ID, network, node URL) to target your desired NEAR environment.

## Development
To work on the extension itself:
```bash
npm install
npm run watch   # or: npm run compile
```
Then, in VS Code/Cursor:
- Run the **Run Extension** launch configuration.
- A new Extension Development Host window will open with the NEAR Cursor Helper extension loaded.

