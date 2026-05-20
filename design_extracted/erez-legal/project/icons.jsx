// Simple stroke icons — Lucide-style, 24x24, currentColor stroke
const Icon = ({ d, size = 16, fill = "none", stroke = "currentColor", strokeWidth = 1.7, children, ...rest }) => (
  <svg className="icon" viewBox="0 0 24 24" width={size} height={size} fill={fill} stroke={stroke}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {d ? <path d={d} /> : children}
  </svg>
);

const IcDashboard   = (p) => <Icon {...p}><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></Icon>;
const IcTasks       = (p) => <Icon {...p}><path d="M3 5h13M3 12h13M3 19h13"/><path d="M19 5l1.5 1.5L23 4M19 12l1.5 1.5L23 11M19 19l1.5 1.5L23 18"/></Icon>;
const IcReports     = (p) => <Icon {...p}><path d="M3 21h18M5 21V9m4 12V5m4 16v-9m4 9V11m4 10v-6"/></Icon>;
const IcUsers       = (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7"/><path d="M21 20c0-2.5-1.5-4.5-4-5.5"/></Icon>;
const IcSettings    = (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>;
const IcLogout      = (p) => <Icon {...p}><path d="M14 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2v-2M9 12h12m0 0l-3-3m3 3l-3 3"/></Icon>;
const IcSearch      = (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>;
const IcPlus        = (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>;
const IcFilter      = (p) => <Icon {...p}><path d="M3 5h18l-7 9v6l-4-2v-4z"/></Icon>;
const IcSun         = (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>;
const IcMoon        = (p) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Icon>;
const IcChevron     = (p) => <Icon {...p}><path d="M9 6l-6 6 6 6"/></Icon>;
const IcChevronDown = (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>;
const IcBriefcase   = (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18"/></Icon>;
const IcClock       = (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>;
const IcAlert       = (p) => <Icon {...p}><path d="M12 9v4M12 17h.01M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/></Icon>;
const IcAward       = (p) => <Icon {...p}><circle cx="12" cy="8" r="6"/><path d="M8.21 13.89L7 22l5-3 5 3-1.21-8.11"/></Icon>;
const IcEdit        = (p) => <Icon {...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Icon>;
const IcMore        = (p) => <Icon {...p}><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></Icon>;
const IcArchive     = (p) => <Icon {...p}><rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/></Icon>;
const IcCheck       = (p) => <Icon {...p}><path d="M20 6L9 17l-5-5"/></Icon>;
const IcMail        = (p) => <Icon {...p}><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 7 10-7"/></Icon>;
const IcLock        = (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>;
const IcCalendar    = (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></Icon>;
const IcDownload    = (p) => <Icon {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></Icon>;

Object.assign(window, {
  Icon, IcDashboard, IcTasks, IcReports, IcUsers, IcSettings, IcLogout,
  IcSearch, IcPlus, IcFilter, IcSun, IcMoon, IcChevron, IcChevronDown,
  IcBriefcase, IcClock, IcAlert, IcAward, IcEdit, IcMore, IcArchive,
  IcCheck, IcMail, IcLock, IcCalendar, IcDownload,
});
