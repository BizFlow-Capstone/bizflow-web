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

export type BookRow = Record<string, unknown>;

interface BookRowsTableProps {
  bookId: number;
  templateCode?: string;
  locationId?: number;
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
  const [columns, setColumns] = useState<any[]>([]);
  const [summaryMeta, setSummaryMeta] = useState<any>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadRows = useCallback(async (isReset = false) => {
    if (!isReset && (loading || !hasMore)) return;
    
    setLoading(true);
    const currentPage = isReset ? 1 : page;
    
    try {
      if (currentPage === 1) {
        // Fetch summary for column info
        const res = await authFetch(`/api/locations/${locationId || 1}/accounting/books/${bookId}/summary`);
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
        const finalRows = (totalEst > 0 && nextRows.length > totalEst) 
          ? nextRows.slice(0, totalEst) 
          : nextRows;
        return finalRows;
      });

      const currentRowsCount = isReset ? result.rows.length : rows.length + result.rows.length;
      const reachedEnd = totalEst > 0 ? (currentRowsCount >= totalEst) : !result.hasMore;
      
      setHasMore(!reachedEnd && !!result.hasMore);
      setPage(currentPage + 1);
    } catch (err) {
      console.error("Lỗi khi tải dòng sổ:", err);
      if (!isReset) setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [bookId, fetchRows, page, hasMore, loading, locationId, pageSize, rows.length]);

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
    loadRows(true);
  }, [bookId, pageSize]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading) return;
    const observer = new IntersectionObserver((entries) => {
      const target = entries[0];
      if (target.isIntersecting && !loading && hasMore) {
        loadRows();
      }
    }, { threshold: 0.1 });
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadRows, hasMore, loading]);

  const renderCell = (row: BookRow, fieldCode: string) => {
    const val = row[fieldCode];
    if (typeof val === "number") {
      return val.toLocaleString("vi-VN");
    }
    return String(val ?? "");
  };

  const buildRowExplanation = (row: BookRow) => {
    const desc = (row.dien_giai || row.description || row.Description || "Không có diễn giải") as string;
    const date = (row.ngay_thang || row.date || row.ngay || row.RevenueDate || row.CostDate || "") as string;
    const amount = Number(row.so_tien ?? row.revenue ?? row.Amount ?? 0);

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
       <span className="text-slate-500 font-medium font-sans">Hiển thị mỗi đợt:</span>
       <Select value={String(pageSize)} onValueChange={(val) => setPageSize(Number(val))}>
          <SelectTrigger className="w-[80px] h-8 text-xs bg-white font-sans">
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

  if (templateCode === "S1a") {
    return (
      <div className="max-w-5xl mx-auto my-6">
        {BatchSizeSelector}
        <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8 transition-all hover:shadow-cyan-100/50">
          <div className="flex justify-between items-start text-xs leading-relaxed font-serif">
            <div className="space-y-1 font-serif">
              <p className="font-bold font-serif uppercase">HỘ, CÁ NHÂN KINH DOANH: ........................</p>
              <p className="font-serif">Địa chỉ: .............................................................</p>
              <p className="font-serif">Mã số thuế: .......................................................</p>
            </div>
            <div className="text-right italic space-y-1 max-w-[300px] font-serif">
               <p className="font-bold not-italic font-serif">Mẫu số S1a-HKD</p>
               <p className="font-serif">(Kèm theo Thông tư số 152/2025/TT-BTC</p>
               <p className="font-serif">ngày 31 tháng 12 năm 2025 của Bộ trưởng</p>
               <p className="font-serif">Bộ Tài chính)</p>
            </div>
          </div>

          <div className="text-center space-y-3 font-serif">
             <h2 className="text-xl font-black uppercase tracking-tight font-serif">SỔ DOANH THU BÁN HÀNG HÓA, DỊCH VỤ</h2>
             <div className="text-sm space-y-1 font-serif">
                <p className="font-serif">Địa điểm kinh doanh: .....................................................</p>
                <p className="font-serif">Kỳ kê khai: .......................................................................</p>
             </div>
          </div>

          <div className="flex justify-end italic text-xs mb-2 font-serif">
             Đơn vị tính: .....................
          </div>

          <div className="overflow-x-auto border-2 border-slate-900">
             <table className="w-full border-collapse text-sm">
               <thead>
                  <tr className="border-b-2 border-slate-900 font-serif">
                    {columns.map((col, idx) => (
                      <th key={col.fieldCode} className={`border-r border-slate-900 last:border-0 p-3 bg-slate-50 font-black text-center font-serif ${idx === columns.length - 1 ? "min-w-[150px]" : ""}`}>
                         {col.label}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-slate-900 italic text-[11px] bg-slate-50/50 font-serif text-center">
                    {columns.map((col, idx) => {
                      let label = col.exportColumn || String.fromCharCode(65 + idx);
                      if (col.fieldType === "decimal" || col.fieldType === "number") label = "1";
                      return (
                        <th key={`letter-${idx}`} className="border-r border-slate-900 last:border-0 p-1 font-medium font-serif">
                           {label}
                        </th>
                      );
                    })}
                  </tr>
               </thead>
               <tbody>
                 {rows.map((row, idx) => (
                   <tr key={idx} className="border-b border-slate-400/30 hover:bg-cyan-50/30 transition-colors font-serif">
                     {columns.map((col) => (
                       <td key={col.fieldCode} className={`border-r border-slate-900 last:border-0 p-3 font-serif ${col.fieldType === "decimal" || col.fieldType === "number" ? "text-right font-mono" : ""}`}>
                          {renderCell(row, col.fieldCode)}
                       </td>
                     ))}
                   </tr>
                 ))}
                 <tr className="border-t-2 border-slate-900 bg-slate-50 font-black text-center font-serif">
                   {columns.map((col, idx) => {
                     const isDescriptionCol = col.fieldCode?.toLowerCase().includes("description") || col.fieldCode?.toLowerCase().includes("dien_giai");
                     const isLastCol = idx === columns.length - 1;
                     const isMoney = col.fieldCode === "revenue" || col.fieldType === "decimal" || col.fieldType === "number";
                     const descriptionColIdx = columns.findIndex(c => c.fieldCode?.toLowerCase().includes("description") || c.fieldCode?.toLowerCase().includes("dien_giai"));
                     const targetLabelIdx = descriptionColIdx !== -1 ? descriptionColIdx : 1;

                     if (idx === targetLabelIdx) {
                       return <td key="total-label" className="border-r border-slate-900 p-3 font-serif">Tổng cộng</td>;
                     }
                     if (isMoney && isLastCol) {
                       const totalVal = summaryMeta?.totalRevenue ?? summaryMeta?.totalAmount ?? 0;
                       return (
                         <td key="total-val" className="border-r border-slate-900 last:border-0 p-3 text-right font-mono">
                           {totalVal.toLocaleString("vi-VN")}
                         </td>
                       );
                     }
                     return <td key={`total-${idx}`} className="border-r border-slate-900 last:border-0 p-3 font-serif"></td>;
                   })}
                 </tr>
               </tbody>
             </table>
          </div>

          {hasMore && <div ref={loaderRef} style={{ height: 10 }} />}
          {loading && (
            <div className="py-4 text-center">
              <Spinner className="w-5 h-5 text-slate-400 inline-block" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-8 pt-8 font-serif">
             <div className="text-center italic text-xs font-serif"></div>
             <div className="text-center space-y-1 font-serif">
                <p className="italic text-xs font-serif">Ngày ... tháng ... năm ...</p>
                <p className="font-bold text-sm uppercase font-serif">NGƯỜI ĐẠI DIỆN HỘ KINH DOANH/</p>
                <p className="font-bold text-sm uppercase font-serif">CÁ NHÂN KINH DOANH</p>
                <p className="italic text-xs pt-2 font-serif">(Ký, ghi rõ họ tên, đóng dấu (nếu có))</p>
             </div>
          </div>

          {!hasMore && rows.length > 0 && (
            <p className="text-[10px] text-center text-slate-400 italic pt-8 font-serif">— Hết sổ —</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-6">
      {BatchSizeSelector}
      <div className="overflow-hidden rounded-xl border bg-white shadow-sm font-sans">
        <div className="overflow-x-auto max-h-[550px]">
          <Table>
            <TableHeader className="bg-gray-50/80 sticky top-0 z-10">
              <TableRow>
                {columns.length > 0 ? (
                  columns.map((col) => (
                    <TableHead key={col.fieldCode} className="whitespace-nowrap font-semibold text-gray-700">
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
                <TableHead className="min-w-[250px] font-semibold text-gray-700 text-center">Giải thích dòng</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/50 transition-colors">
                  {columns.length > 0 ? (
                    columns.map((col) => (
                      <TableCell key={col.fieldCode} className={col.fieldType === "number" || col.fieldType === "decimal" ? "text-right font-mono" : ""}>
                        {renderCell(row, col.fieldCode)}
                      </TableCell>
                    ))
                  ) : (
                    <>
                      <TableCell>{String(row.date || row.ngay || "")}</TableCell>
                      <TableCell>{String(row.description || row.dien_giai || "")}</TableCell>
                      <TableCell className="text-right font-mono">{Number(row.amount || row.so_tien || 0).toLocaleString("vi-VN")}</TableCell>
                    </>
                  )}
                  <TableCell className="bg-slate-50/30">{buildRowExplanation(row)}</TableCell>
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
          <p className="mb-2 italic text-sm">Chưa có dòng dữ liệu nào trong giai đoạn này.</p>
          <p className="text-xs">Hệ thống tự động cập nhật khi phát sinh đơn hàng hoặc chứng từ mới.</p>
        </div>
      )}
    </div>
  );
};
