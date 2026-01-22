import * as vscode from 'vscode';
import * as path from 'path';
import { promises as fs } from 'fs';
import { ScaffoldingService } from '../services/scaffolding';
import { BuildService } from '../services/build';
import { DeployService } from '../services/deploy';
import { ConfigService } from '../services/config';

export interface BuildResult {
    success: boolean;
    diagnostics: any[]; // Flattened list of diagnostics
    artifactPath?: string;
    // Extended properties for internal use
    diagnosticsMap?: Map<string, vscode.Diagnostic[]>;
    toolchainErrors?: string[];
}

export interface DeployResult {
    success: boolean;
    txHash?: string;
    errorMessage?: string;
}

export interface NearExtensionApi {
    /**
     * Creates a new NEAR Rust contract.
     * @param name The name of the contract (crate name).
     * @param path The parent directory where the project will be created.
     */
    createContract(name: string, path: string): Promise<void>;

    /**
     * Builds the contract at the given path.
     * @param path The root directory of the contract (containing Cargo.toml).
     */
    build(path: string): Promise<BuildResult>;

    /**
     * Deploys the contract at the given path.
     * Tries to find the wasm artifact in target/wasm32-unknown-unknown/release.
     * @param path The root directory of the contract.
     * @param accountId Optional account ID to deploy to. If not provided, uses VS Code settings.
     */
    deploy(path: string, accountId?: string): Promise<DeployResult>;

    /**
     * Builds and then deploys the contract.
     * @param path The root directory of the contract.
     * @param accountId Optional account ID to deploy to.
     */
    buildAndDeploy(path: string, accountId?: string): Promise<{ build: BuildResult; deploy: DeployResult }>;
}

/**
 * Creates the public API for the extension.
 * This API can be used by other extensions or agents to automate NEAR development tasks.
 */
export function createNearExtensionApi(
    scaffolding: ScaffoldingService,
    buildService: BuildService,
    deployService: DeployService,
    config: ConfigService
): NearExtensionApi {
    return {
        async createContract(name: string, dir: string): Promise<void> {
            await scaffolding.createNewContract(dir, name);
        },

        async build(dir: string): Promise<BuildResult> {
            const res = await buildService.buildContract(dir);
            
            // Flatten diagnostics map to array for easier consumption
            const diagnostics: any[] = [];
            if (res.diagnosticsMap) {
                res.diagnosticsMap.forEach((diags) => diagnostics.push(...diags));
            }

            return {
                success: res.success,
                artifactPath: res.artifactPath,
                diagnostics,
                diagnosticsMap: res.diagnosticsMap,
                toolchainErrors: res.toolchainErrors
            };
        },

        async deploy(dir: string, accountId?: string): Promise<DeployResult> {
            // Try to find the artifact in standard cargo location
            // target/wasm32-unknown-unknown/release/*.wasm
            const releaseDir = path.join(dir, 'target', 'wasm32-unknown-unknown', 'release');
            let artifactPath: string | undefined;
            
            try {
                const files = await fs.readdir(releaseDir);
                // Find the first .wasm file in the release directory
                const wasm = files.find(f => f.endsWith('.wasm'));
                if (wasm) {
                    artifactPath = path.join(releaseDir, wasm);
                }
            } catch (e) {
                // Directory might not exist
            }

            if (!artifactPath) {
                 return { success: false, errorMessage: "Could not find .wasm artifact. Please build first." };
            }

            return deployService.deployContract(dir, artifactPath, accountId);
        },

        async buildAndDeploy(dir: string, accountId?: string): Promise<{ build: BuildResult; deploy: DeployResult }> {
            const buildRes = await this.build(dir);
            if (!buildRes.success || !buildRes.artifactPath) {
                return {
                    build: buildRes,
                    deploy: { success: false, errorMessage: "Build failed, skipping deploy." }
                };
            }

            const deployRes = await deployService.deployContract(dir, buildRes.artifactPath, accountId);
            return {
                build: buildRes,
                deploy: deployRes
            };
        }
    };
}
