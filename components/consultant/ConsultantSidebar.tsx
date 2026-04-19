"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BookOpen, LogOut } from "lucide-react";

const menuItems = [
  {
    href: "/consultant/accounting",
    label: "Quản Lý Mẫu Sổ",
    icon: BookOpen,
  },
  {
    href: "/consultant/notifications",
    label: "Quản Lý Thông Báo",
    icon: Bell,
  },
];

const bottomMenuItems = [
  {
    href: "/auth/logout",
    label: "Đăng Xuất",
    icon: LogOut,
  },
];

export default function ConsultantSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex min-h-full w-60 shrink-0 flex-col border-r border-gray-200 bg-white">
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Consultant Panel
        </h2>
        <p className="mt-1 text-sm font-semibold text-gray-900">
          BizFlow Consultant
        </p>
      </div>

      <nav className="flex-1 px-3 pb-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-linear-to-r from-teal-50 to-cyan-50 text-teal-700 shadow-sm"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 ${isActive ? "text-teal-600" : "text-gray-400"}`}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-100 px-3 py-4">
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition-all duration-150 hover:bg-gray-50 hover:text-gray-900"
                >
                  <Icon className="h-4.5 w-4.5 text-gray-400" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
