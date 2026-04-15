import { WrapEditor } from "../adapters/editor";
import { TextEditor as VsTextEditor } from "vscode";
import { CommandExecutionError } from "../errors";
import { Editor } from "../adapters/editor";

export interface ExtensionCommand {
  execute(editor?: Editor): Promise<void>;
}

export type ShowErrorMessage = (
  message: string,
) => Thenable<string | undefined>;

export interface Logger {
  error(p: string | undefined): void;
}

export class ErrorMessageFormatter {
  format(message: string) {
    return (message || "").trim();
  }
}

export class CommandWrap {
  private readonly errorMessageFormatter: ErrorMessageFormatter;

  constructor(
    private readonly command: ExtensionCommand,
    private readonly wrapEditor: WrapEditor,
    private readonly showErrorMessage: ShowErrorMessage,
    private readonly logger: Logger,
  ) {
    this.errorMessageFormatter = new ErrorMessageFormatter();
  }

  async execute(editor?: VsTextEditor) {
    try {
      await this.command.execute(editor && this.wrapEditor(editor));
    } catch (e) {
      if (e instanceof Error) {
        this.handleError(e);
      } else {
        throw e;
      }
    }
  }

  async handleError(e: Error | CommandExecutionError) {
    this.logger.error(e.stack);

    const sourceMessage =
      e instanceof CommandExecutionError && e.errorOutput.length > 0
        ? e.errorOutput
        : e.message;
    const errorMessage = this.errorMessageFormatter.format(sourceMessage);
    await this.showErrorMessage(errorMessage);
  }
}
