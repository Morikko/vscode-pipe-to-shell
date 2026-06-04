export interface CommandRunLog {
  command: string;
  stdin: string;
  stdout?: string;
  stderr?: string;
  code?: number;
  env: Record<string, string | undefined>;
  cwd: string;
  success: boolean;
}

export interface CommandLogger {
  log(entry: CommandRunLog): void;
}
