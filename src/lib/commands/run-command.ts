import { ShellCommandService } from "../shell/command-service";
import { HistoryStore } from "../history-store";
import { Workspace } from "../adapters/workspace";
import { Editor } from "../adapters/editor";
import { ExtensionCommand } from "./command-wrapper";
import { CommandReader, CommandOptions } from "../shell/command-reader";
import * as vscode from "vscode";

export class RunCommand implements ExtensionCommand {
  constructor(
    private readonly shellCommandService: ShellCommandService,
    private readonly commandReader: CommandReader,
    private readonly historyStore: HistoryStore,
    private readonly workspaceAdapter: Workspace,
    private readonly inplace: boolean,
  ) {}

  async execute(wrappedEditor: Editor) {
    const { command, shouldOpenNewEditor, shouldSaveCommand } =
      await this.getCommandText();
    if (!command) return;

    if (shouldSaveCommand) {
      await this.historyStore.add(command);
    }

    let inputTexts: string[];
    let selections: readonly vscode.Selection[];
    if (this.shouldPassEntireText(wrappedEditor)) {
      inputTexts = [wrappedEditor.entireText];
      selections = wrappedEditor.entireSelection;
    } else {
      inputTexts = wrappedEditor.selectedTexts;
      selections = wrappedEditor.selections;
    }

    const commandOutputs = await this.processSelectedTexts(
      command,
      inputTexts,
      wrappedEditor.fileUri,
    );

    if (!shouldOpenNewEditor) {
      await wrappedEditor.replaceSelectedTextsWith(selections, commandOutputs);
    } else {
      await wrappedEditor.openNewEditor(commandOutputs.join("\n\n"));
    }
  }

  private async processSelectedTexts(
    command: string,
    selectedTexts: string[],
    fileUri: vscode.Uri,
  ): Promise<string[]> {
    const promiseOfCommandOutputs = selectedTexts.map((input) =>
      this.shellCommandService.runCommand({ command, input, fileUri }),
    );
    return Promise.all(promiseOfCommandOutputs);
  }

  private shouldPassEntireText(wrappedEditor: Editor): boolean {
    const processEntireText = this.workspaceAdapter.getConfig<boolean>(
      "processEntireTextIfNoneSelected",
    );
    return !wrappedEditor.isTextSelected && processEntireText;
  }

  private getCommandText(): Promise<CommandOptions> {
    return this.commandReader.read(!this.inplace);
  }
}
