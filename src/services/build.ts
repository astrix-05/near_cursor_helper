import * as vscode from "vscode";
import * as path from "path";
import { spawn } from "child_process";
import { parseCargoJsonToDiagnostics } from "../diagnostics";

export interface BuildResult {
  success: boolean;
  artifactPath?: string;
  diagnosticsMap?: Map<string, vscode.Diagnostic[]>;
  toolchainErrors?: string[];
}

export class BuildService {
  constructor(private outputChannel: vscode.OutputChannel) {}

  async buildContract(folder: string): Promise<BuildResult> {
    this.outputChannel.appendLine(`Building contract in: ${folder}`);
    const args = ["build", "--target", "wasm32-unknown-unknown", "--release", "--message-format", "json"];
    
    return new Promise<BuildResult>((resolve) => {
      const child = spawn("cargo", args, { cwd: folder });
      const jsonLines: string[] = [];

      child.stdout.on("data", (d) => {
        const str = d.toString();
        // Sometimes multiple JSON objects come in one chunk, split by newline
        for (const line of str.split(/\r?\n/)) {
            if (line.trim()) jsonLines.push(line.trim());
        }
      });
      
      child.stderr.on("data", (d) => {
          // Pass stderr to output channel for visibility
          this.outputChannel.append(d.toString());
      });

      child.on("close", (code) => {
        const success = code === 0;
        const { map, toolchainErrors } = parseCargoJsonToDiagnostics(jsonLines, folder);
        
        let artifactPath = undefined;
        if (success) {
          for (const line of jsonLines) {
            try {
              const msg = JSON.parse(line);
              // Look for compiler-artifact with .wasm file
              if (msg.reason === "compiler-artifact" && msg.target?.kind?.includes("cdylib")) {
                const wasm = msg.filenames?.find((f: string) => f.endsWith(".wasm"));
                if (wasm) {
                    artifactPath = wasm;
                    // Keep looking in case there are multiple, but usually the last one is the release build
                }
              }
            } catch {}
          }
        }
        
        resolve({ success, artifactPath, diagnosticsMap: map, toolchainErrors });
      });
    });
  }
}
