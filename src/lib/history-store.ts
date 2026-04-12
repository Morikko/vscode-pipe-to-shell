import * as vscode from "vscode";

export class HistoryStore {
  constructor(private context: vscode.ExtensionContext) {}

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

  private async loadHistory(): Promise<string[]> {
    return this.context.globalState.get<string[]>("history") || [];
  }

  private async saveHistory(history: string[]) {
    return this.context.globalState.update("history", history);
  }
}
