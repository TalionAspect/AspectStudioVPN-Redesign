import type { CSSProperties } from "react";

type IconProps = { size?: number; className?: string; style?: CSSProperties };

const base = (size: number, className?: string, style?: CSSProperties) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  style,
});

export const ShieldIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 3l7 3v5c0 4.4-3 8.4-7 10-4-1.6-7-5.6-7-10V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
);

export const PowerIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 4v8" />
    <path d="M7 6.5a7 7 0 1 0 10 0" />
  </svg>
);

export const FileIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5z" />
    <path d="M14 3v5h5" />
  </svg>
);

export const ActivityIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M3 12h4l3 8 4-16 3 8h4" />
  </svg>
);

export const SettingsIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

export const KeyIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <circle cx="8" cy="15" r="4" />
    <path d="M11 12l9-9" />
    <path d="M16 7l3 3" />
    <path d="M19 4l2 2" />
  </svg>
);

export const UploadIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 16V4" />
    <path d="M7 9l5-5 5 5" />
    <path d="M5 20h14" />
  </svg>
);

export const CheckIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);

export const XIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const MinusIcon = ({ size = 16, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M5 12h14" />
  </svg>
);

export const SquareIcon = ({ size = 14, className, style }: IconProps) => (
  <svg {...base(size, className, style)} strokeWidth={1.6}>
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
  </svg>
);

export const ArrowDownIcon = ({ size = 16, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 4v12" />
    <path d="M7 11l5 5 5-5" />
  </svg>
);

export const ArrowUpIcon = ({ size = 16, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 20V8" />
    <path d="M7 13l5-5 5 5" />
  </svg>
);

export const LockIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);

export const CpuIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
    <path d="M9 9h6v6H9z" />
    <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
  </svg>
);

export const ClockIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const GaugeIcon = ({ size = 20, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M12 14l4-4" />
    <path d="M4 18a8 8 0 1 1 16 0" />
    <circle cx="12" cy="14" r="1.5" fill="currentColor" stroke="none" />
  </svg>
);

export const TrashIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

export const RefreshIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M21 12a9 9 0 1 1-3-6.7" />
    <path d="M21 4v5h-5" />
  </svg>
);

export const UserIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20a8 8 0 0 1 16 0" />
  </svg>
);

export const SignalIcon = ({ size = 18, className, style }: IconProps) => (
  <svg {...base(size, className, style)}>
    <path d="M5 20v-4M10 20v-8M15 20v-12M20 20V4" />
  </svg>
);