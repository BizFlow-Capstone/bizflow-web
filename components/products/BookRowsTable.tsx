import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Spinner } from "@/components/ui/spinner";
import { authFetch } from "@/lib/auth/tokenManager";
import { useBookRows } from "@/hooks/useBookRows";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BookTemplatePreview from "@/components/accounting/BookTemplatePreview";
import type { AccountingTemplateColumnSummary } from "@/lib/types/adminAccounting";

export type BookRow = Record<string, unknown>;

interface BookRowsTableProps {
  bookId: number;
  templateCode?: string;
  locationId?: number;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type BookSummaryMeta = Record<string, unknown> & {
  columns?: Array<Record<string, unknown>>;
  templateName?: string;
  name?: string;
  versionLabel?: string;
  totalRevenue?: number;
  totalAmount?: number;
  total?: number;
  summaryTotal?: number;
};

export const BookRowsTable: React.FC<BookRowsTableProps> = ({
  bookId,
  templateCode,
  locationId,
}) => {
  const fetchRows = useBookRows(bookId, locationId);

  const [rows, setRows] = useState<BookRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [columns, setColumns] = useState<AccountingTemplateColumnSummary[]>([]);
  const [summaryMeta, setSummaryMeta] = useState<BookSummaryMeta | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const previewColumns: AccountingTemplateColumnSummary[] = columns.map(
    (col) => ({
      fieldCode: String(col.fieldCode ?? ""),
      label: String(col.label ?? col.fieldCode ?? ""),
      fieldType: String(col.fieldType ?? "text"),
      exportColumn: String(col.exportColumn ?? ""),
    }),
  );

  const previewTemplateName = String(
    summaryMeta?.templateName ?? summaryMeta?.name ?? "",
  );
  const previewVersionLabel = String(summaryMeta?.versionLabel ?? "");

  const loadRows = useCallback(
    async (isReset = false) => {
      if (!isReset && (loading || !hasMore)) return;

      setLoading(true);
      const currentPage = isReset ? 1 : page;

      try {
        if (currentPage === 1) {
          const res = await authFetch(
            `/api/locations/${locationId || 1}/accounting/books/${bookId}/summary`,
          );
          if (res.ok) {
            const api = await res.json();
            setColumns(api.data?.columns || []);
            setSummaryMeta(api.data || null);
          }
        }

        const result = await fetchRows(currentPage, pageSize);
        const totalEst = result.totalEstimated || 0;

        setRows((prev) => {
          const baseRows = isReset ? [] : prev;
          const nextRows = [...baseRows, ...result.rows];
          return totalEst > 0 && nextRows.length > totalEst
            ? nextRows.slice(0, totalEst)
            : nextRows;
        });

        const currentRowsCount = isReset
          ? result.rows.length
          : rows.length + result.rows.length;
        const reachedEnd =
          totalEst > 0 ? currentRowsCount >= totalEst : !result.hasMore;

        setHasMore(!reachedEnd && !!result.hasMore);
        setPage(currentPage + 1);
      } catch (err) {
        console.error("Lỗi khi tải dòng sổ:", err);
        if (!isReset) setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    [
      bookId,
      fetchRows,
      hasMore,
      loading,
      locationId,
      page,
      pageSize,
      rows.length,
    ],
  );

  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    setRows([]);
    setPage(1);
    setHasMore(true);
    void loadRows(true);
  }, [bookId, loadRows, pageSize]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && !loading && hasMore) {
          void loadRows();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadRows, hasMore, loading]);

  const renderCell = (row: BookRow, fieldCode: string) => {
    const val = row[fieldCode];
    if (typeof val === "number") return val.toLocaleString("vi-VN");
    return String(val ?? "");
  };

  const buildRowExplanation = (row: BookRow) => {
    const desc =
      asString(row.dien_giai) ||
      asString(row.description) ||
      asString(row.Description) ||
      "Không có diễn giải";
    const date =
      asString(row.ngay_thang) ||
      asString(row.date) ||
      asString(row.ngay) ||
      asString(row.RevenueDate) ||
      asString(row.CostDate);
    const amount =
      asNumber(row.so_tien) ??
      asNumber(row.revenue) ??
      asNumber(row.Amount) ??
      0;

    return (
      <div className="text-[10px] space-y-0.5 opacity-60 italic">
        <div>
          {desc} {date ? `(${date})` : ""} — {amount.toLocaleString("vi-VN")}đ
        </div>
      </div>
    );
  };

  const BatchSizeSelector = (
    <div className="flex items-center gap-3 mb-4 text-xs font-sans">
      <span className="text-slate-500 font-medium font-sans">
        Hiển thị mỗi đợt:
      </span>
      <Select
        value={String(pageSize)}
        onValueChange={(val) => setPageSize(Number(val))}
      >
        <SelectTrigger className="w-20 h-8 text-xs bg-white font-sans">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="font-sans">
          <SelectItem value="10">10 dòng</SelectItem>
          <SelectItem value="20">20 dòng</SelectItem>
          <SelectItem value="50">50 dòng</SelectItem>
          <SelectItem value="100">100 dòng</SelectItem>
        </SelectContent>
      </Select>
      {loading && <Spinner className="w-3 h-3 text-cyan-500 animate-spin" />}
    </div>
  );

  const isDocumentTemplate = templateCode === "S1a" || templateCode === "S2a";

  if (isDocumentTemplate) {
    return (
      <div className="max-w-6xl mx-auto my-6">
        {BatchSizeSelector}
        <BookTemplatePreview
          templateCode={templateCode}
          templateName={previewTemplateName}
          versionLabel={previewVersionLabel || undefined}
          columns={previewColumns}
          rows={rows}
          summaryMeta={summaryMeta}
        />

        {hasMore && <div ref={loaderRef} style={{ height: 10 }} />}
        {loading && (
          <div className="py-4 text-center">
            <Spinner className="w-5 h-5 text-slate-400 inline-block" />
          </div>
        )}

        {!hasMore && rows.length > 0 && (
          <p className="text-[10px] text-center text-slate-400 italic pt-8 font-serif">
            — Hết sổ —
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {BatchSizeSelector}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm font-sans">
        <div className="overflow-x-auto max-h-96">
          <Table>
            <TableHeader className="bg-gray-50/80 sticky top-0 z-10">
              <TableRow>
                {columns.length > 0 ? (
                  columns.map((col) => (
                    <TableHead
                      key={col.fieldCode}
                      className="whitespace-nowrap font-semibold text-gray-700"
                    >
                      {col.label}
                    </TableHead>
                  ))
                ) : (
                  <>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-right">Số tiền</TableHead>
                  </>
                )}
                <TableHead className="font-semibold text-gray-700 text-center">
                  Giải thích dòng
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  {columns.length > 0 ? (
                    columns.map((col) => (
                      <TableCell
                        key={col.fieldCode}
                        className={
                          col.fieldType === "number" ||
                          col.fieldType === "decimal"
                            ? "text-right font-mono"
                            : ""
                        }
                      >
                        {renderCell(row, col.fieldCode)}
                      </TableCell>
                    ))
                  ) : (
                    <>
                      <TableCell>
                        {String(row.date || row.ngay || "")}
                      </TableCell>
                      <TableCell>
                        {String(row.description || row.dien_giai || "")}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {Number(row.amount || row.so_tien || 0).toLocaleString(
                          "vi-VN",
                        )}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="bg-slate-50/30">
                    {buildRowExplanation(row)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {hasMore && <div ref={loaderRef} style={{ height: 10 }} />}
      {!hasMore && rows.length > 0 && (
        <div className="text-center text-xs text-gray-400 py-4 bg-gray-50/50 border-t italic">
          — Đã tải toàn bộ {rows.length} dòng —
        </div>
      )}
      {!loading && rows.length === 0 && (
        <div className="text-center text-gray-400 py-20 bg-slate-50/20">
          <p className="mb-2 italic text-sm">
            Chưa có dòng dữ liệu nào trong giai đoạn này.
          </p>
          <p className="text-xs">
            Hệ thống tự động cập nhật khi phát sinh đơn hàng hoặc chứng từ mới.
          </p>
        </div>
      )}
    </div>
  );
};
