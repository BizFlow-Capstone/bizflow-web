"use client";

import { useState } from "react";
import {
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  PackageOpen,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Landmark,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocations } from "@/hooks/useLocations";
import {
  useDashboardSummary,
  useRevenueChart,
  useTopProducts,
  usePaymentRatio,
  useRevenueByType,
} from "@/hooks/useDashboard";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import type { ChartPeriod } from "@/lib/types/dashboard";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const fmtShort = (n: number) => {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}tỷ`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}tr`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
};

export default function DashboardPage() {
  const { data: locations, isLoading: locLoading } = useLocations();
  const { selectedLocationId } = useDashboardLocation();
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("7d");
  const locationList = locations ?? [];
  const hasLocations = locationList.length > 0;

  // Use selected location only when it exists in the current location list.
  const selectedLocationExists =
    selectedLocationId != null &&
    selectedLocationId > 0 &&
    locationList.some((location) => location.id === selectedLocationId);

  const activeLocationId = hasLocations
    ? selectedLocationExists
      ? (selectedLocationId as number)
      : locationList[0].id
    : 0;

  const { data: summary, isLoading: sumLoading } =
    useDashboardSummary(activeLocationId);
  const { data: revenueChart, isLoading: chartLoading } = useRevenueChart(
    activeLocationId,
    chartPeriod,
  );
  const { data: topProducts } = useTopProducts(activeLocationId, "30d");
  const { data: paymentRatio } = usePaymentRatio(activeLocationId, "30d");
  const { data: revenueByType } = useRevenueByType(activeLocationId, "30d");

  if (locLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
      </div>
    );
  }

  if (!hasLocations) {
    return (
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-8 bg-gray-50 space-y-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border p-5 animate-pulse h-28"
              />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border p-6">
              <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
            </div>
            <div className="bg-white rounded-xl border p-6">
              <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border p-6">
              <div className="h-40 animate-pulse bg-gray-100 rounded-lg" />
            </div>
            <div className="bg-white rounded-xl border p-6">
              <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8 bg-gray-50 space-y-6 overflow-auto">
        {/* ====== Tầng 1: Summary Cards ====== */}
        {sumLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border p-5 animate-pulse h-28"
              />
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue today */}
              <SummaryCard
                icon={<DollarSign className="w-5 h-5" />}
                iconBg="bg-emerald-100 text-emerald-600"
                label="Doanh thu hôm nay"
                value={fmt.format(summary.todayRevenue)}
              />
              {/* Orders today */}
              <SummaryCard
                icon={<ShoppingCart className="w-5 h-5" />}
                iconBg="bg-blue-100 text-blue-600"
                label="Đơn hàng hôm nay"
                value={String(summary.todayOrders)}
              />
              {/* Outstanding debt */}
              <SummaryCard
                icon={<AlertTriangle className="w-5 h-5" />}
                iconBg="bg-amber-100 text-amber-600"
                label="Tổng công nợ"
                value={fmt.format(summary.totalOutstandingDebt)}
              />
              {/* Low stock */}
              <SummaryCard
                icon={<PackageOpen className="w-5 h-5" />}
                iconBg="bg-red-100 text-red-600"
                label="SP sắp hết hàng"
                value={String(summary.lowStockCount)}
              />
            </div>

            {/* Cash flow row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <CashFlowCard
                icon={<Banknote className="w-4 h-4" />}
                label="Tiền mặt vào"
                amount={summary.todayCashIn}
                direction="in"
              />
              <CashFlowCard
                icon={<Landmark className="w-4 h-4" />}
                label="Ngân hàng vào"
                amount={summary.todayBankIn}
                direction="in"
              />
              <CashFlowCard
                icon={<Banknote className="w-4 h-4" />}
                label="Tiền mặt ra"
                amount={summary.todayCashOut}
                direction="out"
              />
              <CashFlowCard
                icon={<Landmark className="w-4 h-4" />}
                label="Ngân hàng ra"
                amount={summary.todayBankOut}
                direction="out"
              />
            </div>
          </>
        ) : null}

        {/* ====== Tầng 2: Charts ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart (takes 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#23C4C1]" />
                Biểu đồ doanh thu
              </h3>
              <div className="flex gap-1">
                <Button
                  variant={chartPeriod === "7d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartPeriod("7d")}
                  className={
                    chartPeriod === "7d"
                      ? "bg-[#23C4C1] hover:bg-[#1ba8a6]"
                      : ""
                  }
                >
                  7 ngày
                </Button>
                <Button
                  variant={chartPeriod === "30d" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartPeriod("30d")}
                  className={
                    chartPeriod === "30d"
                      ? "bg-[#23C4C1] hover:bg-[#1ba8a6]"
                      : ""
                  }
                >
                  30 ngày
                </Button>
              </div>
            </div>

            {chartLoading ? (
              <div className="h-64 animate-pulse bg-gray-100 rounded-lg" />
            ) : revenueChart ? (
              <RevenueBarChart data={revenueChart.data} />
            ) : null}
          </div>

          {/* Payment Ratio */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Tỷ lệ thanh toán
            </h3>
            {paymentRatio ? (
              <div className="space-y-4">
                <PaymentBar
                  label="Tiền mặt"
                  percent={paymentRatio.cash.percent}
                  amount={paymentRatio.cash.amount}
                  color="bg-emerald-500"
                />
                <PaymentBar
                  label="Ngân hàng"
                  percent={paymentRatio.bank.percent}
                  amount={paymentRatio.bank.amount}
                  color="bg-blue-500"
                />
                <PaymentBar
                  label="Công nợ"
                  percent={paymentRatio.debt.percent}
                  amount={paymentRatio.debt.amount}
                  color="bg-amber-500"
                />
              </div>
            ) : (
              <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />
            )}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              🏆 Sản phẩm bán chạy (30 ngày)
            </h3>
            {topProducts ? (
              <div className="space-y-3">
                {topProducts.products.map((p, i) => (
                  <div key={p.productId} className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {p.productName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {p.totalQuantity.toLocaleString("vi-VN")} đã bán
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                      {fmtShort(p.totalRevenue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 animate-pulse bg-gray-100 rounded-lg" />
            )}
          </div>

          {/* Revenue by Business Type */}
          <div className="bg-white rounded-xl border p-6">
            <h3 className="font-semibold text-gray-800 mb-4">
              Doanh thu theo ngành nghề (30 ngày)
            </h3>
            {revenueByType ? (
              <div className="space-y-4">
                {revenueByType.breakdown.map((item) => (
                  <div key={item.businessTypeId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-700">{item.name}</span>
                      <span className="text-sm font-medium text-gray-800">
                        {fmt.format(item.revenue)}{" "}
                        <Badge variant="secondary" className="ml-1 text-xs">
                          {item.percent}%
                        </Badge>
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#23C4C1] rounded-full transition-all duration-500"
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-32 animate-pulse bg-gray-100 rounded-lg" />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function SummaryCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className={`p-2.5 rounded-lg ${iconBg}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500 mb-1">{label}</p>
        <p className="text-lg font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
}

function CashFlowCard({
  icon,
  label,
  amount,
  direction,
}: {
  icon: React.ReactNode;
  label: string;
  amount: number;
  direction: "in" | "out";
}) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-center gap-3">
      <div
        className={`p-2 rounded-lg ${direction === "in" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-semibold text-gray-800">
          {fmt.format(amount)}
        </p>
      </div>
      {direction === "in" ? (
        <ArrowUpRight className="w-4 h-4 text-green-500" />
      ) : (
        <ArrowDownRight className="w-4 h-4 text-red-400" />
      )}
    </div>
  );
}

function PaymentBar({
  label,
  percent,
  amount,
  color,
}: {
  label: string;
  percent: number;
  amount: number;
  color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-xs text-gray-500">
          {fmt.format(amount)} ({percent}%)
        </span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function RevenueBarChart({
  data,
}: {
  data: { date: string; revenue: number; cost: number; profit: number }[];
}) {
  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div>
      {/* Legend */}
      <div className="flex gap-4 mb-3 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-[#23C4C1]" />
          Doanh thu
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-red-400" />
          Chi phí
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-sm bg-emerald-400" />
          Lợi nhuận
        </span>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1 h-56">
        {data.map((d) => {
          const revH = (d.revenue / maxRevenue) * 100;
          const costH = (d.cost / maxRevenue) * 100;
          const label = d.date.slice(5); // MM-DD

          return (
            <div
              key={d.date}
              className="flex-1 flex flex-col items-center gap-0.5 group"
            >
              {/* Tooltip on hover */}
              <div className="hidden group-hover:block absolute -mt-20 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 z-10 whitespace-nowrap pointer-events-none">
                <p>DT: {fmtShort(d.revenue)}</p>
                <p>CP: {fmtShort(d.cost)}</p>
                <p>LN: {fmtShort(d.profit)}</p>
              </div>
              <div className="w-full flex gap-0.5 items-end h-48">
                <div
                  className="flex-1 bg-[#23C4C1] rounded-t-sm transition-all duration-300 hover:opacity-80"
                  style={{ height: `${revH}%` }}
                />
                <div
                  className="flex-1 bg-red-400 rounded-t-sm transition-all duration-300 hover:opacity-80"
                  style={{ height: `${costH}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 mt-1">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
