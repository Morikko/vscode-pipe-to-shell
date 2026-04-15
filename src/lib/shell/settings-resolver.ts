import { Workspace } from "../adapters/workspace";

const OS_KIND = {
  darwin: "osx",
  linux: "linux",
  win32: "windows",
} as { [p: string]: string };
const DEFAULT_OS_KIND = OS_KIND.linux;

function resolveOsKind(platform: string) {
  return OS_KIND[platform] || DEFAULT_OS_KIND;
}

export class ShellSettingsResolver {
  constructor(
    private readonly workspaceAdapter: Workspace,
    private readonly platform: string,
  ) {}

  shellProgramme(): string {
    return this.workspaceAdapter.getConfig<string>(this.osKind, "shell");
  }

  shellArgs(): string[] {
    return this.workspaceAdapter.getConfig<string[]>(this.osKind, "shellArgs");
  }

  private get osKind() {
    return resolveOsKind(this.platform);
  }
}
