import type {
  AccountingBookRow,
  AccountingTemplateColumnSummary,
} from "@/lib/types/adminAccounting";
import type { CSSProperties, ReactElement } from "react";

interface BookTemplatePreviewProps {
  templateCode?: string;
  templateName?: string;
  versionLabel?: string;
  columns: AccountingTemplateColumnSummary[];
  rows: AccountingBookRow[];
  rowDefinitions?: Array<Record<string, unknown>>;
  referenceData?: Record<string, unknown> | null;
  summaryMeta?: Record<string, unknown> | null;
}

interface NormalizedRowDefinition {
  rowType: string;
  rowLabel: string;
  position: string;
  sortOrder: number;
  taxType: string;
  sectionType: string;
  sectionFilterValue: string;
  visibleFieldCodes: string[];
  formulaValue: number | null;
}

type NormalizedColumn = {
  fieldCode: string;
  label: string;
  fieldType: string;
  exportColumn: string;
};

interface TemplateRenderContext {
  templateCode: string;
  templateName?: string;
  versionLabel?: string;
  normalizedColumns: NormalizedColumn[];
  rows: AccountingBookRow[];
  rowDefinitions: NormalizedRowDefinition[];
  referenceData?: Record<string, unknown> | null;
  summaryMeta?: Record<string, unknown> | null;
  totalValue: number;
}

type TemplateRenderer = (context: TemplateRenderContext) => ReactElement;

interface DisplayColumn {
  key: string;
  label: string;
  letter: string;
  align?: "left" | "right" | "center";
  minWidthClass?: string;
}

interface DisplayRow {
  id: string;
  cells: Record<string, string>;
  isEmphasis?: boolean;
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

function parseVisibleFieldCodes(raw: unknown): string[] {
  if (typeof raw !== "string") return [];
  const normalizedRaw = raw.trim();
  if (!normalizedRaw) return [];

  try {
    const parsed = JSON.parse(normalizedRaw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }
  } catch {
    // Accept legacy comma-separated format.
  }

  return normalizedRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function pickFirstRowValue(
  row: AccountingBookRow,
  fieldCodes: Array<string | undefined>,
): unknown {
  for (const fieldCode of fieldCodes) {
    if (!fieldCode) continue;
    const value = row[fieldCode];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
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

function normalizeColumns(
  columns: AccountingTemplateColumnSummary[],
): NormalizedColumn[] {
  return columns.map((column) => ({
    fieldCode: String(column.fieldCode ?? "").trim(),
    label: String(column.label ?? column.fieldCode ?? "").trim(),
    fieldType: String(column.fieldType ?? "text").trim() || "text",
    exportColumn: String(column.exportColumn ?? "").trim(),
  }));
}

function normalizeRowDefinitions(
  rowDefinitions: Array<Record<string, unknown>> | undefined,
): NormalizedRowDefinition[] {
  return (rowDefinitions ?? [])
    .map((rowDef) => ({
      rowType: asString(rowDef.rowType).trim().toLowerCase(),
      rowLabel: asString(rowDef.rowLabel).trim(),
      position: asString(rowDef.position).trim().toLowerCase(),
      sortOrder: Number(rowDef.sortOrder ?? 0),
      taxType: asString(rowDef.taxType).trim().toUpperCase(),
      sectionType: asString(rowDef.sectionType).trim().toLowerCase(),
      sectionFilterValue: asString(rowDef.sectionFilterValue)
        .trim()
        .toLowerCase(),
      visibleFieldCodes: parseVisibleFieldCodes(rowDef.visibleFieldCodes),
      formulaValue:
        typeof rowDef.formulaValue === "number" &&
        Number.isFinite(rowDef.formulaValue)
          ? rowDef.formulaValue
          : null,
    }))
    .filter((rowDef) => rowDef.rowType.length > 0)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function asOptionList(value: unknown): Array<{ value: string; label: string }> {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const optionValue = String(record.value ?? "").trim();
      if (!optionValue) return null;
      const optionLabel = String(record.label ?? optionValue).trim();
      return { value: optionValue, label: optionLabel || optionValue };
    })
    .filter((option): option is { value: string; label: string } => !!option);
}

function getReferenceLabelMap(
  referenceData: Record<string, unknown> | null | undefined,
  key: string,
): Map<string, string> {
  const map = new Map<string, string>();
  const options = asOptionList(referenceData?.[key]);
  options.forEach((option) => {
    map.set(option.value.toUpperCase(), option.label);
  });
  return map;
}

function normalizeCompareText(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeHumanLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const replacements: Array<[RegExp, string]> = [
    [/tong so thue gtgt phai nop/gi, "Tổng số thuế GTGT phải nộp"],
    [/tong so thue tncn phai nop/gi, "Tổng số thuế TNCN phải nộp"],
    [/thue gtgt phai nop/gi, "Thuế GTGT phải nộp"],
    [/thue tncn phai nop/gi, "Thuế TNCN phải nộp"],
    [/thue gtgt/gi, "Thuế GTGT"],
    [/thue tncn/gi, "Thuế TNCN"],
    [/tong cong/gi, "Tổng cộng"],
    [/tong doanh thu/gi, "Tổng doanh thu"],
    [/tong chi phi hop ly/gi, "Tổng chi phí hợp lý"],
    [/chenh lech/gi, "Chênh lệch"],
    [/ton dau ky/gi, "Tồn đầu kỳ"],
    [/ton cuoi ky/gi, "Tồn cuối kỳ"],
    [/du cuoi ky/gi, "Dư cuối kỳ"],
    [/tien gui ngan hang/gi, "TIỀN GỬI NGÂN HÀNG"],
    [/tien mat/gi, "TIỀN MẶT"],
  ];

  let result = trimmed;
  replacements.forEach(([pattern, value]) => {
    result = result.replace(pattern, value);
  });

  return result;
}

function getColumnLetter(column: NormalizedColumn, index: number): string {
  if (column.exportColumn) return column.exportColumn;
  if (
    ["decimal", "number", "auto_increment"].includes(
      column.fieldType.toLowerCase(),
    )
  ) {
    return "1";
  }
  return String.fromCharCode(65 + index);
}

function findColumn(
  columns: NormalizedColumn[],
  candidates: string[],
): NormalizedColumn | undefined {
  const normalizedCandidates = candidates.map((candidate) =>
    candidate.toLowerCase(),
  );

  return (
    columns.find((column) =>
      normalizedCandidates.includes(column.fieldCode.toLowerCase()),
    ) ||
    columns.find((column) =>
      normalizedCandidates.some((candidate) =>
        column.fieldCode.toLowerCase().includes(candidate),
      ),
    )
  );
}

function findAmountColumn(
  columns: NormalizedColumn[],
  excludedCodes: Set<string> = new Set<string>(),
): NormalizedColumn | undefined {
  return (
    findColumn(columns, ["so_tien", "amount", "revenue", "value"]) ||
    columns.find(
      (column) =>
        ["decimal", "number"].includes(column.fieldType.toLowerCase()) &&
        !excludedCodes.has(column.fieldCode),
    ) ||
    columns.find((column) => !excludedCodes.has(column.fieldCode))
  );
}

function isEmphasisRowType(
  rowType: string,
  referenceData?: Record<string, unknown> | null,
): boolean {
  const normalizedRowType = rowType.toLowerCase();
  const hardSet = new Set([
    "industry_header",
    "section_header",
    "subtotal",
    "section_subtotal",
    "tax_line",
    "grand_total",
    "balance_row",
    "profit_row",
  ]);
  if (hardSet.has(normalizedRowType)) return true;

  const rowTypeLabels = getReferenceLabelMap(referenceData, "rowTypes");
  const label = rowTypeLabels.get(normalizedRowType.toUpperCase()) || "";
  const normalizedLabel = label.toLowerCase();
  return ["header", "total", "balance", "tax", "profit"].some((keyword) =>
    normalizedLabel.includes(keyword),
  );
}

function getNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSummaryFormulaValue(
  summaryMeta: Record<string, unknown> | null | undefined,
  keys: string[],
): number | null {
  const formulaMap = summaryMeta?.formulaValues;
  if (!formulaMap || typeof formulaMap !== "object") return null;

  const record = formulaMap as Record<string, unknown>;
  for (const key of keys) {
    const numeric = getNumericValue(record[key]);
    if (numeric !== null) return numeric;
    const lowerKey = key.toLowerCase();
    const lowerMatch = Object.keys(record).find(
      (candidate) => candidate.toLowerCase() === lowerKey,
    );
    if (lowerMatch) {
      const lowerNumeric = getNumericValue(record[lowerMatch]);
      if (lowerNumeric !== null) return lowerNumeric;
    }
  }

  return null;
}

function getTaxTotalAmount(
  rows: AccountingBookRow[],
  summaryMeta: Record<string, unknown> | null | undefined,
  amountFieldCode: string,
  taxKind: "VAT" | "PIT",
): number | null {
  const summaryKeys =
    taxKind === "VAT"
      ? [
          "totalGtgtTax",
          "totalVATTax",
          "totalVatTax",
          "gtgtTax",
          "vatTax",
          "taxGtgt",
        ]
      : ["totalTncnTax", "totalPITTax", "tncnTax", "pitTax", "taxTncn"];

  for (const key of summaryKeys) {
    const numeric = getNumericValue(summaryMeta?.[key]);
    if (numeric !== null) return numeric;
  }

  for (const row of [...rows].reverse()) {
    const rowType = asString(row.rowType).toLowerCase();
    if (!["tax_line", "grand_total", "subtotal"].includes(rowType)) continue;

    const identity =
      `${asString(row.rowLabel)} ${asString(row.taxType)}`.toLowerCase();
    const matches =
      taxKind === "VAT"
        ? identity.includes("gtgt") || identity.includes("vat")
        : identity.includes("tncn") || identity.includes("pit");
    if (!matches) continue;

    const value = pickFirstRowValue(row, [
      amountFieldCode,
      "so_tien",
      "amount",
      "value",
    ]);
    const numeric = getNumericValue(value);
    if (numeric !== null) return numeric;
  }

  return null;
}

function resolveRowDescription(
  row: AccountingBookRow,
  descriptionFieldCode: string | undefined,
  fallbackTaxLabel: string,
): string {
  const rowLabel = normalizeHumanLabel(asString(row.rowLabel));
  if (rowLabel) return rowLabel;

  const visibleCodes = parseVisibleFieldCodes(row.visibleFieldCodes);
  const value = pickFirstRowValue(row, [
    descriptionFieldCode,
    "dien_giai",
    "description",
    ...visibleCodes,
  ]);

  const formatted = normalizeHumanLabel(formatValue(value));
  if (formatted) return formatted;

  const rowType = asString(row.rowType).toLowerCase();
  if (rowType === "tax_line") return fallbackTaxLabel;
  return "";
}

function renderSignatureBlock() {
  return (
    <div className="grid grid-cols-2 gap-8 pt-8 font-serif">
      <div className="text-center italic text-xs font-serif"></div>
      <div className="text-center space-y-1 font-serif">
        <p className="italic text-xs font-serif">Ngày ... tháng ... năm ...</p>
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
  );
}

function renderFormHeader(
  formCode: string,
  templateName?: string,
  versionLabel?: string,
) {
  return (
    <div className="flex justify-between items-start text-xs leading-relaxed font-serif">
      <div className="space-y-1 font-serif">
        <p className="font-bold font-serif uppercase">
          HỘ, CÁ NHÂN KINH DOANH: ........................
        </p>
        <p className="font-serif">
          Địa chỉ: .............................................................
        </p>
        <p className="font-serif">
          Mã số thuế: .......................................................
        </p>
      </div>
      <div className="text-right italic space-y-1 max-w-xs font-serif">
        <p className="font-bold not-italic font-serif">Mẫu số {formCode}</p>
        <p className="font-serif">
          {templateName || "Sổ doanh thu bán hàng hóa, dịch vụ"}
        </p>
        <p className="font-serif">
          {versionLabel ? `Version: ${versionLabel}` : ""}
        </p>
        <p className="font-serif">(Kèm theo Thông tư số 152/2025/TT-BTC</p>
        <p className="font-serif">ngày 31 tháng 12 năm 2025 của Bộ trưởng</p>
        <p className="font-serif">Bộ Tài chính)</p>
      </div>
    </div>
  );
}

function renderBookTitle(title: string, showUnit: boolean = true) {
  return (
    <>
      <div className="text-center space-y-3 font-serif">
        <h2 className="text-xl font-black uppercase tracking-tight font-serif">
          {title}
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
      {showUnit ? (
        <div className="flex justify-end italic text-xs mb-2 font-serif">
          Đơn vị tính: .....................
        </div>
      ) : null}
    </>
  );
}

function renderLedgerTable(
  columns: DisplayColumn[],
  rows: DisplayRow[],
): ReactElement {
  return (
    <div className="overflow-x-auto border-2 border-slate-900">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b-2 border-slate-900 font-serif">
            {columns.map((column) => (
              <th
                key={`header-${column.key}`}
                className={`border-r border-slate-900 last:border-r-0 p-3 bg-slate-50 font-black text-center font-serif ${column.minWidthClass || ""}`}
              >
                {column.label}
              </th>
            ))}
          </tr>
          <tr className="border-b border-slate-900 italic text-[11px] bg-slate-50/50 font-serif text-center">
            {columns.map((column) => (
              <th
                key={`letter-${column.key}`}
                className="border-r border-slate-900 last:border-r-0 p-1 font-medium font-serif"
              >
                {column.letter}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={`border-b border-slate-400/30 hover:bg-cyan-50/30 transition-colors font-serif ${row.isEmphasis ? "font-semibold" : ""}`}
            >
              {columns.map((column) => (
                <td
                  key={`${row.id}-${column.key}`}
                  className={`border-r border-slate-900 last:border-r-0 p-3 ${column.align === "right" ? "text-right font-mono" : ""}`}
                >
                  {row.cells[column.key] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderSupplementalTable(
  title: string,
  columns: NormalizedColumn[],
  rows: AccountingBookRow[],
): ReactElement | null {
  if (columns.length === 0) return null;
  const hasValue = columns.some((column) =>
    rows.some(
      (row) =>
        row[column.fieldCode] !== undefined && row[column.fieldCode] !== null,
    ),
  );
  if (!hasValue) return null;

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-700 font-sans">
        {title}
      </h3>
      <div className="overflow-x-auto border border-slate-300">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50">
              {columns.map((column) => (
                <th
                  key={`supplemental-${column.fieldCode}`}
                  className="border border-slate-300 px-2 py-1.5 text-left font-semibold"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`supplemental-row-${index}`}>
                {columns.map((column) => (
                  <td
                    key={`supplemental-cell-${index}-${column.fieldCode}`}
                    className="border border-slate-300 px-2 py-1.5 align-top"
                  >
                    {formatValue(row[column.fieldCode])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderS1aTemplate(context: TemplateRenderContext): ReactElement {
  const { normalizedColumns, rows, totalValue, templateName, versionLabel } =
    context;

  const totalRowDef =
    context.rowDefinitions.find(
      (rowDef) =>
        ["grand_total", "subtotal", "tax_line"].includes(rowDef.rowType) &&
        rowDef.position === "start_of_book",
    ) ||
    context.rowDefinitions.find((rowDef) =>
      ["grand_total", "subtotal", "tax_line"].includes(rowDef.rowType),
    );

  const summaryAnchorRow = [...rows]
    .reverse()
    .find((row) =>
      ["grand_total", "subtotal", "tax_line"].includes(
        asString(row.rowType).toLowerCase(),
      ),
    );

  const summaryLabelFieldCode =
    (totalRowDef?.visibleFieldCodes ?? []).find((fieldCode) =>
      normalizedColumns.some((column) => column.fieldCode === fieldCode),
    ) ||
    parseVisibleFieldCodes(summaryAnchorRow?.visibleFieldCodes).find(
      (fieldCode) =>
        normalizedColumns.some((column) => column.fieldCode === fieldCode),
    ) ||
    findColumn(normalizedColumns, ["dien_giai", "description"])?.fieldCode ||
    normalizedColumns[Math.max(normalizedColumns.length - 2, 0)]?.fieldCode ||
    "";

  const summaryValueFieldCode =
    [...normalizedColumns]
      .reverse()
      .find((column) =>
        ["decimal", "number"].includes(column.fieldType.toLowerCase()),
      )?.fieldCode ||
    normalizedColumns[normalizedColumns.length - 1]?.fieldCode ||
    "";

  const displayColumns: DisplayColumn[] = normalizedColumns.map(
    (column, index) => ({
      key: column.fieldCode,
      label: column.label,
      letter: getColumnLetter(column, index),
      align: ["decimal", "number"].includes(column.fieldType.toLowerCase())
        ? "right"
        : "left",
    }),
  );

  const displayRows: DisplayRow[] = rows.map((row, index) => ({
    id: `s1a-${index}`,
    cells: Object.fromEntries(
      displayColumns.map((column) => [
        column.key,
        formatValue(row[column.key]),
      ]),
    ),
  }));

  if (totalRowDef) {
    const totalRow: DisplayRow = {
      id: "s1a-total",
      isEmphasis: true,
      cells: Object.fromEntries(
        displayColumns.map((column) => {
          if (column.key === summaryLabelFieldCode)
            return [column.key, normalizeHumanLabel(totalRowDef.rowLabel)];
          if (column.key === summaryValueFieldCode) {
            const displayValue = totalRowDef.formulaValue ?? totalValue;
            return [column.key, displayValue.toLocaleString("vi-VN")];
          }
          return [column.key, ""];
        }),
      ),
    };

    if (totalRowDef.position === "start_of_book") {
      displayRows.unshift(totalRow);
    } else {
      displayRows.push(totalRow);
    }
  }

  return (
    <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8 transition-all hover:shadow-cyan-100/50">
      {renderFormHeader("S1a-HKD", templateName, versionLabel)}
      {renderBookTitle("SỔ DOANH THU BÁN HÀNG HÓA, DỊCH VỤ")}
      {renderLedgerTable(displayColumns, displayRows)}
      {renderSignatureBlock()}
    </div>
  );
}

function buildS2MainRows(
  context: TemplateRenderContext,
  includeStt: boolean,
): {
  rows: DisplayRow[];
  columns: DisplayColumn[];
  supplementalColumns: NormalizedColumn[];
  amountFieldCode: string;
} {
  const { normalizedColumns, rows, referenceData } = context;

  const sttColumn = findColumn(normalizedColumns, ["stt"]);
  const documentNoColumn = findColumn(normalizedColumns, [
    "so_hieu",
    "chung_tu_so_hieu",
  ]);
  const documentDateColumn = findColumn(normalizedColumns, [
    "ngay_thang",
    "chung_tu_ngay_thang",
    "date",
  ]);
  const descriptionColumn = findColumn(normalizedColumns, [
    "dien_giai",
    "description",
  ]);

  const reservedCodes = new Set<string>(
    [
      sttColumn?.fieldCode,
      documentNoColumn?.fieldCode,
      documentDateColumn?.fieldCode,
      descriptionColumn?.fieldCode,
    ].filter(Boolean) as string[],
  );

  const amountColumn =
    findAmountColumn(normalizedColumns, reservedCodes) ||
    ({
      fieldCode: "so_tien",
      label: "Số tiền",
      fieldType: "decimal",
      exportColumn: "",
    } as NormalizedColumn);

  const taxTypeLabels = getReferenceLabelMap(referenceData, "taxTypes");

  const displayColumns: DisplayColumn[] = [];
  if (includeStt && sttColumn) {
    displayColumns.push({
      key: "stt",
      label: "STT",
      letter: "A",
      minWidthClass: "min-w-14",
    });
  }
  displayColumns.push(
    {
      key: "so_hieu",
      label: "Số hiệu chứng từ",
      letter: includeStt ? "B" : "A",
      minWidthClass: "min-w-32",
    },
    {
      key: "ngay_thang",
      label: "Ngày, tháng",
      letter: includeStt ? "C" : "B",
      minWidthClass: "min-w-28",
    },
    {
      key: "dien_giai",
      label: "Diễn giải",
      letter: includeStt ? "D" : "C",
      align: "left",
    },
    {
      key: "so_tien",
      label: "Số tiền",
      letter: "1",
      align: "right",
      minWidthClass: "min-w-36",
    },
  );

  const displayRows = rows.map((row, index) => {
    const taxType = asString(row.taxType).toUpperCase();
    const taxLabel =
      taxTypeLabels.get(taxType) ||
      (taxType === "PIT" ? "Thuế TNCN" : "Thuế GTGT");
    const description = resolveRowDescription(
      row,
      descriptionColumn?.fieldCode,
      taxLabel,
    );

    return {
      id: `s2-${index}`,
      isEmphasis: isEmphasisRowType(asString(row.rowType), referenceData),
      cells: {
        stt: formatValue(pickFirstRowValue(row, [sttColumn?.fieldCode, "stt"])),
        so_hieu: formatValue(
          pickFirstRowValue(row, [
            documentNoColumn?.fieldCode,
            "so_hieu",
            "chung_tu_so_hieu",
          ]),
        ),
        ngay_thang: formatValue(
          pickFirstRowValue(row, [
            documentDateColumn?.fieldCode,
            "ngay_thang",
            "chung_tu_ngay_thang",
            "date",
          ]),
        ),
        dien_giai: description,
        so_tien: formatValue(
          pickFirstRowValue(row, [
            amountColumn.fieldCode,
            "so_tien",
            "amount",
            "revenue",
            "value",
          ]),
        ),
      },
    };
  });

  const primaryCodes = new Set<string>(
    [
      sttColumn?.fieldCode,
      documentNoColumn?.fieldCode,
      documentDateColumn?.fieldCode,
      descriptionColumn?.fieldCode,
      amountColumn.fieldCode,
    ].filter(Boolean) as string[],
  );

  const supplementalColumns = normalizedColumns.filter(
    (column) => !primaryCodes.has(column.fieldCode),
  );

  return {
    rows: displayRows,
    columns: displayColumns,
    supplementalColumns,
    amountFieldCode: amountColumn.fieldCode,
  };
}

function appendDefinitionTotals(
  rows: DisplayRow[],
  context: TemplateRenderContext,
  amountFieldCode: string,
  includePIT: boolean,
): void {
  const endRows = context.rowDefinitions.filter(
    (rowDef) =>
      rowDef.position === "end_of_book" && rowDef.rowType === "grand_total",
  );

  const existingDescriptions = new Set(
    rows.map((row) => normalizeCompareText(row.cells.dien_giai || "")),
  );

  endRows.forEach((rowDef, index) => {
    const taxType = rowDef.taxType ? rowDef.taxType.toUpperCase() : "";
    const label = normalizeHumanLabel(rowDef.rowLabel);
    if (!label) return;
    const normalized = normalizeCompareText(label);
    if (existingDescriptions.has(normalized)) return;

    if (!taxType) {
      // Non-tax grand total: use formulaValue if available
      if (rowDef.formulaValue == null) return;
      rows.push({
        id: `rowdef-total-notax-${index}`,
        isEmphasis: true,
        cells: {
          stt: "",
          so_hieu: "",
          ngay_thang: "",
          dien_giai: label,
          so_tien: rowDef.formulaValue.toLocaleString("vi-VN"),
        },
      });
      existingDescriptions.add(normalized);
      return;
    }

    if (!includePIT && taxType === "PIT") return;

    const amount =
      rowDef.formulaValue ??
      getTaxTotalAmount(
        context.rows,
        context.summaryMeta,
        amountFieldCode,
        taxType === "PIT" ? "PIT" : "VAT",
      );

    rows.push({
      id: `rowdef-total-${taxType}-${index}`,
      isEmphasis: true,
      cells: {
        stt: "",
        so_hieu: "",
        ngay_thang: "",
        dien_giai: label,
        so_tien: amount == null ? "" : amount.toLocaleString("vi-VN"),
      },
    });
    existingDescriptions.add(normalized);
  });
}

const FORMULA_ROW_TYPES = new Set([
  "grand_total",
  "monthly_total",
  "quarterly_total",
  "subtotal",
  "section_subtotal",
  "tax_line",
  "profit_row",
]);

function appendRemainingFormulaRows(
  rows: DisplayRow[],
  context: TemplateRenderContext,
  amountCellKey: string,
  baseCells: Record<string, string>,
): void {
  const existingDescriptions = new Set(
    rows.map((row) => normalizeCompareText(row.cells.dien_giai || "")),
  );

  context.rowDefinitions
    .filter(
      (rowDef) =>
        FORMULA_ROW_TYPES.has(rowDef.rowType) && rowDef.formulaValue !== null,
    )
    .forEach((rowDef, index) => {
      if (rowDef.formulaValue == null) return;
      const label = normalizeHumanLabel(rowDef.rowLabel);
      if (!label) return;
      if (existingDescriptions.has(normalizeCompareText(label))) return;

      rows.push({
        id: `formula-remaining-${rowDef.rowType}-${index}`,
        isEmphasis: true,
        cells: {
          ...baseCells,
          dien_giai: label,
          [amountCellKey]: rowDef.formulaValue.toLocaleString("vi-VN"),
        },
      });
    });
}

const S2_BASE_CELLS = { stt: "", so_hieu: "", ngay_thang: "" };

function renderS2aTemplate(context: TemplateRenderContext): ReactElement {
  const { rows, columns, supplementalColumns, amountFieldCode } =
    buildS2MainRows(context, false);

  appendDefinitionTotals(rows, context, amountFieldCode, true);
  appendRemainingFormulaRows(rows, context, "so_tien", S2_BASE_CELLS);

  return (
    <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8">
      {renderFormHeader("S2a-HKD", context.templateName, context.versionLabel)}
      {renderBookTitle("SỔ DOANH THU BÁN HÀNG HÓA, DỊCH VỤ")}
      {renderLedgerTable(columns, rows)}
      {renderSupplementalTable(
        "Thông tin bổ sung từ template",
        supplementalColumns,
        context.rows,
      )}
      {renderSignatureBlock()}
    </div>
  );
}

function renderS2bTemplate(context: TemplateRenderContext): ReactElement {
  const { rows, columns, supplementalColumns, amountFieldCode } =
    buildS2MainRows(context, true);

  appendDefinitionTotals(rows, context, amountFieldCode, false);
  appendRemainingFormulaRows(rows, context, "so_tien", S2_BASE_CELLS);

  return (
    <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8">
      {renderFormHeader("S2b-HKD", context.templateName, context.versionLabel)}
      {renderBookTitle("SỔ DOANH THU BÁN HÀNG HÓA, DỊCH VỤ (CÁCH 2)")}
      {renderLedgerTable(columns, rows)}
      {renderSupplementalTable(
        "Thông tin bổ sung từ template",
        supplementalColumns,
        context.rows,
      )}
      {renderSignatureBlock()}
    </div>
  );
}

function getLatestFieldValue(
  rows: AccountingBookRow[],
  fieldCode: string,
): unknown {
  for (const row of [...rows].reverse()) {
    const value = row[fieldCode];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function hasDescriptionRow(rows: DisplayRow[], label: string): boolean {
  const needle = normalizeCompareText(label);
  if (!needle) return false;
  return rows.some(
    (row) => normalizeCompareText(row.cells.dien_giai || "") === needle,
  );
}

function resolveS2cFormulaFieldByLabel(label: string): string | null {
  const normalized = normalizeCompareText(label);
  if (normalized.includes("doanh thu")) return "tong_dt";
  if (normalized.includes("chi phi")) return "tong_cp";
  if (normalized.includes("chenh lech")) return "chenh_lech";
  if (normalized.includes("thue tncn")) return "thue_tncn";
  return null;
}

function appendS2cDefinitionRows(
  rows: DisplayRow[],
  context: TemplateRenderContext,
): void {
  const targetedDefs = context.rowDefinitions.filter(
    (rowDef) =>
      rowDef.rowLabel &&
      ["section_header", "section_subtotal", "profit_row", "tax_line"].includes(
        rowDef.rowType,
      ),
  );

  targetedDefs.forEach((rowDef, index) => {
    const label = normalizeHumanLabel(rowDef.rowLabel);
    if (!label || hasDescriptionRow(rows, label)) return;

    const formulaField = resolveS2cFormulaFieldByLabel(label);
    const resolvedValue =
      rowDef.formulaValue ??
      (formulaField ? getLatestFieldValue(context.rows, formulaField) : null);

    rows.push({
      id: `s2c-def-${rowDef.rowType}-${index}`,
      isEmphasis: true,
      cells: {
        stt: "",
        so_hieu: "",
        ngay_thang: "",
        dien_giai: label,
        so_tien: formatValue(resolvedValue),
      },
    });
  });
}

function appendS2dBalanceRows(
  rows: DisplayRow[],
  context: TemplateRenderContext,
): void {
  const balanceDefs = context.rowDefinitions.filter(
    (rowDef) => rowDef.rowType === "balance_row" && rowDef.rowLabel,
  );

  balanceDefs.forEach((rowDef, index) => {
    const label = normalizeHumanLabel(rowDef.rowLabel);
    if (!label || hasDescriptionRow(rows, label)) return;

    const normalizedLabel = normalizeCompareText(label);
    const isOpening = normalizedLabel.includes("dau ky");
    const quantity = isOpening
      ? (getSummaryFormulaValue(context.summaryMeta, [
          "S2D_OPENING_QTY",
          "ton_dau_ky_sl",
        ]) ?? getLatestFieldValue(context.rows, "ton_dau_ky_sl"))
      : (getSummaryFormulaValue(context.summaryMeta, [
          "S2D_CLOSING_QTY",
          "ton_cuoi_ky_sl",
        ]) ?? getLatestFieldValue(context.rows, "ton_cuoi_ky_sl"));
    const value = isOpening
      ? (getSummaryFormulaValue(context.summaryMeta, [
          "S2D_OPENING_VALUE",
          "ton_dau_ky_gt",
        ]) ?? getLatestFieldValue(context.rows, "ton_dau_ky_gt"))
      : (getSummaryFormulaValue(context.summaryMeta, [
          "S2D_CLOSING_VALUE",
          "ton_cuoi_ky_gt",
        ]) ?? getLatestFieldValue(context.rows, "ton_cuoi_ky_gt"));

    const balanceRow: DisplayRow = {
      id: `s2d-balance-${index}`,
      isEmphasis: true,
      cells: {
        so_hieu: "",
        ngay: "",
        dien_giai: label,
        dvt: "",
        don_gia: "",
        sl_nhap: "",
        tien_nhap: "",
        sl_xuat: "",
        tien_xuat: "",
        sl_ton: formatValue(quantity),
        tien_ton: formatValue(value),
      },
    };

    if (rowDef.position === "start_of_book") {
      rows.unshift(balanceRow);
      return;
    }

    rows.push(balanceRow);
  });
}

function resolveS2eBalanceValue(
  context: TemplateRenderContext,
  rowDef: NormalizedRowDefinition,
): unknown {
  const label = normalizeCompareText(rowDef.rowLabel);
  const section = rowDef.sectionFilterValue;

  if (section === "cash") {
    if (label.includes("dau ky"))
      return (
        getSummaryFormulaValue(context.summaryMeta, [
          "S2E_CASH_OPENING",
          "cash_opening",
        ]) ?? getLatestFieldValue(context.rows, "cash_opening")
      );
    if (label.includes("cuoi ky") || label.includes("du cuoi ky")) {
      return (
        getSummaryFormulaValue(context.summaryMeta, [
          "S2E_CASH_CLOSING",
          "cash_closing",
        ]) ?? getLatestFieldValue(context.rows, "cash_closing")
      );
    }
  }

  if (section === "bank") {
    if (label.includes("dau ky"))
      return (
        getSummaryFormulaValue(context.summaryMeta, [
          "S2E_BANK_OPENING",
          "bank_opening",
        ]) ?? getLatestFieldValue(context.rows, "bank_opening")
      );
    if (label.includes("cuoi ky") || label.includes("du cuoi ky")) {
      return (
        getSummaryFormulaValue(context.summaryMeta, [
          "S2E_BANK_CLOSING",
          "bank_closing",
        ]) ?? getLatestFieldValue(context.rows, "bank_closing")
      );
    }
  }

  if (label.includes("dau ky")) {
    return (
      getSummaryFormulaValue(context.summaryMeta, [
        "S2E_CASH_OPENING",
        "cash_opening",
      ]) ??
      getSummaryFormulaValue(context.summaryMeta, [
        "S2E_BANK_OPENING",
        "bank_opening",
      ]) ??
      getLatestFieldValue(context.rows, "cash_opening") ??
      getLatestFieldValue(context.rows, "bank_opening")
    );
  }

  if (label.includes("cuoi ky") || label.includes("du cuoi ky")) {
    return (
      getSummaryFormulaValue(context.summaryMeta, [
        "S2E_CASH_CLOSING",
        "cash_closing",
      ]) ??
      getSummaryFormulaValue(context.summaryMeta, [
        "S2E_BANK_CLOSING",
        "bank_closing",
      ]) ??
      getLatestFieldValue(context.rows, "cash_closing") ??
      getLatestFieldValue(context.rows, "bank_closing")
    );
  }

  return null;
}

function appendS2eDefinitionRows(
  rows: DisplayRow[],
  context: TemplateRenderContext,
): void {
  const defs = context.rowDefinitions.filter(
    (rowDef) =>
      rowDef.rowLabel &&
      ["section_header", "balance_row"].includes(rowDef.rowType),
  );

  defs.forEach((rowDef, index) => {
    const label = normalizeHumanLabel(rowDef.rowLabel);
    if (!label || hasDescriptionRow(rows, label)) return;

    const section = rowDef.sectionFilterValue;
    const sectionFirstIndex =
      section.length > 0
        ? rows.findIndex(
            (row) =>
              normalizeCompareText(String(row.cells.__section || "")) ===
              section,
          )
        : -1;
    const sectionLastIndex =
      section.length > 0
        ? (() => {
            for (let i = rows.length - 1; i >= 0; i -= 1) {
              if (
                normalizeCompareText(String(rows[i].cells.__section || "")) ===
                section
              ) {
                return i;
              }
            }
            return -1;
          })()
        : -1;

    if (rowDef.rowType === "section_header") {
      const headerRow: DisplayRow = {
        id: `s2e-sec-${index}`,
        isEmphasis: true,
        cells: {
          stt: "",
          so_hieu: "",
          ngay_thang: "",
          dien_giai: label,
          thu_vao: "",
          chi_ra: "",
          __section: section,
        },
      };

      if (sectionFirstIndex >= 0) {
        rows.splice(sectionFirstIndex, 0, headerRow);
      } else {
        rows.push(headerRow);
      }
      return;
    }

    const balanceValue = resolveS2eBalanceValue(context, rowDef);
    const balanceRow: DisplayRow = {
      id: `s2e-balance-${index}`,
      isEmphasis: true,
      cells: {
        stt: "",
        so_hieu: "",
        ngay_thang: "",
        dien_giai: label,
        thu_vao: formatValue(balanceValue),
        chi_ra: "",
        __section: section,
      },
    };

    const normalizedLabel = normalizeCompareText(label);
    if (normalizedLabel.includes("dau ky") && sectionFirstIndex >= 0) {
      rows.splice(sectionFirstIndex + 1, 0, balanceRow);
      return;
    }

    if (
      (normalizedLabel.includes("cuoi ky") ||
        normalizedLabel.includes("du cuoi ky")) &&
      sectionLastIndex >= 0
    ) {
      rows.splice(sectionLastIndex + 1, 0, balanceRow);
      return;
    }

    rows.push(balanceRow);
  });
}

function renderS2cTemplate(context: TemplateRenderContext): ReactElement {
  const sttColumn = findColumn(context.normalizedColumns, ["stt"]);
  const documentNoColumn = findColumn(context.normalizedColumns, ["so_hieu"]);
  const documentDateColumn = findColumn(context.normalizedColumns, [
    "ngay_thang",
    "date",
  ]);
  const descriptionColumn = findColumn(context.normalizedColumns, [
    "dien_giai",
    "description",
  ]);
  const amountColumn =
    findColumn(context.normalizedColumns, ["so_tien", "amount", "value"]) ||
    findAmountColumn(context.normalizedColumns) ||
    ({
      fieldCode: "so_tien",
      label: "Số tiền",
      fieldType: "decimal",
      exportColumn: "",
    } as NormalizedColumn);

  const columns: DisplayColumn[] = [
    { key: "stt", label: "STT", letter: "A", minWidthClass: "min-w-14" },
    {
      key: "so_hieu",
      label: "Số hiệu chứng từ",
      letter: "B",
      minWidthClass: "min-w-32",
    },
    {
      key: "ngay_thang",
      label: "Ngày, tháng",
      letter: "C",
      minWidthClass: "min-w-28",
    },
    { key: "dien_giai", label: "Diễn giải", letter: "D" },
    {
      key: "so_tien",
      label: "Số tiền",
      letter: "1",
      align: "right",
      minWidthClass: "min-w-36",
    },
  ];

  const rows: DisplayRow[] = context.rows.map((row, index) => ({
    id: `s2c-${index}`,
    isEmphasis: isEmphasisRowType(asString(row.rowType), context.referenceData),
    cells: {
      stt: formatValue(pickFirstRowValue(row, [sttColumn?.fieldCode, "stt"])),
      so_hieu: formatValue(
        pickFirstRowValue(row, [documentNoColumn?.fieldCode, "so_hieu"]),
      ),
      ngay_thang: formatValue(
        pickFirstRowValue(row, [
          documentDateColumn?.fieldCode,
          "ngay_thang",
          "date",
        ]),
      ),
      dien_giai: resolveRowDescription(row, descriptionColumn?.fieldCode, ""),
      so_tien: formatValue(
        pickFirstRowValue(row, [
          amountColumn.fieldCode,
          "so_tien",
          "amount",
          "value",
        ]),
      ),
    },
  }));

  appendS2cDefinitionRows(rows, context);
  appendRemainingFormulaRows(rows, context, "so_tien", S2_BASE_CELLS);

  return (
    <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8">
      {renderFormHeader("S2c-HKD", context.templateName, context.versionLabel)}
      {renderBookTitle("SỔ CHI TIẾT DOANH THU, CHI PHÍ")}
      {renderLedgerTable(columns, rows)}

      {renderSignatureBlock()}
    </div>
  );
}

function renderS2dTemplate(context: TemplateRenderContext): ReactElement {
  const dateColumn =
    findColumn(context.normalizedColumns, ["ngay", "ngay_thang", "date"]) ||
    ({
      fieldCode: "ngay",
      label: "Ngày",
      fieldType: "date",
      exportColumn: "",
    } as NormalizedColumn);

  const columns: DisplayColumn[] = [
    {
      key: "so_hieu",
      label: "Số hiệu CT",
      letter: "A",
      minWidthClass: "min-w-28",
    },
    { key: "ngay", label: "Ngày", letter: "B", minWidthClass: "min-w-24" },
    {
      key: "dien_giai",
      label: "Diễn giải",
      letter: "C",
      minWidthClass: "min-w-44",
    },
    { key: "dvt", label: "ĐVT", letter: "D", minWidthClass: "min-w-16" },
    { key: "don_gia", label: "Đơn giá", letter: "1", align: "right" },
    { key: "sl_nhap", label: "Nhập - SL", letter: "2", align: "right" },
    { key: "tien_nhap", label: "Nhập - Tiền", letter: "3", align: "right" },
    { key: "sl_xuat", label: "Xuất - SL", letter: "4", align: "right" },
    { key: "tien_xuat", label: "Xuất - Tiền", letter: "5", align: "right" },
    { key: "sl_ton", label: "Tồn - SL", letter: "6", align: "right" },
    { key: "tien_ton", label: "Tồn - Tiền", letter: "7", align: "right" },
  ];

  const rows: DisplayRow[] = context.rows.map((row, index) => ({
    id: `s2d-${index}`,
    isEmphasis: isEmphasisRowType(asString(row.rowType), context.referenceData),
    cells: {
      so_hieu: formatValue(
        pickFirstRowValue(row, ["so_hieu", "chung_tu_so_hieu"]),
      ),
      ngay: formatValue(
        pickFirstRowValue(row, [
          dateColumn.fieldCode,
          "ngay",
          "ngay_thang",
          "date",
        ]),
      ),
      dien_giai: resolveRowDescription(row, "dien_giai", ""),
      dvt: formatValue(row.dvt),
      don_gia: formatValue(row.don_gia),
      sl_nhap: formatValue(row.sl_nhap),
      tien_nhap: formatValue(row.tien_nhap),
      sl_xuat: formatValue(row.sl_xuat),
      tien_xuat: formatValue(row.tien_xuat),
      sl_ton: formatValue(row.sl_ton),
      tien_ton: formatValue(row.tien_ton),
    },
  }));

  appendS2dBalanceRows(rows, context);
  appendRemainingFormulaRows(rows, context, "tien_ton", {
    so_hieu: "",
    ngay: "",
    dvt: "",
    don_gia: "",
    sl_nhap: "",
    tien_nhap: "",
    sl_xuat: "",
    tien_xuat: "",
    sl_ton: "",
  });

  const supplementalColumns = context.normalizedColumns.filter(
    (column) =>
      ![
        "so_hieu",
        "chung_tu_so_hieu",
        "ngay",
        "ngay_thang",
        "date",
        "dien_giai",
        "dvt",
        "don_gia",
        "sl_nhap",
        "tien_nhap",
        "sl_xuat",
        "tien_xuat",
        "sl_ton",
        "tien_ton",
      ].includes(column.fieldCode),
  );

  return (
    <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8">
      {renderFormHeader("S2d-HKD", context.templateName, context.versionLabel)}
      {renderBookTitle("SỔ CHI TIẾT VẬT LIỆU, DỤNG CỤ, SẢN PHẨM, HÀNG HÓA")}
      {renderLedgerTable(columns, rows)}
      {renderSupplementalTable(
        "Chỉ tiêu công thức và cân đối tồn",
        supplementalColumns,
        context.rows,
      )}
      {renderSignatureBlock()}
    </div>
  );
}

function renderS2eTemplate(context: TemplateRenderContext): ReactElement {
  const columns: DisplayColumn[] = [
    { key: "stt", label: "STT", letter: "A", minWidthClass: "min-w-14" },
    {
      key: "so_hieu",
      label: "Số hiệu chứng từ",
      letter: "B",
      minWidthClass: "min-w-32",
    },
    {
      key: "ngay_thang",
      label: "Ngày, tháng",
      letter: "C",
      minWidthClass: "min-w-28",
    },
    { key: "dien_giai", label: "Diễn giải", letter: "D" },
    {
      key: "thu_vao",
      label: "Thu/Gửi vào",
      letter: "1",
      align: "right",
      minWidthClass: "min-w-24",
    },
    {
      key: "chi_ra",
      label: "Chi/Rút ra",
      letter: "2",
      align: "right",
      minWidthClass: "min-w-24",
    },
  ];

  const rows: DisplayRow[] = context.rows.map((row, index) => ({
    id: `s2e-${index}`,
    isEmphasis: isEmphasisRowType(asString(row.rowType), context.referenceData),
    cells: {
      stt: formatValue(row.stt),
      so_hieu: formatValue(
        pickFirstRowValue(row, ["so_hieu", "chung_tu_so_hieu"]),
      ),
      ngay_thang: formatValue(pickFirstRowValue(row, ["ngay_thang", "date"])),
      dien_giai: resolveRowDescription(row, "dien_giai", ""),
      thu_vao: formatValue(
        pickFirstRowValue(row, ["thu_vao", "cash_in", "bank_in"]),
      ),
      chi_ra: formatValue(
        pickFirstRowValue(row, ["chi_ra", "cash_out", "bank_out"]),
      ),
      __section:
        (asString(row.section).trim() ||
          asString(row.moneyChannel).trim() ||
          "")
          .toLowerCase(),
    },
  }));

  appendS2eDefinitionRows(rows, context);
  appendRemainingFormulaRows(rows, context, "thu_vao", {
    stt: "",
    so_hieu: "",
    ngay_thang: "",
    chi_ra: "",
  });

  return (
    <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8">
      {renderFormHeader("S2e-HKD", context.templateName, context.versionLabel)}
      {renderBookTitle("SỔ CHI TIẾT TIỀN")}
      {renderLedgerTable(columns, rows)}

      {renderSignatureBlock()}
    </div>
  );
}

function renderFallbackTemplate(context: TemplateRenderContext): ReactElement {
  const { templateCode, templateName, versionLabel, normalizedColumns, rows } =
    context;
  const fallbackFormCode = templateCode
    ? `${templateCode.toUpperCase()}-HKD`
    : "CHUA-XAC-DINH";

  const displayColumns: DisplayColumn[] = normalizedColumns.map(
    (column, index) => ({
      key: column.fieldCode,
      label: column.label,
      letter: getColumnLetter(column, index),
      align: ["decimal", "number"].includes(column.fieldType.toLowerCase())
        ? "right"
        : "left",
    }),
  );

  const displayRows: DisplayRow[] = rows.map((row, index) => ({
    id: `fallback-${index}`,
    isEmphasis: isEmphasisRowType(asString(row.rowType), context.referenceData),
    cells: Object.fromEntries(
      displayColumns.map((column) => [
        column.key,
        formatValue(row[column.key]),
      ]),
    ),
  }));

  return (
    <div className="bg-white p-8 font-serif text-slate-900 border shadow-2xl space-y-8">
      {renderFormHeader(fallbackFormCode, templateName, versionLabel)}
      {renderBookTitle("SỔ DOANH THU BÁN HÀNG HÓA, DỊCH VỤ")}
      {renderLedgerTable(displayColumns, displayRows)}
      {renderSignatureBlock()}
    </div>
  );
}

const templateRenderers: Record<string, TemplateRenderer> = {
  s1a: renderS1aTemplate,
  s2a: renderS2aTemplate,
  s2b: renderS2bTemplate,
  s2c: renderS2cTemplate,
  s2d: renderS2dTemplate,
  s2e: renderS2eTemplate,
};

const VIETNAMESE_PREVIEW_FONT_STACK =
  '"Tahoma", "Segoe UI", "Arial", "Times New Roman", sans-serif';

const vietnamesePreviewFontStyle = {
  fontFamily: VIETNAMESE_PREVIEW_FONT_STACK,
  "--font-serif": VIETNAMESE_PREVIEW_FONT_STACK,
} as CSSProperties;

export default function BookTemplatePreview({
  templateCode,
  templateName,
  versionLabel,
  columns,
  rows,
  rowDefinitions,
  referenceData,
  summaryMeta,
}: BookTemplatePreviewProps) {
  const normalizedTemplateCode = (templateCode || "").trim().toLowerCase();
  const normalizedColumns = normalizeColumns(columns);
  const normalizedRowDefinitions = normalizeRowDefinitions(rowDefinitions);
  const totalValue = getTotalValue(summaryMeta);

  const renderer =
    templateRenderers[normalizedTemplateCode] || renderFallbackTemplate;

  return (
    <div style={vietnamesePreviewFontStyle}>
      {renderer({
        templateCode: normalizedTemplateCode,
        templateName,
        versionLabel,
        normalizedColumns,
        rows,
        rowDefinitions: normalizedRowDefinitions,
        referenceData,
        summaryMeta,
        totalValue,
      })}
    </div>
  );
}
