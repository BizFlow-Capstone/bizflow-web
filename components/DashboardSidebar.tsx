"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  Heart,
  MapPin,
  Users,
  BarChart3,
  UserCircle,
  Settings,
  LogOut,
  PackagePlus,
  Package,
} from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export default function DashboardSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/dashboard", label: "Trang Chủ", icon: Home },
    { href: "/dashboard/orders", label: "Đơn Hàng", icon: ShoppingCart },
    { href: "/dashboard/imports", label: "Nhập Kho", icon: PackagePlus },
    { href: "/dashboard/products", label: "Sản Phẩm", icon: Package },
    {
      href: "/dashboard/customers",
      label: "Khách Hàng Thân Thiết",
      icon: Heart,
    },
    {
      href: "/dashboard/locations",
      label: "Địa Điểm Kinh Doanh",
      icon: MapPin,
    },
    { href: "/dashboard/employees", label: "Nhân Viên", icon: Users },
    {
      href: "/dashboard/reports",
      label: "Báo Cáo & Thống kê",
      icon: BarChart3,
    },
  ];

  const bottomMenuItems = [
    { href: "/dashboard/profile", label: "Tài Khoản", icon: UserCircle },
    { href: "/dashboard/settings", label: "Cài Đặt", icon: Settings },
    { href: "/auth/logout", label: "Đăng Xuất", icon: LogOut },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen flex flex-col">
      <div className="p-6 ">
        <Link href="/dashboard" className="flex items-center gap-3">
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
            const isActive = pathname === item.href;
            const Icon = item.icon;
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
        <ul className="space-y-1">
          {bottomMenuItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-gray-100 text-gray-900"
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
