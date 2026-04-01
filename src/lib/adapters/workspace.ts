import * as vscode from "vscode";

const CONFIG_PATH_DELIMITER = ".";

export class Workspace {
  constructor(private readonly vsWorkspace: typeof vscode.workspace) {}

  getConfig<T>(configPath: string): T {
    const { basePath, leafName } = this.parseConfigPath(configPath);
    return this.vsWorkspace.getConfiguration(basePath).get(leafName) as T;
  }

  private parseConfigPath(configPath: string) {
    const configPathParts = configPath.split(CONFIG_PATH_DELIMITER);
    return {
      basePath: configPathParts.slice(0, -1).join(CONFIG_PATH_DELIMITER),
      leafName: configPathParts.slice(-1)[0],
    };
  }

  /**
   * @param fileUri
   * @returns The workspace path the fileUri belongs to if any
   */
  getRootPathFor(fileUri: vscode.Uri): string | undefined {
    const folder = this.vsWorkspace.getWorkspaceFolder(fileUri);
    if (folder) {
      return folder.uri.fsPath;
    }
    return undefined;
  }

  /**
   * @returns The first workspace folder path if existing
   */
  getDefaultRootPath(): string | undefined {
    const folders = this.vsWorkspace.workspaceFolders;
    if (folders != undefined && folders.length > 0) {
      return folders[0].uri.fsPath;
    }
    return undefined;
  }
}
