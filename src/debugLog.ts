import * as fs from "node:fs";
import * as path from "node:path";
import { ExtensionContext, workspace } from "vscode";

let debugLogPath: string | undefined;
const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function initializeDebugLog(context: ExtensionContext): string {
    fs.mkdirSync(context.globalStorageUri.fsPath, { recursive: true });
    debugLogPath = path.join(context.globalStorageUri.fsPath, "webview-debug.log");

    debugLog("=== EXTENSION ACTIVATE ===", {
        workspaceFolders: workspace.workspaceFolders?.map((folder) => folder.uri.fsPath) ?? []
    });

    return debugLogPath;
}

export function debugLog(event: string, data?: unknown): void {
    if (!debugLogPath) {
        return;
    }

    let details = "";
    if (data !== undefined) {
        try {
            details = ` ${JSON.stringify(data)}`;
        } catch {
            details = ` ${String(data)}`;
        }
    }

    try {
        fs.appendFileSync(
            debugLogPath,
            `${new Date().toISOString()} [${sessionId}] ${event}${details}\n`,
            "utf8"
        );
    } catch {
        // Debug logging must never interfere with extension activation.
    }
}
