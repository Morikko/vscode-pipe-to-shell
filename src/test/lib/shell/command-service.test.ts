import * as assert from "assert";
import {
  any,
  contains,
  mock,
  mockFunction,
  mockType,
  when,
} from "../../helper";
import {
  ShellCommandService,
  SpawnWrapper,
} from "../../../lib/shell/command-service";
import { ProcessRunner } from "../../../lib/shell/process-runner";
import { ChildProcess } from "child_process";
import { Workspace } from "../../../lib/adapters/workspace";
import Process = NodeJS.Process;
import * as vscode from "vscode";
import * as os from "os";

describe("ShellCommandService", () => {
  let spawn_child_process: SpawnWrapper;
  let processRunner: ProcessRunner;
  let service: ShellCommandService;
  let process: ChildProcess;
  const fileUri = vscode.Uri.file("CURRENT_DIR/CURRENT_FILE");
  const untitledUri = vscode.Uri.from({ scheme: "untitled" });
  const platform = "linux";

  beforeEach(() => {
    process = mockType<ChildProcess>();
    spawn_child_process = mockFunction() as SpawnWrapper;
    processRunner = mock(ProcessRunner);
    const workspace = mock(Workspace);
    when(workspace.getConfig(platform, "shell")).thenReturn("SHELL_PATH");
    when(workspace.getConfig(platform, "shellArgs")).thenReturn(["SHELL_ARG"]);
    when(workspace.getConfig("currentDirectoryKind")).thenReturn("currentFile");

    service = new ShellCommandService(
      processRunner,
      workspace,
      mockType<Process>({
        platform,
        env: { SOME_ENV_VAR: "..." },
      }),
      spawn_child_process,
    );
  });

  it("runs a given command on shell", async () => {
    when(
      spawn_child_process("SHELL_PATH", ["SHELL_ARG", "COMMAND_STRING"], any()),
    ).thenReturn(process);
    when(processRunner.run(process, "")).thenResolve("COMMAND_OUTPUT");

    const params = {
      command: "COMMAND_STRING",
      input: "",
      fileUri: untitledUri,
    };
    const output = await service.runCommand(params);

    assert.deepStrictEqual(output, "COMMAND_OUTPUT");
  });

  it("passes selected text in the editor to the command", async () => {
    when(
      spawn_child_process("SHELL_PATH", ["SHELL_ARG", "COMMAND_STRING"], any()),
    ).thenReturn(process);
    when(processRunner.run(process, "SELECTED_TEXT")).thenResolve(
      "COMMAND_OUTPUT_TEST_WITH_INPUT",
    );

    const params = {
      command: "COMMAND_STRING",
      input: "SELECTED_TEXT",
      fileUri: untitledUri,
    };
    const output = await service.runCommand(params);

    assert.deepStrictEqual(output, "COMMAND_OUTPUT_TEST_WITH_INPUT");
  });

  it("inherits environment variables on executing a command", async () => {
    when(
      spawn_child_process(
        "SHELL_PATH",
        ["SHELL_ARG", "COMMAND_TEST_WITH_ENVVARS"],
        {
          cwd: os.homedir(),
          env: { SOME_ENV_VAR: "..." },
        },
      ),
    ).thenReturn(process);
    when(processRunner.run(process, "")).thenResolve("COMMAND_OUTPUT");

    const params = {
      command: "COMMAND_TEST_WITH_ENVVARS",
      input: "",
      fileUri: untitledUri,
    };
    const output = await service.runCommand(params);

    assert.deepStrictEqual(output, "COMMAND_OUTPUT");
  });

  it("also exposes a selected text as an environment variable", async () => {
    when(
      spawn_child_process(
        "SHELL_PATH",
        ["SHELL_ARG", "COMMAND_TEST_WITH_selectedText_AS_ENVVAR"],
        {
          cwd: os.homedir(),
          env: { selectedText: "SELECTED_TEXT", SOME_ENV_VAR: "..." },
        },
      ),
    ).thenReturn(process);
    when(processRunner.run(process, "")).thenResolve("COMMAND_OUTPUT");

    const params = {
      command: "COMMAND_TEST_WITH_selectedText_AS_ENVVAR",
      input: "SELECTED_TEXT",
      fileUri: untitledUri,
    };
    const output = await service.runCommand(params);

    assert.deepStrictEqual(output, "COMMAND_OUTPUT");
  });

  it("executes a command on a specific directory", async () => {
    when(
      spawn_child_process(
        "SHELL_PATH",
        ["SHELL_ARG", "COMMAND_TEST_WITH_EXEC_DIR"],
        contains({ cwd: "CURRENT_DIR" }),
      ),
    ).thenReturn(process);
    when(processRunner.run(process, "")).thenResolve("COMMAND_OUTPUT");

    const params = {
      command: "COMMAND_TEST_WITH_EXEC_DIR",
      input: "",
      fileUri: fileUri,
    };
    const output = await service.runCommand(params);

    assert.deepStrictEqual(output, "COMMAND_OUTPUT");
  });

  it("throws an error if command failed", async () => {
    when(
      spawn_child_process("SHELL_PATH", ["SHELL_ARG", "COMMAND_STRING"], any()),
    ).thenReturn(process);
    when(processRunner.run(process, "CAUSE_ERROR_INPUT")).thenReject(
      new Error("UNEXPECTED_ERROR"),
    );

    const params = {
      command: "COMMAND_STRING",
      input: "CAUSE_ERROR_INPUT",
      fileUri: untitledUri,
    };

    try {
      await service.runCommand(params);
      throw new Error("Should not have been called");
    } catch (e) {
      if (e instanceof Error) {
        assert.deepStrictEqual(e.message, "UNEXPECTED_ERROR");
      } else {
        throw e;
      }
    }
  });
});
