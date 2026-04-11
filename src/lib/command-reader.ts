import { HistoryStore } from "./history-store";
import * as vscode from "vscode";
import { EXTENSION_NAME } from "./const";
import { Workspace } from "./adapters/workspace";

interface FavoriteCommand {
  id: string;
  command: string;
}

export interface CommandOptions {
  command: string | undefined;
  shouldOpenNewEditor: boolean;
  shouldSaveCommand: boolean;
}

class MessageItem implements vscode.QuickPickItem {
  constructor(
    public label: string,
    public detail: string | undefined = undefined,
    public iconPath: vscode.IconPath | undefined = undefined,
  ) {}
}

class SaveButton implements vscode.QuickInputButton {
  tooltip = "Save executed command in history";
  iconPath = new vscode.ThemeIcon("save");
  location = vscode.QuickInputButtonLocation.Inline;
  toggle = { checked: true };
}

class NewEditorButton implements vscode.QuickInputButton {
  tooltip = "Open result in new editor";
  iconPath = new vscode.ThemeIcon("new-file");
  location = vscode.QuickInputButtonLocation.Inline;
  toggle = { checked: false };

  constructor(readonly checked: boolean) {
    this.toggle.checked = checked;
  }
}

class ShowHistoryButton implements vscode.QuickInputButton {
  tooltip = "Show/Hide history";
  iconPath = new vscode.ThemeIcon("clock");
  location = vscode.QuickInputButtonLocation.Title;
  toggle = { checked: true };
}

class ShowFavoriteButton implements vscode.QuickInputButton {
  tooltip = "Show/Hide favorite command";
  iconPath = new vscode.ThemeIcon("star-full");
  location = vscode.QuickInputButtonLocation.Title;
  toggle = { checked: true };
}

export class CommandReader {
  private historySuggestions: MessageItem[] = [];
  private favoriteSuggestions: MessageItem[] = [];
  private showHistory: boolean = true;
  private showFavorite: boolean = true;
  private shouldSaveCommand: boolean = true;
  private shouldOpenNewEditor: boolean = false;

  constructor(
    private readonly historyStore: HistoryStore,
    private readonly vsWindow: typeof vscode.window,
    private readonly workspaceAdapter: Workspace,
  ) {}

  init() {
    const configPath = `${EXTENSION_NAME}.favoriteCommands`;

    this.historySuggestions = this.historyStore
      .getAll()
      .map((x) => new MessageItem(x, undefined, new vscode.ThemeIcon("clock")));
    this.favoriteSuggestions = this.workspaceAdapter
      .getConfig<FavoriteCommand[]>(configPath)
      .map(
        (fc) =>
          new MessageItem(
            fc.command,
            fc.id,
            new vscode.ThemeIcon("extensions-star-full"),
          ),
      );
    this.showHistory = true;
    this.showFavorite = true;
    this.shouldSaveCommand = true;
  }

  async read(shouldOpenNewEditor: boolean): Promise<CommandOptions> {
    this.init();
    this.shouldOpenNewEditor = shouldOpenNewEditor;
    return {
      command: await this.pickCommand(),
      shouldSaveCommand: this.shouldSaveCommand,
      shouldOpenNewEditor: this.shouldOpenNewEditor,
    };
  }

  makeSuggestions() {
    return [
      ...(this.showHistory ? this.historySuggestions : []),
      ...(this.showFavorite ? this.favoriteSuggestions : []),
    ];
  }

  async pickCommand() {
    const disposables: vscode.Disposable[] = [];
    try {
      return await new Promise<string | undefined>((resolve) => {
        const input = this.vsWindow.createQuickPick<MessageItem>();
        input.placeholder = "Write a new command or select from the suggestion";
        input.items = this.makeSuggestions();
        input.ignoreFocusOut = true;
        input.matchOnDetail = true;
        input.canSelectMany = true;
        input.buttons = [
          new ShowHistoryButton(),
          new ShowFavoriteButton(),
          new NewEditorButton(this.shouldOpenNewEditor),
          new SaveButton(),
        ];
        disposables.push(
          input.onDidChangeActive((items) => {
            if (items.length > 0) {
              input.prompt = "Press space to set the command in the input box";
            } else {
              input.prompt = "";
            }
          }),
          input.onDidChangeSelection((items) => {
            if (input.selectedItems.length > 0) {
              input.value = items[0].label;
              input.selectedItems = [];
              input.prompt = "";
            }
          }),
          input.onDidAccept(() => {
            resolve(input.value);
            input.hide();
          }),
          input.onDidHide(() => {
            resolve(undefined);
            input.dispose();
          }),
          input.onDidTriggerButton((button) => {
            if (button instanceof ShowFavoriteButton) {
              this.showFavorite = button.toggle.checked;
              input.items = this.makeSuggestions();
            } else if (button instanceof ShowHistoryButton) {
              this.showHistory = button.toggle.checked;
              input.items = this.makeSuggestions();
            } else if (button instanceof SaveButton) {
              this.shouldSaveCommand = button.toggle.checked;
            } else if (button instanceof NewEditorButton) {
              this.shouldOpenNewEditor = button.toggle.checked;
            }
          }),
        );
        input.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}
