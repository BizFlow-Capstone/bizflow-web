"use client";

import {
  Users,
  Bell,
  CreditCard,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

// ── Mock data ──────────────────────────────────────────────────────────────────
const stats = [
  {
    title: "Tổng Người Dùng",
    value: "1,248",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Người Dùng Hoạt Động",
    value: "834",
    change: "+8%",
    changeType: "positive" as const,
    icon: Activity,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Thông Báo Đã Gửi",
    value: "3,567",
    change: "+24%",
    changeType: "positive" as const,
    icon: Bell,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    title: "Doanh Thu Platform",
    value: "12.5M",
    change: "+18%",
    changeType: "positive" as const,
    icon: CreditCard,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const recentActivities = [
  {
    id: 1,
    action: "Tài khoản mới đăng ký",
    user: "Nguyễn Văn A",
    time: "5 phút trước",
    type: "user",
  },
  {
    id: 2,
    action: "Chiến dịch thông báo gửi thành công",
    user: "PROMO_WEEKEND",
    time: "15 phút trước",
    type: "notification",
  },
  {
    id: 3,
    action: "Nâng cấp gói Premium",
    user: "Trần Thị B",
    time: "1 giờ trước",
    type: "subscription",
  },
  {
    id: 4,
    action: "Gửi thông báo thất bại",
    user: "SYSTEM_ALERT_001",
    time: "2 giờ trước",
    type: "error",
  },
  {
    id: 5,
    action: "Tạo địa điểm kinh doanh mới",
    user: "Lê Văn C",
    time: "3 giờ trước",
    type: "user",
  },
];

const systemHealth = [
  { label: "API Server", status: "healthy" as const },
  { label: "Database", status: "healthy" as const },
  { label: "Push Service", status: "warning" as const },
  { label: "AI Service", status: "healthy" as const },
];
// ────────────────────────────────────────────────────────────────────────────────

export default function AdminOverviewClient() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tổng Quan Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Xem nhanh trạng thái platform và hoạt động gần đây.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.title}
              className="border-0 shadow-sm hover:shadow-md transition-shadow"
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600">
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-400">
                        so với tháng trước
                      </span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl ${stat.bg}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Hoạt Động Gần Đây
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      activity.type === "error"
                        ? "bg-red-400"
                        : activity.type === "notification"
                          ? "bg-violet-400"
                          : activity.type === "subscription"
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                    }`}
                  />
                  <div>
                    <p className="text-sm text-gray-700">{activity.action}</p>
                    <p className="text-xs text-gray-400">{activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* System Health + Quick Links */}
        <div className="space-y-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Trạng Thái Hệ Thống
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {systemHealth.map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-gray-600">{item.label}</span>
                  {item.status === "healthy" ? (
                    <Badge
                      variant="secondary"
                      className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Hoạt động
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-amber-50 text-amber-700 hover:bg-amber-50"
                    >
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Cảnh báo
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Truy Cập Nhanh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                {
                  label: "Quản Lý Người Dùng",
                  href: "/admin/accounts",
                },
                {
                  label: "Quản Lý Thông Báo",
                  href: "/admin/notifications",
                },
                { label: "Gói Đăng Ký", href: "/admin/subscriptions" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                >
                  <span className="text-sm text-gray-700">{link.label}</span>
                  <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
