"use client";

import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx-js-style";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  DollarSign,
  TrendingDown,
  Banknote,
  Landmark,
  CreditCard,
  Calendar,
  BookOpen,
  BarChart3,
  Plus,
  Trash2,
  Users,
  Layers,
  ChevronDown,
  FileText,
  Download,
  Calculator,
  Terminal,
  AlertCircle,
  Zap,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAllRevenuesByFilters,
  useAllCosts,
  useCreateManualCost,
  useUpdateManualCost,
  useDeleteManualCost,
  useCostReferenceCatalog,
  useCreateManualRevenue,
  useUpdateManualRevenue,
  useDeleteManualRevenue,
  useCashFlowReport,
  useRevenueForecast,
} from "@/hooks/useAccounting";
import { useBusinessTypes } from "@/hooks/useBusinessTypes";
import {
  useAccountingTemplates,
  useAccountingBooks,
  useAccountingPeriods,
  useCreateAccountingBook,
  useDeleteAccountingBook,
} from "@/hooks/useAccounting";
import { BookRowsTable } from "@/components/products/BookRowsTable";

import { useBookSummary } from "@/hooks/useBookSummary";
import {
  useAnomalyAlerts,
  useAcknowledgeAnomalyAlert,
  useBackfillVectorStore,
} from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import NoLocationScreenSkeleton from "@/components/NoLocationScreenSkeleton";
import OwnerOnlyScreen from "@/components/OwnerOnlyScreen";
import { useLocationRole } from "@/hooks/useLocationRole";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  ScatterChart,
  Scatter,
} from "recharts";
import AccountingPeriodsTab from "./AccountingPeriodsTab";
import GeneralLedgerTab from "./GeneralLedgerTab";
import {
  formatVnd,
  formatCompactVnd,
  formatYAxisShort,
  formatTooltipCurrency,
  formatDateTimeVi,
} from "@/lib/format";
import type { RevenueRecord } from "@/lib/types/accounting";
import {
  getBookRows as fetchBookRowsForExport,
  getBookSummary as fetchBookSummaryForExport,
} from "@/services/accountingService";

// --- Main component ---

type Tab = "reports" | "periods" | "books";

type CardPeriod = "day" | "week" | "month" | "year";

type DateWindow = {
  start: Date;
  end: Date;
  label: string;
  dayCount: number;
};

const CARD_PERIOD_OPTIONS: Array<{ key: CardPeriod; label: string }> = [
  { key: "day", label: "Ngày" },
  { key: "week", label: "Tuần" },
  { key: "month", label: "Tháng" },
  { key: "year", label: "Năm" },
];

const TRANSACTION_PAGE_SIZE = 10;

const DEFAULT_COST_TYPE_OPTIONS = [
  "salary",
  "rent",
  "utilities",
  "transport",
  "marketing",
  "maintenance",
  "other",
  "manual",
] as const;

const DEFAULT_PAYMENT_METHOD_OPTIONS = ["cash", "bank"] as const;

type ManualCostType = (typeof DEFAULT_COST_TYPE_OPTIONS)[number] | "import";
type ManualCostPaymentMethod = (typeof DEFAULT_PAYMENT_METHOD_OPTIONS)[number];

function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function buildPeriodWindows(period: CardPeriod): {
  current: DateWindow;
  previous: DateWindow;
} {
  const now = new Date();
  const currentEnd = endOfDay(now);

  let currentStart: Date;
  let label: string;

  switch (period) {
    case "day":
      currentStart = startOfDay(now);
      label = "Ngày";
      break;
    case "week":
      currentStart = startOfDay(addDays(now, -6));
      label = "7 ngày";
      break;
    case "month":
      currentStart = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      label = "Tháng";
      break;
    default:
      currentStart = startOfDay(new Date(now.getFullYear(), 0, 1));
      label = "Năm";
      break;
  }

  const dayCount = Math.max(
    1,
    Math.floor((currentEnd.getTime() - currentStart.getTime()) / 86400000) + 1,
  );

  const previousEnd = endOfDay(addDays(currentStart, -1));
  const previousStart = startOfDay(addDays(previousEnd, -(dayCount - 1)));

  return {
    current: {
      start: currentStart,
      end: currentEnd,
      label,
      dayCount,
    },
    previous: {
      start: previousStart,
      end: previousEnd,
      label: "Kỳ trước",
      dayCount,
    },
  };
}

function parseDateSafe(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isInWindow(value: string, window: DateWindow): boolean {
  const date = parseDateSafe(value);
  if (!date) return false;
  return date >= window.start && date <= window.end;
}

function computePercentDelta(current: number, previous: number): number {
  if (previous > 0) return ((current - previous) / previous) * 100;
  if (current > 0) return 100;
  return 0;
}

function formatPeriodTrend(current: number, previous: number): string {
  const delta = computePercentDelta(current, previous);
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% so với kỳ trước`;
}

export default function ReportsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeTab = (searchParams.get("tab") as Tab) || "reports";

  const { data: locations = [], isLoading: locLoading } = useLocations();
  const { selectedLocationId } = useDashboardLocation();
  const hasLocations = locations.length > 0;
  const { isOwner, isLoading: isRoleLoading } = useLocationRole();

  const activeLocationId = useMemo(() => {
    if (!hasLocations) return 0;
    if (
      selectedLocationId &&
      locations.some((loc) => loc.id === selectedLocationId)
    ) {
      return selectedLocationId;
    }
    return locations[0].id;
  }, [selectedLocationId, locations, hasLocations]);

  const handleTabChange = (key: Tab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`/dashboard/reports?${params.toString()}`, {
      scroll: false,
    });
  };

  if (locLoading || isRoleLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
      </div>
    );
  }

  if (!hasLocations) {
    return (
      <NoLocationScreenSkeleton
        title="Báo cáo thống kê"
        description="Đang chờ bạn tạo địa điểm hoặc nhận lời mời trước khi tải dữ liệu."
      />
    );
  }

  if (!isOwner) {
    return <OwnerOnlyScreen featureName="Báo Cáo & Thống Kê" />;
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "reports",
      label: "Báo cáo",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      key: "periods",
      label: "Kỳ kế toán",
      icon: <Calendar className="w-4 h-4" />,
    },
    {
      key: "books",
      label: "Sổ kế toán",
      icon: <BookOpen className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Top tab bar */}
      <div className="px-8 pt-6 pb-0 border-b bg-white">
        {/* <h1 className="text-xl font-bold text-gray-900 mb-4">
          Báo cáo &amp; Thống kê
        </h1> */}
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? "border-[#23C4C1] text-[#23C4C1]"
                  : "border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-200"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50 overflow-auto">
        {activeTab === "reports" && (
          <ReportsTab locationId={activeLocationId} />
        )}
        {activeTab === "periods" && (
          <AccountingPeriodsTab locationId={activeLocationId} />
        )}
        {activeTab === "books" && <BooksTab locationId={activeLocationId} />}
      </main>
    </div>
  );
}

// ─── Tab 1: Báo cáo ─────────────────────────────────────────────────────────

function ReportsTab({ locationId }: { locationId: number }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const subTab =
    (searchParams.get("subTab") as
      | "revenue"
      | "cost"
      | "cashflow"
      | "ledger"
      | "anomalies") || "ledger";

  const handleSubTabChange = (key: typeof subTab) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("subTab", key);
    router.replace(`/dashboard/reports?${params.toString()}`, {
      scroll: false,
    });
  };
  const { data: revenues, isLoading: revLoading } = useAllRevenuesByFilters({
    locationId,
  });
  const { data: costs, isLoading: costLoading } = useAllCosts({ locationId });
  const { data: businessTypes = [] } = useBusinessTypes();
  const createCostMutation = useCreateManualCost();
  const updateCostMutation = useUpdateManualCost(locationId);
  const deleteCostMutation = useDeleteManualCost(locationId);
  const { data: costReferences } = useCostReferenceCatalog();
  const createRevenueMutation = useCreateManualRevenue();
  const updateRevenueMutation = useUpdateManualRevenue(locationId);
  const deleteRevenueMutation = useDeleteManualRevenue(locationId);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [editingRevenueId, setEditingRevenueId] = useState<number | null>(null);
  const [manualBusinessTypeId, setManualBusinessTypeId] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualChannel, setManualChannel] = useState<"cash" | "bank">("cash");
  const [manualError, setManualError] = useState("");
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [manualCostType, setManualCostType] = useState("other");
  const [manualCostAmount, setManualCostAmount] = useState("");
  const [manualCostDate, setManualCostDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [manualCostDescription, setManualCostDescription] = useState("");
  const [manualCostImage, setManualCostImage] = useState<File | null>(null);
  const [manualCostPaymentMethod, setManualCostPaymentMethod] =
    useState<ManualCostPaymentMethod>("cash");
  const [editingCostId, setEditingCostId] = useState<number | null>(null);
  const [manualCostRemoveDocument, setManualCostRemoveDocument] =
    useState(false);
  const [manualCostError, setManualCostError] = useState("");
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [revenueCardPeriod, setRevenueCardPeriod] =
    useState<CardPeriod>("month");
  const [costCardPeriod, setCostCardPeriod] = useState<CardPeriod>("month");
  const [revenueTxnPage, setRevenueTxnPage] = useState(1);
  const [costTxnPage, setCostTxnPage] = useState(1);

  useEffect(() => {
    if (!manualBusinessTypeId && businessTypes.length > 0) {
      setManualBusinessTypeId(businessTypes[0].businessTypeId);
    }
  }, [businessTypes, manualBusinessTypeId]);
  const [anomalyFilter, setAnomalyFilter] = useState<
    "unacked" | "acked" | "all"
  >("unacked");
  const { data: cashFlow, isLoading: cfLoading } = useCashFlowReport(
    locationId,
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10), // First day of current month
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10), // Last day of current month
  );
  const { data: revenueForecast, isLoading: forecastLoading } =
    useRevenueForecast(locationId);
  const acknowledgedFilter =
    anomalyFilter === "all" ? undefined : anomalyFilter === "acked";
  const { data: anomalyAlerts = [], isLoading: anomalyLoading } =
    useAnomalyAlerts(locationId, acknowledgedFilter, subTab === "anomalies");
  const acknowledgeAnomalyMutation = useAcknowledgeAnomalyAlert();
  const backfillVectorStoreMutation = useBackfillVectorStore();

  const revenueItems = useMemo(() => revenues?.items ?? [], [revenues?.items]);
  const costItems = useMemo(() => costs?.items ?? [], [costs?.items]);
  const totalRevenue = revenueItems.reduce((s, r) => s + r.amount, 0);
  const totalCost = costItems.reduce((s, c) => s + c.amount, 0);

  const revenueTxnTotalPages = Math.max(
    1,
    Math.ceil(revenueItems.length / TRANSACTION_PAGE_SIZE),
  );
  const costTxnTotalPages = Math.max(
    1,
    Math.ceil(costItems.length / TRANSACTION_PAGE_SIZE),
  );

  const revenueCurrentPage = Math.min(revenueTxnPage, revenueTxnTotalPages);
  const costCurrentPage = Math.min(costTxnPage, costTxnTotalPages);

  const revenuePageItems = useMemo(() => {
    const start = (revenueCurrentPage - 1) * TRANSACTION_PAGE_SIZE;
    return revenueItems.slice(start, start + TRANSACTION_PAGE_SIZE);
  }, [revenueItems, revenueCurrentPage]);

  const costPageItems = useMemo(() => {
    const start = (costCurrentPage - 1) * TRANSACTION_PAGE_SIZE;
    return costItems.slice(start, start + TRANSACTION_PAGE_SIZE);
  }, [costItems, costCurrentPage]);

  const revenueCardWindows = useMemo(
    () => buildPeriodWindows(revenueCardPeriod),
    [revenueCardPeriod],
  );
  const costCardWindows = useMemo(
    () => buildPeriodWindows(costCardPeriod),
    [costCardPeriod],
  );

  const revenueCurrentItems = useMemo(
    () =>
      revenueItems.filter((item) =>
        isInWindow(item.revenueDate, revenueCardWindows.current),
      ),
    [revenueItems, revenueCardWindows],
  );
  const revenuePreviousItems = useMemo(
    () =>
      revenueItems.filter((item) =>
        isInWindow(item.revenueDate, revenueCardWindows.previous),
      ),
    [revenueItems, revenueCardWindows],
  );

  const revenueCardTotal = revenueCurrentItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const revenueCardTotalPrev = revenuePreviousItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const revenueCardTxnCount = revenueCurrentItems.length;
  const revenueCardTxnCountPrev = revenuePreviousItems.length;
  const revenueCardAvgDaily =
    revenueCardWindows.current.dayCount > 0
      ? revenueCardTotal / revenueCardWindows.current.dayCount
      : 0;
  const revenueCardAvgDailyPrev =
    revenueCardWindows.previous.dayCount > 0
      ? revenueCardTotalPrev / revenueCardWindows.previous.dayCount
      : 0;
  const revenueCardAvgOrder =
    revenueCardTxnCount > 0 ? revenueCardTotal / revenueCardTxnCount : 0;
  const revenueCardAvgOrderPrev =
    revenueCardTxnCountPrev > 0
      ? revenueCardTotalPrev / revenueCardTxnCountPrev
      : 0;

  const costCurrentItems = useMemo(
    () =>
      costItems.filter((item) =>
        isInWindow(item.costDate, costCardWindows.current),
      ),
    [costItems, costCardWindows],
  );
  const costPreviousItems = useMemo(
    () =>
      costItems.filter((item) =>
        isInWindow(item.costDate, costCardWindows.previous),
      ),
    [costItems, costCardWindows],
  );

  const revenueInCostCurrentWindow = useMemo(
    () =>
      revenueItems
        .filter((item) => isInWindow(item.revenueDate, costCardWindows.current))
        .reduce((sum, item) => sum + item.amount, 0),
    [revenueItems, costCardWindows],
  );
  const revenueInCostPreviousWindow = useMemo(
    () =>
      revenueItems
        .filter((item) =>
          isInWindow(item.revenueDate, costCardWindows.previous),
        )
        .reduce((sum, item) => sum + item.amount, 0),
    [revenueItems, costCardWindows],
  );

  const costCardTotal = costCurrentItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const costCardTotalPrev = costPreviousItems.reduce(
    (sum, item) => sum + item.amount,
    0,
  );
  const costCardTxnCount = costCurrentItems.length;
  const costCardTxnCountPrev = costPreviousItems.length;
  const costCardAvgDaily =
    costCardWindows.current.dayCount > 0
      ? costCardTotal / costCardWindows.current.dayCount
      : 0;
  const costCardAvgDailyPrev =
    costCardWindows.previous.dayCount > 0
      ? costCardTotalPrev / costCardWindows.previous.dayCount
      : 0;
  const costToRevenueRatio =
    revenueInCostCurrentWindow > 0
      ? (costCardTotal / revenueInCostCurrentWindow) * 100
      : 0;
  const costToRevenueRatioPrev =
    revenueInCostPreviousWindow > 0
      ? (costCardTotalPrev / revenueInCostPreviousWindow) * 100
      : 0;

  const revenueSeries = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (6 - idx), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: `Tháng ${date.getMonth() + 1}`,
        revenue: 0,
        target: 0,
        growth: 0,
      };
    });

    const monthIndexMap = new Map(months.map((m, index) => [m.key, index]));
    for (const item of revenueItems) {
      const date = new Date(item.revenueDate);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthIndex = monthIndexMap.get(key);
      if (monthIndex !== undefined) {
        months[monthIndex].revenue += item.amount;
      }
    }

    for (let i = 0; i < months.length; i += 1) {
      const current = months[i];
      const previousRevenue = i > 0 ? months[i - 1].revenue : 0;
      current.target = Math.round(current.revenue * 1.1);
      if (i === 0) {
        current.growth = current.revenue > 0 ? 100 : 0;
      } else if (previousRevenue > 0) {
        current.growth =
          ((current.revenue - previousRevenue) / previousRevenue) * 100;
      } else {
        current.growth = current.revenue > 0 ? 100 : 0;
      }
    }

    return months;
  }, [revenueItems]);

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

    const latestMonthKey = revenueSeries.at(-1)?.key;
    const previousMonthKey = revenueSeries.at(-2)?.key;

    for (const item of revenueItems) {
      const sourceKey = item.paymentMethod ?? item.moneyChannel ?? "other";
      const sourceLabel =
        sourceKey === "cash"
          ? "Tiền mặt"
          : sourceKey === "bank"
            ? "Ngân hàng"
            : sourceKey === "debt"
              ? "Công nợ"
              : sourceKey === "mixed"
                ? "Hỗn hợp"
                : "Khác";

      const current = sourceMap.get(sourceKey) ?? {
        label: sourceLabel,
        total: 0,
        currentMonth: 0,
        previousMonth: 0,
      };

      current.total += item.amount;

      const date = new Date(item.revenueDate);
      if (!Number.isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthKey === latestMonthKey) {
          current.currentMonth += item.amount;
        }
        if (monthKey === previousMonthKey) {
          current.previousMonth += item.amount;
        }
      }

      sourceMap.set(sourceKey, current);
    }

    const rows = Array.from(sourceMap.values()).map((source) => {
      const share = totalRevenue > 0 ? (source.total / totalRevenue) * 100 : 0;
      const growth =
        source.previousMonth > 0
          ? ((source.currentMonth - source.previousMonth) /
              source.previousMonth) *
            100
          : source.currentMonth > 0
            ? 100
            : 0;

      return {
        ...source,
        share,
        growth,
      };
    });

    return rows.sort((a, b) => b.total - a.total);
  }, [revenueItems, revenueSeries, totalRevenue]);

  const revenueTrendAverage =
    revenueSeries.length > 0
      ? revenueSeries.reduce((sum, month) => sum + month.growth, 0) /
        revenueSeries.length
      : 0;

  const revenueForecastItems = useMemo(
    () => revenueForecast?.forecasts ?? [],
    [revenueForecast?.forecasts],
  );

  const revenueForecastSeries = useMemo(
    () =>
      [...revenueForecastItems]
        .sort((a, b) => a.forecastDate.localeCompare(b.forecastDate))
        .map((item) => {
          const parsedDate = new Date(`${item.forecastDate}T00:00:00`);
          const label = Number.isNaN(parsedDate.getTime())
            ? item.forecastDate
            : parsedDate.toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
              });

          return {
            label,
            forecastDate: item.forecastDate,
            predictedRevenue: item.predictedRevenue,
            lowerBound: item.lowerBound,
            upperBound: item.upperBound,
            generatedAt: item.generatedAt,
          };
        }),
    [revenueForecastItems],
  );

  const forecastTotalRevenue = revenueForecastSeries.reduce(
    (sum, item) => sum + item.predictedRevenue,
    0,
  );
  const forecastAverageDailyRevenue =
    revenueForecastSeries.length > 0
      ? forecastTotalRevenue / revenueForecastSeries.length
      : 0;
  const forecastAverageRange =
    revenueForecastSeries.length > 0
      ? revenueForecastSeries.reduce(
          (sum, item) => sum + Math.max(item.upperBound - item.lowerBound, 0),
          0,
        ) / revenueForecastSeries.length
      : 0;
  const forecastGeneratedAt = revenueForecastSeries[0]?.generatedAt;
  const forecastTrendNote = revenueForecastItems.find((item) =>
    item.trendNote?.trim(),
  )?.trendNote;

  const anomalyCriticalCount = useMemo(
    () =>
      anomalyAlerts.filter(
        (item) => item.severity?.toUpperCase() === "CRITICAL",
      ).length,
    [anomalyAlerts],
  );
  const anomalyWarningCount = useMemo(
    () =>
      anomalyAlerts.filter((item) => item.severity?.toUpperCase() === "WARNING")
        .length,
    [anomalyAlerts],
  );

  const costSeries = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 7 }, (_, idx) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (6 - idx), 1);
      return {
        key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`,
        label: `Tháng ${date.getMonth() + 1}`,
        cost: 0,
        budget: 0,
      };
    });

    const monthIndexMap = new Map(months.map((m, index) => [m.key, index]));
    for (const item of costItems) {
      const date = new Date(item.costDate);
      if (Number.isNaN(date.getTime())) continue;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const monthIndex = monthIndexMap.get(key);
      if (monthIndex !== undefined) {
        months[monthIndex].cost += item.amount;
      }
    }

    for (const month of months) {
      month.budget = Math.round(month.cost * 1.12);
    }

    return months;
  }, [costItems]);

  const costCategoryRows = useMemo(() => {
    const categoryMap = new Map<
      string,
      {
        key: string;
        label: string;
        total: number;
        currentMonth: number;
        previousMonth: number;
      }
    >();
    const latestMonthKey = costSeries.at(-1)?.key;
    const previousMonthKey = costSeries.at(-2)?.key;

    for (const item of costItems) {
      const key = item.costType || "other";
      const current = categoryMap.get(key) ?? {
        key,
        label: COST_LABELS[key] ?? key,
        total: 0,
        currentMonth: 0,
        previousMonth: 0,
      };

      current.total += item.amount;

      const date = new Date(item.costDate);
      if (!Number.isNaN(date.getTime())) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (monthKey === latestMonthKey) current.currentMonth += item.amount;
        if (monthKey === previousMonthKey) current.previousMonth += item.amount;
      }

      categoryMap.set(key, current);
    }

    return Array.from(categoryMap.values())
      .map((category) => {
        const budget = Math.round(category.total * 1.05);
        const usage = budget > 0 ? (category.total / budget) * 100 : 0;
        const growth =
          category.previousMonth > 0
            ? ((category.currentMonth - category.previousMonth) /
                category.previousMonth) *
              100
            : category.currentMonth > 0
              ? 100
              : 0;

        return {
          ...category,
          budget,
          usage,
          growth,
          share: totalCost > 0 ? (category.total / totalCost) * 100 : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [costItems, costSeries, totalCost]);

  const averageCostGrowth =
    costSeries.length > 1
      ? costSeries.slice(1).reduce((sum, month, index) => {
          const previous = costSeries[index].cost;
          if (previous <= 0) return sum + (month.cost > 0 ? 100 : 0);
          return sum + ((month.cost - previous) / previous) * 100;
        }, 0) /
        (costSeries.length - 1)
      : 0;

  const subTabs = [
    {
      key: "ledger" as const,
      label: "Sổ cái",
      icon: <BookOpen className="w-3.5 h-3.5" />,
    },
    {
      key: "revenue" as const,
      label: "Doanh thu",
      icon: <DollarSign className="w-3.5 h-3.5" />,
    },
    {
      key: "cost" as const,
      label: "Chi phí",
      icon: <TrendingDown className="w-3.5 h-3.5" />,
    },
    {
      key: "cashflow" as const,
      label: "Dòng tiền",
      icon: <Banknote className="w-3.5 h-3.5" />,
    },
    {
      key: "anomalies" as const,
      label: "Bất thường",
      icon: <AlertCircle className="w-3.5 h-3.5" />,
    },
  ];
  const costTypeOptions = useMemo<ManualCostType[]>(() => {
    const raw = costReferences?.costTypes ?? DEFAULT_COST_TYPE_OPTIONS;
    const valid = raw
      .map((type) =>
        String(type || "")
          .trim()
          .toLowerCase(),
      )
      .filter((type): type is ManualCostType =>
        ["import", ...DEFAULT_COST_TYPE_OPTIONS].includes(
          type as ManualCostType,
        ),
      )
      .filter((type) => type !== "import");

    return valid.length > 0
      ? valid
      : (Array.from(DEFAULT_COST_TYPE_OPTIONS) as ManualCostType[]);
  }, [costReferences?.costTypes]);

  const paymentMethodOptions = useMemo<ManualCostPaymentMethod[]>(() => {
    const raw =
      costReferences?.paymentMethods ?? DEFAULT_PAYMENT_METHOD_OPTIONS;
    const valid = raw.filter(
      (method): method is ManualCostPaymentMethod =>
        method === "cash" || method === "bank",
    );

    return valid.length > 0
      ? valid
      : (Array.from(
          DEFAULT_PAYMENT_METHOD_OPTIONS,
        ) as ManualCostPaymentMethod[]);
  }, [costReferences?.paymentMethods]);

  useEffect(() => {
    if (!costTypeOptions.includes(manualCostType as ManualCostType)) {
      setManualCostType(costTypeOptions[0] ?? "other");
    }
  }, [costTypeOptions, manualCostType]);

  useEffect(() => {
    if (!paymentMethodOptions.includes(manualCostPaymentMethod)) {
      setManualCostPaymentMethod(paymentMethodOptions[0] ?? "cash");
    }
  }, [paymentMethodOptions, manualCostPaymentMethod]);

  function resetRevenueForm() {
    setEditingRevenueId(null);
    setManualAmount("");
    setManualDate(new Date().toISOString().slice(0, 10));
    setManualBusinessTypeId(businessTypes[0]?.businessTypeId ?? "");
    setManualDescription("");
    setManualChannel("cash");
    setManualError("");
  }

  function generateIdempotencyKey() {
    try {
      // Prefer crypto API when available
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cryptoObj = (globalThis as any).crypto || (window as any).crypto;
      if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
        return cryptoObj.randomUUID();
      }
    } catch {
      // fallthrough
    }
    // Fallback: simple UUID v4-ish generator
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      // eslint-disable-next-line no-bitwise
      const r = (Math.random() * 16) | 0;
      // eslint-disable-next-line no-bitwise
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function handleStartEditManualRevenue(revenue: RevenueRecord) {
    setEditingRevenueId(revenue.revenueId);
    setManualAmount(String(revenue.amount));
    setManualDate(
      revenue.revenueDate?.slice(0, 10) ||
        new Date().toISOString().slice(0, 10),
    );
    setManualBusinessTypeId(
      revenue.businessTypeId || businessTypes[0]?.businessTypeId || "",
    );
    setManualDescription(revenue.description || "");
    setManualChannel((revenue.moneyChannel || "cash") as "cash" | "bank");
    setManualError("");
    setIsRevenueModalOpen(true);
  }

  async function handleSubmitManualRevenue() {
    setManualError("");
    const amount = Number(manualAmount);
    if (!amount || amount <= 0) {
      setManualError("Số tiền phải lớn hơn 0.");
      return false;
    }

    if (!manualDate) {
      setManualError("Vui lòng chọn ngày ghi nhận doanh thu.");
      return false;
    }

    if (!manualDescription.trim()) {
      setManualError("Vui lòng nhập mô tả doanh thu.");
      return false;
    }

    if (!manualBusinessTypeId) {
      setManualError("Vui lòng chọn loại hình kinh doanh.");
      return false;
    }

    try {
      if (editingRevenueId) {
        await updateRevenueMutation.mutateAsync({
          revenueId: editingRevenueId,
          data: {
            businessTypeId: manualBusinessTypeId,
            amount,
            revenueDate: manualDate,
            description: manualDescription.trim(),
            moneyChannel: manualChannel,
            idempotencyKey: generateIdempotencyKey(),
          },
        });
      } else {
        await createRevenueMutation.mutateAsync({
          businessLocationId: locationId,
          businessTypeId: manualBusinessTypeId,
          amount,
          revenueDate: manualDate,
          description: manualDescription.trim(),
          moneyChannel: manualChannel,
        });
      }
      resetRevenueForm();
      return true;
    } catch (error) {
      setManualError(
        error instanceof Error
          ? error.message
          : editingRevenueId
            ? "Không thể cập nhật doanh thu thủ công."
            : "Không thể tạo doanh thu thủ công.",
      );
      return false;
    }
  }

  async function handleDeleteManualRevenue(revenueId: number) {
    try {
      await deleteRevenueMutation.mutateAsync(revenueId);
    } catch {
      // Error feedback can be added later near delete action if needed.
    }
  }

  function validateManualCostInput() {
    const amount = Number(manualCostAmount);
    if (!amount || amount <= 0) {
      return "Số tiền chi phí phải lớn hơn 0.";
    }

    if (!manualCostDate) {
      return "Vui lòng chọn ngày chi phí.";
    }

    if (!manualCostDescription.trim()) {
      return "Vui lòng nhập mô tả chi phí.";
    }

    if (!manualCostType) {
      return "Vui lòng chọn loại chi phí.";
    }

    return "";
  }

  async function handleSubmitManualCost() {
    setManualCostError("");
    const error = validateManualCostInput();
    if (error) {
      setManualCostError(error);
      return false;
    }

    const basePayload = {
      description: manualCostDescription.trim(),
      amount: Number(manualCostAmount),
      costDate: manualCostDate,
      paymentMethod: manualCostPaymentMethod,
      image: manualCostImage ?? undefined,
    };

    try {
      if (editingCostId) {
        await updateCostMutation.mutateAsync({
          costId: editingCostId,
          data: {
            ...basePayload,
            removeDocument: manualCostRemoveDocument,
          },
        });
      } else {
        const selectedCostType = costTypeOptions.includes(
          manualCostType as ManualCostType,
        )
          ? (manualCostType as ManualCostType)
          : "other";

        await createCostMutation.mutateAsync({
          businessLocationId: locationId,
          costType: selectedCostType,
          ...basePayload,
        });
      }

      setEditingCostId(null);
      setManualCostType("other");
      setManualCostAmount("");
      setManualCostDescription("");
      setManualCostDate(new Date().toISOString().slice(0, 10));
      setManualCostPaymentMethod("cash");
      setManualCostRemoveDocument(false);
      setManualCostImage(null);
      setManualCostError("");
      return true;
    } catch (e) {
      setManualCostError(
        e instanceof Error ? e.message : "Không thể lưu chi phí thủ công.",
      );
      return false;
    }
  }

  function handleStartEditCost(cost: {
    costId: number;
    costType: string;
    amount: number;
    costDate: string;
    description: string;
    paymentMethod?: "cash" | "bank";
  }) {
    setEditingCostId(cost.costId);
    setManualCostType(cost.costType || "other");
    setManualCostAmount(String(cost.amount));
    setManualCostDate(
      cost.costDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    );
    setManualCostDescription(cost.description || "");
    setManualCostPaymentMethod(cost.paymentMethod || "cash");
    setManualCostRemoveDocument(false);
    setManualCostError("");
    setIsCostModalOpen(true);
  }

  function handleCancelEditCost() {
    setEditingCostId(null);
    setManualCostType("other");
    setManualCostAmount("");
    setManualCostDate(new Date().toISOString().slice(0, 10));
    setManualCostDescription("");
    setManualCostPaymentMethod("cash");
    setManualCostRemoveDocument(false);
    setManualCostImage(null);
    setManualCostError("");
    setIsCostModalOpen(false);
  }

  function handleOpenCreateCostModal() {
    setEditingCostId(null);
    setManualCostType("other");
    setManualCostAmount("");
    setManualCostDate(new Date().toISOString().slice(0, 10));
    setManualCostDescription("");
    setManualCostPaymentMethod("cash");
    setManualCostRemoveDocument(false);
    setManualCostImage(null);
    setManualCostError("");
    setIsCostModalOpen(true);
  }

  async function handleDeleteManualCost(costId: number) {
    try {
      await deleteCostMutation.mutateAsync(costId);
      if (editingCostId === costId) {
        handleCancelEditCost();
      }
    } catch {
      // Keep table simple for now, validation/error feedback already exists on form.
    }
  }

  async function handleAcknowledgeAnomaly(id: string) {
    try {
      await acknowledgeAnomalyMutation.mutateAsync({ id, locationId });
      toast.success("Đã xác nhận cảnh báo");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Không thể xác nhận cảnh báo",
      );
    }
  }

  async function handleBackfillVectorStore() {
    try {
      const response =
        await backfillVectorStoreMutation.mutateAsync(locationId);
      const result = response.data;
      toast.success(
        `Backfill thành công: synced ${result.synced}, skipped ${result.skipped}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Không thể backfill vector store",
      );
    }
  }

  return (
    <div className="space-y-5">
      {/* Sub tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleSubTabChange(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              subTab === t.key
                ? "bg-white text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "ledger" && <GeneralLedgerTab locationId={locationId} />}

      {/* Revenue */}
      {subTab === "revenue" && (
        <DataCard
          title="Doanh thu"
          subtitle={
            revenues
              ? `${revenueCardWindows.current.label}: ${new Intl.NumberFormat("vi-VN").format(revenueCardTxnCount)} giao dịch · Tổng: ${formatVnd(revenueCardTotal)}`
              : undefined
          }
          loading={revLoading}
        >
          <div className="p-5 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  Tổng quan doanh thu
                </h4>
                <p className="text-sm text-gray-500">
                  Theo dõi xu hướng doanh thu và thêm ghi nhận thủ công.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                  {CARD_PERIOD_OPTIONS.map((option) => (
                    <button
                      key={`rev-period-${option.key}`}
                      onClick={() => setRevenueCardPeriod(option.key)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                        revenueCardPeriod === option.key
                          ? "bg-white text-gray-800 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <Button
                  onClick={() => {
                    resetRevenueForm();
                    setIsRevenueModalOpen(true);
                  }}
                  className="bg-[#23C4C1] hover:bg-[#1aa8a5] text-white"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Thêm doanh thu
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <RevenueStatCard
                title={`Tổng doanh thu (${revenueCardWindows.current.label})`}
                value={formatCompactVnd(revenueCardTotal)}
                trend={formatPeriodTrend(
                  revenueCardTotal,
                  revenueCardTotalPrev,
                )}
                positive={revenueCardTotal >= revenueCardTotalPrev}
              />
              <RevenueStatCard
                title="Trung bình mỗi ngày"
                value={formatCompactVnd(revenueCardAvgDaily)}
                trend={formatPeriodTrend(
                  revenueCardAvgDaily,
                  revenueCardAvgDailyPrev,
                )}
                positive={revenueCardAvgDaily >= revenueCardAvgDailyPrev}
              />
              <RevenueStatCard
                title="Giá trị giao dịch TB"
                value={formatCompactVnd(revenueCardAvgOrder)}
                trend={formatPeriodTrend(
                  revenueCardAvgOrder,
                  revenueCardAvgOrderPrev,
                )}
                positive={revenueCardAvgOrder >= revenueCardAvgOrderPrev}
              />
              <RevenueStatCard
                title="Số lượng giao dịch"
                value={new Intl.NumberFormat("vi-VN").format(
                  revenueCardTxnCount,
                )}
                trend={formatPeriodTrend(
                  revenueCardTxnCount,
                  revenueCardTxnCountPrev,
                )}
                positive={revenueCardTxnCount >= revenueCardTxnCountPrev}
              />
            </div>

            <div className="rounded-2xl border p-4 space-y-4 bg-linear-to-br from-slate-50 to-cyan-50/50">
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <h5 className="text-xl font-semibold leading-none text-gray-900">
                    Dự báo doanh thu 7 ngày tới
                  </h5>
                  <p className="text-sm text-gray-500 mt-2">
                    Dữ liệu đã được tính sẵn theo lịch nightly job, không gọi AI
                    realtime.
                  </p>
                </div>
                <Badge className="w-fit bg-blue-100 text-blue-700 border border-blue-200">
                  AI Forecast
                </Badge>
              </div>

              {forecastLoading ? (
                <div className="h-56 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
                </div>
              ) : revenueForecastSeries.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl border bg-white p-3">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                        Tổng 7 ngày
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatCompactVnd(forecastTotalRevenue)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-white p-3">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                        Trung bình / ngày
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatCompactVnd(forecastAverageDailyRevenue)}
                      </p>
                    </div>
                    <div className="rounded-xl border bg-white p-3">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-500">
                        Biên độ dự báo TB
                      </p>
                      <p className="text-lg font-bold text-gray-900 mt-1">
                        {formatCompactVnd(forecastAverageRange)}
                      </p>
                    </div>
                  </div>

                  <RevenueForecastChart data={revenueForecastSeries} />

                  {forecastTrendNote && (
                    <div className="rounded-xl border bg-white/80 p-3">
                      <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-1">
                        Nhận định xu hướng
                      </p>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {forecastTrendNote}
                      </p>
                    </div>
                  )}

                  <p className="text-xs text-gray-500 text-right">
                    {forecastGeneratedAt
                      ? `Cập nhật lúc: ${formatDateTimeVi(forecastGeneratedAt)}`
                      : ""}
                  </p>
                </>
              ) : (
                <div className="rounded-xl border bg-white p-6 text-sm text-gray-500">
                  Chưa có dữ liệu dự báo doanh thu cho địa điểm này.
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4">
                <h5 className="text-xl font-semibold leading-none text-gray-900 mb-4">
                  Doanh Thu vs Thực Tế
                </h5>
                <RevenueBarsChart data={revenueSeries} />
              </div>
              <div className="rounded-2xl border p-4">
                <h5 className="text-xl font-semibold leading-none text-gray-900 mb-4">
                  Xu Hướng Tăng Trưởng Doanh Thu
                </h5>
                <RevenueGrowthDots data={revenueSeries} />
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-white">
                <h5 className="text-xl font-semibold leading-none text-gray-900">
                  Chi Tiết Doanh Thu Theo Nguồn
                </h5>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead>Nguồn Doanh Thu</TableHead>
                    <TableHead className="text-right">Tổng Doanh Thu</TableHead>
                    <TableHead className="text-right">% Tổng</TableHead>
                    <TableHead className="text-right">
                      Tỷ Lệ Tăng Trưởng
                    </TableHead>
                    <TableHead className="text-right">Xu Hướng</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenueSourceRows.map((row) => (
                    <TableRow key={row.label}>
                      <TableCell className="font-medium">{row.label}</TableCell>
                      <TableCell className="text-right font-semibold text-gray-800">
                        {formatCompactVnd(row.total)}
                      </TableCell>
                      <TableCell className="text-right text-gray-600">
                        {row.share.toFixed(1)}%
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold ${row.growth >= 0 ? "text-emerald-600" : "text-red-500"}`}
                      >
                        {row.growth >= 0 ? "+" : ""}
                        {row.growth.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          className={
                            row.growth >= 0
                              ? "bg-blue-600 text-white"
                              : "bg-pink-500 text-white"
                          }
                        >
                          {row.growth >= 0 ? "↑ Tăng" : "↓ Giảm"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {revenueSourceRows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-8 text-gray-500"
                      >
                        Chưa có dữ liệu doanh thu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">
                    Tổng từ tất cả các nguồn
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCompactVnd(totalRevenue)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Tỷ lệ tăng trưởng trung bình
                  </p>
                  <p
                    className={`text-3xl font-bold ${revenueTrendAverage >= 0 ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {revenueTrendAverage >= 0 ? "+" : ""}
                    {revenueTrendAverage.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-white">
                <h5 className="font-semibold text-gray-900">
                  Danh sách giao dịch
                </h5>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                    <TableHead className="pl-5">Ngày</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>PTTT</TableHead>
                    <TableHead className="text-right pr-5">Số tiền</TableHead>
                    <TableHead className="text-right pr-5">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenuePageItems.map((r) => (
                    <TableRow key={r.revenueId} className="hover:bg-gray-50/50">
                      <TableCell className="pl-5 text-sm text-gray-500">
                        {new Date(r.revenueDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.revenueType === "sale"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {r.revenueType === "sale" ? "Bán hàng" : "Thủ công"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate text-gray-700">
                        {r.description}
                      </TableCell>
                      <TableCell>
                        <PaymentBadge method={r.paymentMethod} />
                      </TableCell>
                      <TableCell className="text-right pr-5 font-semibold text-emerald-600">
                        {formatVnd(r.amount)}
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        {r.revenueType === "manual" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEditManualRevenue(r)}
                              disabled={updateRevenueMutation.isPending}
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() =>
                                handleDeleteManualRevenue(r.revenueId)
                              }
                              disabled={deleteRevenueMutation.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {revenuePageItems.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-gray-500"
                      >
                        Chưa có dữ liệu doanh thu.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between gap-2">
                <p className="text-sm text-gray-600">
                  Tổng {revenueItems.length} giao dịch · Trang{" "}
                  {revenueCurrentPage}/{revenueTxnTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={revenueCurrentPage <= 1}
                    onClick={() => setRevenueTxnPage(revenueCurrentPage - 1)}
                  >
                    Trang trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={revenueCurrentPage >= revenueTxnTotalPages}
                    onClick={() => setRevenueTxnPage(revenueCurrentPage + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Dialog
            open={isRevenueModalOpen}
            onOpenChange={(open) => {
              setIsRevenueModalOpen(open);
              if (!open) resetRevenueForm();
            }}
          >
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRevenueId
                    ? "Cập nhật doanh thu thủ công"
                    : "Tạo doanh thu thủ công"}
                </DialogTitle>
                <DialogDescription>
                  {editingRevenueId
                    ? "Chỉnh sửa thông tin giao dịch doanh thu ngoài đơn hàng."
                    : "Nhập thông tin giao dịch để ghi nhận doanh thu ngoài đơn hàng."}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  value={manualBusinessTypeId}
                  onValueChange={(value) => setManualBusinessTypeId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Loại hình kinh doanh" />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((businessType) => (
                      <SelectItem
                        key={businessType.businessTypeId}
                        value={businessType.businessTypeId}
                      >
                        {businessType.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  placeholder="Số tiền"
                  value={manualAmount}
                  onChange={(e) => setManualAmount(e.target.value)}
                />
                <Input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                />
                <Select
                  value={manualChannel}
                  onValueChange={(value) =>
                    setManualChannel(value as "cash" | "bank")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Kênh tiền" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Tiền mặt</SelectItem>
                    <SelectItem value="bank">Ngân hàng</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  className="md:col-span-2"
                  placeholder="Mô tả doanh thu"
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                />
              </div>

              {manualError && (
                <p className="text-sm text-red-500">{manualError}</p>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    resetRevenueForm();
                    setIsRevenueModalOpen(false);
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={async () => {
                    const saved = await handleSubmitManualRevenue();
                    if (saved) {
                      setIsRevenueModalOpen(false);
                    }
                  }}
                  disabled={
                    createRevenueMutation.isPending ||
                    updateRevenueMutation.isPending
                  }
                  className="bg-[#23C4C1] hover:bg-[#1aa8a5] text-white"
                >
                  {createRevenueMutation.isPending ||
                  updateRevenueMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1" />
                  )}
                  {editingRevenueId ? "Lưu thay đổi" : "Lưu doanh thu"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DataCard>
      )}

      {/* Cost */}
      {subTab === "cost" && (
        <DataCard
          title="Chi phí"
          subtitle={
            costs
              ? `${costCardWindows.current.label}: ${new Intl.NumberFormat("vi-VN").format(costCardTxnCount)} giao dịch · Tổng: ${formatVnd(costCardTotal)}`
              : undefined
          }
          loading={costLoading}
        >
          <div className="p-5 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {CARD_PERIOD_OPTIONS.map((option) => (
                  <button
                    key={`cost-period-${option.key}`}
                    onClick={() => setCostCardPeriod(option.key)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                      costCardPeriod === option.key
                        ? "bg-white text-gray-800 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <Button
                onClick={handleOpenCreateCostModal}
                className="bg-[#23C4C1] hover:bg-[#1aa8a5] text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm chi phí
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <CostStatCard
                title={`Tổng chi phí (${costCardWindows.current.label})`}
                value={formatCompactVnd(costCardTotal)}
                trend={formatPeriodTrend(costCardTotal, costCardTotalPrev)}
                positive={costCardTotal <= costCardTotalPrev}
              />
              <CostStatCard
                title="Trung bình mỗi ngày"
                value={formatCompactVnd(costCardAvgDaily)}
                trend={formatPeriodTrend(
                  costCardAvgDaily,
                  costCardAvgDailyPrev,
                )}
                positive={costCardAvgDaily <= costCardAvgDailyPrev}
              />
              <CostStatCard
                title="Tỷ trọng chi phí / doanh thu"
                value={`${costToRevenueRatio.toFixed(1)}%`}
                trend={formatPeriodTrend(
                  costToRevenueRatio,
                  costToRevenueRatioPrev,
                )}
                positive={costToRevenueRatio <= costToRevenueRatioPrev}
              />
              <CostStatCard
                title="Số lượng giao dịch"
                value={new Intl.NumberFormat("vi-VN").format(costCardTxnCount)}
                trend={formatPeriodTrend(
                  costCardTxnCount,
                  costCardTxnCountPrev,
                )}
                positive={costCardTxnCount <= costCardTxnCountPrev}
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <div className="rounded-2xl border p-4">
                <h5 className="text-xl font-semibold leading-none text-gray-900 mb-4">
                  Phân Bổ Chi Phí
                </h5>
                <CostPieChart data={costCategoryRows} />
              </div>
              <div className="rounded-2xl border p-4">
                <h5 className="text-xl font-semibold leading-none text-gray-900 mb-4">
                  Xu Hướng Chi Phí vs Ngân Sách
                </h5>
                <CostBudgetBarsChart data={costSeries} />
              </div>
            </div>

            <div className="rounded-2xl border p-4">
              <h5 className="text-xl font-semibold leading-none text-gray-900 mb-4">
                Phân Tích Xu Hướng Chi Phí
              </h5>
              <CostTrendDots data={costSeries} />
            </div>

            <div className="rounded-2xl border p-4">
              <h5 className="text-2xl font-semibold leading-none text-gray-900 mb-4">
                Các Danh Mục Chi Phí &amp; Trạng Thái Ngân Sách
              </h5>
              <CostBudgetCategoryList data={costCategoryRows} />
            </div>

            <div className="rounded-2xl border overflow-hidden">
              <div className="px-4 py-3 border-b bg-white">
                <h5 className="font-semibold text-gray-900">
                  Danh sách giao dịch
                </h5>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                    <TableHead className="pl-5">Ngày</TableHead>
                    <TableHead>Phân loại</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>PTTT</TableHead>
                    <TableHead className="text-right pr-5">Số tiền</TableHead>
                    <TableHead className="text-right pr-5">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costPageItems.map((c) => (
                    <TableRow key={c.costId} className="hover:bg-gray-50/50">
                      <TableCell className="pl-5 text-sm text-gray-500">
                        {new Date(c.costDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <CostBadge type={c.costType} />
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate text-gray-700">
                        {c.description}
                      </TableCell>
                      <TableCell>
                        <PaymentBadge method={c.paymentMethod} />
                      </TableCell>
                      <TableCell className="text-right pr-5 font-semibold text-red-500">
                        {formatVnd(c.amount)}
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        {c.importId == null ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleStartEditCost({
                                  costId: c.costId,
                                  costType: c.costType,
                                  amount: c.amount,
                                  costDate: c.costDate,
                                  description: c.description,
                                  paymentMethod: c.paymentMethod,
                                })
                              }
                            >
                              Sửa
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleDeleteManualCost(c.costId)}
                              disabled={deleteCostMutation.isPending}
                            >
                              <Trash2 className="w-3.5 h-3.5 mr-1" />
                              Xóa
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {costPageItems.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="py-8 text-center text-gray-500"
                      >
                        Chưa có dữ liệu chi phí.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

              <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between gap-2">
                <p className="text-sm text-gray-600">
                  Tổng {costItems.length} giao dịch · Trang {costCurrentPage}/
                  {costTxnTotalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={costCurrentPage <= 1}
                    onClick={() => setCostTxnPage(costCurrentPage - 1)}
                  >
                    Trang trước
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={costCurrentPage >= costTxnTotalPages}
                    onClick={() => setCostTxnPage(costCurrentPage + 1)}
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Dialog
            open={isCostModalOpen}
            onOpenChange={(open) => {
              setIsCostModalOpen(open);
              if (!open) {
                setManualCostError("");
              }
            }}
          >
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCostId
                    ? "Cập nhật chi phí thủ công"
                    : "Tạo chi phí thủ công"}
                </DialogTitle>
                <DialogDescription>
                  Điền thông tin để thêm chi phí, hoặc cập nhật bản ghi thủ
                  công.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Select
                  value={manualCostType}
                  onValueChange={(value) => setManualCostType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Loại chi phí" />
                  </SelectTrigger>
                  <SelectContent>
                    {costTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {COST_LABELS[type] ?? type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min="0"
                  placeholder="Số tiền"
                  value={manualCostAmount}
                  onChange={(e) => setManualCostAmount(e.target.value)}
                />
                <Input
                  type="date"
                  value={manualCostDate}
                  onChange={(e) => setManualCostDate(e.target.value)}
                />
                <Select
                  value={manualCostPaymentMethod}
                  onValueChange={(value) =>
                    setManualCostPaymentMethod(value as ManualCostPaymentMethod)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="PTTT" />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethodOptions.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method === "cash" ? "Tiền mặt" : "Ngân hàng"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  className="md:col-span-2"
                  placeholder="Mô tả chi phí"
                  value={manualCostDescription}
                  onChange={(e) => setManualCostDescription(e.target.value)}
                />
                <Input
                  className="md:col-span-2"
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setManualCostImage(e.target.files?.[0] ?? null)
                  }
                />
                {editingCostId ? (
                  <label className="md:col-span-2 inline-flex items-center gap-2 text-sm text-gray-700">
                    <Checkbox
                      checked={manualCostRemoveDocument}
                      onCheckedChange={(checked) =>
                        setManualCostRemoveDocument(checked === true)
                      }
                    />
                    Xóa chứng từ hiện tại (RemoveDocument)
                  </label>
                ) : null}
              </div>

              {manualCostError && (
                <p className="text-sm text-red-500">{manualCostError}</p>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={handleCancelEditCost}>
                  Hủy
                </Button>
                <Button
                  onClick={async () => {
                    const saved = await handleSubmitManualCost();
                    if (saved) {
                      setIsCostModalOpen(false);
                    }
                  }}
                  disabled={
                    createCostMutation.isPending || updateCostMutation.isPending
                  }
                  className="bg-[#23C4C1] hover:bg-[#1aa8a5] text-white"
                >
                  {createCostMutation.isPending ||
                  updateCostMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1" />
                  )}
                  {editingCostId ? "Lưu cập nhật" : "Thêm chi phí"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DataCard>
      )}

      {/* Anomalies */}
      {subTab === "anomalies" && (
        <DataCard
          title="Cảnh báo bất thường"
          subtitle={`${anomalyAlerts.length} cảnh báo · Filter: ${anomalyFilter === "unacked" ? "Chưa xác nhận" : anomalyFilter === "acked" ? "Đã xác nhận" : "Tất cả"}`}
          loading={anomalyLoading}
        >
          <div className="p-5 space-y-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="text-base font-semibold text-gray-900">
                  Cảnh báo theo AI + Rule-based
                </h4>
                <p className="text-sm text-gray-500">
                  Theo dõi bất thường doanh thu, dữ liệu và giao dịch đáng ngờ.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void handleBackfillVectorStore()}
                  disabled={backfillVectorStoreMutation.isPending}
                >
                  {backfillVectorStoreMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : null}
                  Backfill vector store
                </Button> */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                  {[
                    { key: "unacked", label: "Chưa xác nhận" },
                    { key: "acked", label: "Đã xác nhận" },
                    { key: "all", label: "Tất cả" },
                  ].map((option) => (
                    <button
                      key={option.key}
                      onClick={() =>
                        setAnomalyFilter(
                          option.key as "unacked" | "acked" | "all",
                        )
                      }
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                        anomalyFilter === option.key
                          ? "bg-white text-gray-800 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border bg-red-50/50 p-3">
                <p className="text-xs uppercase tracking-wide font-semibold text-red-600">
                  Critical
                </p>
                <p className="text-2xl font-bold text-red-700 mt-1">
                  {anomalyCriticalCount}
                </p>
              </div>
              <div className="rounded-xl border bg-amber-50/50 p-3">
                <p className="text-xs uppercase tracking-wide font-semibold text-amber-600">
                  Warning
                </p>
                <p className="text-2xl font-bold text-amber-700 mt-1">
                  {anomalyWarningCount}
                </p>
              </div>
              <div className="rounded-xl border bg-slate-50 p-3">
                <p className="text-xs uppercase tracking-wide font-semibold text-slate-600">
                  Tổng số
                </p>
                <p className="text-2xl font-bold text-slate-700 mt-1">
                  {anomalyAlerts.length}
                </p>
              </div>
            </div>

            {anomalyAlerts.length > 0 ? (
              <div className="rounded-2xl border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                      <TableHead className="pl-5">Mức độ</TableHead>
                      <TableHead>Loại cảnh báo</TableHead>
                      <TableHead>Nội dung</TableHead>
                      <TableHead>Tầng phát hiện</TableHead>
                      <TableHead>Mốc dữ liệu</TableHead>
                      <TableHead className="pr-5">Sinh lúc</TableHead>
                      <TableHead className="pr-5 text-right">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {anomalyAlerts.map((alert) => {
                      const severityMeta = getAnomalySeverityMeta(
                        alert.severity,
                      );

                      return (
                        <TableRow
                          key={alert.id}
                          className="hover:bg-gray-50/50"
                        >
                          <TableCell className="pl-5">
                            <Badge
                              variant="outline"
                              className={severityMeta.badgeClass}
                            >
                              {severityMeta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-gray-800">
                            {getAnomalyTypeLabel(alert.alertType)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-xl">
                            <p className="line-clamp-2">{alert.description}</p>
                            <p className="text-[11px] text-gray-500 mt-1">
                              {alert.isAcknowledged
                                ? "Đã xác nhận"
                                : "Chưa xác nhận"}
                            </p>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {alert.tier}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {new Date(alert.referenceDate).toLocaleDateString(
                              "vi-VN",
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-500 pr-5">
                            {formatDateTimeVi(alert.generatedAt)}
                          </TableCell>
                          <TableCell className="text-right pr-5">
                            {alert.isAcknowledged ? (
                              <span className="text-xs text-gray-400">-</span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() =>
                                  void handleAcknowledgeAnomaly(alert.id)
                                }
                                disabled={acknowledgeAnomalyMutation.isPending}
                              >
                                <Check className="w-3.5 h-3.5 mr-1" />
                                Đã xem
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="rounded-xl border bg-white p-6 text-sm text-gray-500">
                Không có cảnh báo phù hợp với bộ lọc hiện tại.
              </div>
            )}
          </div>
        </DataCard>
      )}

      {/* Cash Flow */}
      {subTab === "cashflow" &&
        (cfLoading ? (
          <div className="bg-white rounded-2xl border p-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
          </div>
        ) : cashFlow ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cashFlow.channels.map((ch) => (
                <div
                  key={ch.channel}
                  className="bg-white rounded-2xl border p-5 space-y-4"
                >
                  <div className="flex items-center gap-2">
                    {ch.channel === "cash" && (
                      <Banknote className="w-5 h-5 text-emerald-500" />
                    )}
                    {ch.channel === "bank" && (
                      <Landmark className="w-5 h-5 text-blue-500" />
                    )}
                    {ch.channel === "debt" && (
                      <CreditCard className="w-5 h-5 text-amber-500" />
                    )}
                    <h4 className="font-semibold text-gray-800">
                      {ch.channel === "cash"
                        ? "Tiền mặt"
                        : ch.channel === "bank"
                          ? "Ngân hàng"
                          : "Công nợ"}
                    </h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Vào</span>
                      <span className="font-medium text-emerald-600">
                        +{formatVnd(ch.totalIn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ra</span>
                      <span className="font-medium text-red-500">
                        -{formatVnd(ch.totalOut)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Ròng</span>
                      <span className="font-bold text-gray-900">
                        {formatVnd(ch.net)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border p-5">
              <h4 className="font-semibold text-gray-800 mb-4">
                Tổng hợp dòng tiền
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {[
                  {
                    label: "Tổng vào",
                    value: cashFlow.channels.reduce((s, c) => s + c.totalIn, 0),
                    color: "text-emerald-600",
                  },
                  {
                    label: "Tổng ra",
                    value: cashFlow.channels.reduce(
                      (s, c) => s + c.totalOut,
                      0,
                    ),
                    color: "text-red-500",
                  },
                  {
                    label: "Ròng tiền mặt",
                    value:
                      cashFlow.channels.find((c) => c.channel === "cash")
                        ?.net ?? 0,
                    color: "text-gray-900",
                  },
                  {
                    label: "Nợ phát sinh",
                    value:
                      cashFlow.channels.find((c) => c.channel === "debt")
                        ?.totalIn ?? 0,
                    color: "text-amber-600",
                  },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-gray-400 text-xs mb-1">{item.label}</p>
                    <p className={`font-bold text-lg ${item.color}`}>
                      {formatVnd(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null)}
    </div>
  );
}

// ─── Tab 3: Sổ kế toán ──────────────────────────────────────────────────────

function BooksTab({ locationId }: { locationId: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: periods, isLoading: periodLoading } =
    useAccountingPeriods(locationId);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | undefined>(
    undefined,
  );
  const [expandedBookId, setExpandedBookId] = useState<number | null>(null);

  const requestedPeriodId = useMemo(() => {
    const raw = searchParams.get("periodId");
    if (!raw) return undefined;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return undefined;
    return parsed;
  }, [searchParams]);

  useEffect(() => {
    if (!periods || periods.length === 0 || !requestedPeriodId) return;
    if (!periods.some((p) => p.periodId === requestedPeriodId)) return;
    setSelectedPeriodId(requestedPeriodId);
  }, [periods, requestedPeriodId]);

  const periodId = useMemo(() => {
    if (selectedPeriodId !== undefined) return selectedPeriodId;
    if (!periods || periods.length === 0) return undefined;
    return (
      periods.find((p) => p.status === "open")?.periodId ?? periods[0].periodId
    );
  }, [selectedPeriodId, periods]);

  const { data: templates } = useAccountingTemplates();
  const { data: books, isLoading: bookLoading } = useAccountingBooks(
    locationId,
    periodId,
  );
  const { mutateAsync: createBook, isPending: creatingBook } =
    useCreateAccountingBook(locationId);
  const { mutateAsync: deleteBook, isPending: deletingBook } =
    useDeleteAccountingBook(locationId);
  const [deletingBookId, setDeletingBookId] = useState<number | null>(null);
  const [exportingBookId, setExportingBookId] = useState<number | null>(null);

  function toSheetCell(value: unknown): string | number | boolean {
    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }
    if (typeof value === "string") {
      return value;
    }
    if (value == null) {
      return "";
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  function formatExcelDate(value: unknown): string {
    if (typeof value !== "string") return "";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("vi-VN");
  }

  function sanitizeSheetName(name: string): string {
    const sanitized = name.replace(/[\\/?*\[\]:]/g, " ").trim();
    return (sanitized || "Sheet").slice(0, 31);
  }

  async function handleExportBook(book: {
    bookId: number;
    templateCode: string;
    templateName: string;
  }) {
    try {
      setExportingBookId(book.bookId);

      const summaryResult = await fetchBookSummaryForExport(
        locationId,
        book.bookId,
      );

      const summaryData =
        (summaryResult.data as Record<string, unknown> | undefined) ?? {};

      const rawColumns = Array.isArray(summaryData.columns)
        ? (summaryData.columns as Array<Record<string, unknown>>)
        : [];

      const columns = rawColumns
        .map((column) => {
          const fieldCode = String(column.fieldCode ?? "").trim();
          const label = String(
            column.label ?? column.exportColumn ?? fieldCode,
          ).trim();
          const exportColumn = String(column.exportColumn ?? "").trim();

          if (!fieldCode) return null;

          return {
            fieldCode,
            label: label || fieldCode,
            exportColumn,
          };
        })
        .filter(
          (
            column,
          ): column is {
            fieldCode: string;
            label: string;
            exportColumn: string;
          } => column !== null,
        );

      const allRows: Array<Record<string, unknown>> = [];
      const seenCursors = new Set<string>();
      let cursor: string | undefined;
      let hasMore = true;
      let guard = 0;

      while (hasMore && guard < 500) {
        guard += 1;
        const rowsResult = await fetchBookRowsForExport(
          locationId,
          book.bookId,
          500,
          cursor,
        );

        const payload =
          (rowsResult.data as Record<string, unknown> | undefined) ?? {};

        const batchRows = Array.isArray(payload.rows)
          ? (payload.rows as Array<Record<string, unknown>>)
          : [];
        allRows.push(...batchRows);

        const nextCursor =
          typeof payload.nextCursor === "string"
            ? payload.nextCursor.trim()
            : "";

        const backendHasMore = Boolean(payload.hasMore);

        if (backendHasMore && nextCursor && !seenCursors.has(nextCursor)) {
          seenCursors.add(nextCursor);
          cursor = nextCursor;
        } else {
          hasMore = false;
        }
      }

      const keys =
        columns.length > 0
          ? columns.map((column) => column.fieldCode)
          : Array.from(
              new Set(
                allRows.flatMap((row) =>
                  Object.keys(row as Record<string, unknown>),
                ),
              ),
            );

      const headers =
        columns.length > 0
          ? columns.map((column) => column.label)
          : keys.map((key) => key);

      const headerCodes =
        columns.length > 0
          ? columns.map(
              (column, index) =>
                column.exportColumn || XLSX.utils.encode_col(index),
            )
          : keys.map((_, index) => XLSX.utils.encode_col(index));

      const sheetDataColumnCount = Math.max(3, headers.length);
      const visualColumnCount = Math.max(6, sheetDataColumnCount);
      const tableEndColumn = sheetDataColumnCount - 1;
      const rightMetaStartColumn = Math.max(3, tableEndColumn + 1);
      const rightMetaEndColumn = Math.max(
        rightMetaStartColumn,
        visualColumnCount - 1,
      );

      const minimumBodyRows = Math.max(allRows.length, 14);
      const tableHeaderRow = 8;
      const tableCodeRow = 9;
      const tableDataStartRow = 10;
      const tableDataEndRow = tableDataStartRow + minimumBodyRows - 1;
      const totalRows = tableDataEndRow + 2;

      const matrix = Array.from({ length: totalRows }, () =>
        Array(visualColumnCount).fill(""),
      );

      const ws = XLSX.utils.aoa_to_sheet(matrix);

      const borderThin = {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      };

      const styleNormal = {
        font: { name: "Times New Roman", sz: 11 },
        alignment: { vertical: "center", horizontal: "left", wrapText: true },
      };
      const styleCenter = {
        ...styleNormal,
        alignment: { vertical: "center", horizontal: "center", wrapText: true },
      };
      const styleBold = {
        ...styleNormal,
        font: { name: "Times New Roman", sz: 11, bold: true },
      };
      const styleTitle = {
        font: { name: "Times New Roman", sz: 18, bold: true },
        alignment: { vertical: "center", horizontal: "center", wrapText: true },
      };
      const styleHeader = {
        ...styleCenter,
        font: { name: "Times New Roman", sz: 12, bold: true },
        border: borderThin,
      };
      const styleCode = {
        ...styleCenter,
        font: { name: "Times New Roman", sz: 12, bold: true },
        border: borderThin,
      };
      const styleCell = {
        ...styleNormal,
        border: borderThin,
      };
      const styleCellCenter = {
        ...styleCenter,
        border: borderThin,
      };

      const setCell = (
        row: number,
        col: number,
        value: string | number | boolean,
        style: Record<string, unknown>,
      ) => {
        const addr = XLSX.utils.encode_cell({ r: row, c: col });
        const cellType = typeof value === "number" ? "n" : "s";
        ws[addr] = {
          v: value,
          t: cellType,
          s: style,
        } as unknown as XLSX.CellObject;
      };

      const setMerge = (
        startRow: number,
        startCol: number,
        endRow: number,
        endCol: number,
      ) => {
        const merges = (ws["!merges"] ?? []) as XLSX.Range[];
        merges.push({
          s: { r: startRow, c: startCol },
          e: { r: endRow, c: endCol },
        });
        ws["!merges"] = merges;
      };

      const summaryBusinessName = String(
        summaryData.ownerName ??
          summaryData.businessName ??
          summaryData.householdName ??
          "",
      ).trim();
      const summaryAddress = String(
        summaryData.locationName ?? summaryData.address ?? "",
      ).trim();
      const summaryTaxCode = String(summaryData.taxCode ?? "").trim();
      const summaryStartDate = formatExcelDate(summaryData.startDate);
      const summaryEndDate = formatExcelDate(summaryData.endDate);

      const formTitleRaw = String(book.templateName || "Sổ kế toán").trim();
      const formTitle = formTitleRaw.toUpperCase().startsWith("SỔ")
        ? formTitleRaw.toUpperCase()
        : `SỔ ${formTitleRaw.toUpperCase()}`;

      const periodText =
        summaryStartDate && summaryEndDate
          ? `${summaryStartDate} - ${summaryEndDate}`
          : "";

      setCell(
        0,
        0,
        `HỘ, CÁ NHÂN KINH DOANH: ${summaryBusinessName}`,
        styleBold,
      );
      setCell(1, 0, `Địa chỉ: ${summaryAddress}`, styleBold);
      setCell(2, 0, `Mã số thuế: ${summaryTaxCode}`, styleBold);
      setMerge(0, 0, 0, tableEndColumn);
      setMerge(1, 0, 1, tableEndColumn);
      setMerge(2, 0, 2, tableEndColumn);

      setCell(0, rightMetaStartColumn, `Mẫu số ${book.templateCode}-HKD`, {
        ...styleCenter,
        font: { name: "Times New Roman", sz: 12, bold: true },
      });
      setCell(
        1,
        rightMetaStartColumn,
        "(Kèm theo Thông tư số 152/2025/TT-BTC)",
        {
          ...styleCenter,
          font: { name: "Times New Roman", sz: 11, italic: true },
        },
      );
      setCell(
        2,
        rightMetaStartColumn,
        "ngày 31 tháng 12 năm 2025 của Bộ trưởng",
        {
          ...styleCenter,
          font: { name: "Times New Roman", sz: 11, italic: true },
        },
      );
      setCell(3, rightMetaStartColumn, "Bộ Tài chính", {
        ...styleCenter,
        font: { name: "Times New Roman", sz: 12, italic: true },
      });
      setMerge(0, rightMetaStartColumn, 0, rightMetaEndColumn);
      setMerge(1, rightMetaStartColumn, 1, rightMetaEndColumn);
      setMerge(2, rightMetaStartColumn, 2, rightMetaEndColumn);
      setMerge(3, rightMetaStartColumn, 3, rightMetaEndColumn);

      setCell(4, 0, formTitle, styleTitle);
      setMerge(4, 0, 4, tableEndColumn);

      setCell(5, 0, `Địa điểm kinh doanh: ${summaryAddress}`, styleCenter);
      setCell(6, 0, `Kỳ kê khai: ${periodText}`, styleCenter);
      setMerge(5, 0, 5, tableEndColumn);
      setMerge(6, 0, 6, tableEndColumn);

      setCell(7, tableEndColumn, "Đơn vị tính: Đồng", {
        ...styleCenter,
        font: { name: "Times New Roman", sz: 11, italic: true },
      });

      headers.forEach((header, colIndex) => {
        setCell(tableHeaderRow, colIndex, header, styleHeader);
      });
      headerCodes.forEach((code, colIndex) => {
        setCell(tableCodeRow, colIndex, code, styleCode);
      });

      for (let rowIndex = 0; rowIndex < minimumBodyRows; rowIndex += 1) {
        const row = allRows[rowIndex] ?? {};
        for (let colIndex = 0; colIndex < sheetDataColumnCount; colIndex += 1) {
          const key = keys[colIndex];
          const rawValue = toSheetCell((row as Record<string, unknown>)[key]);
          const isNumber = typeof rawValue === "number";
          const cellStyle =
            colIndex === 0
              ? styleCellCenter
              : isNumber
                ? {
                    ...styleCell,
                    alignment: {
                      vertical: "center",
                      horizontal: "right",
                      wrapText: true,
                    },
                    numFmt: "#,##0",
                  }
                : styleCell;

          setCell(tableDataStartRow + rowIndex, colIndex, rawValue, cellStyle);
        }
      }

      const columnWidths = Array.from({ length: visualColumnCount }).map(
        (_, colIndex) => {
          if (colIndex >= sheetDataColumnCount) return { wch: 12 };
          const header = headers[colIndex] ?? "";
          const maxDataLen = allRows.slice(0, 250).reduce((maxLen, row) => {
            const key = keys[colIndex];
            const value = toSheetCell((row as Record<string, unknown>)[key]);
            return Math.max(maxLen, String(value).length);
          }, 0);

          return {
            wch: Math.min(
              60,
              Math.max(
                colIndex === 1 ? 28 : 16,
                Math.max(header.length, maxDataLen) + 2,
              ),
            ),
          };
        },
      );

      ws["!cols"] = columnWidths;

      const rowsConfig = Array.from({ length: totalRows }, (_, rowIndex) => {
        if (rowIndex === 4) return { hpt: 30 };
        if (rowIndex === tableHeaderRow) return { hpt: 24 };
        return { hpt: 20 };
      });
      ws["!rows"] = rowsConfig;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(
        workbook,
        ws,
        sanitizeSheetName(book.templateCode || "Form"),
      );

      const summaryRows: Array<[string, string]> = Object.entries(summaryData)
        .filter(([key]) => key !== "columns")
        .map(([key, value]) => [
          key,
          typeof value === "string" || typeof value === "number"
            ? String(value)
            : value == null
              ? ""
              : JSON.stringify(value),
        ]);

      summaryRows.unshift(["bookId", String(book.bookId)]);
      summaryRows.unshift(["templateName", book.templateName]);
      summaryRows.unshift(["templateCode", book.templateCode]);
      summaryRows.push(["exportedAt", new Date().toISOString()]);
      summaryRows.push(["rowCount", String(allRows.length)]);

      const summarySheet = XLSX.utils.aoa_to_sheet([
        ["Field", "Value"],
        ...summaryRows,
      ]);
      summarySheet["!cols"] = [{ wch: 28 }, { wch: 80 }];
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      const datePart = new Date().toISOString().slice(0, 10);
      const fileName = `SoKeToan_${book.templateCode}_${book.bookId}_${datePart}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success("Xuất Excel thành công.");
    } catch (error) {
      console.error("Export Excel failed:", error);
      toast.error("Không thể xuất Excel. Vui lòng thử lại.");
    } finally {
      setExportingBookId(null);
    }
  }

  const handlePeriodChange = (value: string) => {
    const nextPeriodId = Number(value);
    setSelectedPeriodId(nextPeriodId);

    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "books");
    params.set("periodId", String(nextPeriodId));
    router.replace(`/dashboard/reports?${params.toString()}`, {
      scroll: false,
    });
  };

  const [groupNumber, setGroupNumber] = useState<number>(2);
  const [taxMethod, setTaxMethod] = useState<string>("method_1");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const getAllowedTaxMethodsByGroup = (group: number): string[] => {
    if (group === 1) return ["exempt"];
    if (group === 2) return ["method_1", "method_2"];
    return ["method_2"];
  };

  const allowedTaxMethods = getAllowedTaxMethodsByGroup(groupNumber);

  const getSuggestedTemplates = (group: number, method: string) =>
    templates
      ?.filter(
        (t) =>
          t.applicableGroups?.includes(group) &&
          (!t.applicableMethods ||
            t.applicableMethods.length === 0 ||
            t.applicableMethods.includes(method)),
      )
      .map((t) => t.templateCode) ?? [];

  const handleGroupNumberChange = (val: string) => {
    const group = Number(val);
    const allowedMethods = getAllowedTaxMethodsByGroup(group);
    const newMethod = allowedMethods.includes(taxMethod)
      ? taxMethod
      : allowedMethods[0];

    setGroupNumber(group);
    setTaxMethod(newMethod);
    setSelectedTemplates(getSuggestedTemplates(group, newMethod));
  };

  const handleTaxMethodChange = (method: string) => {
    if (!allowedTaxMethods.includes(method)) return;
    setTaxMethod(method);
    setSelectedTemplates(getSuggestedTemplates(groupNumber, method));
  };

  const handleCreate = async () => {
    if (!periodId) return alert("Vui lòng chọn hoặc tạo kỳ kế toán trước.");
    if (selectedTemplates.length === 0)
      return alert("Vui lòng chọn ít nhất 1 mẫu sổ.");
    try {
      await createBook({
        periodId,
        groupNumber,
        taxMethod,
        templateCodes: selectedTemplates,
      });
      alert("Tạo sổ thành công!");
    } catch (err: unknown) {
      alert((err as Error).message || "Lỗi tạo sổ.");
    }
  };

  const handleDeleteBook = async (bookId: number) => {
    const confirmed = window.confirm(
      "Bạn có chắc muốn xóa sổ này? Chỉ nên xóa khi sổ thuộc kỳ đang mở và chưa từng xuất.",
    );
    if (!confirmed) return;

    try {
      setDeletingBookId(bookId);
      await deleteBook(bookId);
      if (expandedBookId === bookId) {
        setExpandedBookId(null);
      }
      alert("Xóa sổ kế toán thành công!");
    } catch (err: unknown) {
      alert((err as Error).message || "Không thể xóa sổ kế toán.");
    } finally {
      setDeletingBookId(null);
    }
  };

  const BOOK_COLORS: Record<string, string> = {
    S1a: "bg-violet-100 text-violet-700",
    S2a: "bg-blue-100 text-blue-700",
    S2b: "bg-cyan-100 text-cyan-700",
    S2c: "bg-teal-100 text-teal-700",
    S2d: "bg-emerald-100 text-emerald-700",
    S2e: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#23C4C1]" />
            Sổ kế toán (TT152)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý và kết xuất dữ liệu sổ theo các nhóm HKD
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">
            Kỳ Kế Toán:
          </label>
          <Select
            value={periodId ? String(periodId) : ""}
            onValueChange={handlePeriodChange}
          >
            <SelectTrigger className="w-50 h-9">
              <SelectValue
                placeholder={periodLoading ? "Đang tải..." : "Chọn kỳ..."}
              />
            </SelectTrigger>
            <SelectContent>
              {periods?.map((p) => (
                <SelectItem key={p.periodId} value={String(p.periodId)}>
                  {p.periodType === "quarter"
                    ? `Q${p.quarter}/${p.year}`
                    : p.periodType === "year"
                      ? `Năm ${p.year}`
                      : `${new Date(p.startDate).toLocaleDateString("vi-VN")} - ${new Date(
                          p.endDate,
                        ).toLocaleDateString("vi-VN")}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tạo Sổ Kế Toán Form */}
      <div className="bg-white rounded-2xl border p-5 shadow-sm">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-[#23C4C1]" /> Tạo Sổ Kế Toán (Gợi ý tự
          động)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
              Quy Mô / Nhóm HKD
            </label>
            <Select
              value={String(groupNumber)}
              onValueChange={handleGroupNumberChange}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nhóm 1</SelectItem>
                <SelectItem value="2">Nhóm 2</SelectItem>
                <SelectItem value="3">Nhóm 3</SelectItem>
                <SelectItem value="4">Nhóm 4</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
              Cách Tính Thuế
            </label>
            <Select
              value={taxMethod}
              onValueChange={handleTaxMethodChange}
              disabled={allowedTaxMethods.length === 1}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allowedTaxMethods.includes("exempt") ? (
                  <SelectItem value="exempt">
                    Miễn thuế (Chỉ dành cho Nhóm 1)
                  </SelectItem>
                ) : null}
                {allowedTaxMethods.includes("method_1") ? (
                  <SelectItem value="method_1">
                    Cách 1 — Theo % Doanh Thu
                  </SelectItem>
                ) : null}
                {allowedTaxMethods.includes("method_2") ? (
                  <SelectItem value="method_2">Cách 2 — DT trừ CP</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-gray-600 uppercase mb-3 block">
            Mẫu sổ (TT152) — Bạn có thể chọn mở rộng thêm nếu cần
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {templates?.map((tpl) => {
              const suggested =
                tpl.applicableGroups?.includes(groupNumber) &&
                (!tpl.applicableMethods ||
                  tpl.applicableMethods.length === 0 ||
                  tpl.applicableMethods.includes(taxMethod));
              const checked = selectedTemplates.includes(tpl.templateCode);
              return (
                <label
                  key={tpl.templateId}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    suggested && checked
                      ? "bg-[#23C4C1]/5 border-[#23C4C1]/30"
                      : suggested
                        ? "bg-white hover:bg-gray-50 border-gray-200"
                        : "bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    disabled={!suggested}
                    onCheckedChange={(c) => {
                      if (!suggested) return;
                      if (c)
                        setSelectedTemplates((prev) => [
                          ...prev,
                          tpl.templateCode,
                        ]);
                      else
                        setSelectedTemplates((prev) =>
                          prev.filter((c) => c !== tpl.templateCode),
                        );
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                          BOOK_COLORS[tpl.templateCode] ??
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {tpl.templateCode}
                      </span>
                      {suggested && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded uppercase">
                          Gợi ý
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">
                      {tpl.name}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={
              creatingBook || !periodId || selectedTemplates.length === 0
            }
            className="bg-[#23C4C1] hover:bg-[#1aa8a5]"
          >
            {creatingBook && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Tạo các sổ đã chọn
          </Button>
        </div>
      </div>

      <Separator />

      {/* Books created list */}
      <div className="space-y-4">
        <div className="flex items-end justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">
              Danh sách sổ kế toán
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Các sổ đã được thiết lập theo thông tư 152
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full border">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {books?.length || 0} sổ đã tạo
          </div>
        </div>

        {bookLoading ? (
          <div className="bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed p-20 flex flex-col items-center justify-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-[#23C4C1] animate-spin" />
            </div>
            <p className="text-sm font-medium text-gray-400 animate-pulse">
              Đang truy xuất dữ liệu sổ...
            </p>
          </div>
        ) : books && books.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {books.map((book) => {
              const isExpanded = expandedBookId === book.bookId;
              return (
                <div
                  key={book.bookId}
                  className={`group relative bg-white rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isExpanded
                      ? "ring-2 ring-[#23C4C1] shadow-2xl scale-[1.01] z-10"
                      : "hover:shadow-xl hover:border-[#23C4C1]/30"
                  }`}
                >
                  <div
                    className="p-5 cursor-pointer flex items-center justify-between"
                    onClick={() =>
                      setExpandedBookId(isExpanded ? null : book.bookId)
                    }
                  >
                    <div className="flex items-center gap-5">
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black font-mono shadow-inner ${
                          BOOK_COLORS[book.templateCode] ||
                          "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {book.templateCode}
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-[#23C4C1] transition-colors flex items-center gap-2">
                          {book.templateName}
                          {isExpanded && (
                            <Badge className="bg-[#23C4C1] hover:bg-[#1DA8A5] text-[10px] h-4 px-1.5 uppercase">
                              Active
                            </Badge>
                          )}
                        </h3>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md border">
                            <Users className="w-3 h-3" /> Nhóm{" "}
                            {book.groupNumber}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md border">
                            <Layers className="w-3 h-3" />
                            {book.taxMethod === "method_1"
                              ? "Ấn định"
                              : book.taxMethod === "exempt"
                                ? "Miễn thuế"
                                : "Kê khai"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(book.createdAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {!isExpanded && (
                        <div className="hidden md:flex items-center gap-3 pr-4 border-r mr-4">
                          <div className="text-right">
                            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                              Trạng thái
                            </p>
                            <p className="text-xs font-bold text-emerald-600 uppercase italic">
                              Hoạt động
                            </p>
                          </div>
                        </div>
                      )}

                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                          isExpanded
                            ? "bg-[#23C4C1] text-white rotate-180"
                            : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                        }`}
                      >
                        <ChevronDown className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-slate-50/30">
                      <div className="p-6">
                        <BookSummaryPanel
                          locationId={locationId}
                          bookId={book.bookId}
                        />
                        <div className="mt-6 bg-white rounded-2xl border shadow-sm overflow-hidden">
                          <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
                            <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-gray-400" />
                              Nhật ký nghiệp vụ chi tiết
                            </h4>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[10px] uppercase font-bold tracking-wider"
                                disabled={
                                  exportingBookId === book.bookId ||
                                  deletingBook
                                }
                                onClick={() =>
                                  void handleExportBook({
                                    bookId: book.bookId,
                                    templateCode: book.templateCode,
                                    templateName: book.templateName,
                                  })
                                }
                              >
                                {exportingBookId === book.bookId ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Đang xuất
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3 h-3 mr-1" /> Xuất
                                    Excel
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-8 text-[10px] uppercase font-bold tracking-wider"
                                disabled={
                                  deletingBook && deletingBookId === book.bookId
                                }
                                onClick={() =>
                                  void handleDeleteBook(book.bookId)
                                }
                              >
                                {deletingBook &&
                                deletingBookId === book.bookId ? (
                                  <>
                                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    Đang xóa
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="w-3 h-3 mr-1" /> Xóa sổ
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                          <BookRowsTable
                            bookId={book.bookId}
                            templateCode={book.templateCode}
                            locationId={locationId}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white/50 backdrop-blur-xl rounded-[40px] border border-dashed border-gray-200 p-20 text-center shadow-inner group transition-all hover:bg-white/80">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 bg-gray-100 rounded-[30px] rotate-6 group-hover:rotate-12 transition-transform opacity-50" />
              <div className="absolute inset-0 bg-white rounded-[30px] border shadow-sm flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-gray-300 group-hover:text-[#23C4C1] transition-colors" />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#23C4C1] rounded-full flex items-center justify-center text-white scale-0 group-hover:scale-100 transition-transform">
                <Plus className="w-5 h-5 shadow-lg" />
              </div>
            </div>
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">
              Bắt đầu thiết lập hệ thống sổ
            </h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
              Hãy chọn kì kế toán và bấm{" "}
              <strong className="text-gray-600 font-bold">Gợi ý tạo sổ</strong>{" "}
              ở phía trên để hệ thống tự động thiết kế sổ sách theo đúng TT152.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared micro-components ─────────────────────────────────────────────────

function getAnomalySeverityMeta(severity: string) {
  const normalized = severity.toUpperCase();

  if (normalized === "CRITICAL") {
    return {
      label: "Critical",
      badgeClass: "bg-red-100 text-red-700 border-red-200",
    };
  }

  if (normalized === "WARNING") {
    return {
      label: "Warning",
      badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
    };
  }

  return {
    label: "Info",
    badgeClass: "bg-blue-100 text-blue-700 border-blue-200",
  };
}

function getAnomalyTypeLabel(type: string) {
  switch (type) {
    case "DATA_QUALITY":
      return "Chất lượng dữ liệu";
    case "REVENUE_ANOMALY":
      return "Bất thường doanh thu";
    case "SUSPICIOUS_TRANSACTION":
      return "Giao dịch nghi ngờ";
    case "INVENTORY_ANOMALY":
      return "Bất thường tồn kho";
    default:
      return type;
  }
}

function DataCard({
  title,
  subtitle,
  loading,
  children,
}: {
  title: string;
  subtitle?: string;
  loading: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
      <div className="p-5 border-b">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {subtitle && <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {loading ? (
        <div className="p-10 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function RevenueStatCard({
  title,
  value,
  trend,
  positive,
}: {
  title: string;
  value: string;
  trend: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-xs font-bold tracking-wide uppercase text-slate-500">
        {title}
      </p>
      <p className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
        {value}
      </p>
      <p
        className={`mt-4 text-sm font-semibold ${positive ? "text-emerald-600" : "text-red-500"}`}
      >
        {trend}
      </p>
    </div>
  );
}

function RevenueBarsChart({
  data,
}: {
  data: Array<{ label: string; revenue: number; target: number }>;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={8}>
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
            tickFormatter={(value) => formatYAxisShort(value as number)}
            tickLine={false}
            axisLine={false}
            width={56}
            fontSize={12}
          />
          <Tooltip
            formatter={(value) => formatTooltipCurrency(value)}
            contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="revenue"
            name="Doanh Thu"
            fill="#14B8A6"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="target"
            name="Thực Tế"
            fill="#60A5FA"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueGrowthDots({
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
            tickFormatter={(value) => `${Number(value).toFixed(0)}%`}
            tickLine={false}
            axisLine={false}
            width={56}
            fontSize={12}
          />
          <Tooltip
            formatter={(value) => `${Number(value ?? 0).toFixed(1)}%`}
            contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
          />
          <Line
            type="monotone"
            dataKey="growth"
            name="Tăng Trưởng (%)"
            stroke="#0EA5E9"
            strokeWidth={2}
            dot={{ r: 4, fill: "#0EA5E9" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueForecastChart({
  data,
}: {
  data: Array<{
    label: string;
    predictedRevenue: number;
    lowerBound: number;
    upperBound: number;
  }>;
}) {
  return (
    <div className="h-72 rounded-xl border bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, left: 0, bottom: 8 }}
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
            tickFormatter={(value) => formatYAxisShort(value as number)}
            tickLine={false}
            axisLine={false}
            width={56}
            fontSize={12}
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
            contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="predictedRevenue"
            name="Dự báo"
            stroke="#0EA5E9"
            strokeWidth={3}
            dot={{ r: 3, fill: "#0EA5E9" }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="lowerBound"
            name="Cận dưới"
            stroke="#14B8A6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="upperBound"
            name="Cận trên"
            stroke="#6366F1"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function CostStatCard({
  title,
  value,
  trend,
  positive,
}: {
  title: string;
  value: string;
  trend: string;
  positive: boolean;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <p className="text-xs font-bold tracking-wide uppercase text-slate-500">
        {title}
      </p>
      <p className="mt-3 text-2xl md:text-3xl font-bold text-slate-900">
        {value}
      </p>
      <p
        className={`mt-4 text-sm font-semibold ${positive ? "text-emerald-600" : "text-rose-500"}`}
      >
        {trend}
      </p>
    </div>
  );
}

function CostPieChart({
  data,
}: {
  data: Array<{ key: string; label: string; total: number; share: number }>;
}) {
  const topItems = data.slice(0, 6).filter((item) => item.total > 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-6 items-center">
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={topItems}
              dataKey="total"
              nameKey="label"
              innerRadius={52}
              outerRadius={88}
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
              formatter={(value) => formatTooltipCurrency(value)}
              contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2">
        {topItems.length > 0 ? (
          topItems.map((item, index) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-2 text-base"
            >
              <span className="inline-flex items-center gap-2 font-semibold text-gray-800">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: PIE_COLORS[index % PIE_COLORS.length],
                  }}
                />
                {item.label}
              </span>
              <span className="text-gray-600">{item.share.toFixed(1)}%</span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">Chưa có dữ liệu chi phí.</p>
        )}
      </div>
    </div>
  );
}

function CostBudgetBarsChart({
  data,
}: {
  data: Array<{ label: string; cost: number; budget: number }>;
}) {
  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} barGap={8}>
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
            tickFormatter={(value) => formatYAxisShort(value as number)}
            tickLine={false}
            axisLine={false}
            width={56}
            fontSize={12}
          />
          <Tooltip
            formatter={(value) => formatTooltipCurrency(value)}
            contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
          <Bar
            dataKey="cost"
            name="Chi Phí"
            fill="#F97316"
            radius={[6, 6, 0, 0]}
          />
          <Bar
            dataKey="budget"
            name="Ngân Sách"
            fill="#A78BFA"
            radius={[6, 6, 0, 0]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function CostTrendDots({
  data,
}: {
  data: Array<{ label: string; cost: number; budget: number }>;
}) {
  const scatterData = data.map((item, index) => ({
    x: index + 1,
    label: item.label,
    cost: item.cost,
    budget: item.budget,
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e5e7eb"
          />
          <XAxis
            type="number"
            dataKey="x"
            tickLine={false}
            axisLine={false}
            domain={[1, Math.max(scatterData.length, 1)]}
            ticks={scatterData.map((item) => item.x)}
            tickFormatter={(value) =>
              scatterData.find((item) => item.x === value)?.label ?? ""
            }
            fontSize={12}
          />
          <YAxis
            type="number"
            tickFormatter={(value) => formatYAxisShort(value as number)}
            tickLine={false}
            axisLine={false}
            width={56}
            fontSize={12}
          />
          <Tooltip
            formatter={(value, name) => [
              formatTooltipCurrency(value),
              String(name),
            ]}
            labelFormatter={(value) => {
              const found = scatterData.find(
                (item) => item.x === Number(value),
              );
              return found?.label ?? "";
            }}
            contentStyle={{ borderRadius: 12, borderColor: "#d1d5db" }}
          />
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: 12 }} />
          <Scatter
            data={scatterData}
            dataKey="cost"
            name="Chi Phí"
            fill="#F97316"
          />
          <Scatter
            data={scatterData}
            dataKey="budget"
            name="Ngân Sách"
            fill="#A78BFA"
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

function CostBudgetCategoryList({
  data,
}: {
  data: Array<{
    key: string;
    label: string;
    total: number;
    budget: number;
    usage: number;
  }>;
}) {
  const topItems = data.slice(0, 6);
  const total = topItems.reduce((sum, item) => sum + item.total, 0);
  const budget = topItems.reduce((sum, item) => sum + item.budget, 0);

  return (
    <div className="space-y-4">
      {topItems.length > 0 ? (
        topItems.map((item) => {
          const usage = Math.min(item.usage, 120);
          return (
            <div key={item.key} className="rounded-xl bg-gray-50 p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">
                    {formatCompactVnd(item.total)} trên{" "}
                    {formatCompactVnd(item.budget)} ngân sách
                  </p>
                </div>
                <Badge
                  className={`${usage > 100 ? "bg-rose-500" : "bg-blue-700"} text-white`}
                >
                  {usage.toFixed(0)}%
                </Badge>
              </div>
              <div className="h-2 rounded-full bg-slate-300 overflow-hidden">
                <div
                  className={`${usage > 100 ? "bg-rose-500" : "bg-blue-700"} h-full rounded-full`}
                  style={{ width: `${Math.min(usage, 100)}%` }}
                />
              </div>
            </div>
          );
        })
      ) : (
        <p className="text-sm text-gray-500">
          Chưa có dữ liệu danh mục chi phí.
        </p>
      )}

      <Separator />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            Tổng chi phí
          </p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
            {formatCompactVnd(total)}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            Tổng ngân sách
          </p>
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">
            {formatCompactVnd(budget)}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase">
            Chênh lệch
          </p>
          <p
            className={`text-2xl md:text-3xl font-bold mt-2 ${budget - total >= 0 ? "text-green-600" : "text-rose-500"}`}
          >
            {budget - total >= 0
              ? `${formatCompactVnd(budget - total)} tiết kiệm`
              : `${formatCompactVnd(total - budget)} vượt`}
          </p>
        </div>
      </div>
    </div>
  );
}

const PIE_COLORS = [
  "#14B8A6",
  "#60A5FA",
  "#F59E0B",
  "#A78BFA",
  "#F97316",
  "#22C55E",
];

const PAYMENT_STYLES: Record<string, { cls: string; label: string }> = {
  cash: { cls: "bg-emerald-100 text-emerald-700", label: "Tiền mặt" },
  bank: { cls: "bg-blue-100 text-blue-700", label: "Ngân hàng" },
  debt: { cls: "bg-amber-100 text-amber-700", label: "Công nợ" },
  mixed: { cls: "bg-purple-100 text-purple-700", label: "Hỗn hợp" },
};

function PaymentBadge({ method }: { method?: string }) {
  if (!method) return <span className="text-gray-300 text-xs">—</span>;
  const s = PAYMENT_STYLES[method] ?? {
    cls: "bg-gray-100 text-gray-600",
    label: method,
  };
  return <Badge className={`${s.cls} text-xs`}>{s.label}</Badge>;
}

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

function CostBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {COST_LABELS[type] ?? type}
    </Badge>
  );
}

// ─── Types for BookSummaryPanel ───────────────────────────────────────────────
interface BookTaxRateItem {
  taxType: string;
  taxRate: number;
  note?: string;
}

interface BookBtEntry {
  businessTypeId: string;
  name: string;
  taxRates: BookTaxRateItem[];
}

interface BookFormulaEntry {
  formulaId: number;
  formulaCode: string;
  name?: string;
  explanation?: string;
  formulaExpression?: string;
}

interface BookColumnEntry {
  fieldCode: string;
  exportColumn?: string;
  label: string;
  fieldType: string;
}

interface BookSummaryData {
  totalRows?: number;
  totalRevenue?: number;
  totalCost?: number;
  totalTax?: number;
  startDate?: string;
  endDate?: string;
  taxMethod?: string;
  formulaValues?: Record<string, unknown>;
  businessTypeTaxes?: BookBtEntry[];
  formulaDetails?: BookFormulaEntry[];
  columns?: BookColumnEntry[];
}

// BookSummaryPanel: show summary, KPIs, formulas for a book
function BookSummaryPanel({
  locationId,
  bookId,
}: {
  locationId: number;
  bookId: number;
}) {
  const { data, isLoading, error } = useBookSummary(locationId, bookId);

  if (isLoading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-28 bg-gray-100 rounded-3xl border border-gray-200"
          />
        ))}
      </div>
    );

  if (error)
    return (
      <div className="p-10 text-center bg-rose-50 rounded-[40px] border border-rose-100 text-rose-600 flex flex-col items-center gap-3 shadow-sm">
        <AlertCircle className="w-10 h-10" />
        <p className="font-bold text-lg text-rose-900">
          Không thể phân xuất dữ liệu
        </p>
        <p className="text-sm text-rose-600/80 max-w-md italic">
          Hệ thống phân tích đang bảo trì hoặc gặp lỗi kết nối. Hãy thử làm mới
          trang hoặc liên hệ quản trị viên.
        </p>
      </div>
    );

  if (!data?.data) return null;
  const summary = data.data as BookSummaryData;

  const fmtValue = (val: unknown) => {
    if (val === null || val === undefined) return "—";
    return Number(val).toLocaleString("vi-VN");
  };

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 md:p-8 rounded-[40px] text-slate-700 border border-slate-200/60 shadow-inner backdrop-blur-sm">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "TỔNG DÒNG",
            value: summary.totalRows,
            color: "text-blue-600",
            bg: "bg-blue-50/30",
          },
          {
            label: "TỔNG DOANH THU",
            value: summary.totalRevenue,
            color: "text-emerald-600",
            bg: "bg-emerald-50/30",
          },
          {
            label: "TỔNG CHI PHÍ",
            value: summary.totalCost,
            color: "text-rose-600",
            bg: "bg-rose-50/30",
          },
          {
            label: "TỔNG THUẾ",
            value: summary.totalTax,
            color: "text-amber-600",
            bg: "bg-amber-50/30",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2 group hover:shadow-md transition-all ${item.bg}`}
          >
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">
              {item.label}
            </p>
            <p
              className={`text-2xl md:text-3xl font-black ${item.color} tabular-nums tracking-tighter`}
            >
              {fmtValue(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Kết quả công thức */}
      {/* <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
          <Calculator className="w-4 h-4 text-slate-400" /> Kết quả công thức
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black border-b">
              <tr>
                <th className="px-6 py-4 text-left tracking-widest">
                  Formula Code
                </th>
                <th className="px-6 py-4 text-right tracking-widest">
                  Giá trị
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(summary.formulaValues || {}).map(
                ([code, val]) => (
                  <tr
                    key={code}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {code}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                      {fmtValue(val)}
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </div> */}

      {/* Thông tin metadata */}
      {/* <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
          <FileText className="w-4 h-4 text-slate-400" /> Chú thích cách tính
        </div>
        <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-[0.03] rotate-12">
            <Zap className="w-24 h-24 text-slate-900" />
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm relative z-10">
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 font-medium">Kỳ tính:</span>
              <span className="font-bold text-slate-800">
                {summary.startDate && summary.endDate
                  ? `${new Date(summary.startDate).toLocaleDateString("vi-VN")} → ${new Date(summary.endDate).toLocaleDateString("vi-VN")}`
                  : "Toàn thời gian"}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 font-medium">Tax method:</span>
              <span className="font-bold text-slate-800 uppercase">
                {summary.taxMethod || "N/A"}
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 font-medium">Ruleset:</span>
              <span className="font-bold text-slate-800 tracking-tight">
                Default Calculation Engine (v1.2)
              </span>
            </li>
            <li className="flex items-center gap-3">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-slate-400 font-medium">
                Số loại ngành áp dụng:
              </span>
              <span className="font-bold text-slate-800">
                {summary.businessTypeTaxes?.length || 0}
              </span>
            </li>
          </ul>
        </div>
      </div> */}

      {/* Ngành nghề & Thuế suất */}
      {(summary.businessTypeTaxes?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
            <Zap className="w-4 h-4 text-amber-500" /> Ngành nghề và thuế suất
            áp dụng
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black border-b">
                <tr>
                  <th className="px-6 py-4 text-left tracking-widest">
                    Business Type
                  </th>
                  <th className="px-6 py-4 text-left tracking-widest">Type</th>
                  <th className="px-6 py-4 text-right tracking-widest">
                    Rate (%)
                  </th>
                  <th className="px-6 py-4 text-left tracking-widest">
                    Sync Source
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(summary.businessTypeTaxes ?? []).map((bt: BookBtEntry) => (
                  <React.Fragment key={bt.businessTypeId}>
                    {bt.taxRates?.map((r: BookTaxRateItem, idx: number) => (
                      <tr
                        key={idx}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        {idx === 0 && (
                          <td
                            className="px-6 py-4 font-bold text-slate-800 leading-tight"
                            rowSpan={bt.taxRates.length}
                          >
                            {bt.name}
                          </td>
                        )}
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs italic">
                          {r.taxType}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-blue-600 tabular-nums">
                          {(Number(r.taxRate) * 100).toLocaleString("vi-VN")}%
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs italic">
                          {r.note || "Hệ thống tự động đồng bộ TT152"}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Công thức ENGINE */}
      {/* {(summary.formulaDetails?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
            <Terminal className="w-4 h-4 text-slate-400" /> Chi tiết công thức
            (engine)
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black border-b">
                <tr>
                  <th className="px-6 py-4 text-left tracking-widest">Code</th>
                  <th className="px-6 py-4 text-left tracking-widest">Name</th>
                  <th className="px-6 py-4 text-left tracking-widest">
                    Expression JSON
                  </th>
                  <th className="px-6 py-4 text-right tracking-widest">
                    Output
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(summary.formulaDetails ?? []).map((f: BookFormulaEntry) => (
                  <tr
                    key={f.formulaId}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {f.formulaCode}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700">
                      {f.name || f.explanation}
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-[10px] max-w-xs truncate font-mono italic">
                      {f.formulaExpression}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                      {fmtValue(summary.formulaValues?.[f.formulaCode])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}

      {/* Cấu trúc cột */}
      {/* {(summary.columns?.length ?? 0) > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
            <Layers className="w-4 h-4 text-slate-400" /> Bản đồ dữ liệu & Cấu
            trúc cột
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black border-b">
                <tr>
                  <th className="px-6 py-4 text-left tracking-widest">
                    SheetCol
                  </th>
                  <th className="px-6 py-4 text-left tracking-widest">
                    DB Field
                  </th>
                  <th className="px-6 py-4 text-left tracking-widest">
                    Table Label
                  </th>
                  <th className="px-6 py-4 text-left tracking-widest">
                    Data Type
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(summary.columns ?? []).map((col: BookColumnEntry) => (
                  <tr
                    key={col.fieldCode}
                    className="hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-black text-slate-700">
                      {col.exportColumn}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {col.fieldCode}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {col.label}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs italic">
                      {col.fieldType}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )} */}
    </div>
  );
}
