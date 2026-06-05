import * as assert from "assert";
import { mockMethods, when } from "../../helper";

import { ShellCommandExecContext } from "../../../lib/shell/command-exec-context";
import { Workspace } from "../../../lib/adapters/workspace";
import * as vscode from "vscode";
import * as os from "os";

describe("ShellCommandExecContext", () => {
  const fileUri = vscode.Uri.file("/DIR/FILE");
  const untitledUri = vscode.Uri.from({ scheme: "untitled" });
  const WORKSPACE_ROOT = "PROJECT_ROOT_PATH";

  it("has environment variables", () => {
    const execContextAlong = new ShellCommandExecContext(
      fakeWorkspaceAdapter({ env: { LANG: "en_US.UTF-8" } }),
      {
        env: { VAR: ".." },
      },
    );
    assert.deepStrictEqual(execContextAlong.env, {
      VAR: "..",
      LANG: "en_US.UTF-8",
    });

    const execContextOverwrite = new ShellCommandExecContext(
      fakeWorkspaceAdapter({ env: { VAR: "en_US.UTF-8" } }),
      {
        env: { VAR: ".." },
      },
    );
    assert.deepStrictEqual(execContextOverwrite.env, { VAR: "en_US.UTF-8" });
  });

  describe("with CurrentDirectoryKind.CURRENT_FILE mode", () => {
    it("returns the directory of the current file if file is existing", () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({ currentDirectoryKind: "currentFile" }),
        { env: {} },
      );
      assert.deepStrictEqual(execContext.getCwd(fileUri), "/DIR");
    });

    it("returns the workspace first root if file is not existing", () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({
          currentDirectoryKind: "currentFile",
          defaultRootPath: "DEFAULT_ROOT",
        }),
        { env: {} },
      );
      assert.deepStrictEqual(execContext.getCwd(untitledUri), "DEFAULT_ROOT");
    });

    it("returns the home dir if there is not even a workspace", () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({ currentDirectoryKind: "currentFile" }),
        { env: {} },
      );
      //when(execContext.home_dir).thenReturn("HOME_DIR");
      assert.deepStrictEqual(execContext.getCwd(untitledUri), os.homedir());
    });
  });

  describe("with CurrentDirectoryKind.WORKSPACE_ROOT mode", () => {
    it("returns the workspace root the file belongs in if any", () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({ currentDirectoryKind: "workspaceRoot" }),
        { env: {} },
      );
      assert.deepStrictEqual(execContext.getCwd(fileUri), WORKSPACE_ROOT);
    });

    it('returns first workspace root for untitled file"', () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({
          currentDirectoryKind: "workspaceRoot",
          defaultRootPath: "DEFAULT_ROOT",
        }),
        { env: {} },
      );
      assert.deepStrictEqual(execContext.getCwd(untitledUri), "DEFAULT_ROOT");
    });

    it("returns home directory if no workspace", () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({ currentDirectoryKind: "workspaceRoot" }),
        { env: {} },
      );
      assert.deepStrictEqual(execContext.getCwd(untitledUri), os.homedir());
    });
  });

  describe("getFileEnvVars", () => {
    // Using /DIR as workspace folder so fileUri (/DIR/FILE) gives relativeFile = FILE
    const FILE_WORKSPACE_FOLDER = "/DIR";

    it("returns file, fileWorkspaceFolder and relativeFile for a file within a workspace", () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({ rootPathForFile: FILE_WORKSPACE_FOLDER }),
        { env: {} },
      );
      assert.deepStrictEqual(execContext.getFileEnvVars(fileUri), {
        file: "/DIR/FILE",
        fileWorkspaceFolder: "/DIR",
        relativeFile: "FILE",
      });
    });

    it("returns only file when the file is not part of workspace folder", () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({
          rootPathForFile: undefined,
          defaultRootPath: FILE_WORKSPACE_FOLDER,
        }),
        { env: {} },
      );
      // relativeFile is omitted — it can't be computed without a real workspace folder
      assert.deepStrictEqual(execContext.getFileEnvVars(fileUri), {
        file: "/DIR/FILE",
      });
    });

    it("returns only file when there is no workspace folder at all", () => {
      const execContext = new ShellCommandExecContext(
        fakeWorkspaceAdapter({ rootPathForFile: undefined }),
        { env: {} },
      );
      assert.deepStrictEqual(execContext.getFileEnvVars(fileUri), {
        file: "/DIR/FILE",
      });
    });

    it("returns empty object for non-file URIs like untitled", () => {
      const execContext = new ShellCommandExecContext(fakeWorkspaceAdapter(), {
        env: {},
      });
      assert.deepStrictEqual(execContext.getFileEnvVars(untitledUri), {});
    });
  });

  /**
   * Omit "rootPathForFile" to default to WORKSPACE_ROOT. Pass undefined
   * explicitly to simulate no workspace folder.
   *
   * @param options
   * @returns
   */
  function fakeWorkspaceAdapter(
    options: {
      currentDirectoryKind?: "workspaceRoot" | "currentFile";
      defaultRootPath?: string;
      rootPathForFile?: string;
      env?: { [p: string]: string };
    } = {},
  ): Workspace {
    // Distinguish "not provided" (use WORKSPACE_ROOT) from "explicitly
    // undefined" (no folder).
    const rootPathForFile =
      "rootPathForFile" in options ? options.rootPathForFile : WORKSPACE_ROOT;
    const workspace = mockMethods<Workspace>([
      "getConfig",
      "getRootPathFor",
      "getDefaultRootPath",
    ]);
    when(workspace.getConfig("currentDirectoryKind")).thenReturn(
      options.currentDirectoryKind,
    );
    when(workspace.getConfig("shell.env")).thenReturn(options.env);
    when(workspace.getRootPathFor(fileUri)).thenReturn(rootPathForFile);
    when(workspace.getRootPathFor(untitledUri)).thenReturn(undefined);
    when(workspace.getDefaultRootPath()).thenReturn(options.defaultRootPath);
    return workspace;
  }
});
