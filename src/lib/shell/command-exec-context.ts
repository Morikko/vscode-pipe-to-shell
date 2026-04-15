import { Workspace } from "../adapters/workspace";
import { dirname } from "path";
import * as os from "os";
import * as vscode from "vscode";

export interface EnvVarWrap {
  env: { [p: string]: string | undefined };
}

enum CurrentDirectoryKind {
  CURRENT_FILE = "currentFile",
  WORKSPACE_ROOT = "workspaceRoot",
}

export class ShellCommandExecContext {
  constructor(
    private readonly workspaceAdapter: Workspace,
    private readonly process: EnvVarWrap,
  ) {}

  get env() {
    return this.process.env;
  }

  /**
   * 1. For an existing file
   *  1. The file directory (CURRENT_FILE)
   *  2. The workspace folder root the file is part of (WORKSPACE_ROOT)
   * 2. First workspace folder root if existing
   * 3. Default to Home directory
   */
  getCwd(fileUri: vscode.Uri): string {
    const currentDirectoryKind =
      this.workspaceAdapter.getConfig<CurrentDirectoryKind>(
        "currentDirectoryKind",
      );

    if (fileUri.scheme == "file") {
      if (currentDirectoryKind == CurrentDirectoryKind.CURRENT_FILE) {
        return dirname(fileUri.fsPath);
      }

      const root_folder = this.workspaceAdapter.getRootPathFor(fileUri);

      if (root_folder) {
        return root_folder;
      }
    }

    return this.workspaceAdapter.getDefaultRootPath() || os.homedir();
  }
}
