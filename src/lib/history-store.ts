import * as vscode from "vscode";
import { Workspace } from "./adapters/workspace";

export class HistoryStore {
  constructor(
    private context: vscode.ExtensionContext,
    private workspaceAdapter: Workspace,
  ) {}

  getAll() {
    return this.loadHistory();
  }

  async clear() {
    await this.saveHistory([]);
  }

  async add(command: string) {
    const currentHistory = await this.getAll();
    const index = currentHistory.indexOf(command);

    let newHistory: string[];
    if (index === -1) {
      newHistory = [...currentHistory, command];
    } else {
      newHistory = [
        ...currentHistory.slice(0, index),
        ...currentHistory.slice(index + 1),
        command,
      ];
    }

    await this.saveHistory(newHistory);
  }

  private async getMaxSize(): Promise<number> {
    return this.workspaceAdapter.getConfig<number>("historyMaxSize");
  }

  private async loadHistory(): Promise<string[]> {
    return this.context.globalState.get<string[]>("history") || [];
  }

  async truncateMaxSize() {
    await this.saveHistory(await this.getAll());
  }

  private async saveHistory(history: string[]) {
    const maxSize = await this.getMaxSize();
    if (history.length > maxSize) {
      history = history.slice(history.length - maxSize);
    }

    return this.context.globalState.update("history", history);
  }
}
