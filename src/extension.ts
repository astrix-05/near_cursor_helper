import * as vscode from "vscode";
import * as path from "path";
import { promises as fs } from "fs";
import { spawn } from "child_process";
import { parseCargoJsonToDiagnostics } from "./diagnostics";

async function writeFile(filePath: string, content: string) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, { encoding: "utf8" });
}

async function createNearRustTemplate(baseDir: string, name: string) {
  const projectDir = path.join(baseDir, name);
  const cargoToml = `[package]\nname = "${name}"\nversion = "0.1.0"\nedition = "2021"\n\n[lib]\ncrate-type = ["cdylib"]\n\n[dependencies]\nnear-sdk = { version = "5.23", default-features = false, features = ["abi"] }\n\n[profile.release]\nopt-level = "z"\nlto = true\ncodegen-units = 1\npanic = "abort"\nstrip = "symbols"\n`;
  const configToml = `[build]\ntarget = "wasm32-unknown-unknown"\nrustflags = ["-C", "link-arg=-s"]\n`;
  const libRs = `use near_sdk::{near, PanicOnDefault};\nuse near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};\n\n#[near(contract_state)]\n#[derive(BorshDeserialize, BorshSerialize, PanicOnDefault)]\npub struct Contract {\n    greeting: String,\n}\n\n#[near]\nimpl Contract {\n    #[init]\n    pub fn new(greeting: String) -> Self {\n        Self { greeting }\n    }\n\n    pub fn set_greeting(&mut self, greeting: String) {\n        self.greeting = greeting;\n    }\n\n    pub fn get_greeting(&self) -> String {\n        self.greeting.clone()\n    }\n}\n`;
  const buildScript = `#!/usr/bin/env bash\nset -e\ncargo build --target wasm32-unknown-unknown --release\nmkdir -p res\ncp target/wasm32-unknown-unknown/release/${name}.wasm res/${name}.wasm\necho "Built res/${name}.wasm"\n`;
  const deployScript = `#!/usr/bin/env bash\nset -euo pipefail\nCONTRACT_NAME=\"${name}.testnet\"\nWASM_PATH=\"${"./res/" + name + ".wasm"}\"\nif [ ! -f \"$WASM_PATH\" ]; then\n  if [ -f \"./target/wasm32-unknown-unknown/release/${name}.wasm\" ]; then\n    WASM_PATH=\"./target/wasm32-unknown-unknown/release/${name}.wasm\"\n  else\n    WASM_PATH=\"./target/wasm32-unknown-unknown/debug/${name}.wasm\"\n  fi\nfi\necho \"Deploying ${name} to $CONTRACT_NAME using $WASM_PATH\"\nnear deploy $CONTRACT_NAME --wasmFile $WASM_PATH\nnear view $CONTRACT_NAME get_greeting '{}'\nnear call $CONTRACT_NAME set_greeting '{\"greeting\":\"Hello from Cursor\"}' --accountId $CONTRACT_NAME\nnear view $CONTRACT_NAME get_greeting '{}'\n`;
  await writeFile(path.join(projectDir, "Cargo.toml"), cargoToml);
  await writeFile(path.join(projectDir, ".cargo", "config.toml"), configToml);
  await writeFile(path.join(projectDir, "src", "lib.rs"), libRs);
  await writeFile(path.join(projectDir, "scripts", "build.sh"), buildScript);
  await fs.chmod(path.join(projectDir, "scripts", "build.sh"), 0o755);
  await writeFile(path.join(projectDir, "scripts", "deploy_testnet.sh"), deployScript);
  await fs.chmod(path.join(projectDir, "scripts", "deploy_testnet.sh"), 0o755);
  return projectDir;
}

async function runCommandInOutput(cmd: string, args: string[], cwd: string, channel: vscode.OutputChannel) {
  return new Promise<void>((resolve, reject) => {
    channel.appendLine(`$ ${cmd} ${args.join(" ")}`);
    const child = spawn(cmd, args, { cwd, shell: false });
    child.stdout.on("data", d => channel.append(d.toString()));
    child.stderr.on("data", d => channel.append(d.toString()));
    child.on("error", err => {
      channel.appendLine(String(err));
      reject(err);
    });
    child.on("close", code => {
      channel.appendLine(`exit code ${code}`);
      code === 0 ? resolve() : reject(new Error(`Command failed: ${cmd}`));
    });
  });
}

export function activate(context: vscode.ExtensionContext) {
  const channel = vscode.window.createOutputChannel("NEAR Cursor");
  const diagnostics = vscode.languages.createDiagnosticCollection("near-cursor");

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
      const dirPath = path.join(root, name);
      try {
        await fs.access(dirPath);
        vscode.window.showErrorMessage("Folder already exists");
        return;
      } catch {}
      const dir = await createNearRustTemplateFromFiles(context.extensionPath, root, name);
      vscode.window.showInformationMessage(`Created NEAR Rust contract at ${dir}`);
    } catch (e) {
      vscode.window.showErrorMessage(String(e));
    }
  });

  const buildDeploy = vscode.commands.registerCommand("nearCursor.buildAndDeploy", async () => {
    channel.show(true);
    diagnostics.clear();
    const targetFolder = await promptForCargoFolder();
    if (!targetFolder) return;
    try {
      const cargoArgs = ["build", "--target", "wasm32-unknown-unknown", "--release", "--message-format", "json"];
      const buildOk = await runCargoBuildCollectDiagnostics(targetFolder, cargoArgs, channel, diagnostics);
      if (!buildOk) {
        vscode.window.showErrorMessage("Build failed");
        return;
      }
      vscode.window.showInformationMessage("Build succeeded");
    } catch (err) {
      vscode.window.showErrorMessage("Build failed");
      return;
    }
    const scriptPath = path.join(targetFolder, "scripts", "deploy_testnet.sh");
    try {
      await runCommandInOutput(scriptPath, [], targetFolder, channel);
      vscode.window.showInformationMessage("Deploy finished");
    } catch (err) {
      vscode.window.showErrorMessage("Deploy script failed");
    }
  });

  context.subscriptions.push(newRust, buildDeploy, channel, diagnostics);
}

export function deactivate() {}

async function readTemplateFile(extPath: string, rel: string) {
  const full = path.join(extPath, "src", "templates", "rust-contract", rel);
  return fs.readFile(full, "utf8");
}

async function createNearRustTemplateFromFiles(extPath: string, baseDir: string, name: string) {
  const projectDir = path.join(baseDir, name);
  await fs.mkdir(path.join(projectDir, "src"), { recursive: true });
  await fs.mkdir(path.join(projectDir, "scripts"), { recursive: true });
  const cargo = await readTemplateFile(extPath, "Cargo.toml");
  const lib = await readTemplateFile(extPath, path.join("src", "lib.rs"));
  const deploy = await readTemplateFile(extPath, path.join("scripts", "deploy_testnet.sh"));
  const cargoOut = cargo.replace(/\{\{crate_name\}\}/g, name);
  const libOut = lib.replace(/\{\{crate_name\}\}/g, name);
  const deployOut = deploy.replace(/\{\{crate_name\}\}/g, name);
  await writeFile(path.join(projectDir, "Cargo.toml"), cargoOut);
  await writeFile(path.join(projectDir, "src", "lib.rs"), libOut);
  await writeFile(path.join(projectDir, "scripts", "deploy_testnet.sh"), deployOut);
  await fs.chmod(path.join(projectDir, "scripts", "deploy_testnet.sh"), 0o755);
  return projectDir;
}

async function detectContractFolder(root: string) {
  const candidates: string[] = [];
  const rootCargo = path.join(root, "Cargo.toml");
  try {
    const txt = await fs.readFile(rootCargo, "utf8");
    if (txt.includes("crate-type") && txt.includes("cdylib")) candidates.push(root);
  } catch {}
  try {
    const entries = await fs.readdir(root, { withFileTypes: true });
    for (const e of entries) {
      if (e.isDirectory()) {
        const p = path.join(root, e.name, "Cargo.toml");
        try {
          const t = await fs.readFile(p, "utf8");
          if ((t.includes("near-sdk") || t.includes("cdylib")) && t.includes("[lib]")) {
            candidates.push(path.join(root, e.name));
          }
        } catch {}
      }
    }
  } catch {}
  return candidates[0];
}

async function promptForCargoFolder() {
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

async function runCargoBuildCollectDiagnostics(cwd: string, args: string[], channel: vscode.OutputChannel, collection: vscode.DiagnosticCollection) {
  return new Promise<boolean>((resolve) => {
    channel.appendLine(`$ cargo ${args.join(" ")}`);
    const child = spawn("cargo", args, { cwd });
    const lines: string[] = [];
    child.stdout.on("data", d => {
      const s = d.toString();
      channel.append(s);
      for (const line of s.split(/\r?\n/)) if (line.trim()) lines.push(line.trim());
    });
    child.stderr.on("data", d => channel.append(d.toString()));
    child.on("close", async code => {
      const diagMap = parseCargoJsonToDiagnostics(lines, cwd);
      const setFor: vscode.Uri[] = [];
      for (const [file, diags] of diagMap.entries()) {
        const targetPath = path.isAbsolute(file) ? file : path.join(cwd, file);
        if (!targetPath.endsWith(".rs")) continue;
        const uri = vscode.Uri.file(targetPath);
        collection.set(uri, diags);
        setFor.push(uri);
      }
      const openDocs = vscode.workspace.textDocuments.filter(d => d.languageId === "rust" || d.fileName.endsWith(".rs"));
      for (const doc of openDocs) {
        if (!setFor.find(u => u.fsPath === doc.uri.fsPath)) {
          collection.set(doc.uri, []);
        }
      }
      resolve(code === 0);
    });
    child.on("error", () => resolve(false));
  });
}
