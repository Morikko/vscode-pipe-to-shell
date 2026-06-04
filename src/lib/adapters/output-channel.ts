import * as vscode from "vscode";
import { CommandLogger, CommandRunLog } from "../shell/command-logger";
import { Workspace } from "./workspace";

export class OutputChannelCommandLogger implements CommandLogger {
  private readonly channel: vscode.LogOutputChannel;

  constructor(
    channelName: string,
    private readonly workspace: Workspace,
  ) {
    this.channel = vscode.window.createOutputChannel(channelName, {
      log: true,
    });
  }

  private quote(text: string): string {
    const quoteChar = text.includes('"') ? "'" : '"';
    return `${quoteChar}${text}${quoteChar}`;
  }

  private logStd(
    lines: string[],
    kind: string,
    name: string,
    content: string | undefined,
  ): void {
    if (this.is_config_enable(kind, name)) {
      if (content) {
        lines.push(`${name}:\n  ${content.replaceAll("\n", "\n  ")}`);
      } else {
        lines.push(`${name}: [Empty]`);
      }
    }
  }
  private is_config_enable(kind: string, key: string): boolean {
    return this.workspace.getConfig<boolean>(`logging.${kind}.${key}`);
  }

  log(entry: CommandRunLog): void {
    const kind = entry.success ? "success" : "failure";
    const lines: string[] = [];

    lines.push("Command executed");
    if (this.is_config_enable(kind, "command")) {
      lines.push(`${"$>"} ${entry.command}`);
    }
    this.logStd(lines, kind, "stdin", entry.stdin);
    this.logStd(lines, kind, "stdout", entry.stdout);
    this.logStd(lines, kind, "stderr", entry.stderr);
    if (this.is_config_enable(kind, "cwd")) {
      lines.push(`cwd: ${entry.cwd}`);
    }
    if (this.is_config_enable(kind, "env")) {
      const envStr = Object.entries(entry.env)
        .filter((pair): pair is [string, string] => pair[1] != null)
        .map(([k, v]) => `  ${k}=${this.quote(v)}`)
        .join("\n");
      lines.push(`env:\n${envStr}`);
    }

    if (lines.length > 0) {
      if (entry.success) {
        this.channel.info(lines.join("\n") + "\n");
      } else {
        this.channel.error(lines.join("\n") + "\n");
      }
    }
  }

  dispose(): void {
    this.channel.dispose();
  }
}
