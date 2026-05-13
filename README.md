[![Build Status](https://travis-ci.org/morikko/vscode-pipe-to-shell.svg?branch=master)](https://travis-ci.org/morikko/vscode-pipe-to-shell) [![Code Climate](https://codeclimate.com/github/morikko/vscode-pipe-to-shell/badges/gpa.svg)](https://codeclimate.com/github/morikko/vscode-pipe-to-shell)

# Edit with Shell Command

Leverage your favourite shell commands to edit text.

## Features

* Edit the selected text by piping it through shell commands.
  The same text is also available as an environment variable, `selectedText`.
* Insert the output of shell commands at the cursor position.
* Records command history: you can edit and reuse past commands.
* Use the shell you like. For example, if you have Bash on Windows, you can specify Bash as your shell for this extension.
* Support multi cursors.

![Edit with Shell Command](https://raw.githubusercontent.com/morikko/vscode-pipe-to-shell/master/images/animations/public.gif)

![Insert command output](https://raw.githubusercontent.com/morikko/vscode-pipe-to-shell/master/images/animations/insert-command-output.gif)

![Edit and reuse past commands](https://raw.githubusercontent.com/morikko/vscode-pipe-to-shell/master/images/animations/edit-and-run-command-history.gif)

## Request Features or Report Bugs

Feature requests and bug reports are very welcome: https://github.com/morikko/vscode-pipe-to-shell/issues

A couple of requests from me when you raise an github issue.

* **Requesting a feature:** Please try to provide the context of why you want the feature. Such as, in what situation the feature could help you and how, or how the lack of the feature is causing an inconvenience to you. I can't think of introducing it until I understand how it helps you 🙂
* **Reporting a bug:** Please include environment information (OS name/version, the editor version). Also consider providing screenshots (or even videos) where appropriate. They are often very very helpful!

## Commands

* `EditWithShell: Run command` (**Command ID:** `pipeToShell.runCommand`)

    Show command history and let you select, modify & run a command

* `EditWithShell: Clear Command History` (**Command ID:** `pipeToShell.clearCommandHistory`)

    Clear command history

## Configurations

* `pipeToShell.currentDirectoryKind` (default: `"currentFile"`)

    Current directory for shell commands. If the target directory is not available, HOME directory will be used. Possible values: `currentFile` or `workspaceRoot`

* `pipeToShell.processEntireTextIfNoneSelected` (default: `false`)

    Pipe the entire text to the shell command if no text is selected

* `pipeToShell.favoriteCommands` (default: `[]`)

    List of commands that are always shown in the suggestion. Each element must
    have a command ID and command. e.g:

    ```
    "pipeToShell.favoriteCommands": [
      {
        "id": "extract-email-and-sort-on-address-book",
        "command": "cut -d, -f3 | sort"
      },
      {
        "id": "insert-melbourne-time",
        "command": "TZ=Australia/Melbourne date '+%Y-%m-%dT%H:%M:%S'"
      },
      ...
    ]
    ```

* `pipeToShell.shell.linux` (default: `"/bin/sh"`)

    The path of the shell that this extension uses on Linux

* `pipeToShell.shellArgs.linux` (default: `["-c"]`)

    Arguments to the shell to be used on Linux

* `pipeToShell.shell.osx` (default: `"/bin/sh"`)

    The path of the shell that this extension uses on macOS

* `pipeToShell.shellArgs.osx` (default: `["-c"]`)

    Arguments to the shell to be used on macOS

* `pipeToShell.shell.windows` (default: `"cmd.exe"`)

    The path of the shell that this extension uses on Windows

    * For PowerShell, you may set this to `"pwsh"`
    * For Bash on WSL (Windows Subsystem for Linux), you may set this to `"wsl"`

* `pipeToShell.shellArgs.windows` (default: `["/d", "/s", "/c"]`)

    Arguments to the shell to be used on Winows

    * For PowerShell, you may set this to `["-NoLogo", "-NoProfile", "-Command"]`
    * For Bash on WSL (Windows Subsystem for Linux), you may set this to `["bash", "-c"]`

## Keyboard Shortcuts

You can quickly open a command input box by registering the extension command to your keyboard shortcut settings. For example:

```
  { "key": "ctrl+r ctrl+r", "command": "pipeToShell.runCommand",
                            "when": "editorTextFocus && !editorReadonly" },
```

## Changelog

* https://github.com/morikko/vscode-pipe-to-shell/blob/master/CHANGELOG.md
