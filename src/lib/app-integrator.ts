import { Editor } from "./adapters/editor";
import { ShellCommandService } from "./shell/command-service";
import { CommandReader } from "./shell/command-reader";
import { HistoryStore } from "./history-store";
import { ProcessRunner } from "./shell/process-runner";
import { InputRunCommand, QuickRunCommand } from "./commands/run-command";
import { ClearHistoryCommand } from "./commands/clear-history";
import { Workspace as WorkspaceAdapter } from "./adapters/workspace";
import * as vscode from "vscode";
import { Position, Range, TextEditor as VsTextEditor } from "vscode";
import { ExtensionCommand, CommandWrap } from "./commands/command-wrapper";
import { EXTENSION_NAME } from "./const";

import * as childProcess from "child_process";

export class AppIntegrator {
  private historyStore: HistoryStore;
  private workspaceAdapter: WorkspaceAdapter;
  private commandReader: CommandReader;

  constructor(private context: vscode.ExtensionContext) {
    this.workspaceAdapter = new WorkspaceAdapter(vscode.workspace);
    this.historyStore = new HistoryStore(context, this.workspaceAdapter);
    this.commandReader = new CommandReader(
      this.historyStore,
      vscode.window,
      this.workspaceAdapter,
    );

    this.registerPaletteCommands();
    this.registerCommandReaderCommands();
    this.registerQuickCommand();

    context.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("editWithShell.historyMaxSize")) {
          this.historyStore.truncateMaxSize();
        }
      }),
    );
  }

  private get runCommandInPlace() {
    return this.wrapCommand(
      new InputRunCommand(
        this.shellCommandService,
        this.historyStore,
        this.workspaceAdapter,
        this.commandReader,
        true,
      ),
    );
  }

  private get runCommandNewEditor() {
    return this.wrapCommand(
      new InputRunCommand(
        this.shellCommandService,
        this.historyStore,
        this.workspaceAdapter,
        this.commandReader,
        false,
      ),
    );
  }

  private get clearHistoryCommand() {
    return this.wrapCommand(new ClearHistoryCommand(this.historyStore));
  }

  private wrapCommand(command: ExtensionCommand) {
    return new CommandWrap(
      command,
      (editor: VsTextEditor) => new Editor(editor, this.locationFactory),
      (message: string) => vscode.window.showErrorMessage(message),
      console,
    );
  }

  private get shellCommandService() {
    return new ShellCommandService(
      new ProcessRunner(),
      this.workspaceAdapter,
      process,
      childProcess.spawn,
    );
  }

  private get locationFactory() {
    return {
      createPosition: (line: number, character: number) =>
        new Position(line, character),
      createRange: (p1: Position, p2: Position) => new Range(p1, p2),
    };
  }

  /**
   * All the commands a user can execute from the command palette
   */
  private registerPaletteCommands() {
    const clearCommandHistory = vscode.commands.registerCommand(
      `${EXTENSION_NAME}.clearCommandHistory`,
      this.clearHistoryCommand.execute,
      this.clearHistoryCommand,
    );
    this.context.subscriptions.push(clearCommandHistory);

    const runCommandInPlace = vscode.commands.registerTextEditorCommand(
      `${EXTENSION_NAME}.runCommandInPlace`,
      this.runCommandInPlace.execute,
      this.runCommandInPlace,
    );
    this.context.subscriptions.push(runCommandInPlace);

    const runCommandNewEditor = vscode.commands.registerTextEditorCommand(
      `${EXTENSION_NAME}.runCommandNewEditor`,
      this.runCommandNewEditor.execute,
      this.runCommandNewEditor,
    );
    this.context.subscriptions.push(runCommandNewEditor);
  }

  /**
   * Predefined commands to adjust the quick open command reader from the
   * keyboard.
   */
  private registerCommandReaderCommands() {
    const CommandReaderToggleNewEditor = vscode.commands.registerCommand(
      "editWithShell.CommandReaderToggleNewEditor",
      () => {
        this.commandReader.toggleOpenNewEditor();
      },
    );
    this.context.subscriptions.push(CommandReaderToggleNewEditor);

    const CommandReaderToggleSaveHistory = vscode.commands.registerCommand(
      "editWithShell.CommandReaderToggleSaveHistory",
      () => {
        this.commandReader.toggleSaveHistory();
      },
    );
    this.context.subscriptions.push(CommandReaderToggleSaveHistory);

    const CommandReaderToggleShowFavorite = vscode.commands.registerCommand(
      "editWithShell.CommandReaderToggleShowFavorite",
      () => {
        this.commandReader.toggleShowFavorite();
      },
    );
    this.context.subscriptions.push(CommandReaderToggleShowFavorite);

    const CommandReaderToggleShowHistory = vscode.commands.registerCommand(
      "editWithShell.CommandReaderToggleShowHistory",
      () => {
        this.commandReader.toggleShowHistory();
      },
    );
    this.context.subscriptions.push(CommandReaderToggleShowHistory);

    const CommandReaderToggleProcessEntireText =
      vscode.commands.registerCommand(
        "editWithShell.CommandReaderToggleProcessEntireText",
        () => {
          this.commandReader.togglesProcessEntireText();
        },
      );
    this.context.subscriptions.push(CommandReaderToggleProcessEntireText);
  }

  /**
   * Register quick command so the user can assign keybinding to trigger a
   * favorite command or any custom command.
   */
  private registerQuickCommand() {
    const quickCommand = this.wrapCommand(
      new QuickRunCommand(
        this.shellCommandService,
        this.historyStore,
        this.workspaceAdapter,
      ),
    );
    const fcCommand = vscode.commands.registerTextEditorCommand(
      `editWithShell.quickCommand`,
      quickCommand.execute,
      quickCommand,
    );
    this.context.subscriptions.push(fcCommand);
  }
}
