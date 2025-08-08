import {
  LayoutDashboard,
  CalendarDays,
  User,
  Settings,
  FileText,
  MessageSquare,
  Wallet,
  Pill,
  Users,
} from "lucide-react";

export const sidebarNavItems = [
  { href: "/admin", label: "داشبورد", icon: LayoutDashboard },
  { href: "/admin/appointments", label: "نوبت‌ها", icon: CalendarDays },
  { href: "/admin/messages", label: "پیام‌ها", icon: MessageSquare },
  { href: "/admin/accounting", label: "حسابداری", icon: Wallet },
  { href: "/admin/staff-management", label: "مدیریت کارکنان", icon: Users },
  { href: "/admin/medicine-inventory", label: "انبار دارو", icon: Pill },
  { href: "/admin/profile", label: "پروفایل", icon: User },
  { href: "/admin/cms", label: "CMS", icon: FileText },
  { href: "/admin/settings", label: "تنظیمات", icon: Settings },
];
