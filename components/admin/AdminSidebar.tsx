"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bell,
  Users,
  CreditCard,
  BookOpen,
  ArrowLeftRight,
} from "lucide-react";

const adminMenuItems = [
  {
    href: "/admin",
    label: "Tổng Quan",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/accounts",
    label: "Quản Lý Người Dùng",
    icon: Users,
  },
  {
    href: "/admin/notifications",
    label: "Quản Lý Thông Báo",
    icon: Bell,
  },
  {
    href: "/admin/accounting",
    label: "Quản Lý Kế Toán",
    icon: BookOpen,
  },
  {
    href: "/admin/subscriptions",
    label: "Gói Đăng Ký",
    icon: CreditCard,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 border-r border-gray-200 bg-white min-h-full flex flex-col shrink-0">
      {/* Back to dashboard */}
      {/* <div className="p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>board</span>
        </Link>
      </div> */}

      {/* <Separator /> */}

      {/* Brand */}
      <div className="px-4 pt-4 pb-2">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Admin Panel
        </h2>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 pb-4">
        <ul className="space-y-1">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[#23C4C1]/10 text-[#23C4C1] shadow-sm border-l-4 border-[#23C4C1] pl-2"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon
                    className={`h-4.5 w-4.5 ${isActive ? "text-[#23C4C1]" : "text-gray-400"}`}
                  />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Switch to user dashboard */}
      <div className="px-3 pb-4">
        <Link
          href="/dashboard"
          prefetch={false}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-all duration-150 border border-dashed border-gray-200"
        >
          <ArrowLeftRight className="h-4 w-4 text-gray-400" />
          Xem Dashboard Người Dùng
        </Link>
      </div>
    </aside>
  );
}
