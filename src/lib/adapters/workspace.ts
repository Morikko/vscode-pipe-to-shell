import * as vscode from "vscode";
import { EXTENSION_NAME } from "../const";

export interface FavoriteCommand {
  id: string;
  name?: string;
  command: string;
}

export class Workspace {
  constructor(private readonly vsWorkspace: typeof vscode.workspace) {}

  getConfig<T>(name: string, section: string | undefined = undefined): T {
    const basePath = section ? `${EXTENSION_NAME}.${section}` : EXTENSION_NAME;
    return this.vsWorkspace.getConfiguration(basePath).get(name) as T;
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
