"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CalendarRange,
  Filter,
  ChevronDown,
  Search,
  X,
  CheckCircle2,
  Undo2,
  CircleSlash,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  useGLEntries,
  useAllGLEntries,
  useGLReferenceCatalog,
} from "@/hooks/useAccounting";
import type {
  GLEntryFilters,
  GLEntryListItem,
  GLViewMode,
} from "@/lib/types/accounting";

const fmt = new Intl.NumberFormat("vi-VN", {
  style: "currency",
  currency: "VND",
  maximumFractionDigits: 0,
});

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolveDateRange(
  fromDate: string,
  toDate: string,
): {
  fromDate: string;
  toDate: string;
} {
  const today = toIsoDate(new Date());
  const finalToDate = toDate || today;
  const year = Number.parseInt(finalToDate.slice(0, 4), 10);
  const safeYear = Number.isNaN(year) ? new Date().getFullYear() : year;

  return {
    fromDate: fromDate || `${safeYear}-01-01`,
    toDate: finalToDate,
  };
}

function statusMeta(status: unknown): { label: string; cls: string } {
  const raw = normalizeFilterValue(status).toLowerCase();

  switch (raw) {
    case "reversal":
      return {
        label: valueLabel(status) || beautifyEnumLabel(raw),
        cls: "bg-red-50 text-red-700 border-red-200",
      };
    case "reversed":
      return {
        label: valueLabel(status) || beautifyEnumLabel(raw),
        cls: "bg-slate-100 text-slate-700 border-slate-300",
      };
    case "replaced":
      return {
        label: valueLabel(status) || beautifyEnumLabel(raw),
        cls: "bg-slate-100 text-slate-700 border-slate-300",
      };
    case "active":
      return {
        label: valueLabel(status) || beautifyEnumLabel(raw),
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    default:
      return {
        label: valueLabel(status) || beautifyEnumLabel(raw),
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
  }
}

function normalizeLabelValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const label = record.label ?? record.name ?? record.displayName;
    if (typeof label === "string" && label.trim()) {
      return label;
    }

    const code = record.code ?? record.value ?? record.id;
    if (typeof code === "string" && code.trim()) {
      return code;
    }
  }

  return String(value ?? "");
}

function normalizeFilterValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const code = record.code ?? record.value ?? record.id;
    if (typeof code === "string" && code.trim()) {
      return code;
    }
    const label = record.label ?? record.name ?? record.displayName;
    if (typeof label === "string" && label.trim()) {
      return label;
    }
  }

  return String(value ?? "");
}

function beautifyEnumLabel(value: unknown): string {
  const raw = normalizeLabelValue(value);
  if (!raw) return "";

  return raw
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function valueLabel(value: unknown): string {
  const raw = normalizeLabelValue(value);
  if (!raw) return "";

  return raw.includes("_") ? beautifyEnumLabel(raw) : raw;
}

function codeValueLabel(value: unknown): string {
  const raw = normalizeFilterValue(value);
  if (!raw) return "";

  return raw.includes("_") ? beautifyEnumLabel(raw) : raw;
}

function resolveSelectedLabel(
  options: unknown[] | undefined,
  value: string,
): string {
  const matchedOption = options?.find(
    (option) => normalizeFilterValue(option) === value,
  );

  return matchedOption ? valueLabel(matchedOption) : codeValueLabel(value);
}

function sourcePath(entry: GLEntryListItem): string | null {
  const entityType = normalizeFilterValue(
    entry.source?.entityType || "",
  ).toLowerCase();
  const referenceType = normalizeFilterValue(
    entry.source?.referenceType || entry.referenceType || "",
  ).toLowerCase();
  const entityId = entry.source?.entityId;
  const referenceId = entry.source?.referenceId ?? entry.referenceId;

  if (entityId) {
    if (
      entityType === "order" ||
      (!entityType && referenceType === "revenue")
    ) {
      return `/dashboard/orders/${entityId}`;
    }

    if (entityType === "import") {
      return `/dashboard/imports/${entityId}`;
    }
  }

  if (referenceType === "order" && referenceId) {
    return `/dashboard/orders/${referenceId}`;
  }

  if (referenceType === "import" && referenceId) {
    return `/dashboard/imports/${referenceId}`;
  }

  if (referenceType === "debtor_payment") {
    return "/dashboard/customers";
  }

  return null;
}

function MultiSelectFilter({
  title,
  options,
  selected,
  onToggle,
  onClear,
  onSelectAll,
}: {
  title: string;
  options: unknown[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  onSelectAll: () => void;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredOptions = options.filter((option) =>
    valueLabel(option).toLowerCase().includes(normalizedQuery),
  );

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-gray-700">
          {title} ({selected.length})
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={onSelectAll}
          >
            Chọn tất cả
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={onClear}
            disabled={selected.length === 0}
          >
            Bỏ chọn
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Tìm trong ${title.toLowerCase()}...`}
          className="pl-9 h-9"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {filteredOptions.map((option) => {
          const optionValue = normalizeFilterValue(option);
          const checked = selected.includes(optionValue);
          return (
            <label
              key={optionValue || JSON.stringify(option)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(optionValue)}
              />
              <span className="truncate text-sm">{valueLabel(option)}</span>
            </label>
          );
        })}

        {filteredOptions.length === 0 && (
          <div className="col-span-2 md:col-span-3 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500">
            Không tìm thấy lựa chọn phù hợp.
          </div>
        )}
      </div>
    </div>
  );
}

export default function GeneralLedgerTab({
  locationId,
}: {
  locationId: number;
}) {
  const router = useRouter();

  const [transactionTypes, setTransactionTypes] = useState<string[]>([]);
  const [referenceTypes, setReferenceTypes] = useState<string[]>([]);
  const [moneyChannels, setMoneyChannels] = useState<
    Array<"cash" | "bank" | "debt">
  >([]);
  const [viewMode, setViewMode] = useState<GLViewMode>("audit");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const range = useMemo(
    () => resolveDateRange(fromDate, toDate),
    [fromDate, toDate],
  );

  const filters: GLEntryFilters = {
    locationId,
    transactionTypes,
    referenceTypes,
    moneyChannels,
    viewMode,
    fromDate: range.fromDate,
    toDate: range.toDate,
    pageNumber,
    pageSize,
  };

  const { data: catalog, isLoading: isCatalogLoading } =
    useGLReferenceCatalog();
  const {
    data,
    isLoading: isEntriesLoading,
    isError,
    error,
  } = useGLEntries(filters);

  const summaryFilters: GLEntryFilters = {
    locationId,
    transactionTypes,
    referenceTypes,
    moneyChannels,
    viewMode,
    fromDate: range.fromDate,
    toDate: range.toDate,
  };

  const { data: summaryData } = useAllGLEntries(summaryFilters);

  const summary = useMemo(() => {
    const items = summaryData?.items ?? [];
    let totalIn = 0;
    let totalOut = 0;
    let activeCount = 0;
    let reversedCount = 0;
    let reversalCount = 0;

    for (const item of items) {
      totalIn += item.debitAmount;
      totalOut += item.creditAmount;

      const status = normalizeFilterValue(item.effectiveStatus).toLowerCase();
      if (status === "active") activeCount += 1;
      if (status === "reversed") reversedCount += 1;
      if (status === "reversal") reversalCount += 1;
    }

    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      activeCount,
      reversedCount,
      reversalCount,
    };
  }, [summaryData?.items]);

  const activeFilterCount =
    transactionTypes.length + referenceTypes.length + moneyChannels.length;

  function toggleStringValue(
    value: string,
    current: string[],
    setter: (values: string[]) => void,
  ) {
    setPageNumber(1);
    setter(
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function toggleMoneyChannel(value: "cash" | "bank" | "debt") {
    setPageNumber(1);
    setMoneyChannels((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  }

  function resetFilters() {
    setTransactionTypes([]);
    setReferenceTypes([]);
    setMoneyChannels([]);
    setViewMode("audit");
    setFromDate("");
    setToDate("");
    setPageNumber(1);
    setPageSize(10);
  }

  function applyDatePreset(preset: "today" | "7d" | "month" | "year") {
    const today = new Date();
    let nextFromDate = "";
    const nextToDate = toIsoDate(today);

    if (preset === "today") {
      nextFromDate = nextToDate;
    }

    if (preset === "7d") {
      const past = new Date(today);
      past.setDate(today.getDate() - 6);
      nextFromDate = toIsoDate(past);
    }

    if (preset === "month") {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      nextFromDate = toIsoDate(firstDay);
    }

    if (preset === "year") {
      nextFromDate = `${today.getFullYear()}-01-01`;
    }

    setPageNumber(1);
    setFromDate(nextFromDate);
    setToDate(nextToDate);
  }

  const hasAnyDetailedFilter =
    transactionTypes.length > 0 ||
    referenceTypes.length > 0 ||
    moneyChannels.length > 0;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-800">
            <Filter className="w-4 h-4 text-[#23C4C1]" />
            <h3 className="text-lg font-semibold">Bộ lọc sổ cái</h3>
            <Badge variant="outline" className="text-xs md:text-sm">
              {resolveSelectedLabel(catalog?.viewModes, viewMode)}
            </Badge>
            <Badge variant="secondary" className="text-xs md:text-sm">
              {activeFilterCount} bộ lọc chi tiết
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetFilters}>
              Reset bộ lọc
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFilterOpen((open) => !open)}
              className="gap-1.5"
            >
              {isFilterOpen ? "Thu gọn" : "Mở bộ lọc"}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`}
              />
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 flex items-center gap-2">
          <CalendarRange className="w-4 h-4" />
          <span>
            Khoảng ngày đang áp dụng: {range.fromDate} đến {range.toDate}.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">Lọc nhanh:</span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => applyDatePreset("today")}
          >
            Hôm nay
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => applyDatePreset("7d")}
          >
            7 ngày
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => applyDatePreset("month")}
          >
            Tháng này
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 text-xs"
            onClick={() => applyDatePreset("year")}
          >
            Năm nay
          </Button>
        </div>

        {hasAnyDetailedFilter && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Đang lọc:</span>
            {transactionTypes.map((value) => (
              <button
                key={`tt-${value}`}
                type="button"
                onClick={() =>
                  toggleStringValue(
                    value,
                    transactionTypes,
                    setTransactionTypes,
                  )
                }
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Loại: {resolveSelectedLabel(catalog?.transactionTypes, value)}
                <X className="w-3 h-3" />
              </button>
            ))}
            {referenceTypes.map((value) => (
              <button
                key={`rt-${value}`}
                type="button"
                onClick={() =>
                  toggleStringValue(value, referenceTypes, setReferenceTypes)
                }
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Nguồn: {resolveSelectedLabel(catalog?.referenceTypes, value)}
                <X className="w-3 h-3" />
              </button>
            ))}
            {moneyChannels.map((value) => (
              <button
                key={`mc-${value}`}
                type="button"
                onClick={() => toggleMoneyChannel(value)}
                className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-gray-700 hover:bg-gray-50"
              >
                Kênh: {resolveSelectedLabel(catalog?.moneyChannels, value)}
                <X className="w-3 h-3" />
              </button>
            ))}
          </div>
        )}

        {isFilterOpen && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <p className="text-sm text-gray-600">Chế độ hiển thị</p>
                <Select
                  value={viewMode}
                  onValueChange={(value) => {
                    setPageNumber(1);
                    setViewMode(value as GLViewMode);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn view mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {(catalog?.viewModes ?? ["effective", "audit"]).map(
                      (mode) => {
                        const value = normalizeFilterValue(mode);
                        return (
                          <SelectItem key={value} value={value}>
                            {valueLabel(mode)}
                          </SelectItem>
                        );
                      },
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm text-gray-600">Từ ngày</p>
                <Input
                  type="date"
                  value={fromDate}
                  onChange={(event) => {
                    setPageNumber(1);
                    setFromDate(event.target.value);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm text-gray-600">Đến ngày</p>
                <Input
                  type="date"
                  value={toDate}
                  onChange={(event) => {
                    setPageNumber(1);
                    setToDate(event.target.value);
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm text-gray-600">Số dòng mỗi trang</p>
                <Select
                  value={String(pageSize)}
                  onValueChange={(value) => {
                    setPageNumber(1);
                    setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[10, 20, 50].map((size) => (
                      <SelectItem key={size} value={String(size)}>
                        {size} dòng
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 flex items-center gap-2">
              <CalendarRange className="w-4 h-4" />
              <span>
                Nếu không nhập từ ngày, hệ thống tự lấy từ {range.fromDate} (đầu
                năm của ToDate).
              </span>
            </div>

            {isCatalogLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> Đang tải dữ liệu
                filter...
              </div>
            ) : (
              <div className="space-y-3">
                <MultiSelectFilter
                  title="Loại giao dịch"
                  options={catalog?.transactionTypes ?? []}
                  selected={transactionTypes}
                  onToggle={(value) =>
                    toggleStringValue(
                      value,
                      transactionTypes,
                      setTransactionTypes,
                    )
                  }
                  onClear={() => {
                    setPageNumber(1);
                    setTransactionTypes([]);
                  }}
                  onSelectAll={() => {
                    setPageNumber(1);
                    setTransactionTypes(
                      (catalog?.transactionTypes ?? []).map((item) =>
                        normalizeFilterValue(item),
                      ),
                    );
                  }}
                />

                <MultiSelectFilter
                  title="Nguồn phát sinh"
                  options={catalog?.referenceTypes ?? []}
                  selected={referenceTypes}
                  onToggle={(value) =>
                    toggleStringValue(value, referenceTypes, setReferenceTypes)
                  }
                  onClear={() => {
                    setPageNumber(1);
                    setReferenceTypes([]);
                  }}
                  onSelectAll={() => {
                    setPageNumber(1);
                    setReferenceTypes(
                      (catalog?.referenceTypes ?? []).map((item) =>
                        normalizeFilterValue(item),
                      ),
                    );
                  }}
                />

                <MultiSelectFilter
                  title="Kênh tiền"
                  options={(catalog?.moneyChannels ?? []).map(
                    (channel) => channel,
                  )}
                  selected={moneyChannels}
                  onToggle={(value) =>
                    toggleMoneyChannel(value as "cash" | "bank" | "debt")
                  }
                  onClear={() => {
                    setPageNumber(1);
                    setMoneyChannels([]);
                  }}
                  onSelectAll={() => {
                    setPageNumber(1);
                    setMoneyChannels(
                      (catalog?.moneyChannels ?? [])
                        .map((item) => normalizeFilterValue(item))
                        .filter(
                          (channel) =>
                            channel === "cash" ||
                            channel === "bank" ||
                            channel === "debt",
                        ) as Array<"cash" | "bank" | "debt">,
                    );
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="border-b px-4 py-3 bg-gray-50/80 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            Đang hiệu lực: {summary.activeCount}
          </span>
          <span className="inline-flex items-center gap-1.5 text-red-700">
            <Undo2 className="w-4 h-4" />
            Dòng đảo: {summary.reversalCount}
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-700">
            <CircleSlash className="w-4 h-4" />
            Đã bị hủy hiệu lực: {summary.reversedCount}
          </span>
        </div>

        {isEntriesLoading ? (
          <div className="py-16 flex items-center justify-center text-gray-500 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#23C4C1]" />
            Đang tải sổ cái...
          </div>
        ) : isError ? (
          <div className="py-10 px-4 text-center text-red-600 text-sm">
            {(error as Error)?.message || "Không thể tải dữ liệu sổ cái."}
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                  <TableHead className="pl-5 text-sm font-semibold text-gray-700">
                    Ngày
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">
                    Loại giao dịch
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">
                    Nguồn
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">
                    Nội dung
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">
                    Kênh tiền
                  </TableHead>
                  <TableHead className="text-sm font-semibold text-gray-700">
                    Trạng thái
                  </TableHead>
                  <TableHead className="text-right text-sm font-semibold text-gray-700">
                    Thu
                  </TableHead>
                  <TableHead className="text-right text-sm font-semibold text-gray-700">
                    Chi
                  </TableHead>
                  <TableHead className="text-right pr-5 text-sm font-semibold text-gray-700">
                    Chi tiết
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.items ?? []).map((entry) => {
                  const status = statusMeta(entry.effectiveStatus);
                  const path = sourcePath(entry);
                  const eff = normalizeFilterValue(
                    entry.effectiveStatus,
                  ).toLowerCase();
                  const muted = eff === "reversed" || eff === "replaced";

                  return (
                    <TableRow
                      key={entry.entryId}
                      className={
                        muted
                          ? "opacity-75 bg-slate-50/60 line-through text-slate-500"
                          : "hover:bg-gray-50/70"
                      }
                    >
                      <TableCell className="pl-5 text-sm text-gray-600 py-3.5 whitespace-nowrap">
                        {new Date(entry.entryDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-800 py-3.5">
                        <span className="inline-flex rounded-md border px-2 py-1 bg-white">
                          {valueLabel(entry.transactionType)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-3.5">
                        {valueLabel(
                          entry.source?.referenceType || entry.referenceType,
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-sm text-gray-800 py-3.5 ${muted ? "line-through" : ""}`}
                      >
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 py-3.5 whitespace-nowrap">
                        {valueLabel(entry.moneyChannel)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${status.cls}`}
                        >
                          {status.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600 py-3.5 whitespace-nowrap">
                        {entry.debitAmount > 0
                          ? fmt.format(entry.debitAmount)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-500 py-3.5 whitespace-nowrap">
                        {entry.creditAmount > 0
                          ? fmt.format(entry.creditAmount)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right pr-5 py-3.5">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!path}
                          onClick={() => {
                            if (path) {
                              const backUrl = encodeURIComponent(
                                "/dashboard/reports?tab=reports&subTab=ledger",
                              );
                              router.push(
                                `${path}${path.includes("?") ? "&" : "?"}backUrl=${backUrl}`,
                              );
                            }
                          }}
                        >
                          {path ? "Xem nguồn" : "Không có"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {(data?.items ?? []).length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="py-10 text-center text-gray-500"
                    >
                      Không có giao dịch sổ cái theo bộ lọc hiện tại.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="border-t px-4 py-3.5 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600">
                Tổng {data?.totalCount ?? 0} dòng · Trang{" "}
                {data?.pageNumber ?? 1}/{Math.max(data?.totalPages ?? 1, 1)}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!data?.hasPreviousPage}
                  onClick={() => setPageNumber((prev) => Math.max(prev - 1, 1))}
                >
                  Trang trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!data?.hasNextPage}
                  onClick={() => setPageNumber((prev) => prev + 1)}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
