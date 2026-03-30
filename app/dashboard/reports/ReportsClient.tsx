"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2,
  DollarSign,
  TrendingDown,
  TrendingUp,
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
  CheckCircle2,
  ShieldCheck,
  BadgeCheck,
  Terminal,
  AlertCircle,
  Zap,
  ArrowRightLeft,
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
  useRevenues,
  useCosts,
  useCreateManualCost,
  useUpdateManualCost,
  useDeleteManualCost,
  useCostReferenceCatalog,
  useCreateManualRevenue,
  useDeleteManualRevenue,
  useCashFlowReport,
} from "@/hooks/useAccounting";
import {
  useAccountingTemplates,
  useAccountingBooks,
  useAccountingPeriods,
  useCreateAccountingBook,
} from "@/hooks/useAccounting";
import { BookRowsTable } from "@/components/products/BookRowsTable";

import { useBookSummary } from "@/hooks/useBookSummary";
import { useLocations } from "@/hooks/useLocations";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import NoLocationScreenSkeleton from "@/components/NoLocationScreenSkeleton";
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

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

const BOOK_COLORS: Record<string, string> = {
  S1a: "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg",
  S2a: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg",
  S2b: "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg",
  S2c: "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg",
  S2d: "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg",
  S2e: "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg",
};

// --- Main component ---

type Tab = "reports" | "periods" | "books";

export default function ReportsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabFromUrl = (searchParams.get("tab") as Tab) || "reports";
  const [activeTab, setActiveTab] = useState<Tab>(tabFromUrl);
  const [openCreate, setOpenCreate] = useState(false);

  const { data: locations = [], isLoading: locLoading } = useLocations();
  const { selectedLocationId } = useDashboardLocation();
  const hasLocations = locations.length > 0;

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

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  const handleTabChange = (key: Tab) => {
    setActiveTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", key);
    router.replace(`/dashboard/reports?${params.toString()}`, {
      scroll: false,
    });
  };

  if (locLoading) {
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

  const subTabFromUrl = searchParams.get("subTab") as
    | "revenue"
    | "cost"
    | "cashflow"
    | "ledger";
  const [subTab, setSubTab] = useState<
    "revenue" | "cost" | "cashflow" | "ledger"
  >(subTabFromUrl || "ledger");

  useEffect(() => {
    if (subTabFromUrl && subTabFromUrl !== subTab) {
      setSubTab(subTabFromUrl);
    }
  }, [subTabFromUrl, subTab]);

  const handleSubTabChange = (key: typeof subTab) => {
    setSubTab(key);
    const params = new URLSearchParams(searchParams.toString());
    params.set("subTab", key);
    router.replace(`/dashboard/reports?${params.toString()}`, {
      scroll: false,
    });
  };
  const { data: revenues, isLoading: revLoading } = useRevenues(locationId);
  const { data: costs, isLoading: costLoading } = useCosts({ locationId });
  const createCostMutation = useCreateManualCost();
  const updateCostMutation = useUpdateManualCost(locationId);
  const deleteCostMutation = useDeleteManualCost(locationId);
  const { data: costReferences } = useCostReferenceCatalog();
  const createRevenueMutation = useCreateManualRevenue();
  const deleteRevenueMutation = useDeleteManualRevenue(locationId);
  const [manualAmount, setManualAmount] = useState("");
  const [manualDate, setManualDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
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
  const [manualCostPaymentMethod, setManualCostPaymentMethod] = useState<
    "cash" | "bank"
  >("cash");
  const [editingCostId, setEditingCostId] = useState<number | null>(null);
  const [manualCostRemoveDocument, setManualCostRemoveDocument] =
    useState(false);
  const [manualCostError, setManualCostError] = useState("");
  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const { data: cashFlow, isLoading: cfLoading } = useCashFlowReport(
    locationId,
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .slice(0, 10), // First day of current month
    new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
      .toISOString()
      .slice(0, 10), // Last day of current month
  );

  const totalRevenue = revenues?.items.reduce((s, r) => s + r.amount, 0) ?? 0;
  const totalCost = costs?.items.reduce((s, c) => s + c.amount, 0) ?? 0;
  const revenueItems = useMemo(() => revenues?.items ?? [], [revenues?.items]);
  const costItems = useMemo(() => costs?.items ?? [], [costs?.items]);

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

  const averageMonthlyRevenue =
    revenueSeries.length > 0
      ? revenueSeries.reduce((sum, month) => sum + month.revenue, 0) /
        revenueSeries.length
      : 0;
  const averageOrderValue =
    revenueItems.length > 0 ? totalRevenue / revenueItems.length : 0;
  const revenueTrendAverage =
    revenueSeries.length > 0
      ? revenueSeries.reduce((sum, month) => sum + month.growth, 0) /
        revenueSeries.length
      : 0;

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

  const averageMonthlyCost =
    costSeries.length > 0
      ? costSeries.reduce((sum, month) => sum + month.cost, 0) /
        costSeries.length
      : 0;
  const totalCostBudget = costSeries.reduce(
    (sum, month) => sum + month.budget,
    0,
  );
  const budgetUsage =
    totalCostBudget > 0
      ? Math.min((totalCost / totalCostBudget) * 100, 999)
      : 0;
  const costEfficiency =
    totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
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
  ];
  const costTypeOptions = costReferences?.costTypes?.filter(
    (type) => type !== "import",
  ) ?? [
    "salary",
    "rent",
    "utilities",
    "transport",
    "marketing",
    "maintenance",
    "other",
    "manual",
  ];
  const paymentMethodOptions = costReferences?.paymentMethods ?? [
    "cash",
    "bank",
  ];

  async function handleCreateManualRevenue() {
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

    try {
      await createRevenueMutation.mutateAsync({
        businessLocationId: locationId,
        amount,
        revenueDate: manualDate,
        description: manualDescription.trim(),
        moneyChannel: manualChannel,
      });
      setManualAmount("");
      setManualDescription("");
      return true;
    } catch (error) {
      setManualError(
        error instanceof Error
          ? error.message
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

    const payload = {
      description: manualCostDescription.trim(),
      amount: Number(manualCostAmount),
      costDate: manualCostDate,
      paymentMethod: manualCostPaymentMethod,
      removeDocument: manualCostRemoveDocument,
      image: manualCostImage ?? undefined,
    };

    try {
      if (editingCostId) {
        await updateCostMutation.mutateAsync({
          costId: editingCostId,
          data: payload,
        });
      } else {
        await createCostMutation.mutateAsync({
          businessLocationId: locationId,
          costType: manualCostType as
            | "import"
            | "salary"
            | "rent"
            | "utilities"
            | "transport"
            | "marketing"
            | "maintenance"
            | "other"
            | "manual",
          ...payload,
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

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Tổng doanh thu"
          value={fmt.format(totalRevenue)}
          trend="+12.4%"
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
          color="emerald"
        />
        <KpiCard
          label="Tổng chi phí"
          value={fmt.format(totalCost)}
          trend="+3.1%"
          icon={<ArrowDownRight className="w-4 h-4 text-red-500" />}
          color="red"
        />
        <KpiCard
          label="Lợi nhuận ròng"
          value={fmt.format(totalRevenue - totalCost)}
          trend="+18.2%"
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
          color="emerald"
        />
      </div> */}

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
              ? `${revenues.totalCount} giao dịch · Tổng: ${fmt.format(totalRevenue)}`
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
                  Theo dõi xu hướng doanh thu và thêm ghi nhận thủ công bằng
                  modal.
                </p>
              </div>
              <Button
                onClick={() => {
                  setManualError("");
                  setIsRevenueModalOpen(true);
                }}
                className="bg-[#23C4C1] hover:bg-[#1aa8a5] text-white"
              >
                <Plus className="w-4 h-4 mr-1" />
                Thêm doanh thu
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <RevenueStatCard
                title="Tổng doanh thu (YTD)"
                value={formatCompactVnd(totalRevenue)}
                trend="+15.2% so với kỳ trước"
                positive
              />
              <RevenueStatCard
                title="Trung bình hàng tháng"
                value={formatCompactVnd(averageMonthlyRevenue)}
                trend="+12.8% so với kỳ trước"
                positive
              />
              <RevenueStatCard
                title="Giá trị đơn trung bình"
                value={formatCompactVnd(averageOrderValue)}
                trend="+3.5% so với kỳ trước"
                positive
              />
              <RevenueStatCard
                title="Số lượng giao dịch"
                value={new Intl.NumberFormat("vi-VN").format(
                  revenueItems.length,
                )}
                trend={`${revenueTrendAverage >= 0 ? "+" : ""}${revenueTrendAverage.toFixed(1)}% tăng trưởng TB`}
                positive={revenueTrendAverage >= 0}
              />
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
                  {revenues?.items.map((r) => (
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
                        {fmt.format(r.amount)}
                      </TableCell>
                      <TableCell className="text-right pr-5">
                        {r.revenueType === "manual" ? (
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
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <Dialog
            open={isRevenueModalOpen}
            onOpenChange={(open) => {
              setIsRevenueModalOpen(open);
              if (!open) setManualError("");
            }}
          >
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Tạo doanh thu thủ công</DialogTitle>
                <DialogDescription>
                  Nhập thông tin giao dịch để ghi nhận doanh thu ngoài đơn hàng.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                    setIsRevenueModalOpen(false);
                    setManualError("");
                  }}
                >
                  Hủy
                </Button>
                <Button
                  onClick={async () => {
                    const created = await handleCreateManualRevenue();
                    if (created) {
                      setIsRevenueModalOpen(false);
                    }
                  }}
                  disabled={createRevenueMutation.isPending}
                  className="bg-[#23C4C1] hover:bg-[#1aa8a5] text-white"
                >
                  {createRevenueMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-1" />
                  )}
                  Lưu doanh thu
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
              ? `${costs.totalCount} giao dịch · Tổng: ${fmt.format(totalCost)}`
              : undefined
          }
          loading={costLoading}
        >
          <div className="p-5 space-y-5">
            <div className="flex items-center justify-end">
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
                title="Tổng chi phí (YTD)"
                value={formatCompactVnd(totalCost)}
                trend="-8.5% so với kỳ trước"
                positive={false}
              />
              <CostStatCard
                title="Trung bình hàng tháng"
                value={formatCompactVnd(averageMonthlyCost)}
                trend="-5.2% so với kỳ trước"
                positive={false}
              />
              <CostStatCard
                title="Sử dụng ngân sách"
                value={`${budgetUsage.toFixed(1)}%`}
                trend="-2.1% so với kỳ trước"
                positive={false}
              />
              <CostStatCard
                title="Hiệu quả chi phí"
                value={`${costEfficiency.toFixed(1)}%`}
                trend={`${averageCostGrowth >= 0 ? "+" : ""}${averageCostGrowth.toFixed(1)}% so với kỳ trước`}
                positive={averageCostGrowth < 0}
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
                  {costs?.items.map((c) => (
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
                        {fmt.format(c.amount)}
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
                </TableBody>
              </Table>
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
                    setManualCostPaymentMethod(value as "cash" | "bank")
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
                        +{fmt.format(ch.totalIn)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Ra</span>
                      <span className="font-medium text-red-500">
                        -{fmt.format(ch.totalOut)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Ròng</span>
                      <span className="font-bold text-gray-900">
                        {fmt.format(ch.net)}
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
                      {fmt.format(item.value)}
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
  const { data: periods, isLoading: periodLoading } = useAccountingPeriods(locationId);
  const [periodId, setPeriodId] = useState<number | undefined>(undefined);
  const [expandedBookId, setExpandedBookId] = useState<number | null>(null);


  // Auto-select first open or most recent period
  useEffect(() => {
    if (periods && periods.length > 0 && !periodId) {
      const openPeriod = periods.find((p: any) => p.status === "open");
      setPeriodId(openPeriod?.periodId ?? periods[0].periodId);
    }
  }, [periods, periodId]);

  const { data: templates, isLoading: tplLoading } = useAccountingTemplates();
  const { data: books, isLoading: bookLoading } = useAccountingBooks(locationId, periodId);
  const { mutateAsync: createBook, isPending: creatingBook } = useCreateAccountingBook(locationId);

  const [groupNumber, setGroupNumber] = useState<number>(2);
  const [taxMethod, setTaxMethod] = useState<string>("method_1");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  // Update suggested tax method and templates based on group
  useEffect(() => {
    if (groupNumber === 1) {
      setTaxMethod("exempt");
    } else if (groupNumber === 4 && taxMethod === "exempt") {
      setTaxMethod("method_2");
    } else if (taxMethod === "exempt") {
      setTaxMethod("method_1");
    }
  }, [groupNumber]);

  useEffect(() => {
    if (!templates) return;
    const codes = templates
      .filter(
        (t) =>
          t.applicableGroups?.includes(groupNumber) &&
          t.applicableMethods?.includes(taxMethod)
      )
      .map((t) => t.templateCode);
    setSelectedTemplates(codes);
  }, [groupNumber, taxMethod, templates]);

  const handleCreate = async () => {
    if (!periodId) return alert("Vui lòng chọn hoặc tạo kỳ kế toán trước.");
    if (selectedTemplates.length === 0) return alert("Vui lòng chọn ít nhất 1 mẫu sổ.");
    try {
      await createBook({
        periodId,
        groupNumber,
        taxMethod,
        templateCodes: selectedTemplates,
      });
      alert("Tạo sổ thành công!");
    } catch (err: any) {
      alert(err.message || "Lỗi tạo sổ.");
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
          <label className="text-sm font-medium text-gray-600">Kỳ Kế Toán:</label>
          <Select
            value={periodId ? String(periodId) : ""}
            onValueChange={(v) => setPeriodId(Number(v))}
          >
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue placeholder={periodLoading ? "Đang tải..." : "Chọn kỳ..."} />
            </SelectTrigger>
            <SelectContent>
              {periods?.map((p: any) => (
                <SelectItem key={p.periodId} value={String(p.periodId)}>
                  {p.periodType === "quarter"
                    ? `Q${p.quarter}/${p.year}`
                    : p.periodType === "year"
                    ? `Năm ${p.year}`
                    : `${new Date(p.startDate).toLocaleDateString("vi-VN")} - ${new Date(
                        p.endDate
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
          <Plus className="w-4 h-4 text-[#23C4C1]" /> Tạo Sổ Kế Toán (Gợi ý tự động)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-4 rounded-xl border border-gray-100 mb-4">
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
              Quy Mô / Nhóm HKD
            </label>
            <Select
              value={String(groupNumber)}
              onValueChange={(v) => setGroupNumber(Number(v))}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Nhóm 1 — Doanh thu {"<"} 500 triệu</SelectItem>
                <SelectItem value="2">Nhóm 2 — 500tr đến 3 tỷ</SelectItem>
                <SelectItem value="3">Nhóm 3 — 3 tỷ đến 50 tỷ</SelectItem>
                <SelectItem value="4">Nhóm 4 — {"≥"} 50 tỷ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 uppercase mb-2 block">
              Cách Tính Thuế
            </label>
            <Select
              value={taxMethod}
              onValueChange={setTaxMethod}
              disabled={groupNumber === 1}
            >
              <SelectTrigger className="bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {groupNumber === 1 ? (
                  <SelectItem value="exempt">Miễn thuế (Chỉ dành cho Nhóm 1)</SelectItem>
                ) : null}
                <SelectItem value="method_1" disabled={groupNumber === 1}>
                  Cách 1 — Theo % Doanh Thu
                </SelectItem>
                <SelectItem value="method_2" disabled={groupNumber === 1}>
                  Cách 2 — DT trừ CP
                </SelectItem>
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
                tpl.applicableMethods?.includes(taxMethod);
              const checked = selectedTemplates.includes(tpl.templateCode);
              return (
                <label
                  key={tpl.templateId}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    checked
                      ? "bg-[#23C4C1]/5 border-[#23C4C1]/30"
                      : "bg-white hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(c) => {
                      if (c) setSelectedTemplates((prev) => [...prev, tpl.templateCode]);
                      else
                        setSelectedTemplates((prev) =>
                          prev.filter((c) => c !== tpl.templateCode)
                        );
                    }}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${
                          BOOK_COLORS[tpl.templateCode] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {tpl.templateCode}
                      </span>
                      {suggested && (
                        <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-[2px] rounded uppercase">
                          Gợi ý
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{tpl.name}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            onClick={handleCreate}
            disabled={creatingBook || !periodId || selectedTemplates.length === 0}
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
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Danh sách sổ kế toán</h2>
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
            <p className="text-sm font-medium text-gray-400 animate-pulse">Đang truy xuất dữ liệu sổ...</p>
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
                    onClick={() => setExpandedBookId(isExpanded ? null : book.bookId)}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black font-mono shadow-inner ${
                        BOOK_COLORS[book.templateCode] || "bg-gray-100 text-gray-600"
                      }`}>
                        {book.templateCode}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-gray-900 group-hover:text-[#23C4C1] transition-colors flex items-center gap-2">
                          {book.templateName}
                          {isExpanded && <Badge className="bg-[#23C4C1] hover:bg-[#1DA8A5] text-[10px] h-4 px-1.5 uppercase">Active</Badge>}
                        </h3>
                        <div className="flex items-center gap-4 mt-1.5">
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md border">
                            <Users className="w-3 h-3" /> Nhóm {book.groupNumber}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md border">
                            <Layers className="w-3 h-3" /> 
                            {book.taxMethod === "method_1" ? "Ấn định" : "Kê khai"}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                            <Calendar className="w-3 h-3" />
                            {new Date(book.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {!isExpanded && (
                        <div className="hidden md:flex items-center gap-3 pr-4 border-r mr-4">
                          <div className="text-right">
                             <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Trạng thái</p>
                             <p className="text-xs font-bold text-emerald-600 uppercase italic">Hoạt động</p>
                          </div>
                        </div>
                      )}
                      
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isExpanded ? "bg-[#23C4C1] text-white rotate-180" : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                      }`}>
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
                                 <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold tracking-wider">
                                    <Download className="w-3 h-3 mr-1" /> Xuất Excel
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
            <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2">Bắt đầu thiết lập hệ thống sổ</h3>
            <p className="text-sm text-gray-400 max-w-xs mx-auto leading-relaxed">
              Hãy chọn kì kế toán và bấm <strong className="text-gray-600 font-bold">Gợi ý tạo sổ</strong> ở phía trên để hệ thống tự động thiết kế sổ sách theo đúng TT152.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared micro-components ─────────────────────────────────────────────────

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

function formatCompactVnd(amount: number) {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (abs >= 1_000_000_000) {
    return `${sign}₫${(abs / 1_000_000_000).toFixed(3).replace(/\.0+$/, "")}B`;
  }

  if (abs >= 1_000_000) {
    return `${sign}₫${(abs / 1_000_000).toFixed(3).replace(/\.0+$/, "")}M`;
  }

  if (abs >= 1_000) {
    return `${sign}₫${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }

  return `${sign}${fmt.format(abs)}`;
}

const PIE_COLORS = [
  "#14B8A6",
  "#60A5FA",
  "#F59E0B",
  "#A78BFA",
  "#F97316",
  "#22C55E",
];

function formatYAxisShort(value: number) {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(0)}K`;
  }
  return `${value}`;
}

function formatTooltipCurrency(value: unknown) {
  const numeric = Number(value ?? 0);
  return fmt.format(Number.isFinite(numeric) ? numeric : 0);
}

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
          <div key={i} className="h-28 bg-gray-100 rounded-3xl border border-gray-200" />
        ))}
      </div>
    );
    
  if (error)
    return (
      <div className="p-10 text-center bg-rose-50 rounded-[40px] border border-rose-100 text-rose-600 flex flex-col items-center gap-3 shadow-sm">
        <AlertCircle className="w-10 h-10" />
        <p className="font-bold text-lg text-rose-900">Không thể phân xuất dữ liệu</p>
        <p className="text-sm text-rose-600/80 max-w-md italic">Hệ thống phân tích đang bảo trì hoặc gặp lỗi kết nối. Hãy thử làm mới trang hoặc liên hệ quản trị viên.</p>
      </div>
    );
    
  if (!data?.data) return null;
  const summary = data.data;

  const fmtValue = (val: any) => {
    if (val === null || val === undefined) return "—";
    return Number(val).toLocaleString("vi-VN");
  };

  return (
    <div className="space-y-8 bg-slate-50/50 p-6 md:p-8 rounded-[40px] text-slate-700 border border-slate-200/60 shadow-inner backdrop-blur-sm">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "TỔNG DÒNG", value: summary.totalRows, color: "text-blue-600", bg: "bg-blue-50/30" },
          { label: "TỔNG DOANH THU", value: summary.totalRevenue, color: "text-emerald-600", bg: "bg-emerald-50/30" },
          { label: "TỔNG CHI PHÍ", value: summary.totalCost, color: "text-rose-600", bg: "bg-rose-50/30" },
          { label: "TỔNG THUẾ", value: summary.totalTax, color: "text-amber-600", bg: "bg-amber-50/30" },
        ].map((item) => (
          <div key={item.label} className={`bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-2 group hover:shadow-md transition-all ${item.bg}`}>
            <p className="text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase">{item.label}</p>
            <p className={`text-2xl md:text-3xl font-black ${item.color} tabular-nums tracking-tighter`}>
               {fmtValue(item.value)}
            </p>
          </div>
        ))}
      </div>

      {/* Kết quả công thức */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
           <Calculator className="w-4 h-4 text-slate-400" /> Kết quả công thức
        </div>
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
           <table className="w-full text-sm">
             <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black border-b">
               <tr>
                 <th className="px-6 py-4 text-left tracking-widest">Formula Code</th>
                 <th className="px-6 py-4 text-right tracking-widest">Giá trị</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {Object.entries(summary.formulaValues || {}).map(([code, val]) => (
                  <tr key={code} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{code}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 tabular-nums">
                       {fmtValue(val)}
                    </td>
                  </tr>
                ))}
             </tbody>
           </table>
        </div>
      </div>

      {/* Thông tin metadata */}
      <div className="space-y-4">
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
                    {summary.startDate ? `${new Date(summary.startDate).toLocaleDateString("vi-VN")} → ${new Date(summary.endDate).toLocaleDateString("vi-VN")}` : "Toàn thời gian"}
                 </span>
              </li>
              <li className="flex items-center gap-3">
                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                 <span className="text-slate-400 font-medium">Tax method:</span>
                 <span className="font-bold text-slate-800 uppercase">{summary.taxMethod || "N/A"}</span>
              </li>
              <li className="flex items-center gap-3">
                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                 <span className="text-slate-400 font-medium">Ruleset:</span>
                 <span className="font-bold text-slate-800 tracking-tight">Default Calculation Engine (v1.2)</span>
              </li>
              <li className="flex items-center gap-3">
                 <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                 <span className="text-slate-400 font-medium">Số loại ngành áp dụng:</span>
                 <span className="font-bold text-slate-800">{summary.businessTypeTaxes?.length || 0}</span>
              </li>
           </ul>
        </div>
      </div>

      {/* Ngành nghề & Thuế suất */}
      {summary.businessTypeTaxes?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
             <Zap className="w-4 h-4 text-amber-500" /> Ngành nghề và thuế suất áp dụng
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
             <table className="w-full text-sm">
               <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black border-b">
                 <tr>
                   <th className="px-6 py-4 text-left tracking-widest">Business Type</th>
                   <th className="px-6 py-4 text-left tracking-widest">Type</th>
                   <th className="px-6 py-4 text-right tracking-widest">Rate (%)</th>
                   <th className="px-6 py-4 text-left tracking-widest">Sync Source</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {summary.businessTypeTaxes.map((bt: any) => (
                    <React.Fragment key={bt.businessTypeId}>
                      {bt.taxRates?.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          {idx === 0 && (
                            <td className="px-6 py-4 font-bold text-slate-800 leading-tight" rowSpan={bt.taxRates.length}>
                               {bt.name}
                            </td>
                          )}
                          <td className="px-6 py-4 text-slate-500 font-mono text-xs italic">{r.taxType}</td>
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
      {summary.formulaDetails?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
             <Terminal className="w-4 h-4 text-slate-400" /> Chi tiết công thức (engine)
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
             <table className="w-full text-sm">
               <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black border-b">
                 <tr>
                   <th className="px-6 py-4 text-left tracking-widest">Code</th>
                   <th className="px-6 py-4 text-left tracking-widest">Name</th>
                   <th className="px-6 py-4 text-left tracking-widest">Expression JSON</th>
                   <th className="px-6 py-4 text-right tracking-widest">Output</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {summary.formulaDetails.map((f: any) => (
                    <tr key={f.formulaId} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{f.formulaCode}</td>
                      <td className="px-6 py-4 font-medium text-slate-700">{f.name || f.explanation}</td>
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
      )}

      {/* Cấu trúc cột */}
      {summary.columns?.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest pl-2">
             <Layers className="w-4 h-4 text-slate-400" /> Bản đồ dữ liệu & Cấu trúc cột
          </div>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
             <table className="w-full text-sm">
               <thead className="bg-slate-50/80 text-slate-500 text-[10px] uppercase font-black border-b">
                 <tr>
                   <th className="px-6 py-4 text-left tracking-widest">SheetCol</th>
                   <th className="px-6 py-4 text-left tracking-widest">DB Field</th>
                   <th className="px-6 py-4 text-left tracking-widest">Table Label</th>
                   <th className="px-6 py-4 text-left tracking-widest">Data Type</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                  {summary.columns.map((col: any) => (
                    <tr key={col.fieldCode} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 font-black text-slate-700">{col.exportColumn}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-400">{col.fieldCode}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{col.label}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs italic">{col.fieldType}</td>
                    </tr>
                  ))}
               </tbody>
             </table>
          </div>
        </div>
      )}
    </div>
  );
}
