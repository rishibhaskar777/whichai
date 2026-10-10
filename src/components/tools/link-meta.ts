import type { ComponentType, SVGProps } from "react";
import {
  BoxIcon,
  CodeIcon,
  GlobeIcon,
  LaptopIcon,
  PuzzleIcon,
  SmartphoneIcon,
  TabletIcon,
  TerminalIcon,
  WindowsIcon,
} from "@/components/icons";
import type { MessageKey } from "@/lib/i18n/en";
import type { VisitorBrowser, VisitorSystem } from "@/lib/platform";
import type { GetItLinkKey, Platform } from "@/lib/schemas/catalogue";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface LinkMeta {
  Icon: Icon;
  label: MessageKey;
}

export const LINK_META: Record<GetItLinkKey, LinkMeta> = {
  web: { Icon: GlobeIcon, label: "getIt.link.web" },
  windows: { Icon: WindowsIcon, label: "getIt.link.windows" },
  macos: { Icon: LaptopIcon, label: "getIt.link.macos" },
  linux: { Icon: TerminalIcon, label: "getIt.link.linux" },
  android: { Icon: SmartphoneIcon, label: "getIt.link.android" },
  ios: { Icon: TabletIcon, label: "getIt.link.ios" },
  chromeExtension: { Icon: PuzzleIcon, label: "getIt.link.chromeExtension" },
  firefoxAddon: { Icon: PuzzleIcon, label: "getIt.link.firefoxAddon" },
  edgeAddon: { Icon: PuzzleIcon, label: "getIt.link.edgeAddon" },
  vscodeExtension: { Icon: CodeIcon, label: "getIt.link.vscodeExtension" },
  jetbrainsPlugin: { Icon: CodeIcon, label: "getIt.link.jetbrainsPlugin" },
  modelPage: { Icon: BoxIcon, label: "getIt.link.modelPage" },
};

/** The order buttons appear in when the visitor's system is not known. */
export const LINK_ORDER: readonly GetItLinkKey[] = [
  "web",
  "windows",
  "macos",
  "linux",
  "android",
  "ios",
  "chromeExtension",
  "firefoxAddon",
  "edgeAddon",
  "vscodeExtension",
  "jetbrainsPlugin",
  "modelPage",
];

const BROWSER_LINK: Record<VisitorBrowser, GetItLinkKey> = {
  chrome: "chromeExtension",
  firefox: "firefoxAddon",
  edge: "edgeAddon",
};

/** Link keys that suit this visitor best, most specific first. */
export function currentLinkKeys(
  system: VisitorSystem | null,
  browser: VisitorBrowser | null,
): GetItLinkKey[] {
  const keys: GetItLinkKey[] = [];
  if (system) keys.push(system);
  if (browser) keys.push(BROWSER_LINK[browser]);
  return keys;
}

export const PLATFORM_META: Record<Platform, LinkMeta> = {
  web: { Icon: GlobeIcon, label: "platform.web" },
  windows: { Icon: WindowsIcon, label: "platform.windows" },
  macos: { Icon: LaptopIcon, label: "platform.macos" },
  linux: { Icon: TerminalIcon, label: "platform.linux" },
  android: { Icon: SmartphoneIcon, label: "platform.android" },
  ios: { Icon: TabletIcon, label: "platform.ios" },
  "command-line": { Icon: TerminalIcon, label: "platform.command-line" },
  code: { Icon: CodeIcon, label: "platform.code" },
};
