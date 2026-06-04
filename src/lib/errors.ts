export class CommandExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly command: string,
    public readonly errorOutput: string,
    public readonly stdout?: string,
  ) {
    super(message);
  }
}
