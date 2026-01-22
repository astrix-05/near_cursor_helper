# NEAR Dev Infra Helper for Cursor

> “A VS Code/Cursor extension that lets developers and AI agents scaffold, build, and deploy NEAR Rust contracts with one command.”

## Why this matters for NEAR
Onboarding to NEAR development often involves juggling multiple tools (`cargo`, `near-cli`, boilerplate templates). This extension acts as **infrastructure** that:
1.  **Shortens the Inner Loop**: Scaffold, build, and deploy without leaving the editor.
2.  **Improves Onboarding**: Provides opinionated, working Rust templates out of the box.
3.  **Enables Automation**: Exposes a typed API (`NearExtensionApi`) that AI agents can use to autonomously write and deploy contracts.

## Features
- **NEAR Rust Scaffolding**: Generate production-ready contracts with `Cargo.toml`, `src/lib.rs`, and deploy scripts from file-based templates.
- **Robust Build System**: Runs `cargo build` targeting `wasm32-unknown-unknown` with **structured diagnostics** (inline error reporting) and toolchain hints.
- **Configurable Deployment**: Deploy directly to testnet/mainnet using settings (`networkId`, `accountId`) without hardcoded scripts.
- **Agent-Friendly API**: Exports a full programmatic API (`createContract`, `build`, `deploy`) for other extensions or AI agents.
- **Example & Tests**: Includes a reference project in `examples/basic-contract/` and Jest tests for reliability.

## Quickstart

### Installation
```bash
git clone https://github.com/your-repo/near_cursor_helper.git
cd near_cursor_helper
npm install
npm run compile
```
Open in VS Code (`code .`) and press `F5` to launch the extension.

### Usage
1.  **Scaffold**: Run command `NEAR: New Rust Contract (Cursor)`. Enter a name (e.g., `my-contract`).
2.  **Build & Deploy**: Run command `NEAR: Build & Deploy to Testnet (Cursor)`. Select your contract folder.
3.  **Output**: Watch the **NEAR Cursor** output channel for build logs and transaction hashes.

## Configuration
Customize behavior via VS Code Settings (`settings.json`):

| Setting | Default | Description |
| :--- | :--- | :--- |
| `nearCursorHelper.networkId` | `"testnet"` | Target network (`testnet`, `mainnet`, `sandbox`). |
| `nearCursorHelper.accountId` | `""` | Your NEAR account ID for deployment (e.g. `alice.testnet`). |

## Architecture
This extension follows a modular Service-Oriented Architecture:

### Services Layer (`src/services/`)
- **`ScaffoldingService`**: Manages file-based templates (`src/templates/`) to generate contracts.
- **`BuildService`**: Wraps `cargo` process execution, parsing JSON output into structured `BuildResult` and VS Code diagnostics.
- **`DeployService`**: Handles deployment via `child_process` using environment variables (`NEAR_ENV`, `ACCOUNT_ID`).
- **`ConfigService`**: Centralized access to extension settings.

### API Layer (`src/api/index.ts`)
Exposes a typed interface for automation:
```typescript
export interface NearExtensionApi {
  createContract(name: string, path: string): Promise<void>;
  build(path: string): Promise<BuildResult>;
  deploy(path: string, accountId?: string): Promise<DeployResult>;
  buildAndDeploy(path: string): Promise<{ build: BuildResult; deploy: DeployResult }>;
}
```

### UI Layer (`src/extension.ts`)
Registers VS Code commands (`nearCursor.newRustContract`, `nearCursor.buildAndDeploy`) that act as thin wrappers around the API.

## Roadmap / Milestones
- [x] **M1: Architecture Refactor**: Modular services, removal of hardcoded strings.
- [x] **M2: Configuration**: `package.json` settings for network/account.
- [x] **M3: Reliability**: Structured `BuildResult`, toolchain hints, better error parsing.
- [x] **M4: Agent API**: Public `NearExtensionApi` for automation.

### Future Work
- Add `QuickFix` providers for common NEAR Rust errors.
- Support TypeScript/JavaScript contracts.
- Integrate directly with `near-cli-rs` via library calls instead of shell spawning.
