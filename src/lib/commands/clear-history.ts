import { HistoryStore } from "../history-store";
import { ExtensionCommand } from "./command-wrapper";

export class ClearHistoryCommand implements ExtensionCommand {
  constructor(private readonly historyStore: HistoryStore) {}

  async execute() {
    return this.historyStore.clear();
  }
}
