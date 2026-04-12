import { HistoryStore } from "./history-store";
import * as vscode from "vscode";
import { Workspace } from "./adapters/workspace";

export interface FavoriteCommand {
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
  tooltip = "Save executed command in history (Ctrl+S)";
  iconPath = new vscode.ThemeIcon("save");
  location = vscode.QuickInputButtonLocation.Inline;
  toggle = { checked: true };

  constructor(readonly checked: boolean) {
    this.toggle.checked = checked;
  }
}

class NewEditorButton implements vscode.QuickInputButton {
  tooltip = "Open result in new editor (Ctrl+N)";
  iconPath = new vscode.ThemeIcon("new-file");
  location = vscode.QuickInputButtonLocation.Inline;
  toggle = { checked: false };

  constructor(readonly checked: boolean) {
    this.toggle.checked = checked;
  }
}

class ShowHistoryButton implements vscode.QuickInputButton {
  tooltip = "Show/Hide history (Ctrl+H)";
  iconPath = new vscode.ThemeIcon("clock");
  location = vscode.QuickInputButtonLocation.Title;
  toggle = { checked: true };

  constructor(readonly checked: boolean) {
    this.toggle.checked = checked;
  }
}

class ShowFavoriteButton implements vscode.QuickInputButton {
  tooltip = "Show/Hide favorite command (Ctrl+F)";
  iconPath = new vscode.ThemeIcon("star-full");
  location = vscode.QuickInputButtonLocation.Title;
  toggle = { checked: true };

  constructor(readonly checked: boolean) {
    this.toggle.checked = checked;
  }
}

export class CommandReader {
  private historySuggestions: MessageItem[] = [];
  private favoriteSuggestions: MessageItem[] = [];
  private showHistory: boolean = true;
  private showFavorite: boolean = true;
  private shouldSaveCommand: boolean = true;
  private shouldOpenNewEditor: boolean = false;
  private input: vscode.QuickPick<MessageItem> | undefined = undefined;

  constructor(
    private readonly historyStore: HistoryStore,
    private readonly vsWindow: typeof vscode.window,
    private readonly workspaceAdapter: Workspace,
  ) {}

  toggleOpenNewEditor() {
    if (this.input === undefined) {
      return;
    }

    this.shouldOpenNewEditor = !this.shouldOpenNewEditor;
    this.input.buttons = this.makeButtons();
  }

  toggleSaveHistory() {
    if (this.input === undefined) {
      return;
    }

    this.shouldSaveCommand = !this.shouldSaveCommand;
    this.input.buttons = this.makeButtons();
  }

  toggleShowHistory() {
    this.showHistory = !this.showHistory;

    if (this.input === undefined) {
      return;
    }

    this.input.buttons = this.makeButtons();
    this.input.items = this.makeSuggestions();
  }

  toggleShowFavorite() {
    this.showFavorite = !this.showFavorite;

    if (this.input === undefined) {
      return;
    }

    this.input.buttons = this.makeButtons();
    this.input.items = this.makeSuggestions();
  }

  makeHistoryMessageItem(command: string): MessageItem {
    return new MessageItem(command, undefined, new vscode.ThemeIcon("clock"));
  }

  makeFavoriteMessageItem(fc: FavoriteCommand): MessageItem {
    return new MessageItem(
      fc.command,
      fc.id,
      new vscode.ThemeIcon("extensions-star-full"),
    );
  }

  async init() {
    this.historySuggestions = (await this.historyStore.getAll()).map(
      this.makeHistoryMessageItem,
    );
    this.favoriteSuggestions = this.workspaceAdapter
      .getConfig<FavoriteCommand[]>("favoriteCommands")
      .map(this.makeFavoriteMessageItem);
    this.showHistory = true;
    this.showFavorite = true;
    this.shouldSaveCommand = true;
  }

  async read(shouldOpenNewEditor: boolean): Promise<CommandOptions> {
    await this.init();
    this.shouldOpenNewEditor = shouldOpenNewEditor;
    try {
      vscode.commands.executeCommand(
        "setContext",
        "editWithShell.CommandReaderOpen",
        true,
      );
      return {
        command: await this.pickCommand(),
        shouldSaveCommand: this.shouldSaveCommand,
        shouldOpenNewEditor: this.shouldOpenNewEditor,
      };
    } finally {
      vscode.commands.executeCommand(
        "setContext",
        "editWithShell.CommandReaderOpen",
        false,
      );
    }
  }

  makeSuggestions() {
    return [
      ...(this.showHistory ? this.historySuggestions : []),
      ...(this.showFavorite ? this.favoriteSuggestions : []),
    ];
  }

  makeButtons() {
    return [
      new ShowHistoryButton(this.showHistory),
      new ShowFavoriteButton(this.showFavorite),
      new NewEditorButton(this.shouldOpenNewEditor),
      new SaveButton(this.shouldSaveCommand),
    ];
  }

  buttonAction(button: vscode.QuickInputButton) {
    if (this.input === undefined) {
      return;
    }

    if (button instanceof ShowFavoriteButton) {
      this.showFavorite = button.toggle.checked;
      this.input.items = this.makeSuggestions();
    } else if (button instanceof ShowHistoryButton) {
      this.showHistory = button.toggle.checked;
      this.input.items = this.makeSuggestions();
    } else if (button instanceof SaveButton) {
      this.shouldSaveCommand = button.toggle.checked;
    } else if (button instanceof NewEditorButton) {
      this.shouldOpenNewEditor = button.toggle.checked;
    }
  }

  async pickCommand() {
    const disposables: vscode.Disposable[] = [];

    try {
      return await new Promise<string | undefined>((resolve) => {
        const input = this.vsWindow.createQuickPick<MessageItem>();
        this.input = input;
        input.placeholder = "Write a new command or select from the suggestion";
        input.items = this.makeSuggestions();
        input.ignoreFocusOut = true;
        input.matchOnDetail = true;
        input.canSelectMany = true;
        input.buttons = this.makeButtons();
        disposables.push(
          input.onDidChangeActive((items) => {
            if (items.length > 0) {
              input.prompt = "Press space to set the command in the input box";
            } else {
              input.prompt = "";
            }
          }),
          input.onDidChangeSelection((items) => {
            // Set the selected item content in the input box and unselect it
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
          input.onDidTriggerButton(this.buttonAction),
        );
        input.show();
      });
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  }
}
