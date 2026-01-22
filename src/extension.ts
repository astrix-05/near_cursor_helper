import * as vscode from "vscode";
import * as path from "path";
import { promises as fs } from "fs";
import { ConfigService } from "./services/config";
import { ScaffoldingService } from "./services/scaffolding";
import { BuildService } from "./services/build";
import { DeployService } from "./services/deploy";
import { createNearExtensionApi, NearExtensionApi } from "./api";

export function activate(context: vscode.ExtensionContext): NearExtensionApi {
  // Initialize Services
  const configService = new ConfigService(context);
  const scaffoldService = new ScaffoldingService(configService);
  
  const channel = vscode.window.createOutputChannel("NEAR Cursor");
  const diagnostics = vscode.languages.createDiagnosticCollection("near-cursor");
  
  const buildService = new BuildService(channel);
  const deployService = new DeployService(configService, channel);

  // Initialize API
  const api = createNearExtensionApi(scaffoldService, buildService, deployService, configService);

  // Command: Scaffold a new NEAR Rust contract
  const newRust = vscode.commands.registerCommand("nearCursor.newRustContract", async () => {
    const wf = vscode.workspace.workspaceFolders;
    if (!wf || wf.length === 0) {
      vscode.window.showErrorMessage("No workspace folder open");
      return;
    }
    const root = wf[0].uri.fsPath;
    const name = await vscode.window.showInputBox({ prompt: "New folder name", value: "hello-near-rust" });
    if (!name) return;

    try {
      await api.createContract(name, root);
      const projectPath = path.join(root, name);
      vscode.window.showInformationMessage(`Created NEAR Rust contract at ${projectPath}`);
    } catch (e: any) {
      vscode.window.showErrorMessage(`Failed to create contract: ${e.message}`);
    }
  });

  // Command: Build & Deploy
  const buildDeploy = vscode.commands.registerCommand("nearCursor.buildAndDeploy", async () => {
    channel.show(true);
    diagnostics.clear();

    // 1. Ask user for folder
    const targetFolder = await promptForCargoFolder();
    if (!targetFolder) return;

    try {
      // 2. Build & Deploy via API
      const { build: buildResult, deploy: deployResult } = await api.buildAndDeploy(targetFolder);
      
      // Update diagnostics
      if (buildResult.diagnosticsMap) {
        updateDiagnostics(buildResult.diagnosticsMap, targetFolder, diagnostics);
      }
      
      // Show toolchain hints
      if (buildResult.toolchainErrors && buildResult.toolchainErrors.length > 0) {
          const hint = buildResult.toolchainErrors.join("\n");
          vscode.window.showWarningMessage(`Toolchain warning: ${hint}`);
          channel.appendLine(`[Toolchain] ${hint}`);
      }

      if (!buildResult.success) {
        vscode.window.showErrorMessage("Build failed - check output for details.");
        return;
      }
      vscode.window.showInformationMessage("Build succeeded");

      // 3. Deploy Result Check
      if (deployResult.success) {
          const txMsg = deployResult.txHash ? ` (Tx: ${deployResult.txHash})` : "";
          vscode.window.showInformationMessage(`Deploy succeeded${txMsg}`);
      } else {
          // If build succeeded but deploy failed
          vscode.window.showErrorMessage(`Deploy failed: ${deployResult.errorMessage || "Unknown error"}`);
      }

    } catch (err: any) {
      vscode.window.showErrorMessage(`Error: ${err.message}`);
    }
  });

  context.subscriptions.push(newRust, buildDeploy, channel, diagnostics);

  return api;
}

export function deactivate() {}

// --- UI Helpers ---

async function promptForCargoFolder(): Promise<string | undefined> {
  const pick = await vscode.window.showOpenDialog({ canSelectFolders: true, canSelectFiles: false, canSelectMany: false });
  if (!pick || pick.length === 0) return undefined;
  const folder = pick[0].fsPath;
  try {
    await fs.access(path.join(folder, "Cargo.toml"));
    return folder;
  } catch {
    vscode.window.showErrorMessage("Selected folder does not contain Cargo.toml");
    return undefined;
  }
}

// Helper to update diagnostics collection from the map
function updateDiagnostics(
    diagMap: Map<string, vscode.Diagnostic[]>, 
    cwd: string, 
    collection: vscode.DiagnosticCollection
) {
    const setFor: vscode.Uri[] = [];
    
    for (const [file, diags] of diagMap.entries()) {
      const targetPath = path.isAbsolute(file) ? file : path.join(cwd, file);
      // We only care about .rs files for now
      if (!targetPath.endsWith(".rs")) continue;
      const uri = vscode.Uri.file(targetPath);
      collection.set(uri, diags);
      setFor.push(uri);
    }
    
    // Clear diagnostics for other open Rust files if they have no errors
    const openDocs = vscode.workspace.textDocuments.filter(d => d.languageId === "rust" || d.fileName.endsWith(".rs"));
    for (const doc of openDocs) {
      if (!setFor.find(u => u.fsPath === doc.uri.fsPath)) {
        collection.set(doc.uri, []);
      }
    }
}
