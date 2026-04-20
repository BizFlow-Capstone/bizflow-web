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
  Zap,
  ArrowLeftRight,
} from "lucide-react";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";
import { useLocationRole } from "@/hooks/useLocationRole";
import { useEffect, useState } from "react";
import { getValidAccessToken, getRoleFromToken } from "@/lib/auth/tokenManager";

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { isOwner } = useLocationRole();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    getValidAccessToken()
      .then((token) => {
        setIsAdmin(getRoleFromToken(token) === "admin");
      })
      .catch(() => {});
  }, []);

  // Items visible to ALL users (owner + employee)
  const sharedMenuItems = [
    { href: "/dashboard", label: "Trang Chủ", icon: Home },
    { href: "/dashboard/orders", label: "Đơn Hàng", icon: ShoppingCart },
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
  ];

  // Items visible to OWNER only
  const ownerMenuItems = [
    { href: "/dashboard/imports", label: "Nhập Kho", icon: PackagePlus },
    { href: "/dashboard/employees", label: "Nhân Viên", icon: Users },
    {
      href: "/dashboard/reports",
      label: "Báo Cáo & Thống Kê",
      icon: BarChart3,
    },
  ];

  const menuItems = isOwner
    ? [
        sharedMenuItems[0], // Trang Chủ
        sharedMenuItems[1], // Đơn Hàng
        ownerMenuItems[0], // Nhập Kho  (owner only)
        sharedMenuItems[2], // Sản Phẩm
        sharedMenuItems[3], // Khách Hàng
        sharedMenuItems[4], // Địa Điểm
        ownerMenuItems[1], // Nhân Viên (owner only)
        ownerMenuItems[2], // Báo Cáo   (owner only)
      ]
    : sharedMenuItems;

  const bottomMenuItems = [
    ...(isOwner
      ? [
          {
            href: "/dashboard/subscription",
            label: "Nâng Cấp Tài Khoản",
            icon: Zap,
            highlight: true,
          },
        ]
      : []),
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
            const isHighlight = "highlight" in item && item.highlight;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-cyan-50 text-[#23C4C1]"
                      : isHighlight
                        ? "bg-linear-to-r from-[#052659]/5 to-[#23C4C1]/10 text-[#052659] hover:from-[#052659]/10 hover:to-[#23C4C1]/20 font-semibold"
                        : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isHighlight && !isActive ? "text-[#23C4C1]" : ""}`}
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {isAdmin && (
        <div className="px-4 pb-4">
          <Separator className="mb-3" />
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors border border-dashed border-gray-200"
          >
            <ArrowLeftRight className="w-5 h-5 text-gray-400" />
            <span>Trang Quản Trị</span>
          </Link>
        </div>
      )}
    </aside>
  );
}
