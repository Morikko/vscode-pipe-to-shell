import {
  Position,
  Range,
  TextEditor as VsTextEditor,
  Uri as VsUri,
} from "vscode";

import * as vscode from "vscode";

export type WrapEditor = (editor: VsTextEditor, lf?: LocationFactory) => Editor;

export interface LocationFactory {
  createPosition(line: number, character: number): Position;
  createRange(start: Position, end: Position): Range;
}

export class Editor {
  constructor(
    private readonly vsEditor: VsTextEditor,
    private readonly locationFactory: LocationFactory,
  ) {}

  get selectedTexts(): string[] {
    const editor = this.vsEditor;
    return editor.selections.map((selection) =>
      editor.document.getText(selection),
    );
  }

  get selections(): readonly vscode.Selection[] {
    return this.vsEditor.selections;
  }

  get entireText(): string {
    return this.vsEditor.document.getText();
  }

  get entireSelection(): readonly vscode.Selection[] {
    const document = this.vsEditor.document;
    const lineCount = document.lineCount;
    const lastLine = document.lineAt(lineCount - 1);
    return [
      new vscode.Selection(
        this.locationFactory.createPosition(0, 0),
        lastLine.range.end,
      ),
    ];
  }

  get isTextSelected(): boolean {
    return this.selectedTexts.length > 1 || this.selectedTexts[0] !== "";
  }

  get fileUri(): VsUri {
    return this.vsEditor.document.uri;
  }

  replaceSelectedTextsWith(
    selections: readonly vscode.Selection[],
    texts: string[],
  ) {
    const editor = this.vsEditor;
    return editor.edit((editBuilder) => {
      selections.forEach((selection, index) => {
        editBuilder.replace(selection, texts[index]);
      });
    });
  }

  async openNewEditor(content: string): Promise<vscode.TextEditor> {
    return new Promise((resolve, reject) => {
      vscode.workspace
        .openTextDocument({ content: content, language: "" })
        .then(
          (doc) => {
            resolve(vscode.window.showTextDocument(doc));
          },
          (err) => reject(err),
        );
    });
  }
}
