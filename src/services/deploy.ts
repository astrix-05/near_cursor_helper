import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";
import { ConfigService } from "./config";

export interface DeployResult {
    success: boolean;
    txHash?: string;
    errorMessage?: string;
}

export class DeployService {
  constructor(private config: ConfigService, private outputChannel: vscode.OutputChannel) {}

  async deployContract(folder: string, artifactPath: string, accountIdOverride?: string): Promise<DeployResult> {
    this.outputChannel.appendLine(`Deploying artifact: ${artifactPath}`);
    
    const networkId = this.config.getNetworkId();
    const accountId = accountIdOverride || this.config.getAccountId();

    if (!accountId) {
        const msg = "Deploy failed: No NEAR account ID configured. Please set 'nearCursorHelper.accountId' in Settings.";
        this.outputChannel.appendLine(msg);
        return { success: false, errorMessage: msg };
    }

    this.outputChannel.appendLine(`Target Network: ${networkId}`);
    this.outputChannel.appendLine(`Target Account: ${accountId}`);

    const scriptPath = path.join(folder, "scripts", "deploy_testnet.sh");
    
    // Check if script exists
    try {
        // Pass environment variables to override script defaults
        const env = { 
            ...process.env, 
            NEAR_ENV: networkId, 
            NEAR_NETWORK: networkId,
            ACCOUNT_ID: accountId,
            NETWORK: networkId 
        };

        return new Promise<DeployResult>((resolve) => {
             const child = spawn("bash", [scriptPath], { cwd: folder, env });
             let output = "";
             let errorOut = "";

             child.stdout.on("data", d => {
                 const s = d.toString();
                 output += s;
                 this.outputChannel.append(s);
             });
             child.stderr.on("data", d => {
                 const s = d.toString();
                 errorOut += s;
                 this.outputChannel.append(s);
             });

             child.on('close', code => {
                 if (code === 0) {
                     // Try to parse tx hash from output (common pattern in near-cli)
                     // "Transaction Id ...: 6zgh..."
                     const match = output.match(/Transaction Id.*:\s*([A-Za-z0-9]+)/);
                     const txHash = match ? match[1] : undefined;
                     resolve({ success: true, txHash });
                 } else {
                     resolve({ success: false, errorMessage: `Deploy script exited with code ${code}` });
                 }
             });
             child.on('error', err => {
                 resolve({ success: false, errorMessage: err.message });
             });
        });

    } catch (e: any) {
        return { success: false, errorMessage: e.message };
    }
  }
}
