"use client";

import { useState } from "react";
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
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLocations } from "@/hooks/useLocations";
import {
  useCosts,
  useRevenues,
  useCashFlowReport,
  useAccountingTemplates,
  useAccountingBooks,
} from "@/hooks/useAccounting";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import AccountingPeriodsTab from "./AccountingPeriodsTab";
import GeneralLedgerTab from "./GeneralLedgerTab";
import NoLocationScreenSkeleton from "@/components/NoLocationScreenSkeleton";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

type Tab = "reports" | "periods" | "books";

export default function ReportsClient() {
  const { data: locations, isLoading: locLoading } = useLocations();
  const { selectedLocationId } = useDashboardLocation();
  const [activeTab, setActiveTab] = useState<Tab>("periods");
  const locationList = locations ?? [];
  const hasLocations = locationList.length > 0;

  const selectedLocationExists =
    selectedLocationId != null &&
    selectedLocationId > 0 &&
    locationList.some((location) => location.id === selectedLocationId);

  const activeLocationId = hasLocations
    ? selectedLocationExists
      ? (selectedLocationId as number)
      : locationList[0].id
    : 0;

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
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          Báo cáo &amp; Thống kê
        </h1>
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
  const [subTab, setSubTab] = useState<
    "revenue" | "cost" | "cashflow" | "ledger"
  >("ledger");
  const { data: revenues, isLoading: revLoading } = useRevenues(locationId);
  const { data: costs, isLoading: costLoading } = useCosts({ locationId });
  const { data: cashFlow, isLoading: cfLoading } = useCashFlowReport(
    locationId,
    "2026-03-01",
    "2026-03-31",
  );

  const totalRevenue = revenues?.items.reduce((s, r) => s + r.amount, 0) ?? 0;
  const totalCost = costs?.items.reduce((s, c) => s + c.amount, 0) ?? 0;

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

  return (
    <div className="space-y-5">
      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          label="Tổng doanh thu"
          value={fmt.format(totalRevenue)}
          trend="+12.4%"
          up
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
          color="emerald"
        />
        <KpiCard
          label="Tổng chi phí"
          value={fmt.format(totalCost)}
          trend="+3.1%"
          up={false}
          icon={<ArrowDownRight className="w-4 h-4 text-red-500" />}
          color="red"
        />
        <KpiCard
          label="Lợi nhuận ròng"
          value={fmt.format(totalRevenue - totalCost)}
          trend="+18.2%"
          up
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
          color="emerald"
        />
      </div>

      {/* Sub tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
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
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                <TableHead className="pl-5">Ngày</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>PTTT</TableHead>
                <TableHead className="text-right pr-5">Số tiền</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                <TableHead className="pl-5">Ngày</TableHead>
                <TableHead>Phân loại</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>PTTT</TableHead>
                <TableHead className="text-right pr-5">Số tiền</TableHead>
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
  const { data: templates, isLoading: tplLoading } = useAccountingTemplates();
  const { data: books, isLoading: bookLoading } =
    useAccountingBooks(locationId);

  const BOOK_COLORS: Record<string, string> = {
    S1a: "bg-violet-100 text-violet-700",
    S2a: "bg-blue-100 text-blue-700",
    S2b: "bg-cyan-100 text-cyan-700",
    S2c: "bg-teal-100 text-teal-700",
    S2d: "bg-emerald-100 text-emerald-700",
    S2e: "bg-green-100 text-green-700",
  };

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">
          Mẫu sổ kế toán (TT152)
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Danh sách mẫu sổ theo Thông tư 152/2025/TT-BTC
        </p>
        {tplLoading ? (
          <div className="bg-white rounded-2xl border p-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates?.map((tpl) => (
              <div
                key={tpl.templateId}
                className="bg-white rounded-2xl border p-4 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`text-xs font-bold font-mono px-2.5 py-1 rounded-lg ${BOOK_COLORS[tpl.templateCode] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {tpl.templateCode}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${tpl.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}
                  >
                    {tpl.isActive ? "Đang dùng" : "Không dùng"}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 mb-2 leading-snug">
                  {tpl.name}
                </p>
                <p className="text-xs text-gray-400">
                  Nhóm {tpl.applicableGroups.join(", ")}
                  {tpl.applicableMethods &&
                    ` · ${tpl.applicableMethods.map((m) => (m === "method_1" ? "Cách 1" : "Cách 2")).join(", ")}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Books created */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-1">Sổ đã tạo</h2>
        <p className="text-sm text-gray-500 mb-4">
          Các sổ kế toán đã được tạo trong các kỳ
        </p>
        {bookLoading ? (
          <div className="bg-white rounded-2xl border p-10 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
          </div>
        ) : books && books.length > 0 ? (
          <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                  <TableHead className="pl-5 font-semibold text-gray-600">
                    Mã sổ
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Tên mẫu
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Nhóm
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Phương pháp
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-gray-600 pr-5">
                    Ngày tạo
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.bookId} className="hover:bg-gray-50/50">
                    <TableCell className="pl-5">
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md ${BOOK_COLORS[book.templateCode] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {book.templateCode}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">
                      {book.templateName}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      Nhóm {book.groupNumber}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {book.taxMethod
                        ? book.taxMethod === "method_1"
                          ? "Cách 1"
                          : "Cách 2"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${book.status === "active" ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"}`}
                      >
                        {book.status === "active" ? "Đang dùng" : "Lưu trữ"}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-400 pr-5">
                      {new Date(book.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border p-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-semibold text-gray-500">Chưa có sổ kế toán</p>
            <p className="text-sm text-gray-400 mt-1">
              Tạo kỳ kế toán và chọn mẫu sổ để bắt đầu
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared micro-components ─────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  trend,
  up,
  icon,
  color,
}: {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  icon: React.ReactNode;
  color: "emerald" | "red";
}) {
  const colorCls =
    color === "emerald"
      ? "text-emerald-600 bg-emerald-50"
      : "text-red-500 bg-red-50";
  return (
    <div className="bg-white rounded-2xl border p-5 space-y-2">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <div
        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${colorCls}`}
      >
        {icon}
        <span>{trend} so với kỳ trước</span>
      </div>
    </div>
  );
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
};

function CostBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {COST_LABELS[type] ?? type}
    </Badge>
  );
}
