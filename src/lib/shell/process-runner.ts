import { ChildProcess } from "child_process";
import { CommandExecutionError } from "../errors";

interface CommandSuccess {
  stdout: string;
  stderr: string;
}

export class ProcessRunner {
  run(command: ChildProcess, inputString: string): Promise<CommandSuccess> {
    let stdoutString = "";
    let stderrString = "";

    command.stdin?.write(inputString);
    command.stdin?.end();

    command.stdout?.on("data", (data) => {
      stdoutString += data.toString();
    });
    command.stderr?.on("data", (data) => {
      stderrString += data.toString();
    });

    return new Promise((resolve, reject) => {
      command.on("error", (err) => {
        reject(err);
      });
      command.on("close", (code) => {
        if (code !== 0) {
          const commandString = command.spawnargs.slice(-1)[0];
          reject(
            new CommandExecutionError(
              `Command failed: ${commandString}\n${stderrString}`,
              code,
              commandString,
              stderrString.trim(),
              stdoutString.trim(),
            ),
          );
        } else {
          if (stdoutString.endsWith("\n")) {
            stdoutString = stdoutString.slice(0, -1);
          }
          resolve({ stdout: stdoutString, stderr: stderrString.trim() });
        }
      });
    });
  }
}
