import {
  InputRunCommand,
  QuickRunCommand,
} from "../../../lib/commands/run-command";
import { Workspace } from "../../../lib/adapters/workspace";
import { Editor } from "../../../lib/adapters/editor";
import { ShellCommandService } from "../../../lib/shell/command-service";
import { HistoryStore } from "../../../lib/history-store";
import { any, mock, mockMethods, mockType, verify, when } from "../../helper";
import { CommandReader } from "../../../lib/shell/command-reader";
import * as vscode from "vscode";
import * as assert from "assert";

describe("InputRunCommand", () => {
  const fileUri = vscode.Uri.file("FILE_NAME");
  const partialSelection = new vscode.Selection(
    new vscode.Position(10, 0),
    new vscode.Position(12, 2),
  );
  const fullSelection = new vscode.Selection(
    new vscode.Position(0, 0),
    new vscode.Position(12, 20),
  );

  describe('When command is specified and "processEntireTextIfNoneSelected" is set to "false"', () => {
    const commandReader = mockType<CommandReader>({
      read: () =>
        Promise.resolve({
          command: "COMMAND_STRING",
          shouldOpenNewEditor: false,
          shouldSaveCommand: true,
        }),
    });
    const workspaceAdapter = mockType<Workspace>({
      getConfig: (key: string) =>
        key === "processEntireTextIfNoneSelected" && false,
    });

    let shellCommandService: ShellCommandService;
    let historyStore: HistoryStore;
    let command: InputRunCommand;

    beforeEach(() => {
      shellCommandService = mock(ShellCommandService);
      when(
        shellCommandService.runCommand({
          command: "COMMAND_STRING",
          input: "SELECTED_TEXT",
          fileUri: fileUri,
        }),
      ).thenResolve("COMMAND_OUTPUT_1");
      when(
        shellCommandService.runCommand({
          command: "COMMAND_STRING",
          input: "",
          fileUri: fileUri,
        }),
      ).thenResolve("COMMAND_OUTPUT_2");

      historyStore = mock(HistoryStore);
      command = new InputRunCommand(
        shellCommandService,
        historyStore,
        workspaceAdapter,
        commandReader,
        true,
      );
    });

    it("runs command with selected text and add commands to the history", async () => {
      const editor = mockMethods<Editor>(["replaceSelectedTextsWith"], {
        isTextSelected: true,
        selectedTexts: ["SELECTED_TEXT"],
        selections: [partialSelection],
        entireText: "ENTIRE_TEXT",
        fileUri: fileUri,
      });

      await command.execute(editor);

      verify(
        editor.replaceSelectedTextsWith(
          [partialSelection],
          ["COMMAND_OUTPUT_1"],
        ),
      );
      verify(historyStore.add("COMMAND_STRING"));
    });

    it("runs command with no input text", async () => {
      const editor = mockMethods<Editor>(["replaceSelectedTextsWith"], {
        isTextSelected: false,
        selectedTexts: [""],
        selections: [partialSelection],
        entireText: "ENTIRE_TEXT",
        fileUri: fileUri,
      });

      await command.execute(editor);

      verify(
        editor.replaceSelectedTextsWith(
          [partialSelection],
          ["COMMAND_OUTPUT_2"],
        ),
      );
    });
  });

  describe('When command is specified and "processEntireTextIfNoneSelected" is set to "true"', () => {
    const commandReader = mockType<CommandReader>({
      read: () =>
        Promise.resolve({
          command: "COMMAND_STRING",
          shouldOpenNewEditor: true,
          shouldSaveCommand: true,
        }),
    });
    const workspaceAdapter = mockType<Workspace>({
      getConfig: (key: string) => key === "processEntireTextIfNoneSelected",
    });

    let shellCommandService: ShellCommandService;
    let historyStore: HistoryStore;
    let command: InputRunCommand;

    beforeEach(() => {
      shellCommandService = mock(ShellCommandService);
      when(
        shellCommandService.runCommand({
          command: "COMMAND_STRING",
          input: "SELECTED_TEXT",
          fileUri: fileUri,
        }),
      ).thenResolve("COMMAND_OUTPUT_1");
      when(
        shellCommandService.runCommand({
          command: "COMMAND_STRING",
          input: "ENTIRE_TEXT",
          fileUri: fileUri,
        }),
      ).thenResolve("COMMAND_OUTPUT_2");

      historyStore = mock(HistoryStore);
      command = new InputRunCommand(
        shellCommandService,
        historyStore,
        workspaceAdapter,
        commandReader,
        true,
      );
    });

    it("runs command with selected text", async () => {
      const editor = mockMethods<Editor>(["openNewEditor"], {
        isTextSelected: true,
        selectedTexts: ["SELECTED_TEXT"],
        selections: [partialSelection],
        entireText: "ENTIRE_TEXT",
        entireSelection: [fullSelection],
        fileUri: fileUri,
      });

      await command.execute(editor);

      verify(editor.openNewEditor("COMMAND_OUTPUT_1"));
    });

    it("runs command with entire text", async () => {
      const editor = mockMethods<Editor>(["openNewEditor"], {
        isTextSelected: false,
        selectedTexts: [""],
        selections: [partialSelection],
        entireText: "ENTIRE_TEXT",
        entireSelection: [fullSelection],
        fileUri: fileUri,
      });

      await command.execute(editor);

      verify(editor.openNewEditor("COMMAND_OUTPUT_2"));
    });
  });

  describe("When command is NOT specified", () => {
    it("does not try to run a command", async () => {
      const historyStore = mock(HistoryStore);
      const shellCommandService = mock(ShellCommandService);
      const editor = mock(Editor);
      const command = new InputRunCommand(
        shellCommandService,
        historyStore,
        mockType<Workspace>(),
        mockType<CommandReader>({
          read: () =>
            Promise.resolve({
              command: undefined,
              shouldOpenNewEditor: false,
              shouldSaveCommand: true,
            }),
        }),
        true,
      );

      await command.execute(editor);

      verify(editor.replaceSelectedTextsWith(any(), any()), { times: 0 });
      verify(shellCommandService.runCommand(any()), { times: 0 });
      verify(historyStore.add(any()), { times: 0 });
    });
  });
});

describe("QuickRunCommand", () => {
  // const workspaceAdapter = mockType<Workspace>({
  //   getConfig: (key: string) =>
  //     key === "processEntireTextIfNoneSelected" && false,
  // });

  describe("getCommandText", () => {
    it("should accept a favorite command id", () => {});

    it("should accept any input command", () => {});

    it("should accept a command option with a favorite command id", () => {});

    it("should accept a command option with any input command", () => {});

    it("should error on any other type", async () => {
      const quickCommand = new QuickRunCommand(
        mock(ShellCommandService),
        mock(HistoryStore),
        mock(Workspace),
      );
      await assert.rejects(quickCommand["getCommandText"](), Error);
      await assert.rejects(quickCommand["getCommandText"](true), Error);
    });
  });
});
