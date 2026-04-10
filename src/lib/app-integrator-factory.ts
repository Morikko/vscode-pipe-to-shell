import { AppIntegrator } from "./app-integrator";
import { Editor } from "./adapters/editor";
import { ShellCommandService } from "./shell-command-service";
import { CommandReader } from "./command-reader";
import { HistoryStore } from "./history-store";
import { ProcessRunner } from "./process-runner";
import { RunCommand } from "./commands/run-command";
import { ClearHistoryCommand } from "./commands/clear-history";
import { Workspace as WorkspaceAdapter } from "./adapters/workspace";
import * as vscode from "vscode";
import { Position, Range, TextEditor as VsTextEditor } from "vscode";
import { ExtensionCommand } from "./commands/extension-command";
import { CommandWrap } from "./command-wrap";

import * as childProcess from "child_process";

export class AppIntegratorFactory {
  private readonly cache: {
    workspaceAdapter?: WorkspaceAdapter;
    historyStore?: HistoryStore;
  };

  constructor() {
    this.cache = Object.create(null);
  }

  create() {
    return new AppIntegrator(
      this.runCommandInPlace,
      this.runCommandNewEditor,
      this.clearHistoryCommand,
      vscode,
    );
  }

  private get runCommandInPlace() {
    return this.wrapCommand(
      new RunCommand(
        this.shellCommandService,
        new CommandReader(
          this.historyStore,
          vscode.window,
          this.workspaceAdapter,
        ),
        this.historyStore,
        this.workspaceAdapter,
        true,
      ),
    );
  }

  private get runCommandNewEditor() {
    return this.wrapCommand(
      new RunCommand(
        this.shellCommandService,
        new CommandReader(
          this.historyStore,
          vscode.window,
          this.workspaceAdapter,
        ),
        this.historyStore,
        this.workspaceAdapter,
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

  private get historyStore() {
    this.cache.historyStore = this.cache.historyStore || new HistoryStore();
    return this.cache.historyStore;
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

  private get workspaceAdapter() {
    this.cache.workspaceAdapter =
      this.cache.workspaceAdapter || new WorkspaceAdapter(vscode.workspace);
    return this.cache.workspaceAdapter;
  }
}
