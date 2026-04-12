import { EXTENSION_NAME } from "./const";
import { Workspace } from "./adapters/workspace";
import { ObjectMap } from "./types";

const OS_KIND = {
  darwin: "osx",
  linux: "linux",
  win32: "windows",
} as ObjectMap<string>;
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
    return this.workspaceAdapter.getConfig<string>(
      `${EXTENSION_NAME}.shell.${this.osKind}`,
    );
  }

  shellArgs(): string[] {
    return this.workspaceAdapter.getConfig<string[]>(
      `${EXTENSION_NAME}.shellArgs.${this.osKind}`,
    );
  }

  private get osKind() {
    return resolveOsKind(this.platform);
  }
}
