import * as td from "testdouble";
import * as vscode from "vscode";
import { mockMethods, mockType } from "../../helper";
import { OutputChannelCommandLogger } from "../../../lib/adapters/output-channel";
import { Workspace } from "../../../lib/adapters/workspace";
import { CommandRunLog } from "../../../lib/shell/command-logger";

const FULL_SUCCESS_LOG = `Command executed
$> echo hello
Exit code: 1
stdin:
  first line
  second line
stdout:
  out line 1
  out line 2
stderr:
  err line 1
  err line 2
cwd: /projects/foo
env:
  MY_VAR="my_value"
  OTHER="other_value"
`;

describe("OutputChannelCommandLogger", () => {
  let fakeChannel: vscode.LogOutputChannel;

  beforeEach(() => {
    fakeChannel = mockMethods<vscode.LogOutputChannel>([
      "info",
      "error",
      "dispose",
    ]);
    td.replace(vscode.window, "createOutputChannel", () => fakeChannel);
  });

  afterEach(() => {
    td.reset();
  });

  // Creates a logger with specific config keys enabled (all others disabled)
  function makeLogger(enabledKeys: string[] = []): OutputChannelCommandLogger {
    const workspace = mockType<Workspace>({
      getConfig: (path: string) => enabledKeys.includes(path),
    });
    return new OutputChannelCommandLogger("test-channel", workspace);
  }

  // Returns a baseline CommandRunLog with all optional fields omitted
  function baseEntry(overrides: Partial<CommandRunLog> = {}): CommandRunLog {
    return {
      command: "echo hello",
      stdin: "",
      env: {},
      cwd: "/tmp",
      success: true,
      ...overrides,
    };
  }

  describe("dispose", () => {
    it("disposes the underlying output channel", () => {
      const logger = makeLogger();
      logger.dispose();
      td.verify(fakeChannel.dispose());
    });
  });

  describe("log — success", () => {
    it("uses channel.info for a successful entry", () => {
      const logger = makeLogger();
      logger.log(baseEntry({ success: true }));
      td.verify(fakeChannel.info(td.matchers.anything()), { times: 1 });
    });

    it("always includes the 'Command executed' header", () => {
      const logger = makeLogger();
      logger.log(baseEntry({ success: true }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => s.includes("Command executed")),
        ),
      );
    });

    it("logs the command line when logging.success.command is enabled", () => {
      const logger = makeLogger(["logging.success.command"]);
      logger.log(baseEntry({ command: "echo hello", success: true }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => s.includes("$> echo hello")),
        ),
      );
    });

    it("omits the command line when logging.success.command is disabled", () => {
      const logger = makeLogger([]);
      logger.log(baseEntry({ command: "echo hello", success: true }));
      td.verify(
        fakeChannel.info(td.matchers.argThat((s: string) => !s.includes("$>"))),
      );
    });

    it("logs the exit code when present", () => {
      const logger = makeLogger();
      logger.log(baseEntry({ code: 42 }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => s.includes("Exit code: 42")),
        ),
      );
    });

    it("omits the exit code line when code is not set", () => {
      const logger = makeLogger();
      logger.log(baseEntry({ code: undefined }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => !s.includes("Exit code")),
        ),
      );
    });

    it("logs the cwd when logging.success.cwd is enabled", () => {
      const logger = makeLogger(["logging.success.cwd"]);
      logger.log(baseEntry({ cwd: "/projects/foo", success: true }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => s.includes("cwd: /projects/foo")),
        ),
      );
    });
  });

  describe("log — failure", () => {
    it("uses channel.error for a failed entry", () => {
      const logger = makeLogger();
      logger.log(baseEntry({ success: false }));
      td.verify(fakeChannel.error(td.matchers.anything()), { times: 1 });
    });

    it("logs the command line when logging.failure.command is enabled", () => {
      const logger = makeLogger(["logging.failure.command"]);
      logger.log(baseEntry({ command: "bad-cmd", success: false }));
      td.verify(
        fakeChannel.error(
          td.matchers.argThat((s: string) => s.includes("$> bad-cmd")),
        ),
      );
    });

    it("logs the cwd when logging.failure.cwd is enabled", () => {
      const logger = makeLogger(["logging.failure.cwd"]);
      logger.log(baseEntry({ cwd: "/projects/foo", success: false }));
      td.verify(
        fakeChannel.error(
          td.matchers.argThat((s: string) => s.includes("cwd: /projects/foo")),
        ),
      );
    });
  });

  describe("log — stdout / stderr / stdin", () => {
    it("logs stdout with indented content when enabled and content is present", () => {
      const logger = makeLogger(["logging.success.stdout"]);
      logger.log(baseEntry({ stdout: "hello world" }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) =>
            s.includes("stdout:\n  hello world"),
          ),
        ),
      );
    });

    it("indents multi-line stdout content", () => {
      const logger = makeLogger(["logging.success.stdout"]);
      logger.log(baseEntry({ stdout: "line1\nline2" }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) =>
            s.includes("stdout:\n  line1\n  line2"),
          ),
        ),
      );
    });

    it("shows [Empty] when stdout is undefined", () => {
      const logger = makeLogger(["logging.success.stdout"]);
      logger.log(baseEntry({ stdout: undefined }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => s.includes("stdout: [Empty]")),
        ),
      );
    });

    it("shows [Empty] when stdin is an empty string", () => {
      const logger = makeLogger(["logging.success.stdin"]);
      logger.log(baseEntry({ stdin: "" }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => s.includes("stdin: [Empty]")),
        ),
      );
    });

    it("logs stderr for a failed entry when logging.failure.stderr is enabled", () => {
      const logger = makeLogger(["logging.failure.stderr"]);
      logger.log(baseEntry({ stderr: "something went wrong", success: false }));
      td.verify(
        fakeChannel.error(
          td.matchers.argThat((s: string) =>
            s.includes("stderr:\n  something went wrong"),
          ),
        ),
      );
    });

    it("omits stdout when the config key is disabled", () => {
      const logger = makeLogger([]);
      logger.log(baseEntry({ stdout: "hidden" }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => !s.includes("hidden")),
        ),
      );
    });
  });

  describe("log — env", () => {
    it("logs env variables when logging.success.env is enabled", () => {
      const logger = makeLogger(["logging.success.env"]);
      logger.log(baseEntry({ env: { MY_VAR: "my_value" } }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => s.includes('MY_VAR="my_value"')),
        ),
      );
    });

    it("uses single quotes when the value contains a double quote", () => {
      const logger = makeLogger(["logging.success.env"]);
      logger.log(baseEntry({ env: { KEY: 'say "hello"' } }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => s.includes("KEY='say \"hello\"'")),
        ),
      );
    });

    it("filters out env entries with undefined values", () => {
      const logger = makeLogger(["logging.success.env"]);
      logger.log(baseEntry({ env: { DEFINED: "yes", MISSING: undefined } }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat(
            (s: string) => s.includes("DEFINED=") && !s.includes("MISSING"),
          ),
        ),
      );
    });

    it("omits the env block when logging.success.env is disabled", () => {
      const logger = makeLogger([]);
      logger.log(baseEntry({ env: { PATH: "/usr/bin" } }));
      td.verify(
        fakeChannel.info(
          td.matchers.argThat((s: string) => !s.includes("env:")),
        ),
      );
    });
  });

  describe("log — full output", () => {
    it("emits the complete log string when every field and config key is enabled", () => {
      const allSuccessKeys = [
        "logging.success.command",
        "logging.success.stdin",
        "logging.success.stdout",
        "logging.success.stderr",
        "logging.success.cwd",
        "logging.success.env",
      ];
      const logger = makeLogger(allSuccessKeys);

      logger.log({
        command: "echo hello",
        code: 1,
        stdin: "first line\nsecond line",
        stdout: "out line 1\nout line 2",
        stderr: "err line 1\nerr line 2",
        cwd: "/projects/foo",
        env: { MY_VAR: "my_value", OTHER: "other_value" },
        success: true,
      });

      td.verify(fakeChannel.info(FULL_SUCCESS_LOG));
    });
  });

  describe("createOutputChannel", () => {
    it("passes the channel name to vscode", () => {
      const createSpy = td.replace(
        vscode.window,
        "createOutputChannel",
        td.function(),
      ) as td.TestDouble<typeof vscode.window.createOutputChannel>;
      td.when(createSpy("my-channel", td.matchers.anything())).thenReturn(
        fakeChannel,
      );

      const workspace = mockType<Workspace>({ getConfig: () => false });
      new OutputChannelCommandLogger("my-channel", workspace);

      td.verify(createSpy("my-channel", td.matchers.anything()));
    });
  });
});
