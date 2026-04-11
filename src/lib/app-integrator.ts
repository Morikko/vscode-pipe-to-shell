import { EXTENSION_NAME } from "./const";
import { ExecutionContextLike } from "./types/vscode";
import { CommandWrap } from "./command-wrap";

import * as vscode from "vscode";
import { CommandReader } from "./command-reader";

export class AppIntegrator {
  constructor(
    private readonly runCommandInPlace: CommandWrap,
    private readonly runCommandNewEditor: CommandWrap,
    private readonly clearHistoryCommand: CommandWrap,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly vscode: any,
    private readonly commandReader: CommandReader,
  ) {}

  integrate(context: ExecutionContextLike) {
    this.registerCommands(context);
  }

  private registerCommands(context: ExecutionContextLike) {
    const clearCommandHistory = this.vscode.commands.registerCommand(
      `${EXTENSION_NAME}.clearCommandHistory`,
      this.clearHistoryCommand.execute,
      this.clearHistoryCommand,
    );
    context.subscriptions.push(clearCommandHistory);

    const runCommandInPlace = this.vscode.commands.registerTextEditorCommand(
      `${EXTENSION_NAME}.runCommandInPlace`,
      this.runCommandInPlace.execute,
      this.runCommandInPlace,
    );
    context.subscriptions.push(runCommandInPlace);

    const runCommandNewEditor = this.vscode.commands.registerTextEditorCommand(
      `${EXTENSION_NAME}.runCommandNewEditor`,
      this.runCommandNewEditor.execute,
      this.runCommandNewEditor,
    );
    context.subscriptions.push(runCommandNewEditor);

    // QuickOpen Keybinding
    const CommandReaderToggleNewEditor = vscode.commands.registerCommand(
      "editWithShell.CommandReaderToggleNewEditor",
      () => {
        this.commandReader.toggleOpenNewEditor();
      },
    );
    context.subscriptions.push(CommandReaderToggleNewEditor);

    const CommandReaderToggleSaveHistory = vscode.commands.registerCommand(
      "editWithShell.CommandReaderToggleSaveHistory",
      () => {
        this.commandReader.toggleSaveHistory();
      },
    );
    context.subscriptions.push(CommandReaderToggleSaveHistory);

    const CommandReaderToggleShowFavorite = vscode.commands.registerCommand(
      "editWithShell.CommandReaderToggleShowFavorite",
      () => {
        this.commandReader.toggleShowFavorite();
      },
    );
    context.subscriptions.push(CommandReaderToggleShowFavorite);

    const CommandReaderToggleShowHistory = vscode.commands.registerCommand(
      "editWithShell.CommandReaderToggleShowHistory",
      () => {
        this.commandReader.toggleShowHistory();
      },
    );
    context.subscriptions.push(CommandReaderToggleShowHistory);
  }
}
