# Proposal: NEAR Dev Infra Helper for Cursor

**Project Name**: NEAR Dev Infra Helper for Cursor
**Repository**: [Link to GitHub]
**One-Liner**: Infrastructure-as-Code extension enabling 1-click NEAR Rust development and AI agent automation.

## Problem
Onboarding to NEAR development involves a steep learning curve with multiple disjointed tools (`cargo`, `near-cli`, `rustup`, project templates). Developers—and increasingly, AI agents—struggle with:
1.  **Context Switching**: Jumping between IDE and terminal breaks flow.
2.  **Boilerplate Fatigue**: Setting up correct `Cargo.toml` and deploy scripts is error-prone.
3.  **Agent Friction**: AI coding assistants (Cursor, Copilot) lack structured APIs to reliably build and deploy contracts, often hallucinating commands.

## Solution
A VS Code/Cursor extension that acts as the "missing infrastructure layer" for the IDE. It unifies scaffolding, building, and deploying into a single tool with two interfaces:
1.  **Human UI**: One-click commands for scaffolding and deploying.
2.  **Agent API**: A typed TypeScript API (`NearExtensionApi`) that allows AI agents to autonomously drive the development loop.

## Key Features & Impact
-   **Zero-Config Scaffolding**: Generates production-ready Rust contracts with best-practice directory structure.
-   **Integrated Build System**: Runs `cargo build` with `wasm32-unknown-unknown` target and maps compiler errors directly to code lines (Inline Diagnostics).
-   **Configurable Deployment**: Handles network switching (`testnet`/`mainnet`) and account management via simple settings.
-   **Automation First**: The core logic is exposed as a service, enabling "Agentic Workflows" where an AI can write code, build it, fix errors based on diagnostics, and deploy it—all without human intervention.

## Architecture
The project follows a modular Service-Oriented Architecture:
-   **Services**: `ScaffoldingService` (Templates), `BuildService` (Cargo wrapper), `DeployService` (NEAR CLI wrapper), `ConfigService`.
-   **API Layer**: `src/api/index.ts` exposes the capabilities to other extensions.
-   **UI Layer**: Thin wrapper around the API for VS Code commands.

## Milestones Delivered
-   [x] **M1**: Core Architecture & Services.
-   [x] **M2**: Configuration System.
-   [x] **M3**: Robust Build & Diagnostics.
-   [x] **M4**: Agent API & Automation.
