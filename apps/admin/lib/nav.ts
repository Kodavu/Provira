// Navigation is data, keyed by permission. The sidebar renders only the items
// whose permission the admin holds — the SAME permission set the API enforces.
export interface NavItem {
  label: string;
  href: string;
  icon: string;
  permission?: string; // undefined = always visible
}

export const NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "home" },
  { label: "Users", href: "/users", icon: "users", permission: "users:view" },
  { label: "Disputes", href: "/disputes", icon: "flag", permission: "disputes:view" },
  { label: "Notifications", href: "/notifications", icon: "bell", permission: "notifications:manage" },
  { label: "Staff", href: "/staff", icon: "id", permission: "admin_users:edit" },
  { label: "Roles & Access", href: "/roles", icon: "key", permission: "settings:view" },
  { label: "Audit Logs", href: "/audit", icon: "list", permission: "settings:view" },
];

export function visibleNav(permissions: string[]): NavItem[] {
  const set = new Set(permissions);
  return NAV.filter((n) => !n.permission || set.has(n.permission));
}
