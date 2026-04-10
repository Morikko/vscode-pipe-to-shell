import { HistoryStore } from "./history-store";
import * as vscode from "vscode";
import { EXTENSION_NAME } from "./const";
import { Workspace } from "./adapters/workspace";

interface FavoriteCommand {
  id: string;
  command: string;
}

class MessageItem implements vscode.QuickPickItem {
  constructor(
    public label: string,
    public detail: string | undefined = undefined,
    public iconPath: vscode.IconPath | undefined = undefined,
    public description: string | undefined = undefined,
    public alwaysShow: boolean = false,
  ) {}
}

export class CommandReader {
  constructor(
    private readonly historyStore: HistoryStore,
    private readonly vsWindow: typeof vscode.window,
    private readonly workspaceAdapter: Workspace,
  ) {}

  async read() {
    const history = this.historyStore.getAll();
    const configPath = `${EXTENSION_NAME}.favoriteCommands`;
    const favoriteCommands =
      this.workspaceAdapter.getConfig<FavoriteCommand[]>(configPath);
    return this.pickCommand(history, favoriteCommands);
  }

  makeItem(value: string): MessageItem {
    return new MessageItem(
      value,
      undefined,
      new vscode.ThemeIcon("terminal-powershell"),
      "command to be executed",
      true,
    );
  }

  async pickCommand(history: string[], favoriteCommands: FavoriteCommand[]) {
    const defaultItems = history
      .map((x) => new MessageItem(x, undefined, new vscode.ThemeIcon("clock")))
      .concat(
        favoriteCommands.map(
          (fc) =>
            new MessageItem(
              fc.command,
              fc.id,
              new vscode.ThemeIcon("extensions-star-full"),
            ),
        ),
      );
    const disposables: vscode.Disposable[] = [];
    try {
      return await new Promise<string | undefined>((resolve) => {
        const input = this.vsWindow.createQuickPick<MessageItem>();
        input.placeholder = "Write a new command or select from the suggestion";
        input.items = [this.makeItem("")].concat(defaultItems);
        input.ignoreFocusOut = true;
        input.matchOnDetail = true;
        input.canSelectMany = true;
        input.selectedItems = [input.items[0]];
        disposables.push(
          input.onDidChangeValue((value) => {
            input.items = [this.makeItem(value)].concat(defaultItems);
            input.selectedItems = [input.items[0]];
          }),
          input.onDidChangeActive((items) => {
            if (items.length > 0 && items[0].detail !== undefined) {
              // Suggestion is active
              input.prompt = "Press space to set the command in the input box";
            } else {
              input.prompt = "";
            }
          }),
          input.onDidChangeSelection((items) => {
            if (input.selectedItems.length > 1) {
              input.value = items[1].label;
              input.selectedItems = [input.items[0]];
              input.prompt = "";
            } else {
              input.selectedItems = [input.items[0]];
            }
          }),
          input.onDidAccept(() => {
            resolve(input.items[0].label);
            input.hide();
          }),
          input.onDidHide(() => {
            resolve(undefined);
            input.dispose();
          }),
        );
        input.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}
