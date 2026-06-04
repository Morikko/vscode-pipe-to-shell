import { ProcessRunner } from "./process-runner";
import { ShellCommandExecContext } from "./command-exec-context";
import { ShellSettingsResolver } from "./settings-resolver";
import { CommandLogger } from "./command-logger";
import { ChildProcess, SpawnOptionsWithoutStdio } from "child_process";
import { Workspace } from "../adapters/workspace";
import { CommandExecutionError } from "../errors";
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
    private readonly logger?: CommandLogger,
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

  async runCommand(params: CommandParams): Promise<string> {
    const options = this.getOptions(params);
    const shell = this.shellSettingsResolver.shellProgramme();
    const shellArgs = this.shellSettingsResolver.shellArgs();
    const stdin = this.isCommandEnvSelection(params.command)
      ? ""
      : params.input;
    const command = this.spawn_child_process(
      shell,
      [...shellArgs, params.command],
      options,
    );

    try {
      const { stdout, stderr } = await this.processRunner.run(command, stdin);
      this.logger?.log({
        command: params.command,
        stdin,
        stdout,
        stderr,
        env: options.env,
        cwd: options.cwd,
        success: true,
      });
      return stdout;
    } catch (e) {
      this.logger?.log({
        command: params.command,
        stdin,
        stdout: e instanceof CommandExecutionError ? e.stdout : undefined,
        stderr: e instanceof CommandExecutionError ? e.errorOutput : undefined,
        code: e instanceof CommandExecutionError ? e.code : undefined,
        env: options.env,
        cwd: options.cwd,
        success: false,
      });
      throw e;
    }
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
