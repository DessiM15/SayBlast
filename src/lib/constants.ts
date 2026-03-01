export const APP_NAME = "SayBlast";

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Campaigns", href: "/campaigns", icon: "Megaphone" },
  { label: "Audiences", href: "/audiences", icon: "Users" },
  { label: "Templates", href: "/templates", icon: "FileText" },
  { label: "Settings", href: "/settings", icon: "Settings" },
] as const;

export const EMAIL_PROVIDERS = {
  gmail: { label: "Gmail", color: "#EA4335" },
  outlook: { label: "Outlook", color: "#0078D4" },
  smtp: { label: "SMTP", color: "#6B7280" },
} as const;

export const ANTI_SPAM_COOLDOWN_HOURS = 72;
