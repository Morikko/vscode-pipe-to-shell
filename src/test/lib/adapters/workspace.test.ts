import * as assert from "assert";
import { mockType } from "../../helper";

import { Workspace as WorkspaceAdapter } from "../../../lib/adapters/workspace";
import * as vscode from "vscode";
import { EXTENSION_NAME } from "../../../lib/const";

describe("WorkspaceAdapter", () => {
  describe("config value", () => {
    const workspaceAdapter = new WorkspaceAdapter(fakeVscodeWorkspace());

    it("gets config value of specified 2 level path", () => {
      assert.deepStrictEqual(workspaceAdapter.getConfig("B"), "VALUE1");
    });

    it("gets config value of specified 4 level path", () => {
      assert.deepStrictEqual(workspaceAdapter.getConfig("F", "D.E"), "VALUE2");
    });
  });

  it("returns the default root path", () => {
    const undefinedWorkspaceAdapter = new WorkspaceAdapter(
      fakeVscodeWorkspace(undefined),
    );
    assert.strictEqual(
      undefinedWorkspaceAdapter.getDefaultRootPath(),
      undefined,
    );

    const emptyWorkspaceAdapter = new WorkspaceAdapter(fakeVscodeWorkspace([]));
    assert.strictEqual(emptyWorkspaceAdapter.getDefaultRootPath(), undefined);

    const workspaceFolders = [
      { uri: { fsPath: "/workspace1" } },
      { uri: { fsPath: "/workspace2" } },
    ];
    const filledWorkspaceAdapter = new WorkspaceAdapter(
      fakeVscodeWorkspace(workspaceFolders),
    );
    assert.strictEqual(
      filledWorkspaceAdapter.getDefaultRootPath(),
      "/workspace1",
    );
  });

  it("returns root path for a file inside a workspace folder", () => {
    const workspaceFolders = [
      { uri: { fsPath: "/workspace1" } },
      { uri: { fsPath: "/workspace2" } },
    ];
    const workspaceAdapter = new WorkspaceAdapter(
      fakeVscodeWorkspace(workspaceFolders),
    );
    const fileUriW1 = vscode.Uri.file("/workspace1/sub/file.txt");
    assert.strictEqual(
      workspaceAdapter.getRootPathFor(fileUriW1),
      "/workspace1",
    );
    const fileUriOutside = vscode.Uri.file("/outside/file.txt");
    assert.strictEqual(
      workspaceAdapter.getRootPathFor(fileUriOutside),
      undefined,
    );

    const emptyWorkspaceAdapter = new WorkspaceAdapter(fakeVscodeWorkspace());
    assert.strictEqual(
      emptyWorkspaceAdapter.getRootPathFor(fileUriW1),
      undefined,
    );
  });

  function fakeVscodeWorkspace(
    workspaceFolders?: { uri: { fsPath: string } }[],
  ) {
    return mockType<typeof vscode.workspace>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      getConfiguration: (oneAbove: any) => {
        switch (oneAbove) {
          case EXTENSION_NAME:
            return { get: (name: string) => name == "B" && "VALUE1" };
          case `${EXTENSION_NAME}.D.E`:
            return { get: (name: string) => name == "F" && "VALUE2" };
          default:
            return { get: () => {} };
        }
      },
      rootPath: "PROJECT_ROOT_PATH",
      workspaceFolders,
      getWorkspaceFolder: (uri: vscode.Uri) => {
        if (
          workspaceFolders &&
          uri.fsPath.startsWith(workspaceFolders[0].uri.fsPath)
        ) {
          return { uri: workspaceFolders[0].uri };
        }
        return undefined;
      },
    });
  }
});
