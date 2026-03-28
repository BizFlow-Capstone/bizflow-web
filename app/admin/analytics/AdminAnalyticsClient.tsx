"use client";

import {
  Users,
  TrendingUp,
  MapPin,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ── Mock Data ──────────────────────────────────────────────────────────────────

const platformStats = [
  {
    title: "Người Dùng Mới (Tháng này)",
    value: "156",
    change: "+23%",
    positive: true,
    icon: Users,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    title: "Tổng Đơn Hàng (Tháng này)",
    value: "8,432",
    change: "+15%",
    positive: true,
    icon: ShoppingCart,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    title: "Địa Điểm KD Mới",
    value: "34",
    change: "+8%",
    positive: true,
    icon: MapPin,
    color: "text-violet-600",
    bg: "bg-violet-50",
  },
  {
    title: "Tỉ Lệ Giữ Chân",
    value: "87%",
    change: "-2%",
    positive: false,
    icon: Activity,
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
];

const monthlyData = [
  { month: "10/2025", users: 580, orders: 3200, revenue: 8.2 },
  { month: "11/2025", users: 650, orders: 3800, revenue: 9.5 },
  { month: "12/2025", users: 720, orders: 4100, revenue: 10.1 },
  { month: "01/2026", users: 890, orders: 5200, revenue: 11.8 },
  { month: "02/2026", users: 1050, orders: 6800, revenue: 12.5 },
  { month: "03/2026", users: 1248, orders: 8432, revenue: 15.2 },
];

const topLocations = [
  { name: "Tạp Hoá Bà Năm", orders: 342, revenue: "12.5M" },
  { name: "Shop VLXD Minh Đức", orders: 289, revenue: "45.2M" },
  { name: "Cửa Hàng Hoàng Gia", orders: 267, revenue: "8.7M" },
  { name: "Tiệm Tạp Hoá An Phú", orders: 198, revenue: "6.3M" },
  { name: "VLXD Phước Thành", orders: 184, revenue: "38.1M" },
];

const usersByRegion = [
  { region: "TP. Hồ Chí Minh", count: 412, pct: 33 },
  { region: "Hà Nội", count: 287, pct: 23 },
  { region: "Đà Nẵng", count: 156, pct: 12.5 },
  { region: "Cần Thơ", count: 98, pct: 7.8 },
  { region: "Khác", count: 295, pct: 23.7 },
];

// ────────────────────────────────────────────────────────────────────────────────

export default function AdminAnalyticsClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Phân Tích Platform
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Theo dõi hiệu suất, tăng trưởng và các chỉ số quan trọng của nền
          tảng.
        </p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {platformStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-500">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                    <div className="flex items-center gap-1">
                      {stat.positive ? (
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                      )}
                      <span
                        className={`text-xs font-medium ${stat.positive ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-xs text-gray-400">vs tháng trước</span>
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

      {/* Growth Table + Top Locations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Growth */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <CardTitle className="text-base font-semibold">
                Tăng Trưởng Theo Tháng
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {monthlyData.map((row) => (
                <div
                  key={row.month}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <span className="text-sm font-medium text-gray-700 w-20">
                    {row.month}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full transition-all"
                        style={{
                          width: `${(row.users / 1400) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>
                      <strong className="text-gray-700">{row.users}</strong>{" "}
                      users
                    </span>
                    <span>
                      <strong className="text-gray-700">
                        {row.orders.toLocaleString()}
                      </strong>{" "}
                      orders
                    </span>
                    <span>
                      <strong className="text-emerald-600">
                        {row.revenue}M
                      </strong>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Active Locations */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-base font-semibold">
                Top Địa Điểm Hoạt Động
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topLocations.map((loc, idx) => (
                <div
                  key={loc.name}
                  className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      idx < 3
                        ? "bg-gradient-to-br from-teal-400 to-cyan-500 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {loc.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {loc.orders} đơn hàng
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                  >
                    {loc.revenue}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users by Region */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Phân Bố Người Dùng Theo Khu Vực
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {usersByRegion.map((region) => (
              <div
                key={region.region}
                className="text-center p-4 rounded-xl bg-gray-50"
              >
                <p className="text-2xl font-bold text-gray-800">
                  {region.count}
                </p>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  {region.region}
                </p>
                <div className="h-1.5 bg-gray-200 rounded-full mt-3 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-cyan-500 rounded-full"
                    style={{ width: `${region.pct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{region.pct}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
