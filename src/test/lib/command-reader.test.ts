import * as assert from "assert";
import { mockMethods, mockType, when } from "../helper";

import { CommandReader, FavoriteCommand } from "../../lib/command-reader";
import * as vscode from "vscode";
import { HistoryStore } from "../../lib/history-store";
import { Workspace } from "../../lib/adapters/workspace";

describe("CommandReader", () => {
  it("allows user to pick and modify a past command. Commands shown last one first", async () => {
    const vsWindow = makeVsWindow();

    when(vsWindow.createQuickPick()).thenReturn({
      value: "COMMAND",
      onDidChangeActive: (_v) => new vscode.Disposable(() => {}),
      onDidChangeSelection: (_v) => new vscode.Disposable(() => {}),
      onDidAccept: (v) => {
        v(); // accept
        return new vscode.Disposable(() => {});
      },
      onDidHide: (_v) => new vscode.Disposable(() => {}),
      onDidTriggerButton: (_v) => new vscode.Disposable(() => {}),
      hide: () => {},
      show: () => {},
    });

    const reader = new CommandReader(
      makeHistoryStore(["COMMAND_1", "COMMAND_2"]),
      vsWindow,
      makeWorkspaceAdapter([]),
    );

    assert.deepStrictEqual(await reader.read(false), {
      command: "COMMAND",
      shouldSaveCommand: true,
      shouldOpenNewEditor: false,
    });

    assert.deepStrictEqual(await reader.read(true), {
      command: "COMMAND",
      shouldSaveCommand: true,
      shouldOpenNewEditor: true,
    });
  });

  describe("makeSuggestions", () => {
    it("returns empty suggestions", async () => {
      const testee = new CommandReader(
        makeHistoryStore([]),
        makeVsWindow(),
        makeWorkspaceAdapter([]),
      );
      await testee.init();
      assert.deepStrictEqual(testee.makeSuggestions(), []);
    });

    it("returns suggestions", async () => {
      const testee = new CommandReader(
        makeHistoryStore(["COMMAND_1", "COMMAND_2"]),
        makeVsWindow(),
        makeWorkspaceAdapter([
          { command: "FAVORITE_1", id: "my_fav_1" },
          { command: "FAVORITE_2", id: "my_fav_2" },
        ]),
      );
      await testee.init();
      assert.deepStrictEqual(testee.makeSuggestions(), [
        testee.makeHistoryMessageItem("COMMAND_1"),
        testee.makeHistoryMessageItem("COMMAND_2"),
        testee.makeFavoriteMessageItem({
          command: "FAVORITE_1",
          id: "my_fav_1",
        }),
        testee.makeFavoriteMessageItem({
          command: "FAVORITE_2",
          id: "my_fav_2",
        }),
      ]);
    });

    it("returns suggestions if asked", async () => {
      const testee = new CommandReader(
        makeHistoryStore(["COMMAND_1", "COMMAND_2"]),
        makeVsWindow(),
        makeWorkspaceAdapter([
          { command: "FAVORITE_1", id: "my_fav_1" },
          { command: "FAVORITE_2", id: "my_fav_2" },
        ]),
      );
      await testee.init();

      testee.toggleShowHistory();
      assert.deepStrictEqual(testee.makeSuggestions(), [
        testee.makeFavoriteMessageItem({
          command: "FAVORITE_1",
          id: "my_fav_1",
        }),
        testee.makeFavoriteMessageItem({
          command: "FAVORITE_2",
          id: "my_fav_2",
        }),
      ]);

      testee.toggleShowHistory();
      testee.toggleShowFavorite();
      assert.deepStrictEqual(testee.makeSuggestions(), [
        testee.makeHistoryMessageItem("COMMAND_1"),
        testee.makeHistoryMessageItem("COMMAND_2"),
      ]);
    });
  });

  function makeWorkspaceAdapter(favoriteCommands: FavoriteCommand[]) {
    return mockType<Workspace>({
      getConfig: (key: string) => {
        if (key === "favoriteCommands") {
          return favoriteCommands;
        } else {
          throw Error("Not defined config");
        }
      },
    });
  }

  function makeVsWindow() {
    return mockMethods<typeof vscode.window>(["createQuickPick"]);
  }

  function makeHistoryStore(commands: string[]) {
    return mockType<HistoryStore>({
      getAll: async () => commands,
    });
  }
});
