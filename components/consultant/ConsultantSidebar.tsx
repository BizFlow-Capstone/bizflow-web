"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeftRight, Bell, BookOpen, LogOut } from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

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
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6">
        <Link
          href="/consultant"
          prefetch={false}
          className="flex items-center gap-3"
        >
          <div className="w-100 h-25  rounded-lg flex items-center justify-center">
            <Image
              src="/pictures/logo.png"
              alt="BizFlow Logo"
              width={100}
              height={80}
            />
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-cyan-50 text-[#23C4C1]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4">
        <Separator className="mb-4" />
        <Link
          href="/dashboard"
          prefetch={false}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border border-dashed border-gray-200"
        >
          <ArrowLeftRight className="w-5 h-5 text-gray-400" />
          <span>Xem Dashboard Người Dùng</span>
        </Link>
      </div>

      <div className="p-4">
        <Separator className="mb-4" />
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-cyan-50 text-[#23C4C1]"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
