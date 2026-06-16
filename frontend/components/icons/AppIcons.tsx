import type { SVGProps } from 'react';

export type IconName =
  | 'activity'
  | 'alert'
  | 'archive'
  | 'arrowDown'
  | 'arrowUp'
  | 'audit'
  | 'box'
  | 'chart'
  | 'chevronLeft'
  | 'chevronRight'
  | 'clock'
  | 'dashboard'
  | 'empty'
  | 'eye'
  | 'eyeOff'
  | 'filter'
  | 'key'
  | 'lock'
  | 'logout'
  | 'package'
  | 'plus'
  | 'reports'
  | 'search'
  | 'shield'
  | 'sparkles'
  | 'stock'
  | 'truck';

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

export default function Icon({ name, size = 20, className = '', ...props }: Props) {
  const iconProps: SVGProps<SVGSVGElement> = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    focusable: 'false',
    'aria-hidden': true,
    className: `icon ${className}`.trim(),
    ...props,
  };

  switch (name) {
    case 'activity':
      return (
        <svg {...iconProps}>
          <path d="M3 12h4l2.2-6 4 12 2.3-6H21" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...iconProps}>
          <path d="M12 3 2.8 19a1.8 1.8 0 0 0 1.6 2.7h15.2a1.8 1.8 0 0 0 1.6-2.7L12 3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      );
    case 'archive':
      return (
        <svg {...iconProps}>
          <path d="M4 7h16" />
          <path d="M5 7v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M9 12h6" />
        </svg>
      );
    case 'arrowDown':
      return (
        <svg {...iconProps}>
          <path d="M12 5v14" />
          <path d="m18 13-6 6-6-6" />
        </svg>
      );
    case 'arrowUp':
      return (
        <svg {...iconProps}>
          <path d="M12 19V5" />
          <path d="m6 11 6-6 6 6" />
        </svg>
      );
    case 'audit':
      return (
        <svg {...iconProps}>
          <path d="M8 3h8l3 3v15H5V3h3Z" />
          <path d="M15 3v4h4" />
          <path d="M8.5 12h7" />
          <path d="M8.5 16h4" />
        </svg>
      );
    case 'box':
      return (
        <svg {...iconProps}>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="m4.4 7.7 7.6 4.2 7.6-4.2" />
          <path d="M12 12v9" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...iconProps}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 16v-5" />
          <path d="M12 16V8" />
          <path d="M16 16v-3" />
        </svg>
      );
    case 'chevronLeft':
      return (
        <svg {...iconProps}>
          <path d="m15 18-6-6 6-6" />
        </svg>
      );
    case 'chevronRight':
      return (
        <svg {...iconProps}>
          <path d="m9 18 6-6-6-6" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg {...iconProps}>
          <path d="M4 13h7V4H4v9Z" />
          <path d="M13 20h7V4h-7v16Z" />
          <path d="M4 20h7v-5H4v5Z" />
        </svg>
      );
    case 'empty':
      return (
        <svg {...iconProps}>
          <path d="m4 8 8-4 8 4-8 4-8-4Z" />
          <path d="M4 8v8l8 4 8-4V8" />
          <path d="M12 12v8" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...iconProps}>
          <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
          <circle cx="12" cy="12" r="2.7" />
        </svg>
      );
    case 'eyeOff':
      return (
        <svg {...iconProps}>
          <path d="m3 3 18 18" />
          <path d="M9.9 5.3A9.5 9.5 0 0 1 12 5c6 0 9.5 7 9.5 7a17 17 0 0 1-2.2 3.1" />
          <path d="M6.6 6.7C3.9 8.5 2.5 12 2.5 12s3.5 7 9.5 7a9.7 9.7 0 0 0 4.8-1.3" />
          <path d="M10.6 10.6a2.7 2.7 0 0 0 3.8 3.8" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...iconProps}>
          <path d="M4 6h16" />
          <path d="M7 12h10" />
          <path d="M10 18h4" />
        </svg>
      );
    case 'key':
      return (
        <svg {...iconProps}>
          <circle cx="8" cy="15" r="3.5" />
          <path d="m10.5 12.5 8-8" />
          <path d="M15 8h4v4" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...iconProps}>
          <rect x="5" y="10" width="14" height="10" rx="2.2" />
          <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...iconProps}>
          <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10" />
          <path d="M14 16l4-4-4-4" />
          <path d="M18 12H9" />
        </svg>
      );
    case 'package':
      return (
        <svg {...iconProps}>
          <path d="M12 3 4 7.5v9L12 21l8-4.5v-9L12 3Z" />
          <path d="m7.5 5.6 8.9 5" />
          <path d="m4.4 7.8 7.6 4.3 7.6-4.3" />
          <path d="M12 12.1V21" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...iconProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...iconProps}>
          <path d="M5 20V4h14v16H5Z" />
          <path d="M8.5 14.5 11 12l2 1.8 3-4.2" />
          <path d="M8 17h8" />
        </svg>
      );
    case 'search':
      return (
        <svg {...iconProps}>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...iconProps}>
          <path d="M12 3 5 6v5.5c0 4.3 2.8 7.8 7 9.5 4.2-1.7 7-5.2 7-9.5V6l-7-3Z" />
          <path d="m9.2 12.1 1.9 1.9 3.8-4" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...iconProps}>
          <path d="M12 3l1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4L12 3Z" />
          <path d="M5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z" />
          <path d="M18.5 14l.7 2 1.8.7-1.8.6-.7 1.9-.6-1.9-1.9-.6 1.9-.7.6-2Z" />
        </svg>
      );
    case 'stock':
      return (
        <svg {...iconProps}>
          <path d="M7 4v13" />
          <path d="m3.5 13.5 3.5 3.5 3.5-3.5" />
          <path d="M17 20V7" />
          <path d="m13.5 10.5 3.5-3.5 3.5 3.5" />
        </svg>
      );
    case 'truck':
      return (
        <svg {...iconProps}>
          <path d="M3 6h11v9H3V6Z" />
          <path d="M14 9h3.4l3.1 3.2V15H14V9Z" />
          <circle cx="7" cy="17" r="2" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      );
    default:
      return null;
  }
}
