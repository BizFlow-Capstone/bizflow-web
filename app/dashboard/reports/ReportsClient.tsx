"use client";

import { useState } from "react";
import {
  MapPin,
  Loader2,
  DollarSign,
  TrendingDown,
  Banknote,
  Landmark,
  CreditCard,
  Calendar,
  Lock,
  Unlock,
  FileText,
  BookOpen,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useLocations } from "@/hooks/useLocations";
import {
  useCosts,
  useRevenues,
  useCashFlowReport,
  useAccountingPeriods,
  useAccountingTemplates,
  useAccountingBooks,
} from "@/hooks/useAccounting";
import type { PeriodStatus } from "@/lib/types/accounting";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

type Tab = "reports" | "periods" | "books";

export default function ReportsClient() {
  const { data: locations, isLoading: locLoading } = useLocations();
  const [locationId, setLocationId] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<Tab>("reports");

  const activeLocationId =
    locationId > 0
      ? locationId
      : locations && locations.length > 0
        ? locations[0].id
        : 0;

  if (locLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    {
      key: "reports",
      label: "Báo cáo",
      icon: <TrendingDown className="w-4 h-4" />,
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
    <div className="flex-1 flex flex-col">
      <div className="px-8 pt-6">
        <div className="flex items-center justify-end gap-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <Select
            value={String(activeLocationId)}
            onValueChange={(v) => setLocationId(Number(v))}
          >
            <SelectTrigger className="w-55 bg-white">
              <SelectValue placeholder="Chọn cửa hàng" />
            </SelectTrigger>
            <SelectContent>
              {locations?.map((loc) => (
                <SelectItem key={loc.id} value={String(loc.id)}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-1 mt-4 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[#23C4C1] text-white"
                  : "text-gray-600 hover:bg-gray-100"
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
          <PeriodsTab locationId={activeLocationId} />
        )}
        {activeTab === "books" && <BooksTab locationId={activeLocationId} />}
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Tab 1: Báo cáo (Revenue, Cost, Cash Flow)
// ═══════════════════════════════════════════════

function ReportsTab({ locationId }: { locationId: number }) {
  const [subTab, setSubTab] = useState<"revenue" | "cost" | "cashflow">(
    "revenue",
  );
  const { data: revenues, isLoading: revLoading } = useRevenues(locationId);
  const { data: costs, isLoading: costLoading } = useCosts({ locationId });
  const { data: cashFlow, isLoading: cfLoading } = useCashFlowReport(
    locationId,
    "2026-03-01",
    "2026-03-31",
  );

  const subTabs = [
    {
      key: "revenue" as const,
      label: "Doanh thu",
      icon: <DollarSign className="w-4 h-4" />,
    },
    {
      key: "cost" as const,
      label: "Chi phí",
      icon: <TrendingDown className="w-4 h-4" />,
    },
    {
      key: "cashflow" as const,
      label: "Dòng tiền",
      icon: <Banknote className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              subTab === t.key
                ? "bg-white border border-gray-200 text-gray-800 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* Revenue Table */}
      {subTab === "revenue" && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Báo cáo doanh thu</h3>
            {revenues && (
              <p className="text-sm text-gray-500 mt-1">
                Tổng:{" "}
                <span className="font-medium text-emerald-600">
                  {fmt.format(revenues.items.reduce((s, r) => s + r.amount, 0))}
                </span>
                {" · "}
                {revenues.totalCount} bản ghi
              </p>
            )}
          </div>
          {revLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>PTTT</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues?.items.map((r) => (
                  <TableRow key={r.revenueId}>
                    <TableCell className="text-sm">
                      {new Date(r.revenueDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          r.revenueType === "sale" ? "default" : "secondary"
                        }
                        className={
                          r.revenueType === "sale"
                            ? "bg-blue-100 text-blue-700"
                            : ""
                        }
                      >
                        {r.revenueType === "sale" ? "Bán hàng" : "Thủ công"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {r.description}
                    </TableCell>
                    <TableCell>
                      <PaymentMethodBadge method={r.paymentMethod} />
                    </TableCell>
                    <TableCell className="text-right font-medium text-emerald-600">
                      {fmt.format(r.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Cost Table */}
      {subTab === "cost" && (
        <div className="bg-white rounded-xl border">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Báo cáo chi phí</h3>
            {costs && (
              <p className="text-sm text-gray-500 mt-1">
                Tổng:{" "}
                <span className="font-medium text-red-600">
                  {fmt.format(costs.items.reduce((s, c) => s + c.amount, 0))}
                </span>
                {" · "}
                {costs.totalCount} bản ghi
              </p>
            )}
          </div>
          {costLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Phân loại</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>PTTT</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs?.items.map((c) => (
                  <TableRow key={c.costId}>
                    <TableCell className="text-sm">
                      {new Date(c.costDate).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell>
                      <CostTypeBadge type={c.costType} />
                    </TableCell>
                    <TableCell className="text-sm max-w-xs truncate">
                      {c.description}
                    </TableCell>
                    <TableCell>
                      <PaymentMethodBadge method={c.paymentMethod} />
                    </TableCell>
                    <TableCell className="text-right font-medium text-red-600">
                      {fmt.format(c.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Cash Flow */}
      {subTab === "cashflow" && (
        <div className="space-y-4">
          {cfLoading ? (
            <div className="bg-white rounded-xl border p-8 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
            </div>
          ) : cashFlow ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {cashFlow.channels.map((ch) => (
                  <div
                    key={ch.channel}
                    className="bg-white rounded-xl border p-5"
                  >
                    <div className="flex items-center gap-2 mb-3">
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
                        <span className="text-gray-500">Tổng vào</span>
                        <span className="font-medium text-emerald-600">
                          +{fmt.format(ch.totalIn)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Tổng ra</span>
                        <span className="font-medium text-red-500">
                          -{fmt.format(ch.totalOut)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between">
                        <span className="text-gray-600 font-medium">Ròng</span>
                        <span className="font-bold text-gray-800">
                          {fmt.format(ch.net)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary row */}
              <div className="bg-white rounded-xl border p-5">
                <h4 className="font-semibold text-gray-800 mb-2">Tổng hợp</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Tổng doanh thu</p>
                    <p className="font-bold text-lg text-gray-800">
                      {fmt.format(
                        cashFlow.channels.reduce((s, c) => s + c.totalIn, 0),
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tiền thực thu</p>
                    <p className="font-bold text-lg text-emerald-600">
                      {fmt.format(
                        cashFlow.channels
                          .filter((c) => c.channel !== "debt")
                          .reduce((s, c) => s + c.net, 0),
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Tổng chi</p>
                    <p className="font-bold text-lg text-red-500">
                      {fmt.format(
                        cashFlow.channels.reduce((s, c) => s + c.totalOut, 0),
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Nợ phát sinh</p>
                    <p className="font-bold text-lg text-amber-600">
                      {fmt.format(
                        cashFlow.channels.find((c) => c.channel === "debt")
                          ?.totalIn ?? 0,
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// Tab 2: Kỳ kế toán (Accounting Periods)
// ═══════════════════════════════════════════════

function PeriodsTab({ locationId }: { locationId: number }) {
  const { data: periods, isLoading } = useAccountingPeriods(locationId);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const getStatusBadge = (status: PeriodStatus) => {
    switch (status) {
      case "open":
        return (
          <Badge className="bg-emerald-100 text-emerald-700">
            <Clock className="w-3 h-3 mr-1" />
            Đang mở
          </Badge>
        );
      case "finalized":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Lock className="w-3 h-3 mr-1" />
            Đã chốt
          </Badge>
        );
      case "reopened":
        return (
          <Badge className="bg-amber-100 text-amber-700">
            <Unlock className="w-3 h-3 mr-1" />
            Mở lại
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Danh sách kỳ kế toán</h3>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#23C4C1] hover:bg-[#1ba8a6]"
        >
          <Plus className="w-4 h-4 mr-1" />
          Tạo kỳ mới
        </Button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border p-8 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
        </div>
      ) : periods && periods.length > 0 ? (
        <div className="space-y-3">
          {periods.map((period) => (
            <div
              key={period.periodId}
              className="bg-white rounded-xl border overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedId(
                    expandedId === period.periodId ? null : period.periodId,
                  )
                }
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div className="text-left">
                    <p className="font-medium text-gray-800">
                      {period.periodType === "quarter"
                        ? `Quý ${period.quarter}/${period.year}`
                        : `Năm ${period.year}`}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(period.startDate).toLocaleDateString("vi-VN")} —{" "}
                      {new Date(period.endDate).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(period.status)}
                  {expandedId === period.periodId ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </button>

              {expandedId === period.periodId && (
                <div className="px-4 pb-4 border-t bg-gray-50/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Số dư TM đầu kỳ
                      </p>
                      <p className="font-medium">
                        {period.openingCashBalance != null
                          ? fmt.format(period.openingCashBalance)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">
                        Số dư NH đầu kỳ
                      </p>
                      <p className="font-medium">
                        {period.openingBankBalance != null
                          ? fmt.format(period.openingBankBalance)
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Trạng thái</p>
                      <p className="font-medium capitalize">{period.status}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Ngày chốt</p>
                      <p className="font-medium">
                        {period.finalizedAt
                          ? new Date(period.finalizedAt).toLocaleDateString(
                              "vi-VN",
                            )
                          : "Chưa chốt"}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {(period.status === "open" ||
                      period.status === "reopened") && (
                      <Button size="sm" variant="outline">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Chốt kỳ
                      </Button>
                    )}
                    {period.status === "finalized" && (
                      <Button size="sm" variant="outline">
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Mở lại
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Xem sổ
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="font-medium">Chưa có kỳ kế toán</p>
          <p className="text-sm mt-1">
            Tạo kỳ kế toán đầu tiên để bắt đầu quản lý sổ sách
          </p>
        </div>
      )}

      {/* Create Period Dialog */}
      <CreatePeriodDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
      />
    </div>
  );
}

function CreatePeriodDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [periodType, setPeriodType] = useState<"quarter" | "year">("quarter");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState("1");
  const [cashBalance, setCashBalance] = useState("");
  const [bankBalance, setBankBalance] = useState("");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo kỳ kế toán mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Loại kỳ
            </label>
            <Select
              value={periodType}
              onValueChange={(v) => setPeriodType(v as "quarter" | "year")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quarter">Quý</SelectItem>
                <SelectItem value="year">Năm</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Năm
              </label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            {periodType === "quarter" && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Quý
                </label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Quý 1</SelectItem>
                    <SelectItem value="2">Quý 2</SelectItem>
                    <SelectItem value="3">Quý 3</SelectItem>
                    <SelectItem value="4">Quý 4</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Separator />
          <p className="text-xs text-gray-500">
            Số dư đầu kỳ (bắt buộc cho kỳ đầu tiên, kỳ sau tự động carry từ kỳ
            trước)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Tiền mặt đầu kỳ
              </label>
              <Input
                type="number"
                placeholder="VD: 50000000"
                value={cashBalance}
                onChange={(e) => setCashBalance(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Ngân hàng đầu kỳ
              </label>
              <Input
                type="number"
                placeholder="VD: 120000000"
                value={bankBalance}
                onChange={(e) => setBankBalance(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button className="bg-[#23C4C1] hover:bg-[#1ba8a6]" onClick={onClose}>
            Tạo kỳ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════
// Tab 3: Sổ kế toán (Accounting Books)
// ═══════════════════════════════════════════════

function BooksTab({ locationId }: { locationId: number }) {
  const { data: templates, isLoading: tplLoading } = useAccountingTemplates();
  const { data: books, isLoading: bookLoading } =
    useAccountingBooks(locationId);

  const isLoading = tplLoading || bookLoading;

  return (
    <div className="space-y-6">
      {/* Templates overview */}
      <div>
        <h3 className="font-semibold text-gray-800 mb-3">Mẫu sổ theo TT152</h3>
        {isLoading ? (
          <div className="bg-white rounded-xl border p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates?.map((tpl) => (
              <div
                key={tpl.templateId}
                className="bg-white rounded-xl border p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className="text-xs font-mono">
                    {tpl.templateCode}
                  </Badge>
                  <Badge
                    className={
                      tpl.isActive
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }
                  >
                    {tpl.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">
                  {tpl.name}
                </p>
                <p className="text-xs text-gray-500">
                  Nhóm: {tpl.applicableGroups.join(", ")}
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
        <h3 className="font-semibold text-gray-800 mb-3">Sổ đã tạo</h3>
        {bookLoading ? (
          <div className="bg-white rounded-xl border p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
          </div>
        ) : books && books.length > 0 ? (
          <div className="bg-white rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã sổ</TableHead>
                  <TableHead>Tên mẫu</TableHead>
                  <TableHead>Nhóm</TableHead>
                  <TableHead>Phương pháp</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {books.map((book) => (
                  <TableRow key={book.bookId}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {book.templateCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {book.templateName}
                    </TableCell>
                    <TableCell className="text-sm">
                      Nhóm {book.groupNumber}
                    </TableCell>
                    <TableCell className="text-sm">
                      {book.taxMethod
                        ? book.taxMethod === "method_1"
                          ? "Cách 1"
                          : "Cách 2"
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          book.status === "active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }
                      >
                        {book.status === "active" ? "Đang dùng" : "Lưu trữ"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(book.createdAt).toLocaleDateString("vi-VN")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">Chưa có sổ kế toán</p>
            <p className="text-sm mt-1">
              Tạo kỳ kế toán và chọn mẫu sổ để bắt đầu
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Shared badge components
// ═══════════════════════════════════════════════

function PaymentMethodBadge({ method }: { method?: string }) {
  if (!method) return <span className="text-xs text-gray-400">—</span>;
  const styles: Record<string, string> = {
    cash: "bg-emerald-100 text-emerald-700",
    bank: "bg-blue-100 text-blue-700",
    debt: "bg-amber-100 text-amber-700",
    mixed: "bg-purple-100 text-purple-700",
  };
  const labels: Record<string, string> = {
    cash: "Tiền mặt",
    bank: "Ngân hàng",
    debt: "Công nợ",
    mixed: "Hỗn hợp",
  };
  return (
    <Badge className={styles[method] || "bg-gray-100 text-gray-600"}>
      {labels[method] || method}
    </Badge>
  );
}

const COST_TYPE_LABELS: Record<string, string> = {
  import: "Nhập hàng",
  salary: "Lương",
  rent: "Thuê mặt bằng",
  utilities: "Điện/Nước",
  transport: "Vận chuyển",
  marketing: "Marketing",
  maintenance: "Bảo trì",
  other: "Khác",
};

function CostTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" className="text-xs">
      {COST_TYPE_LABELS[type] || type}
    </Badge>
  );
}
