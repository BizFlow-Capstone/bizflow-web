import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

function buildRowDedupKey(row: BookRow): string {
  const idCandidates = [
    "rowId",
    "RowId",
    "lineId",
    "lineNumber",
    "revenueId",
    "costId",
    "glEntryId",
    "stockMovementId",
    "id",
    "Id",
  ];

  for (const key of idCandidates) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return `${key}:${value.trim()}`;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return `${key}:${value}`;
    }
  }

  return JSON.stringify(row);
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

type BookSectionRow = {
  lineType: string;
  values?: Record<string, unknown>;
  dataFilter?: {
    businessTypeId?: string;
    section?: string;
    productId?: string;
  };
  taxMetadata?: {
    taxType?: string;
  };
};

type BookSection = {
  sectionType: string;
  businessTypeId?: string;
  businessTypeName?: string;
  groupKey?: string;
  groupName?: string;
  rows?: BookSectionRow[];
};

type BookSectionsMeta = {
  columns?: AccountingTemplateColumnSummary[];
  sections?: BookSection[];
  footerRows?: BookSectionRow[];
};

const TT152_TEMPLATE_CODES = ["S1a", "S2a", "S2b", "S2c", "S2d", "S2e"];

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function toSectionDisplayRow(sectionRow: BookSectionRow): BookRow {
  const values = { ...(sectionRow.values ?? {}) };
  const row: BookRow = {
    ...values,
    lineType: values.lineType ?? sectionRow.lineType,
    rowType: values.rowType ?? sectionRow.lineType,
  };

  if (!row.rowLabel) {
    row.rowLabel = row.dien_giai ?? row.description ?? "";
  }

  if (!row.taxType && sectionRow.taxMetadata?.taxType) {
    row.taxType = sectionRow.taxMetadata.taxType;
  }

  return row;
}

function resolveBusinessTypeId(row: BookRow): string {
  return asString(row.businessTypeId) || asString(row.BusinessTypeId);
}

function assembleRowsFromSections(
  dataRows: BookRow[],
  sectionsMeta: BookSectionsMeta | null,
): BookRow[] {
  if (!sectionsMeta?.sections || sectionsMeta.sections.length === 0) {
    return dataRows;
  }

  const groupedDataRows = new Map<string, BookRow[]>();
  let ungroupedRows: BookRow[] = [];

  dataRows.forEach((row) => {
    const businessTypeId = normalizeKey(resolveBusinessTypeId(row));
    const sectionKey = normalizeKey(asString(row.section));
    const groupKey = businessTypeId || sectionKey;
    if (!groupKey) {
      ungroupedRows.push(row);
      return;
    }
    const group = groupedDataRows.get(groupKey) ?? [];
    group.push(row);
    groupedDataRows.set(groupKey, group);
  });

  const assembledRows: BookRow[] = [];
  const consumedBusinessTypes = new Set<string>();

  sectionsMeta.sections.forEach((section) => {
    (section.rows ?? []).forEach((layoutRow) => {
      if (layoutRow.lineType !== "data_placeholder") {
        assembledRows.push(toSectionDisplayRow(layoutRow));
        return;
      }

      const placeholderBusinessType = normalizeKey(
        layoutRow.dataFilter?.businessTypeId ??
          layoutRow.dataFilter?.productId ??
          layoutRow.dataFilter?.section ??
          section.businessTypeId ??
          section.groupKey ??
          "",
      );

      if (placeholderBusinessType) {
        const matchedRows = groupedDataRows.get(placeholderBusinessType) ?? [];
        if (matchedRows.length > 0) {
          assembledRows.push(...matchedRows);
          consumedBusinessTypes.add(placeholderBusinessType);
        }
        return;
      }

      if (ungroupedRows.length > 0) {
        assembledRows.push(...ungroupedRows);
        ungroupedRows = [];
      }
    });
  });

  groupedDataRows.forEach((groupRows, businessTypeId) => {
    if (consumedBusinessTypes.has(businessTypeId)) return;
    assembledRows.push(...groupRows);
  });

  if (ungroupedRows.length > 0) {
    assembledRows.push(...ungroupedRows);
  }

  (sectionsMeta.footerRows ?? []).forEach((footerRow) => {
    assembledRows.push(toSectionDisplayRow(footerRow));
  });

  return assembledRows.length > 0 ? assembledRows : dataRows;
}

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
  const [sectionsMeta, setSectionsMeta] = useState<BookSectionsMeta | null>(
    null,
  );
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const canAutoLoadRef = useRef(true);

  const isDocumentTemplate = TT152_TEMPLATE_CODES.includes(templateCode ?? "");

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
  const previewRows = useMemo(
    () => assembleRowsFromSections(rows, sectionsMeta),
    [rows, sectionsMeta],
  );

  const loadMoreRows = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const currentPage = page;

    try {
      const result = await fetchRows(currentPage, pageSize);
      const totalEst = result.totalEstimated || 0;
      let nextRowsCount = 0;

      setRows((prev) => {
        const seen = new Set(prev.map((row) => buildRowDedupKey(row)));
        const uniqueIncoming = result.rows.filter((row) => {
          const dedupKey = buildRowDedupKey(row);
          if (seen.has(dedupKey)) return false;
          seen.add(dedupKey);
          return true;
        });

        const nextRows = [...prev, ...uniqueIncoming];
        const cappedRows =
          totalEst > 0 && nextRows.length > totalEst
            ? nextRows.slice(0, totalEst)
            : nextRows;
        nextRowsCount = cappedRows.length;
        return cappedRows;
      });

      const reachedEnd =
        totalEst > 0 ? nextRowsCount >= totalEst : !result.hasMore;

      setHasMore(!reachedEnd && !!result.hasMore);
      setPage(currentPage + 1);
    } catch (err) {
      console.error("Lỗi khi tải thêm dòng sổ:", err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [fetchRows, hasMore, loading, page, pageSize]);

  useEffect(() => {
    let cancelled = false;

    const loadInitialRows = async () => {
      setLoading(true);
      setRows([]);
      setPage(1);
      setHasMore(true);
      canAutoLoadRef.current = true;
      setColumns([]);
      setSummaryMeta(null);
      setSectionsMeta(null);

      try {
        const locId = locationId || 1;
        const [summaryRes, sectionsRes, firstBatch] = await Promise.all([
          authFetch(
            `/api/locations/${locId}/accounting/books/${bookId}/summary`,
          ),
          isDocumentTemplate
            ? authFetch(
                `/api/locations/${locId}/accounting/books/${bookId}/sections`,
              )
            : Promise.resolve(null),
          fetchRows(1, pageSize),
        ]);

        if (cancelled) return;

        if (summaryRes.ok) {
          const summaryApi = await summaryRes.json();
          setColumns(summaryApi.data?.columns || []);
          setSummaryMeta(summaryApi.data || null);
        }

        if (sectionsRes && sectionsRes.ok) {
          const sectionsApi = await sectionsRes.json();
          const sectionsData = (sectionsApi.data ||
            null) as BookSectionsMeta | null;
          setSectionsMeta(sectionsData);

          if (
            sectionsData?.columns &&
            Array.isArray(sectionsData.columns) &&
            sectionsData.columns.length > 0
          ) {
            setColumns((previousColumns) =>
              previousColumns.length > 0
                ? previousColumns
                : sectionsData.columns || [],
            );
          }
        }

        const totalEst = firstBatch.totalEstimated || 0;
        const initialRows =
          totalEst > 0 && firstBatch.rows.length > totalEst
            ? firstBatch.rows.slice(0, totalEst)
            : firstBatch.rows;

        setRows(initialRows);

        const reachedEnd =
          totalEst > 0 ? initialRows.length >= totalEst : !firstBatch.hasMore;

        setHasMore(!reachedEnd && !!firstBatch.hasMore);
        setPage(2);
      } catch (err) {
        if (!cancelled) {
          console.error("Lỗi khi tải dòng sổ:", err);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInitialRows();

    return () => {
      cancelled = true;
    };
  }, [bookId, fetchRows, isDocumentTemplate, locationId, pageSize]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (!target.isIntersecting) {
          canAutoLoadRef.current = true;
          return;
        }

        if (canAutoLoadRef.current && !loading && hasMore) {
          canAutoLoadRef.current = false;
          void loadMoreRows();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMoreRows, loading]);

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

  if (isDocumentTemplate) {
    return (
      <div className="max-w-6xl mx-auto my-6">
        {BatchSizeSelector}
        <BookTemplatePreview
          templateCode={templateCode}
          templateName={previewTemplateName}
          versionLabel={previewVersionLabel || undefined}
          columns={previewColumns}
          rows={previewRows}
          summaryMeta={summaryMeta}
        />

        {hasMore && <div ref={loaderRef} style={{ height: 10 }} />}
        {loading && (
          <div className="py-4 text-center">
            <Spinner className="w-5 h-5 text-slate-400 inline-block" />
          </div>
        )}

        {!hasMore && previewRows.length > 0 && (
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
