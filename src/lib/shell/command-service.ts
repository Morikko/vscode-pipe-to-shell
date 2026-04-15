import { ProcessRunner } from "./process-runner";
import { ShellCommandExecContext } from "./command-exec-context";
import { ShellSettingsResolver } from "./settings-resolver";
import { ChildProcess, SpawnOptionsWithoutStdio } from "child_process";
import { Workspace } from "../adapters/workspace";
import * as vscode from "vscode";

import Process = NodeJS.Process;

export type SpawnWrapper = (
  command: string,
  args?: ReadonlyArray<string>,
  options?: SpawnOptionsWithoutStdio,
) => ChildProcess;

export interface CommandParams {
  command: string;
  input: string;
  fileUri: vscode.Uri;
}

export class ShellCommandService {
  private readonly shellCommandExecContext: ShellCommandExecContext;
  private readonly shellSettingsResolver: ShellSettingsResolver;

  constructor(
    private readonly processRunner: ProcessRunner,
    workspace: Workspace,
    process: Process,
    private readonly spawn_child_process: SpawnWrapper,
  ) {
    this.shellCommandExecContext = new ShellCommandExecContext(workspace, {
      env: process.env,
    });
    this.shellSettingsResolver = new ShellSettingsResolver(
      workspace,
      process.platform,
    );
  }

  private isCommandEnvSelection(command: string) {
    return command.includes("selectedText");
  }

  runCommand(params: CommandParams): Promise<string> {
    const options = this.getOptions(params);
    const shell = this.shellSettingsResolver.shellProgramme();
    const shellArgs = this.shellSettingsResolver.shellArgs();
    const command = this.spawn_child_process(
      shell,
      [...shellArgs, params.command],
      options,
    );
    return this.processRunner.run(
      command,
      this.isCommandEnvSelection(params.command) ? "" : params.input,
    );
  }

  private getOptions(params: CommandParams) {
    const env = { ...this.shellCommandExecContext.env };
    if (this.isCommandEnvSelection(params.command)) {
      env["selectedText"] = params.input;
    }

    return {
      cwd: this.shellCommandExecContext.getCwd(params.fileUri),
      env: env,
    };
  }
}
