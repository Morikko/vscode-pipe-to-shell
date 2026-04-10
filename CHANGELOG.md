# Change Log

All notable changes to "Edit with Shell Command" extension will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Open the command output in a new editor

### Changed
- The `cwd` of the execute shell command in `WORKSPACE_ROOT` mode is now first
  the workspace root where the file belongs. If none, the root of the first
  folder in the workspace. And finally, the home directory.
- The dependencies have been updated
- Development
  - Migrate from TSlint to ESlint
  - Add prettier
  - Use new vscode development setup
- This extension is based on edit-with-shell v1.3.0

### Removed
- `Quick CommandX` have been removed
- 
