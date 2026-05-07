import * as assert from "assert";
import { HistoryStore } from "../../lib/history-store";
import { mockType } from "../helper";
import * as vscode from "vscode";
import { Workspace } from "../../lib/adapters/workspace";

function makeWorkspaceAdapter(maxSize: number) {
  return mockType<Workspace>({
    getConfig: (key: string) => {
      if (key === "historyMaxSize") {
        return maxSize;
      } else {
        throw Error("Not defined config");
      }
    },
  });
}

describe("HistoryStore", () => {
  let historyState: string[] = [];
  const fakeContext = mockType<vscode.ExtensionContext>({
    globalState: {
      get: (_key: string) => historyState,
      update: (_key: string, history: string[]) => (historyState = history),
    },
  });

  beforeEach(() => {
    historyState = [];
  });

  it("retrieves all recorded commands", async () => {
    const historyStore = new HistoryStore(
      fakeContext,
      makeWorkspaceAdapter(10),
    );
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_2");
    assert.deepStrictEqual(await historyStore.getAll(), [
      "COMMAND_1",
      "COMMAND_2",
    ]);
  });

  it("does not record the same command twice", async () => {
    const historyStore = new HistoryStore(
      fakeContext,
      makeWorkspaceAdapter(10),
    );
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_1");
    assert.deepStrictEqual(await historyStore.getAll(), ["COMMAND_1"]);
  });

  it("returns the last used command at the end", async () => {
    const historyStore = new HistoryStore(
      fakeContext,
      makeWorkspaceAdapter(10),
    );
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_2");
    await historyStore.add("COMMAND_1");
    assert.deepStrictEqual(await historyStore.getAll(), [
      "COMMAND_2",
      "COMMAND_1",
    ]);
  });

  it("returns an empty list if no commands are recorded yet", async () => {
    const historyStore = new HistoryStore(
      fakeContext,
      makeWorkspaceAdapter(10),
    );
    assert.deepStrictEqual(await historyStore.getAll(), []);
  });

  it("clears all history", async () => {
    const historyStore = new HistoryStore(
      fakeContext,
      makeWorkspaceAdapter(10),
    );
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_2");
    await historyStore.clear();
    assert.deepStrictEqual(await historyStore.getAll(), []);
  });

  it("truncates the history on add", async () => {
    historyState = ["COMMAND_1", "COMMAND_2", "COMMAND_3", "COMMAND_4"];
    const historyStore = new HistoryStore(fakeContext, makeWorkspaceAdapter(2));

    await historyStore.truncateMaxSize();
    assert.deepStrictEqual(await historyStore.getAll(), [
      "COMMAND_3",
      "COMMAND_4",
    ]);

    // Second run do nothing
    await historyStore.truncateMaxSize();
    assert.deepStrictEqual(await historyStore.getAll(), [
      "COMMAND_3",
      "COMMAND_4",
    ]);
  });

  it("truncates the history after config change", async () => {
    const historyStore = new HistoryStore(fakeContext, makeWorkspaceAdapter(2));
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_2");
    await historyStore.add("COMMAND_3");
    assert.deepStrictEqual(await historyStore.getAll(), [
      "COMMAND_2",
      "COMMAND_3",
    ]);
    await historyStore.add("COMMAND_4");
    assert.deepStrictEqual(await historyStore.getAll(), [
      "COMMAND_3",
      "COMMAND_4",
    ]);
  });
});
