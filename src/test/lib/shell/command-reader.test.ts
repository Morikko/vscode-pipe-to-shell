import * as assert from "assert";
import { mockMethods, mockType, when } from "../../helper";

import {
  CommandReader,
  FavoriteCommand,
  SuggestionItem,
} from "../../../lib/shell/command-reader";
import * as vscode from "vscode";
import { HistoryStore } from "../../../lib/history-store";
import { Workspace } from "../../../lib/adapters/workspace";

describe("CommandReader", () => {
  describe("user input", () => {
    it("should take the input box value", async () => {
      const vsWindow = makeVsWindow("COMMAND");

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

    it("should prefer the active item", async () => {
      new SuggestionItem("ACTIVE_COMMAND");
      const vsWindow = makeVsWindow("COMMAND", [
        new SuggestionItem("ACTIVE_COMMAND"),
      ]);

      const reader = new CommandReader(
        makeHistoryStore(["COMMAND_1", "COMMAND_2"]),
        vsWindow,
        makeWorkspaceAdapter([]),
      );

      assert.deepStrictEqual(await reader.read(false), {
        command: "ACTIVE_COMMAND",
        shouldSaveCommand: true,
        shouldOpenNewEditor: false,
      });
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
        testee.makeHistorySuggestionItem("COMMAND_2"),
        testee.makeHistorySuggestionItem("COMMAND_1"),
        testee.makeFavoriteSuggestionItem({
          command: "FAVORITE_1",
          id: "my_fav_1",
        }),
        testee.makeFavoriteSuggestionItem({
          command: "FAVORITE_2",
          id: "my_fav_2",
        }),
      ]);
    });

    it("returns merged suggestions", async () => {
      const testee = new CommandReader(
        makeHistoryStore(["COMMAND_1", "COMMAND_2"]),
        makeVsWindow(),
        makeWorkspaceAdapter([
          { command: "FAVORITE_1", id: "my_fav_1" },
          { command: "COMMAND_2", id: "my_fav_2" },
        ]),
      );
      await testee.init();
      assert.deepStrictEqual(testee.makeSuggestions(), [
        // instead of history
        testee.makeFavoriteSuggestionItem({
          command: "COMMAND_2",
          id: "my_fav_2",
        }),
        testee.makeHistorySuggestionItem("COMMAND_1"),

        testee.makeFavoriteSuggestionItem({
          command: "FAVORITE_1",
          id: "my_fav_1",
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
        testee.makeFavoriteSuggestionItem({
          command: "FAVORITE_1",
          id: "my_fav_1",
        }),
        testee.makeFavoriteSuggestionItem({
          command: "FAVORITE_2",
          id: "my_fav_2",
        }),
      ]);

      testee.toggleShowHistory();
      testee.toggleShowFavorite();
      assert.deepStrictEqual(testee.makeSuggestions(), [
        testee.makeHistorySuggestionItem("COMMAND_2"),
        testee.makeHistorySuggestionItem("COMMAND_1"),
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

  function makeVsWindow(
    command: string | undefined = undefined,
    activeItems: readonly SuggestionItem[] = [],
  ) {
    const mockVsWindow = mockMethods<typeof vscode.window>(["createQuickPick"]);

    when(mockVsWindow.createQuickPick()).thenReturn({
      value: command,
      activeItems: activeItems,
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

    return mockVsWindow;
  }

  function makeHistoryStore(commands: string[]) {
    return mockType<HistoryStore>({
      getAll: async () => commands,
    });
  }
});
