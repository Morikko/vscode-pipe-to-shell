# Pipe to Shell

Leverage your favourite shell commands to edit text.

- [Pipe to Shell](#pipe-to-shell)
- [Features](#features)
- [Enter a command](#enter-a-command)
- [History](#history)
- [Shell configuration](#shell-configuration)
- [Environment variables](#environment-variables)
- [Working directory](#working-directory)
- [Favorite commands](#favorite-commands)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Audit \& Debug](#audit--debug)
- [Changelog](#changelog)
- [Request Features or Report Bugs](#request-features-or-report-bugs)
- [Credit](#credit)

# Features

* Edit the selected text by piping it through shell commands
* Insert the output of shell commands at the cursor position
* Records command history: you can edit and reuse past commands
* Highly configurable: shell preference, env vars and many more
* Support multi cursors

![Pipe to Shell](https://raw.githubusercontent.com/morikko/vscode-pipe-to-shell/master/images/animations/public.gif)

![Insert command output](https://raw.githubusercontent.com/morikko/vscode-pipe-to-shell/master/images/animations/insert-command-output.gif)

![Edit and reuse past commands](https://raw.githubusercontent.com/morikko/vscode-pipe-to-shell/master/images/animations/edit-and-run-command-history.gif)

# Enter a command

`PipeToShell: Run command in-place` and `PipeToShell: Run command to new editor`
show a command input with suggestions. The input allows to enter a new command
or modify an existing suggestion. 

Command IDs: `pipeToShell.runCommandInPlace` /
`pipeToShell.runCommandNewEditor`.

By clicking the `OK` button or pressing <kbd>Enter</kbd>, the entered command is
run. 

The suggestions are made of the previous run commands (marked with <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M7.99909 3C10.7605 3 12.9991 5.23858 12.9991 8C12.9991 10.7614 10.7605 13 7.99909 13C5.39117 13 3.2491 11.003 3.0195 8.45512C2.99471 8.1801 2.75167 7.97723 2.47664 8.00202C2.20161 8.0268 1.99875 8.26985 2.02353 8.54488C2.29916 11.6035 4.86898 14 7.99909 14C11.3128 14 13.9991 11.3137 13.9991 8C13.9991 4.68629 11.3128 2 7.99909 2C6.20656 2 4.59815 2.78613 3.49909 4.03138V2.5C3.49909 2.22386 3.27524 2 2.99909 2C2.72295 2 2.49909 2.22386 2.49909 2.5V5.5C2.49909 5.77614 2.72295 6 2.99909 6H3.08812C3.09498 6.00014 3.10184 6.00014 3.10868 6H5.99909C6.27524 6 6.49909 5.77614 6.49909 5.5C6.49909 5.22386 6.27524 5 5.99909 5H3.99863C4.91128 3.78495 6.36382 3 7.99909 3ZM7.99909 5.5C7.99909 5.22386 7.77524 5 7.49909 5C7.22295 5 6.99909 5.22386 6.99909 5.5V8.5C6.99909 8.77614 7.22295 9 7.49909 9H9.49909C9.77524 9 9.99909 8.77614 9.99909 8.5C9.99909 8.22386 9.77524 8 9.49909 8H7.99909V5.5Z"/></svg>) and the favorite commands
(marked with <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M15.022 7.25497L12.203 10.003L12.869 13.883C12.917 14.165 12.844 14.438 12.664 14.654C12.479 14.872 12.205 15.001 11.929 15.001C11.775 15.001 11.626 14.963 11.485 14.89L8.00101 13.057L4.51701 14.889C4.13401 15.093 3.62401 14.991 3.34001 14.657C3.15801 14.439 3.08501 14.165 3.13201 13.884L3.79801 10.004L0.979007 7.25597C0.714007 6.99797 0.624007 6.63297 0.737007 6.27997C0.853007 5.92497 1.14001 5.68197 1.50701 5.62797L5.40301 5.06197L7.14501 1.53197C7.47301 0.865971 8.52801 0.865971 8.85601 1.53197L10.598 5.06197L14.494 5.62797C14.862 5.68197 15.149 5.92397 15.264 6.27597C15.378 6.63197 15.286 6.99697 15.022 7.25497Z"/></svg>).

By clicking or pressing <kbd>Space</kbd> on a suggestion, the command is set in the prompt to be further modified.

By pressing <kbd>Enter</kbd> on a suggestion, that command is run immediately.

By default all suggestions are shown but it is possible to customize it with the
buttons at the top:
- <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M7.99909 3C10.7605 3 12.9991 5.23858 12.9991 8C12.9991 10.7614 10.7605 13 7.99909 13C5.39117 13 3.2491 11.003 3.0195 8.45512C2.99471 8.1801 2.75167 7.97723 2.47664 8.00202C2.20161 8.0268 1.99875 8.26985 2.02353 8.54488C2.29916 11.6035 4.86898 14 7.99909 14C11.3128 14 13.9991 11.3137 13.9991 8C13.9991 4.68629 11.3128 2 7.99909 2C6.20656 2 4.59815 2.78613 3.49909 4.03138V2.5C3.49909 2.22386 3.27524 2 2.99909 2C2.72295 2 2.49909 2.22386 2.49909 2.5V5.5C2.49909 5.77614 2.72295 6 2.99909 6H3.08812C3.09498 6.00014 3.10184 6.00014 3.10868 6H5.99909C6.27524 6 6.49909 5.77614 6.49909 5.5C6.49909 5.22386 6.27524 5 5.99909 5H3.99863C4.91128 3.78495 6.36382 3 7.99909 3ZM7.99909 5.5C7.99909 5.22386 7.77524 5 7.49909 5C7.22295 5 6.99909 5.22386 6.99909 5.5V8.5C6.99909 8.77614 7.22295 9 7.49909 9H9.49909C9.77524 9 9.99909 8.77614 9.99909 8.5C9.99909 8.22386 9.77524 8 9.49909 8H7.99909V5.5Z"/></svg>: Hide/Show history suggestions (Ctrl+H)
- <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M15.022 7.25497L12.203 10.003L12.869 13.883C12.917 14.165 12.844 14.438 12.664 14.654C12.479 14.872 12.205 15.001 11.929 15.001C11.775 15.001 11.626 14.963 11.485 14.89L8.00101 13.057L4.51701 14.889C4.13401 15.093 3.62401 14.991 3.34001 14.657C3.15801 14.439 3.08501 14.165 3.13201 13.884L3.79801 10.004L0.979007 7.25597C0.714007 6.99797 0.624007 6.63297 0.737007 6.27997C0.853007 5.92497 1.14001 5.68197 1.50701 5.62797L5.40301 5.06197L7.14501 1.53197C7.47301 0.865971 8.52801 0.865971 8.85601 1.53197L10.598 5.06197L14.494 5.62797C14.862 5.68197 15.149 5.92397 15.264 6.27597C15.378 6.63197 15.286 6.99697 15.022 7.25497Z"/></svg>: Hide/Show favorite suggestions (Ctrl+F)

It is also possible to customize the execution:

- <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M5 14C4.448 14 4 13.552 4 13V3C4 2.448 4.448 2 5 2H8V4.5C8 5.328 8.672 6 9.5 6H12V6.025C12.344 6.056 12.677 6.121 13 6.213V5.414C13 5.016 12.842 4.635 12.561 4.353L9.647 1.439C9.366 1.158 8.984 1 8.586 1H5C3.895 1 3 1.895 3 3V13C3 14.105 3.895 15 5 15H7.261C7.008 14.693 6.791 14.357 6.607 14H5ZM9 2.207L11.793 5H9.5C9.224 5 9 4.776 9 4.5V2.207ZM11.5 7C9.015 7 7 9.015 7 11.5C7 13.985 9.015 16 11.5 16C13.985 16 16 13.985 16 11.5C16 9.015 13.985 7 11.5 7ZM14 12H12V14C12 14.276 11.776 14.5 11.5 14.5C11.224 14.5 11 14.276 11 14V12H9C8.724 12 8.5 11.776 8.5 11.5C8.5 11.224 8.724 11 9 11H11V9C11 8.724 11.224 8.5 11.5 8.5C11.776 8.5 12 8.724 12 9V11H14C14.276 11 14.5 11.224 14.5 11.5C14.5 11.776 14.276 12 14 12Z"/></svg>: Change target In-place/New-editor (Ctrl+N). The default value is based on the command run.
- <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M14.414 3.207L12.793 1.586C12.421 1.213 11.905 1 11.379 1H3C1.897 1 1 1.897 1 3V13C1 14.103 1.897 15 3 15H13C14.103 15 15 14.103 15 13V4.621C15 4.095 14.787 3.579 14.414 3.207ZM9 2V3.5C9 3.776 8.776 4 8.5 4H6.5C6.224 4 6 3.776 6 3.5V2H9ZM5 14V9.5C5 9.224 5.224 9 5.5 9H10.5C10.776 9 11 9.224 11 9.5V14H5ZM14 13C14 13.551 13.551 14 13 14H12V9.5C12 8.673 11.327 8 10.5 8H5.5C4.673 8 4 8.673 4 9.5V14H3C2.449 14 2 13.551 2 13V3C2 2.449 2.449 2 3 2H5V3.5C5 4.327 5.673 5 6.5 5H8.5C9.327 5 10 4.327 10 3.5V2H11.379C11.642 2 11.9 2.107 12.086 2.293L13.707 3.914C13.893 4.1 14 4.358 14 4.621V13Z"/></svg>: Save the command in history (Ctrl+S)
- <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M2 3.5C2 3.22386 2.22386 3 2.5 3H10.5C10.7761 3 11 3.22386 11 3.5C11 3.77614 10.7761 4 10.5 4H2.5C2.22386 4 2 3.77614 2 3.5ZM2 11.5C2 11.2239 2.22386 11 2.5 11H9.5C9.77614 11 10 11.2239 10 11.5C10 11.7761 9.77614 12 9.5 12H2.5C2.22386 12 2 11.7761 2 11.5ZM2.5 7C2.22386 7 2 7.22386 2 7.5C2 7.77614 2.22386 8 2.5 8H13.5C13.7761 8 14 7.77614 14 7.5C14 7.22386 13.7761 7 13.5 7H2.5Z"/></svg>: When selected process file content if no text is selected (Ctrl+G)
  
  The initial value is defined by `pipeToShell.processEntireTextIfNoneSelected`
  configuration

The checkboxes are VScode API limitations, they are meaningless and should be
ignored.

# History

The history size is controlled by `pipeToShell.historyMaxSize`. It is persistent over an IDE restart.

The history can be cleared with `PipeToShell: Clear Command History` (Command
ID: `pipeToShell.clearCommandHistory`)

# Shell configuration

You can adjust the configuration to use your preferred shell with specific args.

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

# Environment variables

By default, the env vars are inherited from the VScode process running the extension.

A few extra env vars are added by the extension:
- `file`: Absolute path to the file (if not untitled)
- `fileWorkspaceFolder`: workspace folder the file belongs (if has one)
- `relativeFile`: file path relative to fileWorkspaceFolder (if has one)

If the provided command is referencing `selectedText` then the text selection is
passed through this env var instead of stdin.

Additional custom env vars can defined in `pipeToShell.shell.env` setting:

```json
{
    "PATH": "/some/path"
}
```

# Working directory

The current directory for shell commands can be customized with
`pipeToShell.currentDirectoryKind` (default: `"currentFile"`).

1. `currentFile`: If the target directory is not available, HOME directory will
   be used.
2. `workspaceRoot`: The workspace root where the file belongs. If none, the root
   of the first folder in the workspace. If not available, the home directory.

# Favorite commands

List of commands that are always shown in the suggestions and that may also be
used with keyboard shortcuts. 

You can define them in the configuration `pipeToShell.favoriteCommands`. Each
element must have an ID and command. An additional nice name can be added.

```json
"pipeToShell.favoriteCommands": [
    {
        "id": "extract-email-and-sort-on-address-book",
        "command": "cut -d, -f3 | sort"
    },
    {
        "id": "insert-melbourne-time",
        "command": "TZ=Australia/Melbourne date '+%Y-%m-%dT%H:%M:%S'",
        "name": "Insert Melbourne Time"
    },
    ...
]
```

# Keyboard Shortcuts

**Open prompt**

You can quickly open a command input box by registering the extension command to your keyboard shortcut settings. For example:

```json
{
    "key": "ctrl+r ctrl+r", 
    "command": "pipeToShell.runCommandInPlace",
    "when": "editorTextFocus && !editorReadonly"
}
```

**Run a specific command**

By using `pipeToShell.quickCommand`:

```json
{
    "key": "ctrl+shift+;",
    "command": "pipeToShell.quickCommand",
    "when": "editorTextFocus",
    "args": "beautify_json"
}
```

If the `args` is a favourite command id, then the related command is run else the provided command is run:

```json
{
    "key": "ctrl+shift+;",
    "command": "pipeToShell.quickCommand",
    "when": "editorTextFocus",
    "args": "jq -c"
}
```

It is also possible to customize the execution:

```json
{
    "key": "ctrl+shift+[",
    "command": "pipeToShell.quickCommand",
    "when": "editorTextFocus",
    "args": {
        "command": "jq -c",
        "shouldOpenNewEditor": false,
        "shouldSaveCommand": true,
        "shouldProcessEntireText": true,
    }
}
```

`command` is required and behaves as `args` when a string. All the other
parameters are optional. The default values are the ones listed above except
`shouldProcessEntireText` that is defined by the extension setting.

# Audit & Debug

There is a `Pipe to Shell` channel in the `Output`.

The following elements can be configured to be logged (locally) on success
`pipeToShell.logging.success.XXX` and/or failure
`pipeToShell.logging.failure.XXX` in the settings:

- Command: Always `true` by default
- Stdin: Always `false` by default
- Stdout: Only in failure by default
- Stderr: Only in failure by default
- Env vars: Always `false` by default
- Cwd: Only in failure by default

The datetime of the execution is also logged.

# Changelog

https://github.com/morikko/vscode-pipe-to-shell/blob/master/CHANGELOG.md

# Request Features or Report Bugs

Feature requests and bug reports are welcome: https://github.com/morikko/vscode-pipe-to-shell/issues

* **Reporting a bug:** Please include as much environment information (OS
  name/version, the editor version) and steps on how to reproduce it.

* **Requesting a feature:** Please try to provide the context of why you want
  the feature. I am not encline to complicate the extension for little benefit
  or obscur use cases.

# Credit

This extension is a fork from [Edit with Shell Command extension](https://github.com/ryu1kn/vscode-edit-with-shell) and greatly inspired by [Filter Text extension](https://github.com/yhirose/vscode-filtertext).
