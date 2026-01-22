import * as vscode from "vscode";

export class ConfigService {
  getNetworkId(): string {
    return vscode.workspace.getConfiguration("nearCursorHelper").get("networkId") || "testnet";
  }

  getAccountId(): string | undefined {
    const acc = vscode.workspace.getConfiguration("nearCursorHelper").get<string>("accountId");
    return acc ? acc.trim() : undefined;
  }

  // Helper to get extension path for templates
  private extensionPath: string;

  constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath;
  }

  getExtensionPath(): string {
    return this.extensionPath;
  }
}
