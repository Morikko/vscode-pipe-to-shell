import * as assert from "assert";
import { mockMethods, mockType, verify } from "../../helper";

import { Editor } from "../../../lib/adapters/editor";
import * as vscode from "vscode";
import { Position } from "vscode";

describe("Editor", () => {
  const locationFactory = { createPosition, createRange: createSelection };
  const partialSelection = new vscode.Selection(
    new vscode.Position(10, 0),
    new vscode.Position(12, 2),
  );

  it("holds a selected text", () => {
    const vsEditor = fakeEditor({
      selectedTexts: ["SELECTED_TEXT"],
      selections: [partialSelection],
    });
    const editor = new Editor(vsEditor, locationFactory);
    assert.deepStrictEqual(editor.selectedTexts, ["SELECTED_TEXT"]);
  });

  it("holds the entire text", () => {
    const vsEditor = fakeEditor({});
    const editor = new Editor(vsEditor, locationFactory);
    assert.deepStrictEqual(editor.entireText, "FOO\n\nBAR");
  });

  it("holds a file path", () => {
    const vsEditor = fakeEditor({ uriScheme: "file" });
    const editor = new Editor(vsEditor, locationFactory);
    assert.deepStrictEqual(editor.fileUri, {
      scheme: "file",
      fsPath: "FILE_PATH",
    });
  });

  it("does not hold a file path if editor content has never been saved", () => {
    const vsEditor = fakeEditor({});
    const editor = new Editor(vsEditor, locationFactory);
    assert.deepStrictEqual(editor.fileUri, {
      scheme: "untitled",
      fsPath: undefined,
    });
  });

  it("replaces the selected text with given text", async () => {
    const editBuilder = mockMethods<vscode.TextEditorEdit>(["replace"]);
    const vsEditor = fakeEditor({
      selectedTexts: ["SELECTED_TEXT"],
      selections: [partialSelection],
      editBuilder,
    });
    const editor = new Editor(vsEditor, locationFactory);

    await editor.replaceSelectedTextsWith([partialSelection], ["NEW_TEXT"]);

    verify(editBuilder.replace(vsEditor.selections[0], "NEW_TEXT"));
  });

  it("replaces the entire text with the command output", async () => {
    const editBuilder = mockMethods<vscode.TextEditorEdit>(["replace"]);
    const vsEditor = fakeEditor({ editBuilder });
    const locationFactory = { createPosition, createRange: createSelection };
    const editor = new Editor(vsEditor, locationFactory);

    await editor.replaceSelectedTextsWith(
      [createSelection(createPosition(0, 0), createPosition(2, 24))],
      ["NEW_TEXT"],
    );

    verify(
      editBuilder.replace(
        createSelection(createPosition(0, 0), createPosition(2, 24)),
        "NEW_TEXT",
      ),
    );
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function fakeEditor(params: any) {
    const selectedTexts = params.selectedTexts || [];
    const entireText = `FOO\n${selectedTexts[0] || ""}\nBAR`;
    const uriScheme = params.uriScheme;
    return mockType<vscode.TextEditor>({
      selections: params.selections,
      document: {
        getText: () => selectedTexts[0] || entireText,
        uri: {
          scheme: uriScheme || "untitled",
          fsPath: uriScheme ? "FILE_PATH" : undefined,
        },
        lineCount: entireText.split("\n").length,
        lineAt: (lineIndex: number) => ({
          range: createSelection(
            createPosition(lineIndex, 0),
            createPosition(lineIndex, 24),
          ),
        }),
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      edit: function (callback: any) {
        callback(params.editBuilder || { replace: () => {} });
        return Promise.resolve(true);
      },
    });
  }

  function createPosition(line: number, column: number) {
    return new vscode.Position(line, column);
  }

  function createSelection(position1: Position, position2: Position) {
    return new vscode.Selection(position1, position2);
  }
});
