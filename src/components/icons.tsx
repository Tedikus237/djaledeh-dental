import type { ReactNode, SVGProps } from "react";

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, "color"> {
  size?: number;
  color?: string;
  className?: string;
}

const make = (paths: ReactNode) =>
  function Icon({ size = 24, color = "currentColor", className, ...rest }: IconProps) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" stroke={color} fill="none" strokeWidth={2}
        strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" {...rest}>
        {paths}
      </svg>
    );
  };

export const IconTooth = make(<path d="M12 3c-1.7 0-2.8 1-4 1-1.9 0-3.5 1.6-3.5 4 0 1.6.4 2.7.8 4.2.4 1.5.7 3.3 1.1 5.1.3 1.4.8 2.7 1.9 2.7.9 0 1-2.1 1.2-3.4.2-1.1.6-2 1.5-2s1.3.9 1.5 2c.2 1.3.3 3.4 1.2 3.4 1.1 0 1.6-1.3 1.9-2.7.4-1.8.7-3.6 1.1-5.1.4-1.5.8-2.6.8-4.2 0-2.4-1.6-4-3.5-4-1.2 0-2.3-1-4-1Z" />);
export const IconUser = make(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>);
export const IconUsers = make(<><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.3c1.4.4 2.5 1.7 2.5 3.2 0 1.5-1 2.8-2.4 3.2M18 14c2.6.5 4.5 2.5 4.5 5.5" /></>);
export const IconCalendar = make(<><rect x="3.5" y="5" width="17" height="16" rx="2" /><path d="M8 3v4M16 3v4M3.5 10h17" /></>);
export const IconClock = make(<><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>);
export const IconPhone = make(<path d="M5 4h3.2l1.3 4.4-2 1.6a13.5 13.5 0 0 0 6.5 6.5l1.6-2 4.4 1.3V19a2 2 0 0 1-2.1 2C10.6 20.5 3.5 13.4 3 6.1 2.9 5 3.9 4 5 4Z" />);
export const IconSearch = make(<><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>);
export const IconPlus = make(<path d="M12 5v14M5 12h14" />);
export const IconEdit = make(<><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /><path d="M14 6l4 4" /></>);
export const IconTrash = make(<><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" /><path d="M10 11v6M14 11v6" /></>);
export const IconCheck = make(<path d="m5 12 5 5L19 7" />);
export const IconX = make(<path d="M6 6l12 12M18 6 6 18" />);
export const IconAlert = make(<><path d="M12 3.5 21.5 20h-19L12 3.5Z" /><path d="M12 10v4M12 17.2h.01" /></>);
export const IconBell = make(<><path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" /><path d="M10 19a2 2 0 0 0 4 0" /></>);
export const IconFile = make(<><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" /><path d="M14 3v5h5" /></>);
export const IconMoney = make(<><rect x="2.5" y="6" width="19" height="12" rx="2" /><circle cx="12" cy="12" r="3" /><path d="M6 10v.01M18 14v.01" /></>);
export const IconChart = make(<><path d="M4 20V10M11 20V4M18 20v-7" /><path d="M2.5 20h19" /></>);
export const IconLogout = make(<><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /><path d="M16 17l5-5-5-5M21 12H9" /></>);
export const IconMenu = make(<path d="M4 7h16M4 12h16M4 17h16" />);
export const IconChevronLeft = make(<path d="M15 6l-6 6 6 6" />);
export const IconChevronRight = make(<path d="M9 6l6 6-6 6" />);
export const IconWhatsApp = make(<><path d="M7 17.5 3.8 19l1.2-3.2A8 8 0 1 1 7 17.5Z" /><path d="M9 9.3c0 3 2.7 5.7 5.7 5.7.5 0 1-.5 1-1.2 0-.3-.1-.5-.3-.6l-1.7-1a.6.6 0 0 0-.7.1l-.5.5a5 5 0 0 1-2.3-2.3l.5-.5a.6.6 0 0 0 .1-.7l-1-1.7a.7.7 0 0 0-.6-.3c-.7 0-1.2.5-1.2 1Z" /></>);
export const IconPrint = make(<><path d="M7 8V3h10v5" /><rect x="3.5" y="8" width="17" height="8" rx="1.5" /><path d="M7 15h10v6H7z" /></>);
export const IconSettings = make(<><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V20a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H4a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3H10a1.7 1.7 0 0 0 1-1.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H20a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></>);
export const IconStethoscope = make(<><path d="M5 3v6a4 4 0 0 0 8 0V3" /><path d="M9 13v2a5 5 0 0 0 10 0v-2.5" /><circle cx="19" cy="9.5" r="1.8" /></>);
export const IconClipboard = make(<><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1M8.5 11h7M8.5 15h7" /></>);
export const IconDownload = make(<><path d="M12 4v11m0 0-4-4m4 4 4-4" /><path d="M4 19h16" /></>);
export const IconRefresh = make(<><path d="M4 12a8 8 0 0 1 13.7-5.7L20 8M20 4v4h-4" /><path d="M20 12a8 8 0 0 1-13.7 5.7L4 16M4 20v-4h4" /></>);
export const IconFilter = make(<path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />);
export const IconEye = make(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="3" /></>);
export const IconSave = make(<><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M8 4v5h7V4M8 14h8v6H8z" /></>);
export const IconHome = make(<><path d="M4 11.5 12 4l8 7.5" /><path d="M6 10v9a1 1 0 0 0 1 1h3v-6h4v6h3a1 1 0 0 0 1-1v-9" /></>);
export const IconArrowLeft = make(<path d="M19 12H5M11 6l-6 6 6 6" />);
export const IconArrowRight = make(<path d="M5 12h14M13 6l6 6-6 6" />);