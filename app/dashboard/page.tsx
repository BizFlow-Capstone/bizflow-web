"use client";

import Link from "next/link";
import { useMemo } from "react";
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
  TrendingDown,
  Loader2,
  Sparkles,
  Flame,
  LineChart as LineChartIcon,
  Megaphone,
  Brain,
  ChevronRight,
  BarChart3,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  BarChart,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useLocations } from "@/hooks/useLocations";
import {
  useProducts,
  useReorderSuggestions,
  useReorderSuggestionProductLookup,
  useProductInsights,
  useAnomalyAlerts,
} from "@/hooks/useProducts";
import {
  useAllRevenuesByFilters,
  useAllCosts,
  useRevenueForecast,
} from "@/hooks/useAccounting";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import type { ProductInsightType } from "@/lib/types/product";
import {
  formatVnd,
  formatCompactVnd,
  formatYAxisShort,
  formatTooltipCurrency,
  formatDateTimeVi,
} from "@/lib/format";
import type { CostFilters, RevenueFilters } from "@/lib/types/accounting";

// ─── Constants ────────────────────────────────────────────────────────────────

const CHART_PRIMARY = "#23c4c1";
const CHART_PRIMARY_DARK = "#1aa9a7";
const CHART_PRIMARY_LIGHT = "#7ee4e2";
const CHART_PRIMARY_SOFT = "#bdf2f1";

const PIE_COLORS = [
  CHART_PRIMARY,
  CHART_PRIMARY_LIGHT,
  CHART_PRIMARY_SOFT,
  "#d9f7f6",
  CHART_PRIMARY_DARK,
  "#0f8d8b",
];

const COST_LABELS: Record<string, string> = {
  import: "Nhập hàng",
  salary: "Lương",
  rent: "Thuê MB",
  utilities: "Điện/Nước",
  transport: "Vận chuyển",
  marketing: "Marketing",
  maintenance: "Bảo trì",
  other: "Khác",
  manual: "Thủ công",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUrgencyMeta(urgency?: string) {
  switch (urgency) {
    case "HIGH":
      return {
        badgeClass: "bg-red-100 text-red-700 border-red-200",
        label: "Khẩn cấp cao",
        rowClass: "border-l-red-400 bg-red-50/70",
      };
    case "MEDIUM":
      return {
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
        label: "Khẩn cấp vừa",
        rowClass: "border-l-amber-400 bg-amber-50/70",
      };
    default:
      return {
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
        label: "Khẩn cấp thấp",
        rowClass: "border-l-blue-300 bg-blue-50/60",
      };
  }
}

function getInsightMeta(type: ProductInsightType): {
  label: string;
  description: string;
  badgeClass: string;
  icon: LucideIcon;
} {
  switch (type) {
    case "TOP_SELLER":
      return {
        label: "Sản phẩm bán chạy",
        description: "Nhóm sản phẩm có sản lượng dẫn đầu",
        badgeClass: "bg-rose-100 text-rose-700 border-rose-200",
        icon: Flame,
      };
    case "GROWTH_TREND":
      return {
        label: "Tăng trưởng nổi bật",
        description: "Sản phẩm có xu hướng tăng nhanh gần đây",
        badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
        icon: LineChartIcon,
      };
    case "PROMOTE_CANDIDATE":
      return {
        label: "Cơ hội đẩy bán",
        description: "Sản phẩm nên ưu tiên quảng bá để tối ưu doanh thu",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
        icon: Megaphone,
      };
    default:
      return {
        label: type,
        description: "Nhóm phân tích khác",
        badgeClass: "bg-gray-100 text-gray-700 border-gray-200",
        icon: Sparkles,
      };
  }
}

function formatInsightMetric(type: ProductInsightType, value: number) {
  if (!Number.isFinite(value)) return "0";
  if (type === "TOP_SELLER")
    return `${new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(value)))} sản lượng`;
  if (Math.abs(value) <= 1)
    return `${(value * 100).toFixed(1).replace(/\.0$/, "")}%`;
  return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: locations, isLoading: locLoading } = useLocations();
  const { selectedLocationId } = useDashboardLocation();
  const locationList = locations ?? [];
  const hasLocations = locationList.length > 0;

  const selectedLocationExists =
    selectedLocationId != null &&
    selectedLocationId > 0 &&
    locationList.some((l) => l.id === selectedLocationId);

  const activeLocationId = hasLocations
    ? selectedLocationExists
      ? (selectedLocationId as number)
      : locationList[0].id
    : 0;

  // Data hooks
  const overviewRevenueFilters = useMemo<RevenueFilters>(
    () => ({ locationId: activeLocationId }),
    [activeLocationId],
  );
  const overviewCostFilters = useMemo<CostFilters>(
    () => ({ locationId: activeLocationId }),
    [activeLocationId],
  );
  const { data: revenueData, isLoading: revLoading } = useAllRevenuesByFilters(
    overviewRevenueFilters,
  );
  const { data: costsData, isLoading: costLoading } =
    useAllCosts(overviewCostFilters);
  const { data: revenueForecast, isLoading: forecastLoading } =
    useRevenueForecast(activeLocationId);
  const { data: reorderSuggestions = [], isLoading: reorderLoading } =
    useReorderSuggestions(activeLocationId);
  const { data: productInsights = [], isLoading: insightsLoading } =
    useProductInsights(activeLocationId);
  const { data: unackedAnomalies = [] } = useAnomalyAlerts(
    activeLocationId,
    false,
  );
  const { data: productData } = useProducts({
    locationId: activeLocationId,
    pageSize: 200,
  });

  // Derived
  const revenueItems = useMemo(
    () => revenueData?.items ?? [],
    [revenueData?.items],
  );
  const costItems = useMemo(() => costsData?.items ?? [], [costsData?.items]);
  const totalRevenue = useMemo(
    () => revenueItems.reduce((s, r) => s + r.amount, 0),
    [revenueItems],
  );
  const totalCost = useMemo(
    () => costItems.reduce((s, c) => s + c.amount, 0),
    [costItems],
  );
  const netProfit = totalRevenue - totalCost;
  const costEfficiency =
    totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;

  // 7-month revenue series
  const revenueSeries = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (6 - idx), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: `Th${date.getMonth() + 1}`,
        revenue: 0,
        growth: 0,
      };
    });
    const monthIndexMap = new Map(months.map((m, i) => [m.key, i]));
    for (const item of revenueItems) {
      const date = new Date(item.revenueDate);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const idx = monthIndexMap.get(key);
      if (idx !== undefined) months[idx].revenue += item.amount;
    }
    for (let i = 0; i < months.length; i++) {
      const prev = i > 0 ? months[i - 1].revenue : 0;
      months[i].growth =
        i === 0 || prev === 0 ? 0 : ((months[i].revenue - prev) / prev) * 100;
    }
    return months;
  }, [revenueItems]);

  // 7-month cost series
  const costSeries = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (6 - idx), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: `Th${date.getMonth() + 1}`,
        cost: 0,
      };
    });
    const monthIndexMap = new Map(months.map((m, i) => [m.key, i]));
    for (const item of costItems) {
      const date = new Date(item.costDate);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const idx = monthIndexMap.get(key);
      if (idx !== undefined) months[idx].cost += item.amount;
    }
    return months;
  }, [costItems]);

  // Combined for main chart
  const combinedSeries = useMemo(
    () =>
      revenueSeries.map((r, i) => ({
        label: r.label,
        revenue: r.revenue,
        cost: costSeries[i]?.cost ?? 0,
      })),
    [revenueSeries, costSeries],
  );

  // Revenue source breakdown
  const revenueSourceRows = useMemo(() => {
    const sourceMap = new Map<
      string,
      {
        label: string;
        total: number;
        currentMonth: number;
        previousMonth: number;
      }
    >();
    const latestKey = revenueSeries.at(-1)?.key;
    const prevKey = revenueSeries.at(-2)?.key;
    for (const item of revenueItems) {
      const sk = item.paymentMethod ?? item.moneyChannel ?? "other";
      const label =
        sk === "cash"
          ? "Tiền mặt"
          : sk === "bank"
            ? "Ngân hàng"
            : sk === "debt"
              ? "Công nợ"
              : sk === "mixed"
                ? "Hỗn hợp"
                : "Khác";
      const cur = sourceMap.get(sk) ?? {
        label,
        total: 0,
        currentMonth: 0,
        previousMonth: 0,
      };
      cur.total += item.amount;
      const date = new Date(item.revenueDate);
      if (!Number.isNaN(date.getTime())) {
        const mk = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (mk === latestKey) cur.currentMonth += item.amount;
        if (mk === prevKey) cur.previousMonth += item.amount;
      }
      sourceMap.set(sk, cur);
    }
    return Array.from(sourceMap.values())
      .map((s) => ({
        ...s,
        share: totalRevenue > 0 ? (s.total / totalRevenue) * 100 : 0,
        growth:
          s.previousMonth > 0
            ? ((s.currentMonth - s.previousMonth) / s.previousMonth) * 100
            : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [revenueItems, revenueSeries, totalRevenue]);

  // Cost by category
  const costCategoryRows = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        label: string;
        total: number;
        currentMonth: number;
        previousMonth: number;
      }
    >();
    const latestKey = costSeries.at(-1)?.key;
    const prevKey = costSeries.at(-2)?.key;
    for (const item of costItems) {
      const key = item.costType || "other";
      const cur = map.get(key) ?? {
        key,
        label: COST_LABELS[key] ?? key,
        total: 0,
        currentMonth: 0,
        previousMonth: 0,
      };
      cur.total += item.amount;
      const date = new Date(item.costDate);
      if (!Number.isNaN(date.getTime())) {
        const mk = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (mk === latestKey) cur.currentMonth += item.amount;
        if (mk === prevKey) cur.previousMonth += item.amount;
      }
      map.set(key, cur);
    }
    return Array.from(map.values())
      .map((c) => ({
        ...c,
        share: totalCost > 0 ? (c.total / totalCost) * 100 : 0,
        growth:
          c.previousMonth > 0
            ? ((c.currentMonth - c.previousMonth) / c.previousMonth) * 100
            : 0,
      }))
      .sort((a, b) => b.total - a.total);
  }, [costItems, costSeries, totalCost]);

  // Forecast
  const revenueForecastSeries = useMemo(
    () =>
      (revenueForecast?.forecasts ?? [])
        .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate))
        .map((item) => {
          const d = new Date(`${item.forecastDate}T00:00:00`);
          return {
            label: Number.isNaN(d.getTime())
              ? item.forecastDate
              : d.toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                }),
            forecastDate: item.forecastDate,
            predictedRevenue: item.predictedRevenue,
            lowerBound: item.lowerBound,
            upperBound: item.upperBound,
            generatedAt: item.generatedAt,
          };
        }),
    [revenueForecast?.forecasts],
  );

  const forecastTotalRevenue = revenueForecastSeries.reduce(
    (s, i) => s + i.predictedRevenue,
    0,
  );
  const forecastAverageDailyRevenue =
    revenueForecastSeries.length > 0
      ? forecastTotalRevenue / revenueForecastSeries.length
      : 0;
  const forecastTrendNote = (revenueForecast?.forecasts ?? []).find((i) =>
    i.trendNote?.trim(),
  )?.trendNote;
  const forecastGeneratedAt = revenueForecastSeries[0]?.generatedAt;

  const averageMonthlyRevenue =
    revenueSeries.length > 0
      ? revenueSeries.reduce((s, m) => s + m.revenue, 0) / revenueSeries.length
      : 0;
  const revenueTrendAverage =
    revenueSeries.length > 0
      ? revenueSeries.reduce((s, m) => s + m.growth, 0) / revenueSeries.length
      : 0;

  // AI product helpers
  const productNameMap = useMemo(() => {
    const map = new Map<number, string>();
    (productData?.items ?? []).forEach((p) =>
      map.set(p.productId, p.productName || p.name),
    );
    return map;
  }, [productData?.items]);

  const aiLookupIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...reorderSuggestions.slice(0, 5).map((i) => Number(i.productId)),
          ...productInsights.slice(0, 36).map((i) => Number(i.productId)),
        ]),
      ).filter((id) => Number.isFinite(id) && id > 0),
    [reorderSuggestions, productInsights],
  );

  const { data: reorderProductLookup = {}, isLoading: reorderLookupLoading } =
    useReorderSuggestionProductLookup(aiLookupIds, activeLocationId);

  const insightsByType = useMemo(() => {
    const grouped: Record<ProductInsightType, typeof productInsights> = {
      TOP_SELLER: [],
      GROWTH_TREND: [],
      PROMOTE_CANDIDATE: [],
    };
    [...productInsights]
      .sort((a, b) =>
        a.insightType !== b.insightType
          ? a.insightType.localeCompare(b.insightType)
          : a.rank !== b.rank
            ? a.rank - b.rank
            : b.periodDays - a.periodDays,
      )
      .forEach((item) => {
        if (item.insightType in grouped) {
          grouped[item.insightType].push(item);
        }
      });
    return grouped;
  }, [productInsights]);

  const topSellerChartData = useMemo(
    () =>
      (insightsByType.TOP_SELLER ?? []).slice(0, 5).map((row) => {
        const numericId = Number(row.productId);
        const productName =
          (Number.isFinite(numericId) && numericId > 0
            ? productNameMap.get(numericId) ||
              reorderProductLookup[numericId]?.productName
            : undefined) || `SP #${row.productId}`;
        return {
          name: productName,
          shortName:
            productName.length > 18
              ? `${productName.slice(0, 18)}…`
              : productName,
          value: Math.max(0, Math.round(row.metricValue)),
          periodLabel: `${row.periodDays} ngày`,
        };
      }),
    [insightsByType, productNameMap, reorderProductLookup],
  );

  const growthTrendChartData = useMemo(
    () =>
      (insightsByType.GROWTH_TREND ?? []).slice(0, 5).map((row) => {
        const numericId = Number(row.productId);
        const productName =
          (Number.isFinite(numericId) && numericId > 0
            ? productNameMap.get(numericId) ||
              reorderProductLookup[numericId]?.productName
            : undefined) || `SP #${row.productId}`;
        const normalizedValue =
          Math.abs(row.metricValue) <= 1
            ? row.metricValue * 100
            : row.metricValue;
        return {
          name: productName,
          shortName:
            productName.length > 18
              ? `${productName.slice(0, 18)}…`
              : productName,
          value: Number.isFinite(normalizedValue) ? normalizedValue : 0,
          periodLabel: `${row.periodDays} ngày`,
          fill: normalizedValue >= 0 ? CHART_PRIMARY : "#FB7185",
        };
      }),
    [insightsByType, productNameMap, reorderProductLookup],
  );

  const promoteCandidateRows = useMemo(
    () =>
      (insightsByType.PROMOTE_CANDIDATE ?? []).slice(0, 3).map((row) => {
        const numericId = Number(row.productId);
        const productName =
          (Number.isFinite(numericId) && numericId > 0
            ? productNameMap.get(numericId) ||
              reorderProductLookup[numericId]?.productName
            : undefined) || `SP #${row.productId}`;
        return {
          ...row,
          productName,
          scoreText: formatInsightMetric("PROMOTE_CANDIDATE", row.metricValue),
        };
      }),
    [insightsByType, productNameMap, reorderProductLookup],
  );

  const topSellerMeta = getInsightMeta("TOP_SELLER");
  const growthTrendMeta = getInsightMeta("GROWTH_TREND");
  const promoteMeta = getInsightMeta("PROMOTE_CANDIDATE");

  const latestInsightGeneratedAt = useMemo(() => {
    const timestamps = productInsights
      .map((i) => new Date(i.generatedAt).getTime())
      .filter((v) => Number.isFinite(v));
    if (timestamps.length === 0) return null;
    return new Date(Math.max(...timestamps));
  }, [productInsights]);

  const topReorderSuggestions = useMemo(
    () =>
      reorderSuggestions.slice(0, 5).map((item) => {
        const numericId = Number(item.productId);
        const productName =
          Number.isFinite(numericId) && numericId > 0
            ? productNameMap.get(numericId) ||
              reorderProductLookup[numericId]?.productName
            : undefined;
        return { ...item, productName: productName || `SP #${item.productId}` };
      }),
    [reorderSuggestions, productNameMap, reorderProductLookup],
  );

  const smartActionCards = useMemo(() => {
    const actions: Array<{
      title: string;
      detail: string;
      badge: string;
      tone: "rose" | "amber" | "blue";
      icon: LucideIcon;
    }> = [];

    const topSeller = topSellerChartData[0];
    if (topSeller) {
      actions.push({
        title: `Đẩy mạnh '${topSeller.name}'`,
        detail: `Sản phẩm đang dẫn đầu với ${Math.round(topSeller.value).toLocaleString("vi-VN")} đơn vị trong ${topSeller.periodLabel.toLowerCase()}.`,
        badge: "Tiềm năng cao",
        tone: "rose",
        icon: Flame,
      });
    }

    if (unackedAnomalies.length > 0) {
      actions.push({
        title: "Theo dõi cảnh báo vận hành",
        detail: `${unackedAnomalies.length} cảnh báo cần được rà soát để tránh ảnh hưởng doanh thu hoặc tồn kho.`,
        badge: "Cần kiểm tra",
        tone: "amber",
        icon: AlertTriangle,
      });
    }

    const topReorder = topReorderSuggestions[0];
    if (topReorder) {
      actions.push({
        title: "Tối ưu tồn kho",
        detail: `${topReorder.productName} còn ${Math.max(0, Math.round(topReorder.currentStock)).toLocaleString("vi-VN")} đơn vị, nên chuẩn bị nhập thêm sớm.`,
        badge: "Cần nhập sớm",
        tone: "blue",
        icon: PackageOpen,
      });
    } else if (forecastTrendNote?.trim()) {
      actions.push({
        title: "Điều chỉnh kế hoạch bán",
        detail: forecastTrendNote,
        badge: "Theo dự báo",
        tone: "blue",
        icon: TrendingUp,
      });
    }

    return actions.slice(0, 3);
  }, [
    forecastTrendNote,
    topReorderSuggestions,
    topSellerChartData,
    unackedAnomalies.length,
  ]);

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
        </main>
      </div>
    );
  }

  const finDataLoading = revLoading || costLoading;

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8 bg-gray-50 space-y-6 overflow-auto">
        {/* ── Section 1: Today summary ── */}
        {/* {sumLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border p-5 animate-pulse h-20"
              />
            ))}
          </div>
        ) : summary ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                icon={<DollarSign className="w-5 h-5" />}
                iconBg="bg-emerald-100 text-emerald-600"
                label="Doanh thu hôm nay"
                value={formatVnd(summary.todayRevenue)}
              />
              <SummaryCard
                icon={<ShoppingCart className="w-5 h-5" />}
                iconBg="bg-blue-100 text-blue-600"
                label="Đơn hàng hôm nay"
                value={String(summary.todayOrders)}
              />
              <SummaryCard
                icon={<AlertTriangle className="w-5 h-5" />}
                iconBg="bg-amber-100 text-amber-600"
                label="Tổng công nợ"
                value={formatVnd(summary.totalOutstandingDebt)}
              />
              <SummaryCard
                icon={<PackageOpen className="w-5 h-5" />}
                iconBg="bg-red-100 text-red-600"
                label="SP sắp hết hàng"
                value={String(summary.lowStockCount)}
              />
            </div>
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
        ) : null} */}

        {/* ── Section 2: YTD Financial KPIs ── */}
        {finDataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border p-5 animate-pulse h-28"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <FinancialKpiCard
              icon={<TrendingUp className="w-5 h-5" />}
              iconBg="bg-emerald-100 text-emerald-600"
              label="Tổng doanh thu"
              value={formatCompactVnd(totalRevenue)}
              sub={`${revenueItems.length} giao dịch phát sinh`}
              trend={revenueTrendAverage}
              trendColor="emerald"
            />
            <FinancialKpiCard
              icon={<TrendingDown className="w-5 h-5" />}
              iconBg="bg-rose-100 text-rose-600"
              label="Tổng chi phí"
              value={formatCompactVnd(totalCost)}
              sub={`${costItems.length} giao dịch phát sinh`}
              trendColor="rose"
            />
            <FinancialKpiCard
              icon={
                netProfit >= 0 ? (
                  <ArrowUpRight className="w-5 h-5" />
                ) : (
                  <ArrowDownRight className="w-5 h-5" />
                )
              }
              iconBg={
                netProfit >= 0
                  ? "bg-teal-100 text-teal-600"
                  : "bg-red-100 text-red-600"
              }
              label="Lợi nhuận ròng"
              value={formatCompactVnd(netProfit)}
              sub="Doanh thu − Chi phí"
              trendColor={netProfit >= 0 ? "emerald" : "rose"}
            />
            <FinancialKpiCard
              icon={<Sparkles className="w-5 h-5" />}
              iconBg="bg-blue-100 text-blue-600"
              label="Tỉ suất lợi nhuận"
              value={`${costEfficiency.toFixed(1)}%`}
              sub="(DT − CP) / DT"
              trendColor={costEfficiency >= 50 ? "emerald" : "rose"}
            />
          </div>
        )}

        {/* ── Section 3: 7-month charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border p-6">
            <div className="mb-5">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#23C4C1]" />
                Doanh thu &amp; Chi phí (7 tháng gần nhất)
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                So sánh doanh thu và chi phí phát sinh theo từng tháng.
              </p>
            </div>
            {finDataLoading ? (
              <div className="h-72 animate-pulse bg-gray-100 rounded-lg" />
            ) : (
              <RevenueCostBarChart data={combinedSeries} />
            )}
          </div>

          <div className="bg-white rounded-2xl border p-6">
            <div className="mb-5">
              <h3 className="font-semibold text-gray-900">
                Xu hướng tăng trưởng DT
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Tốc độ tăng trưởng doanh thu so với tháng trước.
              </p>
            </div>
            {revLoading ? (
              <div className="h-72 animate-pulse bg-gray-100 rounded-lg" />
            ) : (
              <RevenueGrowthLineChart data={revenueSeries} />
            )}
          </div>
        </div>

        {/* ── Section 4: Breakdown panels ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">Phân bổ chi phí</h3>
              <p className="text-sm text-gray-500 mt-1">
                Tỷ trọng từng danh mục chi phí.
              </p>
            </div>
            {costLoading ? (
              <div className="h-60 animate-pulse bg-gray-100 rounded-lg" />
            ) : costCategoryRows.length > 0 ? (
              <CostPieChartViz data={costCategoryRows} />
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
                <TrendingDown className="w-8 h-8 opacity-30" />
                <p className="text-sm">Chưa có dữ liệu chi phí</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border p-6">
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900">Nguồn doanh thu</h3>
              <p className="text-sm text-gray-500 mt-1">
                Doanh thu theo phương thức thanh toán.
              </p>
            </div>
            {revLoading ? (
              <div className="h-60 animate-pulse bg-gray-100 rounded-lg" />
            ) : revenueSourceRows.length > 0 ? (
              <div className="space-y-4">
                {revenueSourceRows.map((row, idx) => (
                  <div key={row.label} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              PIE_COLORS[idx % PIE_COLORS.length],
                          }}
                        />
                        {row.label}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {formatCompactVnd(row.total)}
                        </span>
                        <span
                          className={`text-xs font-semibold ${row.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {row.growth >= 0 ? "+" : ""}
                          {row.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(row.share, 100)}%`,
                          backgroundColor: PIE_COLORS[idx % PIE_COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                ))}
                <Separator className="my-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Tổng</span>
                  <span className="font-bold text-gray-900">
                    {formatCompactVnd(totalRevenue)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-gray-400">
                <TrendingUp className="w-8 h-8 opacity-30" />
                <p className="text-sm">Chưa có dữ liệu doanh thu</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Section 5: AI overview hero ── */}
        <section className="space-y-6">
          <div className="overflow-hidden rounded-[28px] border border-slate-800 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_35%),linear-gradient(135deg,#071226_0%,#0b1730_55%,#081225_100%)] p-6 shadow-[0_20px_60px_rgba(15,23,42,0.24)] md:p-8">
            <div className="mb-6">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                <Sparkles className="h-4 w-4" />
                AI Intelligence
              </p>
              <h3 className="mt-3 text-3xl font-bold tracking-tight text-white">
                Dự báo &amp; Phân tích thông minh
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                Mô hình Machine Learning phân tích dữ liệu lịch sử để dự báo xu
                hướng và gợi ý tối ưu vận hành cho chi nhánh.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.85fr]">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="flex items-center gap-2 text-lg font-semibold text-white">
                      <Brain className="h-5 w-5 text-cyan-300" />
                      Dự báo doanh thu bán lẻ
                    </h4>
                    <p className="mt-1 text-xs text-slate-400">
                      {forecastGeneratedAt
                        ? `Cập nhật lúc ${formatDateTimeVi(forecastGeneratedAt)}`
                        : "Dữ liệu dự báo được đồng bộ theo lịch ban đêm"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-semibold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                      Dự báo
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-indigo-300" />
                      Khoảng tin cậy
                    </span>
                  </div>
                </div>

                {forecastLoading ? (
                  <div className="flex h-64 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
                  </div>
                ) : revenueForecastSeries.length > 0 ? (
                  <>
                    <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Tổng 7 ngày
                        </p>
                        <p className="mt-1 text-xl font-bold text-white">
                          {formatCompactVnd(forecastTotalRevenue)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Trung bình / ngày
                        </p>
                        <p className="mt-1 text-xl font-bold text-white">
                          {formatCompactVnd(forecastAverageDailyRevenue)}
                        </p>
                      </div>
                      <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                          Gợi ý tồn kho
                        </p>
                        <p className="mt-1 text-xl font-bold text-white">
                          {reorderSuggestions.length}
                        </p>
                      </div>
                    </div>
                    <RevenueForecastLineChart
                      data={revenueForecastSeries}
                      theme="dark"
                    />
                    {forecastTrendNote && (
                      <div className="mt-4 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cyan-200">
                          Nhận định
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-cyan-50">
                          {forecastTrendNote}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-6 text-sm text-slate-300">
                    Chưa có dữ liệu dự báo doanh thu cho địa điểm này.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-semibold text-white">
                    Hành động đề xuất
                  </h4>
                  <p className="mt-1 text-sm text-slate-300">
                    Các ưu tiên nên xem ngay trong tuần này.
                  </p>
                </div>

                {smartActionCards.map((item) => {
                  const Icon = item.icon;
                  const toneClass =
                    item.tone === "rose"
                      ? {
                          box: "border-rose-500/30 bg-rose-500/10",
                          icon: "bg-rose-500/15 text-rose-300",
                          badge:
                            "bg-rose-500/15 text-rose-200 border-rose-400/30",
                        }
                      : item.tone === "amber"
                        ? {
                            box: "border-amber-500/30 bg-amber-500/10",
                            icon: "bg-amber-500/15 text-amber-300",
                            badge:
                              "bg-amber-500/15 text-amber-200 border-amber-400/30",
                          }
                        : {
                            box: "border-blue-500/30 bg-blue-500/10",
                            icon: "bg-blue-500/15 text-blue-300",
                            badge:
                              "bg-blue-500/15 text-blue-200 border-blue-400/30",
                          };

                  return (
                    <div
                      key={item.title}
                      className={`rounded-2xl border p-4 ${toneClass.box}`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${toneClass.icon}`}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-white">
                              {item.title}
                            </p>
                            <Badge
                              variant="outline"
                              className={toneClass.badge}
                            >
                              {item.badge}
                            </Badge>
                          </div>
                          <p className="text-sm leading-6 text-slate-300">
                            {item.detail}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <PackageOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-slate-900">
                    Cảnh báo nhập hàng
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Dựa trên tốc độ bán thực tế và mức tồn kho hiện tại.
                  </p>
                </div>
              </div>
              <Link
                href={`/dashboard/imports/create?locationId=${activeLocationId}`}
                className="text-sm font-semibold text-[#23C4C1]"
              >
                Xem tất cả
              </Link>
            </div>

            {reorderLoading || reorderLookupLoading ? (
              <div className="h-24 animate-pulse rounded-lg bg-gray-100" />
            ) : topReorderSuggestions.length > 0 ? (
              <div className="space-y-4">
                {topReorderSuggestions.slice(0, 3).map((item) => {
                  const urgency = getUrgencyMeta(item.urgency);
                  const stripClass =
                    item.urgency === "HIGH"
                      ? "bg-rose-500"
                      : item.urgency === "MEDIUM"
                        ? "bg-amber-500"
                        : "bg-cyan-500";

                  return (
                    <div
                      key={`${item.productId}-${item.generatedAt}`}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-4 transition hover:shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-4">
                        <span
                          className={`h-10 w-1 shrink-0 rounded-full ${stripClass}`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-800">
                            {item.productName}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Tồn kho:{" "}
                            {Math.max(
                              0,
                              Math.round(item.currentStock),
                            ).toLocaleString("vi-VN")}{" "}
                            đơn vị · Dự kiến hết trong{" "}
                            {Math.max(0, Math.round(item.daysUntilStockout))}{" "}
                            ngày
                          </p>
                        </div>
                      </div>
                      <div className="ml-3 flex items-center gap-3">
                        <Badge variant="outline" className={urgency.badgeClass}>
                          {urgency.label}
                        </Badge>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Chưa có dữ liệu gợi ý nhập hàng cho địa điểm này.
              </p>
            )}
          </div>

          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-lg font-semibold text-gray-900">
                  Phân tích sản phẩm
                </h4>
                <p className="mt-1 text-sm text-gray-500">
                  Hiển thị nhóm bán chạy, tăng trưởng mạnh và cơ hội nên đẩy
                  bán.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-cyan-200 bg-cyan-100 text-cyan-700"
                >
                  {productInsights.length} insights
                </Badge>
                <Badge
                  variant="outline"
                  className="border-rose-200 bg-rose-100 text-rose-700"
                >
                  {unackedAnomalies.length} cảnh báo
                </Badge>
                {latestInsightGeneratedAt ? (
                  <Badge
                    variant="outline"
                    className="border-slate-200 bg-slate-100 text-slate-700"
                  >
                    {formatDateTimeVi(latestInsightGeneratedAt.toISOString())}
                  </Badge>
                ) : null}
              </div>
            </div>

            {insightsLoading ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
                <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-xl border bg-slate-50/70 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
                            <Flame className="h-4 w-4" />
                          </span>
                          {topSellerMeta.label}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {topSellerMeta.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={topSellerMeta.badgeClass}
                      >
                        {topSellerChartData.length}
                      </Badge>
                    </div>
                    <InsightHorizontalBarChart
                      data={topSellerChartData}
                      emptyLabel="Chưa có dữ liệu sản phẩm bán chạy"
                      valueFormatter={(value) =>
                        `${Math.round(value).toLocaleString("vi-VN")} sp`
                      }
                    />
                  </div>

                  <div className="rounded-xl border bg-slate-50/70 p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <LineChartIcon className="h-4 w-4" />
                          </span>
                          {growthTrendMeta.label}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {growthTrendMeta.description}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={growthTrendMeta.badgeClass}
                      >
                        {growthTrendChartData.length}
                      </Badge>
                    </div>
                    <InsightHorizontalBarChart
                      data={growthTrendChartData}
                      emptyLabel="Chưa có dữ liệu tăng trưởng"
                      valueFormatter={(value) =>
                        `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl border bg-amber-50/40 p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                          <Megaphone className="h-4 w-4" />
                        </span>
                        {promoteMeta.label}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {promoteMeta.description}
                      </p>
                    </div>
                    <Badge variant="outline" className={promoteMeta.badgeClass}>
                      {promoteCandidateRows.length}
                    </Badge>
                  </div>

                  {promoteCandidateRows.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      {promoteCandidateRows.map((row) => (
                        <div
                          key={`promote-${row.productId}-${row.rank}-${row.periodDays}`}
                          className="rounded-xl border bg-white p-3"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                              #{row.rank}
                            </Badge>
                            <span className="text-[11px] text-gray-500">
                              {row.periodDays} ngày
                            </span>
                          </div>
                          <p className="line-clamp-2 text-sm font-semibold text-gray-800">
                            {row.productName}
                          </p>
                          <p className="mt-2 text-xs text-gray-600">
                            Tiềm năng tăng thêm{" "}
                            <span className="font-semibold text-amber-700">
                              {row.scoreText}
                            </span>
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Chưa có đề xuất đẩy bán nổi bật.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

// ─── Card components ──────────────────────────────────────────────────────────

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
          {formatVnd(amount)}
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

function FinancialKpiCard({
  icon,
  iconBg,
  label,
  value,
  sub,
  trend,
  trendColor = "emerald",
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  sub?: string;
  trend?: number | null;
  trendColor?: "emerald" | "rose" | "blue";
}) {
  const trendCls =
    trendColor === "emerald"
      ? "text-emerald-600"
      : trendColor === "rose"
        ? "text-rose-500"
        : "text-blue-600";
  return (
    <div className="bg-white rounded-xl border p-5 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${iconBg}`}>{icon}</div>
        <p className="text-xs text-gray-500 leading-tight pt-1">{label}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ─── Chart components ─────────────────────────────────────────────────────────

function RevenueCostBarChart({
  data,
}: {
  data: Array<{ label: string; revenue: number; cost: number }>;
}) {
  const hasData = data.some((d) => d.revenue > 0 || d.cost > 0);
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center h-72 gap-2 text-gray-400">
        <TrendingUp className="w-8 h-8 opacity-30" />
        <p className="text-sm">Chưa có dữ liệu doanh thu hoặc chi phí</p>
      </div>
    );
  }
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} barGap={6}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v) => formatYAxisShort(v as number)}
            tickLine={false}
            axisLine={false}
            width={56}
            fontSize={12}
          />
          <Tooltip
            formatter={(v) => formatTooltipCurrency(v)}
            contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="revenue"
            name="Doanh thu"
            fill={CHART_PRIMARY}
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="cost"
            name="Chi phí"
            fill={CHART_PRIMARY_LIGHT}
            radius={[6, 6, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueGrowthLineChart({
  data,
}: {
  data: Array<{ label: string; growth: number }>;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            tickFormatter={(v) => `${Number(v).toFixed(0)}%`}
            tickLine={false}
            axisLine={false}
            width={56}
            fontSize={12}
          />
          <Tooltip
            formatter={(v) => `${Number(v ?? 0).toFixed(1)}%`}
            contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
          />
          <Line
            type="monotone"
            dataKey="growth"
            name="Tăng trưởng (%)"
            stroke={CHART_PRIMARY}
            strokeWidth={2}
            dot={{ r: 4, fill: CHART_PRIMARY }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueForecastLineChart({
  data,
  theme = "light",
}: {
  data: Array<{
    label: string;
    predictedRevenue: number;
    lowerBound: number;
    upperBound: number;
  }>;
  theme?: "light" | "dark";
}) {
  const isDark = theme === "dark";

  return (
    <div
      className={
        isDark
          ? "h-64 rounded-xl border border-slate-700/70 bg-slate-950/30 p-3"
          : "h-64 rounded-xl border bg-white p-3"
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke={isDark ? "rgba(148, 163, 184, 0.18)" : "#e5e7eb"}
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            tick={{ fill: isDark ? "#94a3b8" : "#6b7280" }}
          />
          <YAxis
            tickFormatter={(v) => formatYAxisShort(v as number)}
            tickLine={false}
            axisLine={false}
            width={56}
            fontSize={12}
            tick={{ fill: isDark ? "#94a3b8" : "#6b7280" }}
          />
          <Tooltip
            formatter={(value, name) => {
              const labelMap: Record<string, string> = {
                predictedRevenue: "Dự báo",
                lowerBound: "Cận dưới",
                upperBound: "Cận trên",
              };
              return [
                formatTooltipCurrency(value),
                labelMap[String(name)] ?? String(name),
              ];
            }}
            contentStyle={{
              borderRadius: 12,
              borderColor: isDark ? "#334155" : "#d1d5db",
              backgroundColor: isDark ? "#0f172a" : "#ffffff",
              color: isDark ? "#e2e8f0" : "#111827",
            }}
          />
          <Legend
            verticalAlign="bottom"
            wrapperStyle={{
              fontSize: 12,
              color: isDark ? "#cbd5e1" : "#6b7280",
            }}
          />
          <Line
            type="monotone"
            dataKey="predictedRevenue"
            name="Dự báo"
            stroke={CHART_PRIMARY}
            strokeWidth={3}
            dot={{ r: 3, fill: CHART_PRIMARY }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="lowerBound"
            name="Cận dưới"
            stroke={CHART_PRIMARY_LIGHT}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="upperBound"
            name="Cận trên"
            stroke={CHART_PRIMARY_DARK}
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function InsightHorizontalBarChart({
  data,
  emptyLabel,
  valueFormatter,
}: {
  data: Array<{
    name: string;
    shortName: string;
    value: number;
    periodLabel?: string;
    fill?: string;
  }>;
  emptyLabel: string;
  valueFormatter: (value: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 text-gray-400">
        <BarChart3 className="h-8 w-8 opacity-30" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 6, right: 16, left: 8, bottom: 6 }}
        >
          <CartesianGrid
            horizontal={false}
            stroke="#e5e7eb"
            strokeDasharray="3 3"
          />
          <XAxis
            type="number"
            tickFormatter={(value) => valueFormatter(Number(value))}
            tickLine={false}
            axisLine={false}
            fontSize={11}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tickLine={false}
            axisLine={false}
            width={100}
            fontSize={12}
          />
          <Tooltip
            labelFormatter={(_, payload) => {
              const datum = payload?.[0]?.payload as
                | { name?: string; periodLabel?: string }
                | undefined;
              if (!datum?.name) return "";
              return datum.periodLabel
                ? `${datum.name} · ${datum.periodLabel}`
                : datum.name;
            }}
            formatter={(value) => valueFormatter(Number(value ?? 0))}
            contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`${entry.name}-${index}`}
                fill={entry.fill ?? PIE_COLORS[index % PIE_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function CostPieChartViz({
  data,
}: {
  data: Array<{ key: string; label: string; total: number; share: number }>;
}) {
  const topItems = data.slice(0, 6).filter((item) => item.total > 0);
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-4 items-center">
      <div className="h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={topItems}
              dataKey="total"
              nameKey="label"
              innerRadius={48}
              outerRadius={80}
              paddingAngle={2}
              stroke="#ffffff"
              strokeWidth={1}
            >
              {topItems.map((item, index) => (
                <Cell
                  key={item.key}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(v) => formatTooltipCurrency(v)}
              contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {topItems.map((item, index) => (
          <div
            key={item.key}
            className="flex items-center justify-between text-sm"
          >
            <span className="flex items-center gap-2 font-medium text-gray-700">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                }}
              />
              {item.label}
            </span>
            <span className="text-gray-500">{item.share.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
