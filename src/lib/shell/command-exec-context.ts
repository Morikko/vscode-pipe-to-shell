import { Workspace } from "../adapters/workspace";
import { dirname, relative } from "path";
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
    return {
      ...this.process.env,
      ...this.workspaceAdapter.getConfig<{ [p: string]: string }>("shell.env"),
    };
  }

  /**
   * Returns VS Code-style predefined variables as env vars for a given file URI:
   *   file               — absolute path to the file (${file})
   *   fileWorkspaceFolder — workspace folder the file belongs to (${fileWorkspaceFolder})
   *   relativeFile       — file path relative to fileWorkspaceFolder (${relativeFile})
   *
   * Returns an empty object for non-file URIs (e.g. untitled).
   */
  getFileEnvVars(fileUri: vscode.Uri): { [key: string]: string } {
    if (fileUri.scheme !== "file") {
      return {};
    }

    const file = fileUri.fsPath;
    const workspaceFolder = this.workspaceAdapter.getRootPathFor(fileUri);
    if (!workspaceFolder) {
      return { file };
    }

    return {
      file,
      fileWorkspaceFolder: workspaceFolder,
      relativeFile: relative(workspaceFolder, file),
    };
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
