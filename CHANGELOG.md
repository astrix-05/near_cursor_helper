# Changelog

All notable changes to the "near-cursor-helper" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-01-16

### Added
- **New Command**: `NEAR: New Rust Contract (Cursor)` (`nearCursor.newRustContract`)
  - Scaffolds a new NEAR Rust project with `Cargo.toml`, `src/lib.rs`, and helper scripts.
  - Uses `near-sdk` 5.0 and `#[near_bindgen]` macros.
  - Generates `wasm32-unknown-unknown` build configuration.
- **New Command**: `NEAR: Build & Deploy to Testnet (Cursor)` (`nearCursor.buildAndDeploy`)
  - Detects contract folders containing `Cargo.toml`.
  - Runs `cargo build --target wasm32-unknown-unknown --release` with JSON output.
  - Streams build logs to a dedicated "NEAR Cursor" Output channel.
  - Parses Rust compiler errors and displays them as inline diagnostics in VS Code.
  - Links error codes (e.g., `near_sdk`, `wasm`) to official documentation.
- **Diagnostics**: Real-time error reporting in the editor for Rust contract builds.
- **Documentation**: Comprehensive `README.md` and `CONTRIBUTING.md`.

### Fixed
- Fixed issue where build commands would block the UI (moved to async/await).
- Improved error parsing to only show primary spans for cleaner diagnostics.
