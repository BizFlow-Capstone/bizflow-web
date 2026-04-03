import type {
  AccountingBookRow,
  AccountingTemplateColumnSummary,
} from "@/lib/types/adminAccounting";

interface BookTemplatePreviewProps {
  templateCode?: string;
  templateName?: string;
  versionLabel?: string;
  columns: AccountingTemplateColumnSummary[];
  rows: AccountingBookRow[];
  summaryMeta?: Record<string, unknown> | null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatValue(value: unknown): string {
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (value === null || value === undefined) return "";
  return String(value);
}

function getTotalValue(summaryMeta?: Record<string, unknown> | null): number {
  const candidate =
    summaryMeta?.totalRevenue ??
    summaryMeta?.totalAmount ??
    summaryMeta?.total ??
    summaryMeta?.summaryTotal ??
    0;
  return (asNumber(candidate) ?? Number(candidate)) || 0;
}

function normalizeColumns(columns: AccountingTemplateColumnSummary[]) {
  return columns.map((column) => ({
    fieldCode: column.fieldCode,
    label: column.label || column.fieldCode,
    fieldType: column.fieldType || "text",
    exportColumn: column.exportColumn || "",
  }));
}

export default function BookTemplatePreview({
  templateCode,
  templateName,
  versionLabel,
  columns,
  rows,
  summaryMeta,
}: BookTemplatePreviewProps) {
  const normalizedTemplateCode = (templateCode || "").trim().toLowerCase();
  const normalizedColumns = normalizeColumns(columns);
  const totalValue = getTotalValue(summaryMeta);
  const isS1a = normalizedTemplateCode === "s1a";
  const isS2a = normalizedTemplateCode === "s2a";

  const renderSimpleCell = (row: AccountingBookRow, fieldCode: string) => {
    const value = row[fieldCode];
    return formatValue(value);
  };

  if (isS1a) {
    return (
      <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8 transition-all hover:shadow-cyan-100/50">
        <div className="flex justify-between items-start text-xs leading-relaxed font-serif">
          <div className="space-y-1 font-serif">
            <p className="font-bold font-serif uppercase">
              HỘ, CÁ NHÂN KINH DOANH: ........................
            </p>
            <p className="font-serif">
              Địa chỉ:
              .............................................................
            </p>
            <p className="font-serif">
              Mã số thuế:
              .......................................................
            </p>
          </div>
          <div className="text-right italic space-y-1 max-w-xs font-serif">
            <p className="font-bold not-italic font-serif">Mẫu số S1a-HKD</p>
            <p className="font-serif">
              {templateName || "Sổ doanh thu bán hàng hóa, dịch vụ"}
            </p>
            <p className="font-serif">
              {versionLabel ? `Version: ${versionLabel}` : ""}
            </p>
            <p className="font-serif">(Kèm theo Thông tư số 152/2025/TT-BTC</p>
            <p className="font-serif">
              ngày 31 tháng 12 năm 2025 của Bộ trưởng
            </p>
            <p className="font-serif">Bộ Tài chính)</p>
          </div>
        </div>

        <div className="text-center space-y-3 font-serif">
          <h2 className="text-xl font-black uppercase tracking-tight font-serif">
            SỔ DOANH THU BÁN HÀNG HÓA, DỊCH VỤ
          </h2>
          <div className="text-sm space-y-1 font-serif">
            <p className="font-serif">
              Địa điểm kinh doanh:
              .....................................................
            </p>
            <p className="font-serif">
              Kỳ kê khai:
              .......................................................................
            </p>
          </div>
        </div>

        <div className="flex justify-end italic text-xs mb-2 font-serif">
          Đơn vị tính: .....................
        </div>

        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-900 font-serif">
                {normalizedColumns.map((column) => (
                  <th
                    key={column.fieldCode}
                    className={`border-r border-slate-900 last:border-0 p-3 bg-slate-50 font-black text-center font-serif ${column.fieldCode === "so_tien" ? "min-w-36" : ""}`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-slate-900 italic text-[11px] bg-slate-50/50 font-serif text-center">
                {normalizedColumns.map((column, index) => {
                  let label =
                    column.exportColumn || String.fromCharCode(65 + index);
                  if (
                    column.fieldType === "decimal" ||
                    column.fieldType === "number"
                  )
                    label = "1";
                  return (
                    <th
                      key={`letter-${column.fieldCode}`}
                      className="border-r border-slate-900 last:border-0 p-1 font-medium font-serif"
                    >
                      {label}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-slate-400/30 hover:bg-cyan-50/30 transition-colors font-serif"
                >
                  {normalizedColumns.map((column) => (
                    <td
                      key={column.fieldCode}
                      className={`border-r border-slate-900 last:border-0 p-3 font-serif ${column.fieldType === "decimal" || column.fieldType === "number" ? "text-right font-mono" : ""}`}
                    >
                      {renderSimpleCell(row, column.fieldCode)}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-black text-center font-serif">
                {normalizedColumns.map((column, index) => {
                  const descriptionIndex = normalizedColumns.findIndex(
                    (c) =>
                      c.fieldCode.toLowerCase().includes("description") ||
                      c.fieldCode.toLowerCase().includes("dien_giai"),
                  );
                  const targetLabelIdx =
                    descriptionIndex !== -1 ? descriptionIndex : Math.max(1, 0);
                  const isMoney =
                    column.fieldCode === "so_tien" ||
                    column.fieldType === "decimal" ||
                    column.fieldType === "number";

                  if (index === targetLabelIdx) {
                    return (
                      <td
                        key="total-label"
                        className="border-r border-slate-900 p-3 font-serif"
                      >
                        Tổng cộng
                      </td>
                    );
                  }
                  if (isMoney && index === normalizedColumns.length - 1) {
                    return (
                      <td
                        key="total-val"
                        className="border-r border-slate-900 last:border-0 p-3 text-right font-mono"
                      >
                        {totalValue.toLocaleString("vi-VN")}
                      </td>
                    );
                  }
                  return (
                    <td
                      key={`total-${column.fieldCode}`}
                      className="border-r border-slate-900 last:border-0 p-3 font-serif"
                    ></td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8 font-serif">
          <div className="text-center italic text-xs font-serif"></div>
          <div className="text-center space-y-1 font-serif">
            <p className="italic text-xs font-serif">
              Ngày ... tháng ... năm ...
            </p>
            <p className="font-bold text-sm uppercase font-serif">
              NGƯỜI ĐẠI DIỆN HỘ KINH DOANH/
            </p>
            <p className="font-bold text-sm uppercase font-serif">
              CÁ NHÂN KINH DOANH
            </p>
            <p className="italic text-xs pt-2 font-serif">
              (Ký, ghi rõ họ tên, đóng dấu (nếu có))
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isS2a) {
    const displayColumns = normalizedColumns.filter((column) =>
      ["so_hieu", "ngay_thang", "dien_giai", "so_tien"].includes(
        column.fieldCode,
      ),
    );
    const canRenderGroupedHeader =
      displayColumns.some((column) => column.fieldCode === "so_hieu") ||
      displayColumns.some((column) => column.fieldCode === "ngay_thang");

    return (
      <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8">
        <div className="flex justify-between items-start text-xs leading-relaxed font-serif">
          <div className="space-y-1 font-serif">
            <p className="font-bold font-serif uppercase">
              HỘ, CÁ NHÂN KINH DOANH: ........................
            </p>
            <p className="font-serif">
              Địa chỉ:
              .............................................................
            </p>
            <p className="font-serif">
              Mã số thuế:
              .......................................................
            </p>
          </div>
          <div className="text-right italic space-y-1 max-w-xs font-serif">
            <p className="font-bold not-italic font-serif">Mẫu số S2a-HKD</p>
            <p className="font-serif">
              {templateName || "Sổ doanh thu bán hàng hóa, dịch vụ (Cách 1)"}
            </p>
            <p className="font-serif">
              {versionLabel ? `Version: ${versionLabel}` : ""}
            </p>
            <p className="font-serif">(Kèm theo Thông tư số 152/2025/TT-BTC</p>
            <p className="font-serif">
              ngày 31 tháng 12 năm 2025 của Bộ trưởng
            </p>
            <p className="font-serif">Bộ Tài chính)</p>
          </div>
        </div>

        <div className="space-y-3 font-serif">
          <h2 className="text-xl font-black uppercase tracking-tight font-serif">
            SỔ DOANH THU BÁN HÀNG HÓA, DỊCH VỤ
          </h2>
          <div className="text-sm space-y-1 font-serif">
            <p className="font-serif">
              Địa điểm kinh doanh:
              .....................................................
            </p>
            <p className="font-serif">
              Kỳ kê khai:
              .......................................................................
            </p>
            <p className="italic">Đơn vị tính: .....................</p>
          </div>
        </div>

        <div className="overflow-x-auto border-2 border-slate-900">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-slate-900 font-serif">
                {canRenderGroupedHeader ? (
                  <th
                    colSpan={2}
                    className="border-r border-slate-900 last:border-0 p-3 bg-slate-50 font-black text-center font-serif"
                  >
                    Chứng từ
                  </th>
                ) : null}
                <th
                  rowSpan={2}
                  className="border-r border-slate-900 last:border-0 p-3 bg-slate-50 font-black text-center font-serif"
                >
                  Diễn giải
                </th>
                <th
                  rowSpan={2}
                  className="border-r border-slate-900 last:border-0 p-3 bg-slate-50 font-black text-center font-serif"
                >
                  Số tiền
                </th>
              </tr>
              <tr className="border-b border-slate-900 italic text-[11px] bg-slate-50/50 font-serif text-center">
                {canRenderGroupedHeader ? (
                  <>
                    <th className="border-r border-slate-900 last:border-0 p-1 font-medium font-serif">
                      Số hiệu
                    </th>
                    <th className="border-r border-slate-900 last:border-0 p-1 font-medium font-serif">
                      Ngày, tháng
                    </th>
                  </>
                ) : null}
              </tr>
              <tr className="border-b border-slate-900 italic text-[11px] bg-slate-50/50 font-serif text-center">
                {canRenderGroupedHeader ? (
                  <>
                    <th className="border-r border-slate-900 last:border-0 p-1 font-medium font-serif">
                      A
                    </th>
                    <th className="border-r border-slate-900 last:border-0 p-1 font-medium font-serif">
                      B
                    </th>
                    <th className="border-r border-slate-900 last:border-0 p-1 font-medium font-serif">
                      C
                    </th>
                    <th className="border-r border-slate-900 last:border-0 p-1 font-medium font-serif">
                      1
                    </th>
                  </>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const rowType = asString(row.rowType);
                const rowLabel = asString(row.rowLabel);
                const isSubtotal =
                  rowType === "subtotal" || rowType === "grand_total";
                const isTax = rowType === "tax_line";
                const isHeader =
                  rowType === "industry_header" || rowType === "section_header";
                const rowClass =
                  isHeader || isSubtotal || isTax ? "font-semibold" : "";

                return (
                  <tr
                    key={rowIndex}
                    className={`border-b border-slate-400/30 hover:bg-cyan-50/30 transition-colors font-serif ${rowClass}`}
                  >
                    {canRenderGroupedHeader ? (
                      <>
                        <td className="border-r border-slate-900 last:border-0 p-3 font-serif">
                          {formatValue(
                            row.so_hieu || row.chung_tu_so_hieu || "",
                          )}
                        </td>
                        <td className="border-r border-slate-900 last:border-0 p-3 font-serif">
                          {formatValue(
                            row.ngay_thang ||
                              row.chung_tu_ngay_thang ||
                              row.date ||
                              "",
                          )}
                        </td>
                      </>
                    ) : null}
                    <td className="border-r border-slate-900 last:border-0 p-3 font-serif">
                      {rowLabel ||
                        formatValue(row.dien_giai || row.description || "")}
                    </td>
                    <td className="border-r border-slate-900 last:border-0 p-3 text-right font-mono">
                      {formatValue(
                        row.so_tien || row.amount || row.revenue || "",
                      )}
                    </td>
                  </tr>
                );
              })}
              <tr className="border-t-2 border-slate-900 bg-slate-50 font-black text-center font-serif">
                {displayColumns.length > 0 ? (
                  <>
                    <td className="border-r border-slate-900 p-3"></td>
                    <td className="border-r border-slate-900 p-3"></td>
                    <td className="border-r border-slate-900 p-3 text-left">
                      Tổng cộng
                    </td>
                    <td className="border-r border-slate-900 p-3 text-right font-mono">
                      {totalValue.toLocaleString("vi-VN")}
                    </td>
                  </>
                ) : null}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-8 font-serif">
          <div className="text-center italic text-xs font-serif"></div>
          <div className="text-center space-y-1 font-serif">
            <p className="italic text-xs font-serif">
              Ngày ... tháng ... năm ...
            </p>
            <p className="font-bold text-sm uppercase font-serif">
              NGƯỜI ĐẠI DIỆN HỘ KINH DOANH/
            </p>
            <p className="font-bold text-sm uppercase font-serif">
              CÁ NHÂN KINH DOANH
            </p>
            <p className="italic text-xs pt-2 font-serif">
              (Ký, ghi rõ họ tên, đóng dấu (nếu có))
            </p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
