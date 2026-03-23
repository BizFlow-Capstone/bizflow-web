"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CalendarRange,
  Filter,
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
import { useGLEntries, useGLReferenceCatalog } from "@/hooks/useAccounting";
import type {
  GLEntryFilters,
  GLEntryListItem,
  GLEffectiveStatus,
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

function statusMeta(status: GLEffectiveStatus): { label: string; cls: string } {
  switch (status) {
    case "reversal":
      return {
        label: "Dòng đảo",
        cls: "bg-red-50 text-red-700 border-red-200",
      };
    case "reversed":
      return {
        label: "Đã bị hủy hiệu lực",
        cls: "bg-slate-100 text-slate-700 border-slate-300",
      };
    default:
      return {
        label: "Đang hiệu lực",
        cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
  }
}

function beautifyEnumLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function moneyChannelLabel(value?: string): string {
  if (value === "cash") return "Tiền mặt";
  if (value === "bank") return "Ngân hàng";
  if (value === "debt") return "Ghi nợ";
  return "Không rõ";
}

function viewModeLabel(value: GLViewMode): string {
  if (value === "audit") return "Audit - Dòng thời gian đầy đủ";
  return "Effective - Số liệu hiệu lực";
}

function sourcePath(entry: GLEntryListItem): string | null {
  const sourceType = (
    entry.source?.entityType ||
    entry.source?.referenceType ||
    entry.referenceType ||
    ""
  ).toLowerCase();
  const sourceId =
    entry.source?.entityId ?? entry.source?.referenceId ?? entry.referenceId;

  if (!sourceId) {
    return null;
  }

  if (sourceType === "order") {
    return `/dashboard/orders/${sourceId}`;
  }

  if (sourceType === "import") {
    return `/dashboard/imports/${sourceId}`;
  }

  if (sourceType === "debtor_payment") {
    return "/dashboard/customers";
  }

  return null;
}

function MultiSelectFilter({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((option) => {
          const checked = selected.includes(option);
          return (
            <label
              key={option}
              className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
            >
              <Checkbox
                checked={checked}
                onCheckedChange={() => onToggle(option)}
              />
              <span className="truncate text-sm">
                {beautifyEnumLabel(option)}
              </span>
            </label>
          );
        })}
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
  const [viewMode, setViewMode] = useState<GLViewMode>("effective");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const summary = useMemo(() => {
    const items = data?.items ?? [];
    let totalIn = 0;
    let totalOut = 0;
    let activeCount = 0;
    let reversedCount = 0;
    let reversalCount = 0;

    for (const item of items) {
      totalIn += item.debitAmount;
      totalOut += item.creditAmount;

      if (item.effectiveStatus === "active") activeCount += 1;
      if (item.effectiveStatus === "reversed") reversedCount += 1;
      if (item.effectiveStatus === "reversal") reversalCount += 1;
    }

    return {
      totalIn,
      totalOut,
      net: totalIn - totalOut,
      activeCount,
      reversedCount,
      reversalCount,
    };
  }, [data?.items]);

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
    setViewMode("effective");
    setFromDate("");
    setToDate("");
    setPageNumber(1);
    setPageSize(10);
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500 mb-1">
            Tổng thu (trang hiện tại)
          </p>
          <p className="text-2xl font-bold text-emerald-600">
            {fmt.format(summary.totalIn)}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500 mb-1">
            Tổng chi (trang hiện tại)
          </p>
          <p className="text-2xl font-bold text-red-600">
            {fmt.format(summary.totalOut)}
          </p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-sm text-gray-500 mb-1">Chênh lệch thu chi</p>
          <p className="text-2xl font-bold text-gray-900">
            {fmt.format(summary.net)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-gray-800">
            <Filter className="w-4 h-4 text-[#23C4C1]" />
            <h3 className="text-lg font-semibold">Bộ lọc sổ cái</h3>
            <Badge variant="outline" className="text-xs md:text-sm">
              {viewModeLabel(viewMode)}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={resetFilters}>
            Reset bộ lọc
          </Button>
        </div>

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
                {(catalog?.viewModes ?? ["effective", "audit"]).map((mode) => (
                  <SelectItem key={mode} value={mode}>
                    {viewModeLabel(mode)}
                  </SelectItem>
                ))}
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
            Nếu không nhập từ ngày, hệ thống tự lấy từ {range.fromDate} (đầu năm
            của ToDate).
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
                toggleStringValue(value, transactionTypes, setTransactionTypes)
              }
            />

            <MultiSelectFilter
              title="Nguồn phát sinh"
              options={catalog?.referenceTypes ?? []}
              selected={referenceTypes}
              onToggle={(value) =>
                toggleStringValue(value, referenceTypes, setReferenceTypes)
              }
            />

            <MultiSelectFilter
              title="Kênh tiền"
              options={(catalog?.moneyChannels ?? []).map((channel) => channel)}
              selected={moneyChannels}
              onToggle={(value) =>
                toggleMoneyChannel(value as "cash" | "bank" | "debt")
              }
            />
          </div>
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
                  const muted = entry.effectiveStatus === "reversed";

                  return (
                    <TableRow
                      key={entry.entryId}
                      className={
                        muted
                          ? "opacity-75 bg-slate-50/60"
                          : "hover:bg-gray-50/70"
                      }
                    >
                      <TableCell className="pl-5 text-sm text-gray-600 py-3.5 whitespace-nowrap">
                        {new Date(entry.entryDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-800 py-3.5">
                        <span className="inline-flex rounded-md border px-2 py-1 bg-white">
                          {beautifyEnumLabel(entry.transactionType)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 py-3.5">
                        {beautifyEnumLabel(
                          entry.source?.referenceType || entry.referenceType,
                        )}
                      </TableCell>
                      <TableCell
                        className={`text-sm text-gray-800 py-3.5 ${muted ? "line-through" : ""}`}
                      >
                        {entry.description}
                      </TableCell>
                      <TableCell className="text-sm text-gray-700 py-3.5 whitespace-nowrap">
                        {moneyChannelLabel(entry.moneyChannel)}
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
                            if (path) router.push(path);
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
