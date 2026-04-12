import * as assert from "assert";
import { HistoryStore } from "../../lib/history-store";
import { mockType } from "../helper";
import * as vscode from "vscode";

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
    const historyStore = new HistoryStore(fakeContext);
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_2");
    assert.deepStrictEqual(await historyStore.getAll(), [
      "COMMAND_1",
      "COMMAND_2",
    ]);
  });

  it("does not record the same command twice", async () => {
    const historyStore = new HistoryStore(fakeContext);
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_1");
    assert.deepStrictEqual(await historyStore.getAll(), ["COMMAND_1"]);
  });

  it("returns the last used command at the end", async () => {
    const historyStore = new HistoryStore(fakeContext);
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_2");
    await historyStore.add("COMMAND_1");
    assert.deepStrictEqual(await historyStore.getAll(), [
      "COMMAND_2",
      "COMMAND_1",
    ]);
  });

  it("returns an empty list if no commands are recorded yet", async () => {
    const historyStore = new HistoryStore(fakeContext);
    assert.deepStrictEqual(await historyStore.getAll(), []);
  });

  it("clears all history", async () => {
    const historyStore = new HistoryStore(fakeContext);
    await historyStore.add("COMMAND_1");
    await historyStore.add("COMMAND_2");
    await historyStore.clear();
    assert.deepStrictEqual(await historyStore.getAll(), []);
  });
});
