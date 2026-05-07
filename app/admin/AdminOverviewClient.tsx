"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Calendar, ChevronDown, Users } from "lucide-react";
import Link from "next/link";
import { getAdminUsers } from "@/lib/admin-users-api";
import { getDispatches } from "@/lib/admin-notification-api";
import { authFetch } from "@/lib/auth/tokenManager";
import {
  formatDateTimeVi,
  formatNumberVi,
  formatTooltipCurrency,
  formatVnd,
  formatYAxisShort,
} from "@/lib/format";
import type { NotificationDispatch } from "@/lib/types/adminNotification";

type RangeMode = "day" | "month" | "year" | "custom";

type SubscriptionAnalytics = {
  fromDate: string;
  toDate: string;
  totalRevenue: number;
  totalSubscriptionRegistrations: number;
  dailySeries: Array<{
    date: string;
    revenue: number;
    subscriptionRegistrations: number;
  }>;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5139"
).replace(/\/$/, "");

function toApiDate(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${mm}-${dd}-${yyyy}`;
}

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveRange(mode: RangeMode, from: Date, to: Date) {
  if (mode === "custom") {
    return { from, to };
  }

  const today = new Date();
  if (mode === "day") return { from: today, to: today };
  if (mode === "month") {
    return {
      from: new Date(today.getFullYear(), today.getMonth(), 1),
      to: today,
    };
  }

  return { from: new Date(today.getFullYear(), 0, 1), to: today };
}

function formatCount(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return formatNumberVi(value);
}

async function getSubscriptionAnalytics(
  period: RangeMode,
  fromDate: Date,
  toDate: Date,
): Promise<SubscriptionAnalytics> {
  const params = new URLSearchParams();
  params.set("Period", period);
  if (period === "custom") {
    params.set("FromDate", toApiDate(fromDate));
    params.set("ToDate", toApiDate(toDate));
  }

  const res = await authFetch(
    `${API_BASE_URL}/api/admin/subscriptions/analytics?${params.toString()}`,
    {
      method: "GET",
      headers: { accept: "*/*" },
      cache: "no-store",
    },
  );
  const body = (await res.json()) as { data?: SubscriptionAnalytics };
  if (!res.ok || !body?.data) {
    throw new Error("Failed to load subscription analytics");
  }
  return body.data;
}

const quickLinks = [
  { label: "Quản lý người dùng", href: "/admin/accounts" },
  { label: "Quản lý thông báo", href: "/admin/notifications" },
  { label: "Quản lý gói đăng ký", href: "/admin/subscriptions" },
  { label: "Báo cáo kế toán", href: "/admin/accounting" },
];

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div
    className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
  >
    {children}
  </div>
);

const IconButton = ({
  icon: Icon,
  onClick,
}: {
  icon: React.ComponentType<{ size?: number }>;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="p-2 text-gray-500 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
  >
    <Icon size={18} />
  </button>
);

export default function AdminOverviewClient() {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [rangeMode, setRangeMode] = useState<RangeMode>("year");
  const [selectedRange, setSelectedRange] = useState<
    "day" | "month" | "year" | "custom"
  >("year");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [appliedFrom, setAppliedFrom] = useState(toInputDate(new Date()));
  const [appliedTo, setAppliedTo] = useState(toInputDate(new Date()));
  const [totalUsers, setTotalUsers] = useState<number | null>(null);
  const [totalSubscriptions, setTotalSubscriptions] = useState<number | null>(
    null,
  );
  const [totalRevenue, setTotalRevenue] = useState<number | null>(null);
  const [totalDispatches, setTotalDispatches] = useState<number | null>(null);
  const [analytics, setAnalytics] = useState<SubscriptionAnalytics | null>(
    null,
  );
  const [dispatchItems, setDispatchItems] = useState<NotificationDispatch[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rangeLabel = useMemo(() => {
    if (selectedRange === "day") return "Hôm nay";
    if (selectedRange === "month") return "Tháng này";
    if (selectedRange === "year") return "Năm nay";
    if (customFrom && customTo) return `${customFrom} - ${customTo}`;
    return "Tuỳ chỉnh";
  }, [selectedRange, customFrom, customTo]);

  const effectiveRange = useMemo(() => {
    if (rangeMode === "custom") {
      return resolveRange("custom", new Date(appliedFrom), new Date(appliedTo));
    }
    return resolveRange(rangeMode, new Date(), new Date());
  }, [rangeMode, appliedFrom, appliedTo]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [users, subscriptions, dispatches] = await Promise.all([
          getAdminUsers({ pageNumber: 1, pageSize: 1, role: "user" }),
          getSubscriptionAnalytics(
            rangeMode,
            effectiveRange.from,
            effectiveRange.to,
          ),
          getDispatches(
            1,
            4,
            undefined,
            toApiDate(effectiveRange.from),
            toApiDate(effectiveRange.to),
          ),
        ]);

        if (!active) return;
        setTotalUsers(users.totalCount ?? null);
        setTotalSubscriptions(
          subscriptions.totalSubscriptionRegistrations ?? null,
        );
        setTotalRevenue(subscriptions.totalRevenue ?? null);
        setTotalDispatches(dispatches.totalCount ?? null);
        setAnalytics(subscriptions);
        setDispatchItems(dispatches.items ?? []);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Không thể tải dữ liệu");
      } finally {
        if (!active) return;
        setIsLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [rangeMode, effectiveRange.from, effectiveRange.to]);

  const summaryData = useMemo(
    () => [
      {
        title: "Tổng doanh thu",
        value:
          totalRevenue === null || !Number.isFinite(totalRevenue)
            ? "—"
            : formatVnd(totalRevenue),
        trend: "—",
        trendText: "từ giao dịch thành công",
        isPositive: true,
      },
      {
        title: "Số người dùng",
        value: formatCount(totalUsers),
        trend: "—",
        trendText: "tổng người dùng",
        isPositive: true,
      },
      {
        title: "Số Lượt Đăng Kí gói",
        value: formatCount(totalSubscriptions),
        trend: "—",
        trendText: `trong ${rangeLabel.toLowerCase()}`,
        isPositive: true,
      },
      {
        title: "Số Thông Báo",
        value: formatCount(totalDispatches),
        trend: "—",
        trendText: "đã gửi",
        isPositive: false,
      },
    ],
    [totalRevenue, totalUsers, totalSubscriptions, totalDispatches, rangeLabel],
  );

  const revenueData = useMemo(() => {
    const months = Array.from({ length: 12 }, (_, index) => ({
      name: `T${index + 1}`,
      value: 0,
    }));
    (analytics?.dailySeries ?? []).forEach((item) => {
      const month = new Date(item.date).getMonth();
      months[month].value += item.revenue;
    });
    return months;
  }, [analytics?.dailySeries]);

  const pieData = useMemo(() => {
    const paid = Math.max(totalSubscriptions ?? 0, 0);
    const total = Math.max(totalUsers ?? 0, 0);
    const free = Math.max(total - paid, 0);
    return [
      { name: "Premium Plan", value: paid, color: "#23c4c1" }, // Teal custom
      { name: "Free Plan", value: free, color: "#e5e7eb" }, // Light Gray
    ];
  }, [totalSubscriptions, totalUsers]);

  const handlePreset = (preset: "day" | "month" | "year") => {
    const now = new Date();
    if (preset === "day") {
      setSelectedRange("day");
      setRangeMode("day");
      setAppliedFrom(toInputDate(now));
      setAppliedTo(toInputDate(now));
      setIsDatePickerOpen(false);
      return;
    }

    if (preset === "month") {
      setSelectedRange("month");
      setRangeMode("month");
      setIsDatePickerOpen(false);
      return;
    }

    if (preset === "year") {
      setSelectedRange("year");
      setRangeMode("year");
      setIsDatePickerOpen(false);
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 font-sans text-gray-800">
      {error && (
        <div className="mb-4 rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex justify-end gap-4">
        <div className="flex items-center gap-2 relative">
          <div className="relative">
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <Calendar size={16} className="text-gray-400" />
              <span>{rangeLabel}</span>
              <ChevronDown size={16} className="text-gray-400 ml-1" />
            </button>

            {/* Date Picker Dropdown */}
            {isDatePickerOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 z-50 text-sm overflow-hidden">
                <div className="px-2 py-2">
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${selectedRange === "day" ? "bg-[#e9f9f9] text-[#23c4c1] font-medium" : ""}`}
                    onClick={() => handlePreset("day")}
                  >
                    Hôm nay
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${selectedRange === "month" ? "bg-[#e9f9f9] text-[#23c4c1] font-medium" : ""}`}
                    onClick={() => handlePreset("month")}
                  >
                    Tháng này
                  </button>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 ${selectedRange === "year" ? "bg-[#e9f9f9] text-[#23c4c1] font-medium" : ""}`}
                    onClick={() => handlePreset("year")}
                  >
                    Năm nay
                  </button>
                </div>

                <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                  <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">
                    Tùy chỉnh
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs bg-white outline-none focus:border-[#23c4c1]"
                      value={customFrom}
                      onChange={(e) => {
                        setSelectedRange("custom");
                        setRangeMode("custom");
                        setCustomFrom(e.target.value);
                      }}
                    />
                    <input
                      type="date"
                      className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs bg-white outline-none focus:border-[#23c4c1]"
                      value={customTo}
                      onChange={(e) => {
                        setSelectedRange("custom");
                        setRangeMode("custom");
                        setCustomTo(e.target.value);
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (customFrom && customTo) {
                        setSelectedRange("custom");
                        setRangeMode("custom");
                        setAppliedFrom(customFrom);
                        setAppliedTo(customTo);
                      }
                      setIsDatePickerOpen(false);
                    }}
                    className="w-full bg-[#23c4c1] hover:bg-[#1eb0ae] text-white font-medium py-2 rounded-md transition-colors shadow-sm"
                  >
                    Áp Dụng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {summaryData.map((item) => (
          <Card key={item.title} className="p-5">
            <div className="text-sm font-medium text-gray-500 mb-2">
              {item.title}
            </div>
            <div className="text-2xl font-semibold text-gray-900 mb-3">
              {isLoading ? "…" : item.value}
            </div>
          </Card>
        ))}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card className="lg:col-span-2 p-5 flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-semibold text-gray-900">
                Doanh thu theo tháng
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Doanh thu từ giao dịch thanh toán gói dịch vụ
              </p>
            </div>
            <IconButton icon={Download} />
          </div>
          <div className="flex-1 h-62.5 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                margin={{ top: 5, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#9ca3af" }}
                  tickFormatter={(value) => formatYAxisShort(Number(value))}
                />
                <Tooltip
                  cursor={{ fill: "#f3f4f6" }}
                  contentStyle={{ borderRadius: "8px", border: "none" }}
                  formatter={(value) => [
                    formatTooltipCurrency(value),
                    "Doanh thu",
                  ]}
                />
                <Bar
                  dataKey="value"
                  fill="#23c4c1"
                  radius={[4, 4, 0, 0]}
                  barSize={28}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-5 flex flex-col relative">
          <div className="mb-2">
            <h3 className="font-semibold text-gray-900">Người dùng đăng ký</h3>
            <p className="text-sm text-gray-500 mt-1">
              Tổng quan phân bổ gói dịch vụ
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative mt-8">
            <div className="h-35 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="100%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center pb-2">
                <div className="bg-gray-100 p-1.5 rounded-full mb-1">
                  <Users size={16} className="text-gray-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? "…" : formatCount(totalUsers)}
                </div>
                <div className="text-xs text-gray-500">Tổng người dùng</div>
              </div>
            </div>

            <div className="flex justify-between w-full mt-8 px-2">
              <div className="flex flex-col">
                <span className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
                  <div className="w-2 h-2 rounded-full bg-[#23c4c1]"></div>
                  Premium Plan
                </span>
                <span className="text-xl font-semibold">
                  {isLoading ? "…" : formatCount(pieData[0]?.value ?? 0)}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="flex items-center text-xs text-gray-500 gap-1.5 mb-1">
                  Free Plan
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                </span>
                <span className="text-xl font-semibold">
                  {isLoading ? "…" : formatCount(pieData[1]?.value ?? 0)}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">
              Thông báo gửi gần đây
            </h3>
            <Link
              href="/admin/notifications"
              className="text-sm text-[#23c4c1] hover:text-[#1eb0ae] font-medium transition-colors"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            {dispatchItems.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-10">
                Hiện tại không có thông báo nào được gửi.
              </div>
            ) : (
              dispatchItems.map((dispatch) => {
                const sentAt = dispatch.sentAt || dispatch.createdAt;
                const timeLabel = sentAt
                  ? formatDateTimeVi(sentAt)
                  : "Chưa gửi";
                const status = dispatch.status?.toString().toUpperCase();
                const isSuccess = status === "SENT" || status === "COMPLETED";
                const isFailed = status === "FAILED" || status === "CANCELLED";
                const statusClass = isSuccess
                  ? "bg-emerald-50 text-emerald-600"
                  : isFailed
                    ? "bg-rose-50 text-rose-600"
                    : "bg-amber-50 text-amber-600";

                return (
                  <div
                    key={dispatch.notificationDispatchId}
                    className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 hover:bg-gray-50/50 transition-colors"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {dispatch.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {dispatch.recipientScope}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">{timeLabel}</div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-md ${statusClass}`}
                      >
                        {dispatch.status}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Quick Navigation */}
        <Card className="p-5">
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900">Di chuyển nhanh</h3>
          </div>
          <div className="flex flex-col gap-3">
            {quickLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium">{link.label}</span>
                <span className="text-[#23c4c1]">→</span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
