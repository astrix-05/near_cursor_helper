import * as vscode from "vscode";

type CargoMessage = {
  reason?: string;
  message?: {
    rendered?: string;
    message?: string;
    code?: { code?: string } | null;
    level?: string;
    spans?: Array<{
      file_name?: string;
      line_start?: number;
      line_end?: number;
      column_start?: number;
      column_end?: number;
      is_primary?: boolean;
    }>;
  };
};

function docUrlFor(text: string) {
  const t = text.toLowerCase();
  if (t.includes("near_sdk")) return "https://docs.rs/near-sdk/latest/near_sdk/";
  if (t.includes("wasm")) return "https://docs.near.org/sdk/rust/quickstart";
  return undefined;
}

export function parseCargoJsonToDiagnostics(lines: string[], baseDir: string) {
  const map = new Map<string, vscode.Diagnostic[]>();
  for (const line of lines) {
    let obj: CargoMessage | undefined;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }
    if (!obj || obj.reason !== "compiler-message" || !obj.message) continue;
    const msg = obj.message;
    if (!msg.spans || msg.spans.length === 0) continue;
    const isError = msg.level === "error";
    if (!isError) continue;
    for (const sp of msg.spans) {
      if (sp.is_primary === false) continue;
      const file = sp.file_name || "";
      if (!file) continue;
      const start = new vscode.Position(Math.max(0, (sp.line_start || 1) - 1), Math.max(0, (sp.column_start || 1) - 1));
      const end = new vscode.Position(Math.max(0, (sp.line_end || sp.line_start || 1) - 1), Math.max(0, (sp.column_end || sp.column_start || 1) - 1));
      const d = new vscode.Diagnostic(new vscode.Range(start, end), msg.rendered || msg.message || "", vscode.DiagnosticSeverity.Error);
      const url = docUrlFor(msg.message || msg.rendered || "");
      if (url) {
        d.code = { value: (msg.code && msg.code.code) || "near", target: vscode.Uri.parse(url) } as any;
        d.source = url;
      }
      const arr = map.get(file) || [];
      arr.push(d);
      map.set(file, arr);
    }
  }
  return map;
}
