import type { ReactNode, SVGProps } from "react";

type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function createIcon(paths: ReactNode) {
  return function Icon(props: IconProps) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="20"
        height="20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {paths}
      </svg>
    );
  };
}

export const SunIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </>,
);

export const MoonIcon = createIcon(
  <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />,
);

export const MonitorIcon = createIcon(
  <>
    <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
    <path d="M9 20h6M12 15.5V20" />
  </>,
);

export const HomeIcon = createIcon(
  <>
    <path d="m4 11 8-7 8 7" />
    <path d="M6 10v9h4v-5h4v5h4v-9" />
  </>,
);

export const FolderIcon = createIcon(
  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
);

export const SearchIcon = createIcon(
  <>
    <circle cx="11" cy="11" r="6" />
    <path d="m20 20-4-4" />
  </>,
);

export const LibraryIcon = createIcon(
  <>
    <path d="M5 4v16M10 4v16" />
    <path d="m14.5 5.5 4.2-1.1 3 14.6-4.2 1.1Z" />
  </>,
);

export const ChangesIcon = createIcon(
  <>
    <path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5" />
    <path d="M20 4v4.5h-4.5" />
    <path d="M20 12a8 8 0 0 1-13.7 5.6L4 15.5" />
    <path d="M4 20v-4.5h4.5" />
  </>,
);

export const CompareIcon = createIcon(
  <>
    <path d="M7 4v16M17 4v16" />
    <path d="m4 7 3-3 3 3M14 17l3 3 3-3" />
  </>,
);

export const PlusIcon = createIcon(<path d="M12 5v14M5 12h14" />);

export const MenuIcon = createIcon(<path d="M4 7h16M4 12h16M4 17h16" />);

export const CloseIcon = createIcon(<path d="m6 6 12 12M18 6 6 18" />);

export const PanelLeftIcon = createIcon(
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M9.5 4.5v15" />
  </>,
);

export const PanelRightIcon = createIcon(
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
    <path d="M14.5 4.5v15" />
  </>,
);

export const UserIcon = createIcon(
  <>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </>,
);

export const ExternalLinkIcon = createIcon(
  <>
    <path d="M14 4h6v6" />
    <path d="M20 4 11 13" />
    <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
  </>,
);

export const ArrowUpIcon = createIcon(<path d="M12 19V5M6 11l6-6 6 6" />);

export const NewsIcon = createIcon(
  <>
    <path d="M5 5h11v14H7a2 2 0 0 1-2-2V5Z" />
    <path d="M16 9h3v8a2 2 0 0 1-2 2" />
    <path d="M8 9h5M8 13h5" />
  </>,
);

export const ChevronDownIcon = createIcon(<path d="m6 9 6 6 6-6" />);

export const CheckIcon = createIcon(<path d="m5 12.5 4.5 4.5L19 7.5" />);

export const CopyIcon = createIcon(
  <>
    <rect x="8.5" y="8.5" width="11" height="11" rx="2" />
    <path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" />
  </>,
);

export const MailIcon = createIcon(
  <>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
    <path d="m4 7 8 6 8-6" />
  </>,
);

export const PhoneIcon = createIcon(
  <path d="M6.5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2Z" />,
);

export const MoreIcon = createIcon(
  <>
    <circle cx="5" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="19" cy="12" r="1" />
  </>,
);

export const TrashIcon = createIcon(
  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />,
);

export const PencilIcon = createIcon(
  <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />,
);

export const DownloadIcon = createIcon(
  <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />,
);

export const UploadIcon = createIcon(<path d="M12 16V5M7 9l5-5 5 5M5 20h14" />);

export const ShareIcon = createIcon(
  <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />,
);

export const BookmarkIcon = createIcon(
  <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1Z" />,
);

export const SettingsIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </>,
);

export const HelpIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01" />
  </>,
);

export const InfoIcon = createIcon(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
);

export const CopyPlusIcon = createIcon(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h8M14.5 12.5v5M12 15h5" />
  </>,
);

export const RefreshIcon = createIcon(
  <path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4" />,
);
