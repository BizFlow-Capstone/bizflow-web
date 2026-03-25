"use client";

import { useState } from "react";
import {
  Calendar,
  Lock,
  Unlock,
  Clock,
  Plus,
  History,
  ChevronRight,
  CheckCircle2,
  RotateCcw,
  Banknote,
  Landmark,
  Loader2,
  AlertTriangle,
  Info,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useAccountingPeriods,
  useCreatePeriod,
  useCreateCustomPeriod,
  useFinalizePeriod,
  useReopenPeriod,
  usePeriodAuditLogs,
  useOpeningBalanceSuggestion,
  useAccountingBooks,
} from "@/hooks/useAccounting";
import type {
  AccountingPeriod,
  PeriodStatus,
  PeriodAuditLog,
} from "@/lib/types/accounting";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("vi-VN");
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function PeriodStatusBadge({ status }: { status: PeriodStatus }) {
  const cfg = {
    open: {
      cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Clock className="w-3 h-3" />,
      label: "Đang mở",
    },
    finalized: {
      cls: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Lock className="w-3 h-3" />,
      label: "Đã chốt",
    },
    reopened: {
      cls: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Unlock className="w-3 h-3" />,
      label: "Mở lại",
    },
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.cls}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

// ─── Period Label ─────────────────────────────────────────────────────────────

function periodLabel(p: AccountingPeriod) {
  if (p.periodType === "quarter") return `Q${p.quarter}/${p.year}`;
  if (p.periodType === "year") return `Năm ${p.year}`;
  return `${fmtDate(p.startDate)} – ${fmtDate(p.endDate)}`;
}

// ─── Audit log action map ─────────────────────────────────────────────────────

const ACTION_META: Record<string, { label: string; color: string }> = {
  period_created: { label: "Tạo kỳ", color: "bg-emerald-500" },
  period_finalized: { label: "Chốt kỳ", color: "bg-blue-500" },
  period_reopened: { label: "Mở lại kỳ", color: "bg-amber-500" },
  book_created: { label: "Tạo sổ kế toán", color: "bg-purple-500" },
  book_exported: { label: "Xuất sổ", color: "bg-gray-500" },
  group_suggestion: { label: "Gợi ý nhóm (hệ thống)", color: "bg-slate-400" },
};

// ─── Opening Balance Suggestion Card ─────────────────────────────────────────

function SuggestionCard({
  data,
  onApply,
  onDismiss,
}: {
  data: {
    openingCashBalance?: number;
    openingBankBalance?: number;
    sourceStartDate?: string;
    sourceEndDate?: string;
    calculationBreakdown?: {
      previousOpeningCashBalance: number;
      previousOpeningBankBalance: number;
      netCashInSourcePeriod: number;
      netBankInSourcePeriod: number;
    };
  };
  onApply: (cash: number, bank: number) => void;
  onDismiss: () => void;
}) {
  const bd = data.calculationBreakdown;
  const openingCash = data.openingCashBalance ?? 0;
  const openingBank = data.openingBankBalance ?? 0;
  const sourceStart = data.sourceStartDate ?? "";
  const sourceEnd = data.sourceEndDate ?? "";

  if (!bd) return null;

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 text-blue-700">
          <Sparkles className="w-4 h-4 shrink-0" />
          <p className="text-sm font-semibold">
            Gợi ý từ kỳ trước ({sourceStart ? fmtDate(sourceStart) : "-"} –{" "}
            {sourceEnd ? fmtDate(sourceEnd) : "-"})
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-blue-400 hover:text-blue-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        {[
          {
            ch: "Tiền mặt",
            prev: bd.previousOpeningCashBalance,
            net: bd.netCashInSourcePeriod,
            sug: openingCash,
          },
          {
            ch: "Ngân hàng",
            prev: bd.previousOpeningBankBalance,
            net: bd.netBankInSourcePeriod,
            sug: openingBank,
          },
        ].map((r) => (
          <div
            key={r.ch}
            className="bg-white rounded-lg p-3 border border-blue-100 space-y-1"
          >
            <p className="font-semibold text-blue-800 text-xs">{r.ch}</p>
            <div className="text-gray-500 space-y-0.5">
              <p>
                Đầu kỳ trước:{" "}
                <span className="text-gray-700">{fmt.format(r.prev)}</span>
              </p>
              <p>
                Net GL:{" "}
                <span className="text-emerald-600">+{fmt.format(r.net)}</span>
              </p>
            </div>
            <p className="font-bold text-gray-800 text-sm">
              {fmt.format(r.sug)}
            </p>
          </div>
        ))}
      </div>
      <Button
        size="sm"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8"
        onClick={() => onApply(openingCash, openingBank)}
      >
        Áp dụng gợi ý
      </Button>
    </div>
  );
}

// ─── Create Period Dialog ─────────────────────────────────────────────────────

function CreatePeriodDialog({
  open,
  onClose,
  locationId,
}: {
  open: boolean;
  onClose: () => void;
  locationId: number;
}) {
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [quarter, setQuarter] = useState("2");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [cash, setCash] = useState("");
  const [bank, setBank] = useState("");
  const [suggestion, setSuggestion] = useState<null | {
    openingCashBalance?: number;
    openingBankBalance?: number;
    sourceStartDate?: string;
    sourceEndDate?: string;
    calculationBreakdown?: {
      previousOpeningCashBalance: number;
      previousOpeningBankBalance: number;
      netCashInSourcePeriod: number;
      netBankInSourcePeriod: number;
    };
  }>(null);

  const createStandard = useCreatePeriod(locationId);
  const createCustom = useCreateCustomPeriod(locationId);
  const getSuggestion = useOpeningBalanceSuggestion(locationId);

  const isPending = createStandard.isPending || createCustom.isPending;

  function reset() {
    setYear(String(new Date().getFullYear()));
    setQuarter("2");
    setStartDate("");
    setEndDate("");
    setCash("");
    setBank("");
    setSuggestion(null);
  }

  async function fetchSuggestion(
    type: "quarter" | "year" | "custom",
    tab: string,
  ) {
    const params =
      tab === "custom"
        ? { periodType: "custom" as const, startDate: startDate || undefined }
        : tab === "quarter"
          ? {
              periodType: "quarter" as const,
              year: Number(year),
              quarter: Number(quarter),
            }
          : { periodType: "year" as const, year: Number(year) };
    const res = await getSuggestion.mutateAsync(params);
    if (res.data.hasSuggestion) setSuggestion(res.data);
  }

  async function handleSubmit(tab: string) {
    const cashVal = parseFloat(cash) || undefined;
    const bankVal = parseFloat(bank) || undefined;
    try {
      if (tab === "custom") {
        await createCustom.mutateAsync({
          startDate,
          endDate,
          openingCashBalance: cashVal,
          openingBankBalance: bankVal,
        });
      } else {
        await createStandard.mutateAsync({
          periodType: tab as "quarter" | "year",
          year: Number(year),
          quarter: tab === "quarter" ? Number(quarter) : undefined,
          openingCashBalance: cashVal,
          openingBankBalance: bankVal,
        });
      }
      reset();
      onClose();
    } catch {
      /* errors handled by mutation */
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          reset();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#23C4C1]" />
            Tạo kỳ kế toán mới
          </DialogTitle>
          <DialogDescription>
            Chọn loại kỳ và nhập thông tin số dư đầu kỳ.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="quarter">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="quarter">Theo Quý</TabsTrigger>
            <TabsTrigger value="year">Theo Năm</TabsTrigger>
            <TabsTrigger value="custom">Tùy chỉnh</TabsTrigger>
          </TabsList>

          {(["quarter", "year"] as const).map((tab) => (
            <TabsContent key={tab} value={tab} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Năm
                  </label>
                  <Input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    min={2020}
                    max={2100}
                  />
                </div>
                {tab === "quarter" && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Quý
                    </label>
                    <Select value={quarter} onValueChange={setQuarter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4].map((q) => (
                          <SelectItem key={q} value={String(q)}>
                            Quý {q}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <BalanceSection
                cash={cash}
                bank={bank}
                setCash={setCash}
                setBank={setBank}
                suggestion={suggestion}
                setSuggestion={setSuggestion}
                onFetchSuggestion={() => fetchSuggestion(tab, tab)}
                isLoadingSuggestion={getSuggestion.isPending}
              />
              <DialogFooter>
                <Button variant="outline" onClick={onClose}>
                  Hủy
                </Button>
                <Button
                  className="bg-[#23C4C1] hover:bg-[#1aa8a5]"
                  onClick={() => handleSubmit(tab)}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : null}
                  Tạo kỳ
                </Button>
              </DialogFooter>
            </TabsContent>
          ))}

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Đến ngày
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
            </div>
            <BalanceSection
              cash={cash}
              bank={bank}
              setCash={setCash}
              setBank={setBank}
              suggestion={suggestion}
              setSuggestion={setSuggestion}
              onFetchSuggestion={() => fetchSuggestion("custom", "custom")}
              isLoadingSuggestion={getSuggestion.isPending}
            />
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Hủy
              </Button>
              <Button
                className="bg-[#23C4C1] hover:bg-[#1aa8a5]"
                onClick={() => handleSubmit("custom")}
                disabled={isPending || !startDate || !endDate}
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : null}
                Tạo kỳ
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function BalanceSection({
  cash,
  bank,
  setCash,
  setBank,
  suggestion,
  setSuggestion,
  onFetchSuggestion,
  isLoadingSuggestion,
}: {
  cash: string;
  bank: string;
  setCash: (v: string) => void;
  setBank: (v: string) => void;
  suggestion: null | {
    openingCashBalance?: number;
    openingBankBalance?: number;
    sourceStartDate?: string;
    sourceEndDate?: string;
    calculationBreakdown?: {
      previousOpeningCashBalance: number;
      previousOpeningBankBalance: number;
      netCashInSourcePeriod: number;
      netBankInSourcePeriod: number;
    };
  };
  setSuggestion: (v: null) => void;
  onFetchSuggestion: () => void;
  isLoadingSuggestion: boolean;
}) {
  return (
    <div className="space-y-3">
      <Separator />
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 font-medium">Số dư đầu kỳ</p>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1 text-blue-600 border-blue-200 hover:bg-blue-50"
          onClick={onFetchSuggestion}
          disabled={isLoadingSuggestion}
        >
          {isLoadingSuggestion ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Sparkles className="w-3 h-3" />
          )}
          Gợi ý từ kỳ trước
        </Button>
      </div>
      {suggestion && (
        <SuggestionCard
          data={suggestion}
          onApply={(c, b) => {
            setCash(String(c));
            setBank(String(b));
            setSuggestion(null);
          }}
          onDismiss={() => setSuggestion(null)}
        />
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
            <Banknote className="w-3 h-3" />
            Tiền mặt (VNĐ)
          </label>
          <Input
            type="number"
            placeholder="VD: 50,000,000"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 mb-1 flex items-center gap-1">
            <Landmark className="w-3 h-3" />
            Ngân hàng (VNĐ)
          </label>
          <Input
            type="number"
            placeholder="VD: 120,000,000"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-start gap-2 bg-amber-50 rounded-lg p-2.5 text-xs text-amber-700 border border-amber-100">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          Kỳ đầu tiên bắt buộc nhập số dư. Kỳ sau có thể dùng tính năng gợi ý để
          tự động carry từ kỳ trước.
        </span>
      </div>
    </div>
  );
}

// ─── Finalize Dialog ──────────────────────────────────────────────────────────

function FinalizeDialog({
  period,
  locationId,
  onClose,
}: {
  period: AccountingPeriod | null;
  locationId: number;
  onClose: () => void;
}) {
  const finalize = useFinalizePeriod(locationId);
  async function handleConfirm() {
    if (!period) return;
    await finalize.mutateAsync(period.periodId);
    onClose();
  }
  return (
    <Dialog
      open={!!period}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-600" />
            Chốt kỳ kế toán
          </DialogTitle>
          <DialogDescription>
            Xác nhận chốt kỳ{" "}
            <strong>{period ? periodLabel(period) : ""}</strong>. Sau khi chốt,
            sổ kế toán sẽ được đánh dấu là chính thức.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4 text-sm text-blue-700 border border-blue-100">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Bạn vẫn có thể mở lại kỳ sau khi chốt nếu cần chỉnh sửa. Mọi thay
            đổi sẽ được ghi vào lịch sử.
          </span>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleConfirm}
            disabled={finalize.isPending}
          >
            {finalize.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-1" />
            )}
            Xác nhận Chốt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Reopen Dialog ────────────────────────────────────────────────────────────

function ReopenDialog({
  period,
  locationId,
  onClose,
}: {
  period: AccountingPeriod | null;
  locationId: number;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const reopen = useReopenPeriod(locationId);
  async function handleConfirm() {
    if (!period || !reason.trim()) return;
    await reopen.mutateAsync({
      periodId: period.periodId,
      reason: reason.trim(),
    });
    setReason("");
    onClose();
  }
  return (
    <Dialog
      open={!!period}
      onOpenChange={(v) => {
        if (!v) {
          setReason("");
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Unlock className="w-5 h-5 text-amber-600" />
            Mở lại kỳ kế toán
          </DialogTitle>
          <DialogDescription>
            Mở lại kỳ <strong>{period ? periodLabel(period) : ""}</strong> để
            chỉnh sửa. Lý do sẽ được ghi vào lịch sử.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Lý do mở lại <span className="text-red-500">*</span>
          </label>
          <Textarea
            placeholder="VD: Phát hiện thiếu 3 đơn hàng chưa complete, cần bổ sung trước khi nộp thuế..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-400">{reason.length}/500 ký tự</p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setReason("");
              onClose();
            }}
          >
            Hủy
          </Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white"
            onClick={handleConfirm}
            disabled={!reason.trim() || reopen.isPending}
          >
            {reopen.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-1" />
            )}
            Mở lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Audit Log Drawer ─────────────────────────────────────────────────────────

function AuditLogDrawer({
  period,
  locationId,
  onClose,
}: {
  period: AccountingPeriod | null;
  locationId: number;
  onClose: () => void;
}) {
  const { data: logs, isLoading } = usePeriodAuditLogs(
    locationId,
    period?.periodId ?? 0,
  );
  return (
    <Sheet
      open={!!period}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="w-full sm:w-120 sm:max-w-120 flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-gray-500" />
            Lịch sử thay đổi
          </SheetTitle>
          <SheetDescription>
            {period ? periodLabel(period) : ""}
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
            </div>
          ) : !logs || logs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <History className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm">Chưa có lịch sử thay đổi</p>
            </div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2.5 top-0 bottom-0 w-px bg-gray-100" />
              {logs.map((log, i) => (
                <AuditLogItem
                  key={log.logId}
                  log={log}
                  isLast={i === logs.length - 1}
                />
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function AuditLogItem({
  log,
  isLast,
}: {
  log: PeriodAuditLog;
  isLast: boolean;
}) {
  const meta = ACTION_META[log.action] ?? {
    label: log.action,
    color: "bg-gray-400",
  };
  const [expanded, setExpanded] = useState(false);
  const hasDetails = log.oldValue || log.newValue || log.reason;
  return (
    <div className={`relative pb-6 ${isLast ? "" : ""}`}>
      <div
        className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full border-2 border-white ${meta.color}`}
      />
      <div className="bg-white rounded-xl border p-3 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">{meta.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(log.createdAt).toLocaleString("vi-VN")} ·{" "}
              {log.createdByUserName ?? log.createdByUserId ?? "Unknown user"}
            </p>
          </div>
          {hasDetails && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-400 hover:text-gray-600 mt-0.5"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${expanded ? "rotate-90" : ""}`}
              />
            </button>
          )}
        </div>
        {expanded && (
          <div className="mt-3 pt-3 border-t space-y-2">
            {log.reason && (
              <div className="bg-amber-50 rounded-lg p-2.5 text-xs text-amber-700 border border-amber-100">
                <span className="font-medium">Lý do: </span>
                {log.reason}
              </div>
            )}
            {log.newValue && (
              <div className="bg-gray-50 rounded-lg p-2 text-xs">
                <p className="text-gray-400 mb-1 font-medium">Giá trị mới</p>
                <pre className="text-gray-600 whitespace-pre-wrap break-all">
                  {JSON.stringify(JSON.parse(log.newValue), null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Period Detail Sheet ──────────────────────────────────────────────────────

function PeriodDetailSheet({
  period,
  locationId,
  onClose,
}: {
  period: AccountingPeriod | null;
  locationId: number;
  onClose: () => void;
}) {
  const { data: books, isLoading } = useAccountingBooks(
    locationId,
    period?.periodId,
  );
  return (
    <Sheet
      open={!!period}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <SheetContent className="w-full sm:w-130 sm:max-w-130 flex flex-col p-2">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#23C4C1]" />
            {period ? periodLabel(period) : "Chi tiết kỳ"}
          </SheetTitle>
          <SheetDescription>
            {period && <PeriodStatusBadge status={period.status} />}
          </SheetDescription>
        </SheetHeader>
        {period && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-5">
            {/* Overview cards */}
            <div className="grid grid-cols-2 gap-3">
              <InfoCard
                icon={<Calendar className="w-4 h-4 text-gray-400" />}
                label="Thời gian"
                value={`${fmtDate(period.startDate)} – ${fmtDate(period.endDate)}`}
              />
              <InfoCard
                icon={<Clock className="w-4 h-4 text-gray-400" />}
                label="Ngày tạo"
                value={fmtDate(period.createdAt)}
              />
              <InfoCard
                icon={<Banknote className="w-4 h-4 text-emerald-500" />}
                label="TM đầu kỳ"
                value={
                  period.openingCashBalance != null
                    ? fmt.format(period.openingCashBalance)
                    : "—"
                }
              />
              <InfoCard
                icon={<Landmark className="w-4 h-4 text-blue-500" />}
                label="NH đầu kỳ"
                value={
                  period.openingBankBalance != null
                    ? fmt.format(period.openingBankBalance)
                    : "—"
                }
              />
              {period.finalizedAt && (
                <InfoCard
                  icon={<Lock className="w-4 h-4 text-blue-400" />}
                  label="Ngày chốt"
                  value={fmtDate(period.finalizedAt)}
                />
              )}
            </div>

            {/* Books */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Sổ kế toán trong kỳ
              </p>
              {isLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-[#23C4C1]" />
                </div>
              ) : books && books.length > 0 ? (
                <div className="space-y-2">
                  {books.map((book) => (
                    <div
                      key={book.bookId}
                      className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {book.templateName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <span className="font-mono bg-gray-200 rounded px-1">
                            {book.templateCode}
                          </span>
                          {" · "}Nhóm {book.groupNumber}
                          {book.taxMethod &&
                            ` · ${book.taxMethod === "method_1" ? "Cách 1" : "Cách 2"}`}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${book.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-500"}`}
                      >
                        {book.status === "active" ? "Đang dùng" : "Lưu trữ"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400 bg-gray-50 rounded-xl border border-dashed">
                  <p className="text-sm">Chưa có sổ kế toán nào trong kỳ này</p>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-3 border">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <p className="text-xs text-gray-500">{label}</p>
      </div>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}

// ─── Main PeriodsTab ──────────────────────────────────────────────────────────

type FilterStatus = "all" | PeriodStatus;

export default function AccountingPeriodsTab({
  locationId,
}: {
  locationId: number;
}) {
  const { data: periods, isLoading } = useAccountingPeriods(locationId);
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [showCreate, setShowCreate] = useState(false);
  const [finalizeTarget, setFinalizeTarget] = useState<AccountingPeriod | null>(
    null,
  );
  const [reopenTarget, setReopenTarget] = useState<AccountingPeriod | null>(
    null,
  );
  const [auditTarget, setAuditTarget] = useState<AccountingPeriod | null>(null);
  const [detailTarget, setDetailTarget] = useState<AccountingPeriod | null>(
    null,
  );

  const filtered = (periods ?? []).filter(
    (p) => filterStatus === "all" || p.status === filterStatus,
  );

  const statusCounts = {
    all: periods?.length ?? 0,
    open: periods?.filter((p) => p.status === "open").length ?? 0,
    finalized: periods?.filter((p) => p.status === "finalized").length ?? 0,
    reopened: periods?.filter((p) => p.status === "reopened").length ?? 0,
  };

  const filters: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: statusCounts.all },
    { key: "open", label: "Đang mở", count: statusCounts.open },
    { key: "finalized", label: "Đã chốt", count: statusCounts.finalized },
    { key: "reopened", label: "Mở lại", count: statusCounts.reopened },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Kỳ kế toán</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý vòng đời các kỳ kế toán của cửa hàng, bao gồm tạo mới, chốt
            sổ, và mở lại kỳ.
          </p>
        </div>
        <Button
          onClick={() => setShowCreate(true)}
          className="bg-[#23C4C1] hover:bg-[#1aa8a5] gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Tạo kỳ mới
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilterStatus(f.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
              filterStatus === f.key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f.label}
            <span
              className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${filterStatus === f.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-200" />
            <p className="font-semibold text-gray-500">Không có kỳ nào</p>
            <p className="text-sm mt-1">
              {filterStatus === "all"
                ? 'Nhấn "Tạo kỳ mới" để bắt đầu'
                : "Thử bỏ bộ lọc để xem tất cả"}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                <TableHead className="font-semibold text-gray-600 pl-5">
                  Kỳ kế toán
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Thời gian
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Trạng thái
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  TM đầu kỳ
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  NH đầu kỳ
                </TableHead>
                <TableHead className="font-semibold text-gray-600">
                  Ngày chốt
                </TableHead>
                <TableHead className="font-semibold text-gray-600 text-right pr-5">
                  Thao tác
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((period) => (
                <TableRow
                  key={period.periodId}
                  className="hover:bg-gray-50/50 group"
                >
                  <TableCell className="pl-5 font-semibold text-gray-900">
                    {periodLabel(period)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {fmtDate(period.startDate)} – {fmtDate(period.endDate)}
                  </TableCell>
                  <TableCell>
                    <PeriodStatusBadge status={period.status} />
                  </TableCell>
                  <TableCell className="text-sm font-mono text-gray-700">
                    {period.openingCashBalance != null ? (
                      fmt.format(period.openingCashBalance)
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm font-mono text-gray-700">
                    {period.openingBankBalance != null ? (
                      fmt.format(period.openingBankBalance)
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {period.finalizedAt ? (
                      fmtDate(period.finalizedAt)
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-5">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Detail */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-gray-500 hover:text-gray-800"
                        onClick={() => setDetailTarget(period)}
                      >
                        <ChevronRight className="w-3.5 h-3.5 mr-0.5" />
                        Chi tiết
                      </Button>
                      {/* History */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs text-gray-500 hover:text-gray-800"
                        onClick={() => setAuditTarget(period)}
                      >
                        <History className="w-3.5 h-3.5 mr-0.5" />
                        Lịch sử
                      </Button>
                      {/* Finalize */}
                      {(period.status === "open" ||
                        period.status === "reopened") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300"
                          onClick={() => setFinalizeTarget(period)}
                        >
                          <Lock className="w-3 h-3 mr-0.5" />
                          Chốt kỳ
                        </Button>
                      )}
                      {/* Reopen */}
                      {period.status === "finalized" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs border-amber-200 text-amber-600 hover:bg-amber-50 hover:border-amber-300"
                          onClick={() => setReopenTarget(period)}
                        >
                          <RotateCcw className="w-3 h-3 mr-0.5" />
                          Mở lại
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Modals & Drawers */}
      <CreatePeriodDialog
        open={showCreate}
        onClose={() => setShowCreate(false)}
        locationId={locationId}
      />
      <FinalizeDialog
        period={finalizeTarget}
        locationId={locationId}
        onClose={() => setFinalizeTarget(null)}
      />
      <ReopenDialog
        period={reopenTarget}
        locationId={locationId}
        onClose={() => setReopenTarget(null)}
      />
      <AuditLogDrawer
        period={auditTarget}
        locationId={locationId}
        onClose={() => setAuditTarget(null)}
      />
      <PeriodDetailSheet
        period={detailTarget}
        locationId={locationId}
        onClose={() => setDetailTarget(null)}
      />
    </div>
  );
}
