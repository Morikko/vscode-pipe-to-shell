import { ShellCommandService } from "../shell/command-service";
import { HistoryStore } from "../history-store";
import { Workspace, FavoriteCommand } from "../adapters/workspace";
import { Editor } from "../adapters/editor";
import { ExtensionCommand } from "./command-wrapper";
import { CommandReader, CommandOptions } from "../shell/command-reader";
import * as vscode from "vscode";

const COMMAND_OPTIONS_KEYS = new Set<string>([
  "command",
  "shouldOpenNewEditor",
  "shouldSaveCommand",
] satisfies (keyof CommandOptions)[]);

export abstract class RunCommand implements ExtensionCommand {
  constructor(
    private readonly shellCommandService: ShellCommandService,
    private readonly historyStore: HistoryStore,
    protected readonly workspaceAdapter: Workspace,
  ) {}

  async execute(wrappedEditor: Editor, args?: unknown) {
    const {
      command,
      shouldOpenNewEditor,
      shouldSaveCommand,
      shouldProcessEntireText,
    } = await this.getCommandText(wrappedEditor.isTextSelected, args);
    if (!command) return;

    if (shouldSaveCommand) {
      await this.historyStore.add(command);
    }

    let inputTexts: string[];
    let selections: readonly vscode.Selection[];
    if (!wrappedEditor.isTextSelected && shouldProcessEntireText) {
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

  protected abstract getCommandText(
    isTextSelected: boolean,
    args?: unknown,
  ): Promise<CommandOptions>;
}

export class InputRunCommand extends RunCommand {
  constructor(
    shellCommandService: ShellCommandService,
    historyStore: HistoryStore,
    workspaceAdapter: Workspace,
    private readonly commandReader: CommandReader,
    private readonly inplace: boolean,
  ) {
    super(shellCommandService, historyStore, workspaceAdapter);
  }

  protected getCommandText(isTextSelected: boolean): Promise<CommandOptions> {
    return this.commandReader.read(!this.inplace, isTextSelected);
  }
}

type WithRequired<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

export class QuickRunCommand extends RunCommand {
  constructor(
    shellCommandService: ShellCommandService,
    historyStore: HistoryStore,
    workspaceAdapter: Workspace,
  ) {
    super(shellCommandService, historyStore, workspaceAdapter);
  }

  /**
   * @param command_or_id Either a favorite command id or a valid shell command
   * @returns The favorite command if match else the raw command_or_id
   */
  private getCommand(command_or_id: string): string {
    const favoriteCommands =
      this.workspaceAdapter.getConfig<FavoriteCommand[]>("favoriteCommands");
    const fc = favoriteCommands.find((fc) => fc.id === command_or_id);

    return fc?.command ?? command_or_id;
  }

  private isOptionalBoolean(obj: Record<string, unknown>, key: string) {
    const value = obj[key];
    if (typeof value === "boolean" || typeof value === "undefined") {
      return true;
    } else {
      throw new Error(`${key} should be an optional boolean and not ${value}`);
    }
  }

  private validateCommonOptions(
    args: unknown,
  ): args is WithRequired<Partial<CommandOptions>, "command"> {
    const opts = args as Record<string, unknown>;

    if (typeof opts["command"] !== "string") {
      throw new Error("command is required and should be a string");
    }
    this.isOptionalBoolean(opts, "shouldOpenNewEditor");
    this.isOptionalBoolean(opts, "shouldSaveCommand");

    const unknownKeys = Object.keys(opts).filter(
      (key) => !COMMAND_OPTIONS_KEYS.has(key),
    );

    if (unknownKeys.length > 0) {
      throw new Error(`Unknown keys: ${unknownKeys}`);
    }

    return true;
  }

  protected async getCommandText(
    isTextSelected: boolean,
    args?: unknown,
  ): Promise<CommandOptions> {
    const shouldProcessEntireText = isTextSelected
      ? false
      : this.workspaceAdapter.getConfig<boolean>(
          "processEntireTextIfNoneSelected",
        );

    if (typeof args === "string") {
      return {
        command: this.getCommand(args),
        shouldOpenNewEditor: false,
        shouldSaveCommand: true,
        shouldProcessEntireText: shouldProcessEntireText,
      };
    } else if (
      args !== null &&
      typeof args === "object" &&
      this.validateCommonOptions(args)
    ) {
      return {
        shouldOpenNewEditor: false,
        shouldSaveCommand: true,
        shouldProcessEntireText: shouldProcessEntireText,
        ...args,
        command: this.getCommand(args["command"]),
      };
    } else {
      throw new Error(
        `Invalid args: expected a string or a command options object, got ${args}`,
      );
    }
  }
}
