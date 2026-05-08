"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ElementType } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleHelp,
  Copy,
  Database,
  FileText,
  Layers,
  Lock,
  Pencil,
  Power,
  Save,
  Sparkles,
  Trash2,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  cloneFormula,
  getAccountingOverview,
  getAccountingReference,
  getBusinessTypesWithRates,
  getFormulaDetail,
  getMappableEntities,
  getMappableEntityDetail,
  getTemplateVersionFormulas,
  previewTemplateVersion,
  runAccountingTrace,
  updateFieldMappingForTesting,
  updateFormulaTesting,
  updateMappableEntity,
  updateRowDefinition,
} from "@/lib/admin-accounting-api";
import type {
  CreateTemplateRequest,
  CreateTemplateVersionRequest,
} from "@/lib/admin-accounting-api";
import { getAccountingPeriods } from "@/services/accountingService";
import { getLocations } from "@/services/locationService";
import BookTemplatePreview from "../../../../components/accounting/BookTemplatePreview";
import type { VersionOption } from "./types";
import type { AccountingPeriod } from "@/lib/types/accounting";
import type { Location } from "@/lib/types/location";

interface VersionTabProps {
  mode?: "admin" | "consultant";
  tvId: string;
  tvLabel: string;
  tvEffective: string;
  tvNotes: string;
  tvResult: unknown;
  versionOptions: VersionOption[];
  templateOptions: VersionOption[];
  setTvId: (value: string) => void;
  setTvLabel: (value: string) => void;
  setTvEffective: (value: string) => void;
  setTvNotes: (value: string) => void;
  onDetail: (rawId?: string) => Promise<void> | void;
  onFull: (rawId?: string) => Promise<void> | void;
  onCreateTemplate: (
    payload: CreateTemplateRequest,
  ) => Promise<number | null> | number | null;
  onCreateVersion: (
    templateId: number,
    payload: CreateTemplateVersionRequest,
  ) => Promise<number | null> | number | null;
  onClone: () => Promise<void> | void;
  onActivate: () => Promise<void> | void;
  onDeactivate: () => Promise<void> | void;
  onDelete: () => Promise<void> | void;
  onUpdate: () => Promise<void> | void;
}

interface MappingDraftState {
  mappingId: string;
  fieldCode: string;
  fieldLabel: string;
  fieldType: string;
  sourceType: string;
  sourceEntityId: string;
  sourceFieldId: string;
  formulaId: string;
  filterJson: string;
  aggregationType: string;
  formulaExpression: string;
  sortOrder: string;
}

interface RowDraftState {
  rowDefId: string;
  rowType: string;
  rowLabel: string;
  position: string;
  sortOrder: string;
  sectionType: string;
  sectionFilterValue: string;
  groupByField: string;
  formulaId: string;
  taxType: string;
  visibleFieldCodes: string;
}

interface FormulaDraftState {
  formulaId: string;
  code: string;
  name: string;
  description: string;
  formulaType: string;
  expressionJson: string;
  isActive: string;
}

interface EntityDraftState {
  entityId: string;
  entityCode: string;
  displayName: string;
  description: string;
}

interface RowTaxRateHint {
  taxType: string;
  businessTypeCode: string;
  businessTypeName: string;
  taxRate: number;
}

type ReferenceHelpCategory =
  | "fieldTypes"
  | "sourceTypes"
  | "aggregateTypes"
  | "rowTypes"
  | "positions"
  | "sectionTypes"
  | "taxTypes";

interface ReferenceHelpItem {
  value: string;
  label: string;
  description: string;
  example: string;
}

const EMPTY_REFERENCE_HELP_CATALOG: Record<
  ReferenceHelpCategory,
  ReferenceHelpItem[]
> = {
  fieldTypes: [],
  sourceTypes: [],
  aggregateTypes: [],
  rowTypes: [],
  positions: [],
  sectionTypes: [],
  taxTypes: [],
};

const PRIMARY = "bg-[#23C4C1] text-white hover:bg-[#1ea8a6]";
const wizardSteps = ["Template", "Mappings", "Rows", "Review"];

const ROW_TYPE_LABELS: Record<string, string> = {
  industry_header: "Tieu de nganh nghe",
  data_placeholder: "Vung du lieu",
  subtotal: "Cong nhom",
  tax_line: "Dong thue",
  grand_total: "Tong cong",
  section_header: "Tieu de phan",
  section_subtotal: "Cong phan",
  balance_row: "Dong so du",
  monthly_total: "Cong thang",
  quarterly_total: "Cong quy",
  profit_row: "Chenh lech DT-CP",
};

const POSITION_LABELS: Record<string, string> = {
  per_group: "Moi nhom",
  per_section: "Moi phan",
  start_of_book: "Dau so",
  end_of_book: "Cuoi so",
};

const SECTION_TYPE_LABELS: Record<string, string> = {
  industry_group: "Nhom nganh nghe",
  revenue_cost: "Doanh thu / Chi phi",
  cash_bank: "Tien mat / Ngan hang",
  per_product: "Theo san pham",
};

type PreviewBookRow = Record<string, unknown>;

type BookSectionRow = {
  lineType: string;
  values?: Record<string, unknown>;
  dataFilter?: {
    businessTypeId?: string;
    section?: string;
  };
  taxMetadata?: {
    taxType?: string;
    rate?: number;
  };
};

type BookSectionsMeta = {
  sections?: Array<{
    sectionType?: string;
    businessTypeId?: string;
    businessTypeName?: string;
    groupIndex?: number;
    rows?: BookSectionRow[];
  }>;
  footerRows?: BookSectionRow[];
};

const PREVIEW_DEFAULT_LOCATION_ID = 6;
const PREVIEW_DEFAULT_PERIOD_ID = 2;
const PREVIEW_DEFAULT_RULESET_ID = 1;
const PREVIEW_BATCH_SIZE = 1000;

function formatAccountingPeriodLabel(period: AccountingPeriod): string {
  if (period.periodType === "quarter" && period.quarter) {
    return `Q${period.quarter}/${period.year} (${period.startDate} - ${period.endDate})`;
  }

  if (period.periodType === "year") {
    return `Nam ${period.year} (${period.startDate} - ${period.endDate})`;
  }

  return `Ky #${period.periodId} (${period.startDate} - ${period.endDate})`;
}

function parseVisibleFieldCodes(raw: string): string[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === "string" ? item : ""))
      .filter(Boolean);
  } catch {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === "object",
  );
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

function buildPreviewRowDedupKey(row: PreviewBookRow): string {
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

function asReferenceHelpList(value: unknown): ReferenceHelpItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const record = entry as Record<string, unknown>;
      const optionValue = String(record.value ?? "").trim();
      if (!optionValue) return null;
      const optionLabel = String(record.label ?? optionValue).trim();
      return {
        value: optionValue,
        label: optionLabel || optionValue,
        description: String(record.description ?? "").trim(),
        example: String(record.example ?? "").trim(),
      };
    })
    .filter((option): option is ReferenceHelpItem => !!option);
}

function toOptionList(
  options: ReferenceHelpItem[],
): Array<{ value: string; label: string }> {
  return options.map((option) => ({
    value: option.value,
    label: option.label,
  }));
}

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase();
}

function isSectionDrivenTemplate(templateCode: string): boolean {
  const normalized = normalizeKey(templateCode);
  return ["s2a", "s2b", "s2c", "s2d", "s2e"].includes(normalized);
}

// Templates that should ONLY use sections data for preview (never raw rows from getBookRows).
function isSectionsOnlyTemplate(templateCode: string): boolean {
  return normalizeKey(templateCode) === "s2c";
}

function mapSectionRowToStructure(
  sectionRow: BookSectionRow,
  fieldCodes: string[],
  sectionMeta?: {
    sectionType?: string;
    businessTypeId?: string;
    businessTypeName?: string;
    groupIndex?: number;
  },
): PreviewBookRow {
  const directValues = sectionRow as unknown as Record<string, unknown>;
  const values = sectionRow.values ?? directValues;
  const row: PreviewBookRow = {
    lineType: asString(values.lineType) || sectionRow.lineType,
    rowType: asString(values.rowType) || sectionRow.lineType,
    rowLabel:
      asString(values.rowLabel) ||
      asString(values.dien_giai) ||
      asString(values.description),
    explanation:
      asString(values.explanation) || asString(directValues.explanation),
    visibleFieldCodes: values.visibleFieldCodes,
    taxType:
      asString(values.taxType) || asString(sectionRow.taxMetadata?.taxType),
    taxRate: sectionRow.taxMetadata?.rate,
    section:
      sectionRow.dataFilter?.section ||
      asString(sectionMeta?.sectionType) ||
      undefined,
    businessTypeId:
      sectionRow.dataFilter?.businessTypeId || sectionMeta?.businessTypeId,
    businessTypeName: sectionMeta?.businessTypeName,
    groupIndex: sectionMeta?.groupIndex,
  };

  fieldCodes.forEach((fieldCode) => {
    if (Object.prototype.hasOwnProperty.call(values, fieldCode)) {
      row[fieldCode] = values[fieldCode];
    } else if (Object.prototype.hasOwnProperty.call(directValues, fieldCode)) {
      row[fieldCode] = directValues[fieldCode];
    }
  });

  return row;
}

function mapSectionRowsToStructure(
  columns: Array<{ fieldCode: string }>,
  sectionsMeta: BookSectionsMeta | null,
  dataRows: PreviewBookRow[],
): PreviewBookRow[] {
  if (!sectionsMeta?.sections || sectionsMeta.sections.length === 0) {
    return dataRows;
  }

  const fieldCodes = columns.map((column) => column.fieldCode).filter(Boolean);
  const mappedRows: PreviewBookRow[] = [];
  const consumedDataRowIndexes = new Set<number>();

  const getRowBusinessTypeId = (row: PreviewBookRow): string => {
    const nestedDataFilter = asRecord(row.dataFilter);
    const nestedBusinessType = asRecord(row.businessType);
    const nestedBusinessTypeMeta = asRecord(row.businessTypeMeta);
    const nestedIndustry = asRecord(row.industryGroup);

    const candidates = [
      asString(row.businessTypeId),
      asString(row.BusinessTypeId),
      asString(row.business_type_id),
      asString(row.businessTypeCode),
      asString(row.business_type_code),
      asString(row.loai_hinh_kinh_doanh_id),
      asString(row.LoaiHinhKinhDoanhId),
      asString(nestedDataFilter?.businessTypeId),
      asString(nestedDataFilter?.BusinessTypeId),
      asString(nestedBusinessType?.id),
      asString(nestedBusinessType?.businessTypeId),
      asString(nestedBusinessTypeMeta?.id),
      asString(nestedBusinessTypeMeta?.businessTypeId),
      asString(nestedIndustry?.id),
      asString(nestedIndustry?.businessTypeId),
    ];
    return candidates.find((item) => item.trim().length > 0) ?? "";
  };

  const getRowProductId = (row: PreviewBookRow): string => {
    const nestedProduct = asRecord(row.product);
    const nestedItem = asRecord(row.item);
    const candidates = [
      asString(row.productId),
      asString(row.ProductId),
      asString(row.product_id),
      asString(row.itemId),
      asString(row.ItemId),
      asString(row.inventoryItemId),
      asString(row.InventoryItemId),
      asString(nestedProduct?.id),
      asString(nestedProduct?.productId),
      asString(nestedItem?.id),
      asString(nestedItem?.itemId),
    ];
    return candidates.find((item) => item.trim().length > 0) ?? "";
  };

  const getRowSection = (row: PreviewBookRow): string => {
    const nestedDataFilter = asRecord(row.dataFilter);
    const candidates = [
      asString(row.section),
      asString(row.Section),
      asString(row.sectionType),
      asString(row.SectionType),
      asString(row.loai_phan),
      asString(row.moneyChannel),
      asString(row.MoneyChannel),
      asString(row.money_channel),
      asString(nestedDataFilter?.section),
      asString(nestedDataFilter?.Section),
    ];
    return candidates.find((item) => item.trim().length > 0) ?? "";
  };

  sectionsMeta.sections.forEach((section) => {
    (section.rows ?? []).forEach((sectionRow) => {
      const rowType = normalizeKey(asString(sectionRow.lineType));
      if (rowType === "data_placeholder") {
        const sectionType = normalizeKey(asString(section.sectionType));
        const rawDataFilter = asRecord(sectionRow.dataFilter);
        const filterBusinessTypeId = asString(
          rawDataFilter &&
            Object.prototype.hasOwnProperty.call(
              rawDataFilter,
              "businessTypeId",
            )
            ? rawDataFilter.businessTypeId
            : section.businessTypeId,
        ).trim();
        const filterSection = asString(sectionRow.dataFilter?.section).trim();

        const injectedRows: PreviewBookRow[] = [];
        dataRows.forEach((dataRow, index) => {
          if (consumedDataRowIndexes.has(index)) return;

          const rowBusinessTypeId = getRowBusinessTypeId(dataRow);
          const rowSection = getRowSection(dataRow);
          const rowProductId = getRowProductId(dataRow);

          const businessTypeMatched = filterBusinessTypeId
            ? sectionType === "per_product"
              ? normalizeKey(rowProductId) ===
                normalizeKey(filterBusinessTypeId)
              : normalizeKey(rowBusinessTypeId) ===
                normalizeKey(filterBusinessTypeId)
            : true;
          const sectionMatched = filterSection
            ? normalizeKey(rowSection) === normalizeKey(filterSection)
            : true;

          if (businessTypeMatched && sectionMatched) {
            consumedDataRowIndexes.add(index);
            injectedRows.push(dataRow);
          }
        });

        mappedRows.push(...injectedRows);
        return;
      }

      mappedRows.push(
        mapSectionRowToStructure(sectionRow, fieldCodes, {
          sectionType: section.sectionType,
          businessTypeId: section.businessTypeId,
          businessTypeName: section.businessTypeName,
          groupIndex: section.groupIndex,
        }),
      );
    });
  });

  dataRows.forEach((dataRow, index) => {
    if (!consumedDataRowIndexes.has(index)) {
      mappedRows.push(dataRow);
    }
  });

  (sectionsMeta.footerRows ?? []).forEach((footerRow) => {
    mappedRows.push(mapSectionRowToStructure(footerRow, fieldCodes));
  });

  return mappedRows;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function formatDate(value: string): string {
  if (!value.trim()) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("vi-VN");
}

function toNullableNumber(value: string): number | undefined {
  if (!value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseCsvStrings(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseGroupNumbers(value: string): number[] {
  return parseCsvStrings(value)
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item > 0);
}

function deriveMappingDraft(
  mapping: Record<string, unknown> | null,
): MappingDraftState {
  return {
    mappingId: asString(mapping?.mappingId),
    fieldCode: asString(mapping?.fieldCode),
    fieldLabel: asString(mapping?.fieldLabel),
    fieldType: asString(mapping?.fieldType) || "decimal",
    sourceType: asString(mapping?.sourceType) || "query",
    sourceEntityId: asString(mapping?.sourceEntityId),
    sourceFieldId: asString(mapping?.sourceFieldId),
    formulaId: asString(mapping?.formulaId),
    filterJson: asString(mapping?.filterJson),
    aggregationType: asString(mapping?.aggregationType),
    formulaExpression: asString(mapping?.formulaExpression),
    sortOrder: asString(mapping?.sortOrder) || "0",
  };
}

function deriveRowDraft(row: Record<string, unknown> | null): RowDraftState {
  return {
    rowDefId: asString(row?.rowDefId),
    rowType: asString(row?.rowType) || "data_placeholder",
    rowLabel: asString(row?.rowLabel),
    position: asString(row?.position) || "per_group",
    sortOrder: asString(row?.sortOrder) || "100",
    sectionType: asString(row?.sectionType),
    sectionFilterValue: asString(row?.sectionFilterValue),
    groupByField: asString(row?.groupByField),
    formulaId: asString(row?.formulaId),
    taxType: asString(row?.taxType),
    visibleFieldCodes: asString(row?.visibleFieldCodes),
  };
}

function deriveFormulaDraft(
  formula: Record<string, unknown> | null,
): FormulaDraftState {
  return {
    formulaId: asString(formula?.formulaId),
    code: asString(formula?.code),
    name: asString(formula?.name),
    description: asString(formula?.description),
    formulaType: asString(formula?.formulaType),
    expressionJson: asString(formula?.expressionJson) || "{}",
    isActive: asBoolean(formula?.isActive) ? "true" : "false",
  };
}

function deriveEntityDraft(
  entity: Record<string, unknown> | null,
): EntityDraftState {
  return {
    entityId: asString(entity?.entityId),
    entityCode: asString(entity?.entityCode),
    displayName: asString(entity?.displayName),
    description: asString(entity?.description),
  };
}

function buildFieldMappingPatch(
  mapping: Record<string, unknown>,
  nextFormulaId?: number,
) {
  return {
    fieldLabel: asString(mapping.fieldLabel) || undefined,
    fieldType: asString(mapping.fieldType) || undefined,
    sourceType: asString(mapping.sourceType) || "query",
    sourceEntityId: asNumber(mapping.sourceEntityId) ?? undefined,
    sourceFieldId: asNumber(mapping.sourceFieldId) ?? undefined,
    filterJson: asString(mapping.filterJson) || undefined,
    aggregationType: asString(mapping.aggregationType) || undefined,
    formulaId: nextFormulaId ?? asNumber(mapping.formulaId) ?? undefined,
    formulaExpression: asString(mapping.formulaExpression) || undefined,
    sortOrder: asNumber(mapping.sortOrder) ?? 0,
  };
}

function buildRowDefinitionPatch(
  row: Record<string, unknown>,
  nextFormulaId?: number,
) {
  return {
    rowType: asString(row.rowType) || "data_placeholder",
    rowLabel: asString(row.rowLabel) || null,
    position: asString(row.position) || "per_group",
    sortOrder: asNumber(row.sortOrder) ?? 100,
    sectionType: asString(row.sectionType) || null,
    sectionFilterValue: asString(row.sectionFilterValue) || null,
    groupByField: asString(row.groupByField) || null,
    formulaId: nextFormulaId ?? asNumber(row.formulaId) ?? null,
    taxType: asString(row.taxType) || null,
    visibleFieldCodes: asString(row.visibleFieldCodes) || null,
  };
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: ElementType;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 text-xs uppercase tracking-wide text-gray-500">
        <span>{label}</span>
        <Icon className="h-4 w-4 text-[#15918f]" />
      </div>
      <div className="mt-2 text-lg font-semibold text-gray-900">{value}</div>
    </div>
  );
}

function ReferenceHelpLabel({
  label,
  items,
}: {
  label: string;
  items: ReferenceHelpItem[];
}) {
  const [open, setOpen] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      setOpen(true);
      hoverTimerRef.current = null;
    }, 300);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    setOpen(false);
  };

  return (
    <div className="relative inline-flex items-center gap-1">
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <button
        type="button"
        // title={`Giải thích ${label}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#15918f] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#23C4C1]/60"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>

      {open ? (
        <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-80 rounded-md bg-white px-3 py-2 text-[11px] leading-relaxed text-gray-700 shadow-lg ring-1 ring-[#23C4C1]/35">
          {items.length === 0 ? (
            <p className="text-gray-500">Chưa có reference cho trường này.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-4 marker:text-[#15918f]">
              {items.map((item) => {
                const description = item.description
                  ? `: ${item.description}`
                  : "";
                const example = item.example ? ` (vd: ${item.example})` : "";
                return (
                  <li key={item.value}>
                    <span className="font-semibold text-[#0f766e]">
                      {item.value}
                    </span>{" "}
                    - {item.label}
                    {description}
                    {example}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}

type TraceNode = {
  step: number;
  nodeType: string;
  description: string;
  resolvedValue: number | null;
  source: string;
  debug: string | null;
  children: TraceNode[] | null;
};

function TraceNodeRow({
  node,
  depth,
}: {
  node: TraceNode;
  depth: number;
}): React.ReactElement {
  const nodeTypeStyle: Record<string, string> = {
    op: "bg-blue-50 text-blue-700 border-blue-200",
    fn: "bg-purple-50 text-purple-700 border-purple-200",
    ref: "bg-amber-50 text-amber-700 border-amber-200",
    literal: "bg-green-50 text-green-700 border-green-200",
  };
  const sourceLabel: Record<string, string> = {
    computed: "tính toán",
    constant: "hằng số",
    formula_cache: "cache formula",
  };
  const badgeClass =
    nodeTypeStyle[node.nodeType] ?? "bg-gray-50 text-gray-600 border-gray-200";

  return (
    <>
      <div
        className="flex items-start gap-2 rounded px-2 py-1 text-xs hover:bg-slate-50"
        style={{ marginLeft: depth * 20 }}
      >
        <span className="shrink-0 font-mono text-gray-400">#{node.step}</span>
        <span
          className={`shrink-0 rounded border px-1.5 py-0.5 font-mono text-[10px] ${badgeClass}`}
        >
          {node.nodeType}
        </span>
        <span className="flex-1 font-mono text-gray-800">
          {node.description}
        </span>
        <span className="shrink-0 text-right font-mono font-semibold text-slate-700">
          {node.resolvedValue == null
            ? "—"
            : node.resolvedValue.toLocaleString("vi-VN")}
        </span>
        <span className="shrink-0 text-[10px] text-gray-400 italic">
          ({sourceLabel[node.source] ?? node.source})
        </span>
      </div>
      {node.children?.map((child) => (
        <TraceNodeRow key={child.step} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default function VersionTab(props: VersionTabProps) {
  const selectedVersionId = props.tvId;
  const isConsultantMode = props.mode === "consultant";
  const loadDetail = props.onDetail;
  const loadFullStructure = props.onFull;

  const result = asRecord(props.tvResult);
  const hasResult = !!result;

  const templateCode = asString(result?.templateCode);
  const templateName = asString(result?.templateName);
  const versionLabel = asString(result?.versionLabel);
  const effectiveFrom = asString(result?.effectiveFrom);
  const changeNotes = asString(result?.changeNotes);
  const templateVersionId = asNumber(result?.templateVersionId);
  const isActive = asBoolean(result?.isActive);

  const fieldMappings = asArray(result?.fieldMappings);
  const rowDefinitions = asArray(result?.rowDefinitions);
  const mappingCount =
    fieldMappings.length || (asNumber(result?.mappingCount) ?? 0);
  const rowCount = rowDefinitions.length || (asNumber(result?.rowCount) ?? 0);
  const isLoaded = hasResult && templateVersionId !== null;
  const isDraft = isLoaded && isActive === false;
  const isActiveVersion = isLoaded && isActive === true;

  const [renderPreviewResult, setRenderPreviewResult] = useState<Record<
    string,
    unknown
  > | null>(null);

  const sampleBookColumns = useMemo(() => {
    const root = asRecord(renderPreviewResult);
    const apiColumns = asArray(root?.columns);
    if (apiColumns.length > 0) {
      return apiColumns
        .map((col) => ({
          fieldCode: asString(col.fieldCode),
          label: asString(col.label) || asString(col.fieldCode),
          fieldType: asString(col.fieldType) || "text",
          exportColumn: asString(col.exportColumn),
        }))
        .filter((col) => col.fieldCode);
    }
    return [...fieldMappings]
      .sort((a, b) => {
        const aSort = asNumber(a.sortOrder) ?? Number.MAX_SAFE_INTEGER;
        const bSort = asNumber(b.sortOrder) ?? Number.MAX_SAFE_INTEGER;
        return aSort - bSort;
      })
      .map((mapping) => ({
        fieldCode: asString(mapping.fieldCode),
        label: asString(mapping.fieldLabel) || asString(mapping.fieldCode),
        fieldType: asString(mapping.fieldType) || "text",
        exportColumn: asString(mapping.exportColumn),
      }))
      .filter((column) => column.fieldCode);
  }, [renderPreviewResult, fieldMappings]);

  const sampleBookRows = useMemo(() => {
    return [...rowDefinitions]
      .sort((a, b) => {
        const aSort = asNumber(a.sortOrder) ?? Number.MAX_SAFE_INTEGER;
        const bSort = asNumber(b.sortOrder) ?? Number.MAX_SAFE_INTEGER;
        return aSort - bSort;
      })
      .map((row) => ({
        ...row,
        rowType: asString(row.rowType),
        rowLabel: asString(row.rowLabel),
        position: asString(row.position),
        sortOrder: asNumber(row.sortOrder) ?? 0,
      }));
  }, [rowDefinitions]);

  const [renderPreviewBusy, setRenderPreviewBusy] = useState(false);
  const [renderPreviewLoadingMore, setRenderPreviewLoadingMore] =
    useState(false);
  const [renderPreviewCursor, setRenderPreviewCursor] = useState<string | null>(
    null,
  );
  const [renderPreviewHasMore, setRenderPreviewHasMore] = useState(false);
  const [renderPreviewError, setRenderPreviewError] = useState("");
  const [deactivateBusy, setDeactivateBusy] = useState(false);
  const [deactivateError, setDeactivateError] = useState("");
  const [previewLocationId, setPreviewLocationId] = useState<number>(
    PREVIEW_DEFAULT_LOCATION_ID,
  );
  const [previewLocations, setPreviewLocations] = useState<Location[]>([]);
  const [previewLocationsBusy, setPreviewLocationsBusy] = useState(false);
  const [previewLocationsError, setPreviewLocationsError] = useState("");
  const [previewPeriodId, setPreviewPeriodId] = useState<number | null>(
    PREVIEW_DEFAULT_PERIOD_ID,
  );
  const [previewPeriods, setPreviewPeriods] = useState<AccountingPeriod[]>([]);
  const [previewPeriodsBusy, setPreviewPeriodsBusy] = useState(false);
  const [previewPeriodsError, setPreviewPeriodsError] = useState("");
  const [templateVersionFormulas, setTemplateVersionFormulas] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [templateVersionFormulasBusy, setTemplateVersionFormulasBusy] =
    useState(false);
  const [templateVersionFormulasError, setTemplateVersionFormulasError] =
    useState("");
  const renderPreviewLoaderMainRef = useRef<HTMLDivElement | null>(null);
  const renderPreviewLoaderWizardRef = useRef<HTMLDivElement | null>(null);
  const renderPreviewCanAutoLoadRef = useRef(true);

  const templateVersionFormulaItems = useMemo(() => {
    return templateVersionFormulas
      .filter((formula) => formula.isActive !== false)
      .map((formula) => ({
        formulaId: asNumber(formula.formulaId),
        code: asString(formula.code),
        name: asString(formula.name),
        formulaType: asString(formula.formulaType),
        isActive: asBoolean(formula.isActive),
        usedByFieldCodes: asStringArray(formula.usedByFieldCodes),
      }));
  }, [templateVersionFormulas]);

  const renderPreviewSummaryMeta = useMemo(() => {
    const root = asRecord(renderPreviewResult);
    return asRecord(root?.summary);
  }, [renderPreviewResult]);

  const renderPreviewSectionsMeta = useMemo((): BookSectionsMeta | null => {
    const root = asRecord(renderPreviewResult);
    const rawSections = asArray(root?.sections);
    if (rawSections.length === 0) return null;
    return {
      sections: rawSections.map((section) => ({
        sectionType: asString(section.sectionType),
        businessTypeId: asString(section.groupKey || section.businessTypeId),
        businessTypeName: asString(
          section.groupName || section.businessTypeName,
        ),
        groupIndex:
          typeof section.groupIndex === "number"
            ? section.groupIndex
            : undefined,
        rows: asArray(section.rows) as unknown as BookSectionRow[],
      })),
      footerRows: asArray(root?.footerRows) as unknown as BookSectionRow[],
    };
  }, [renderPreviewResult]);

  const renderPreviewRows = useMemo(() => {
    const root = asRecord(renderPreviewResult);
    const rows = asRecord(root?.rows);
    return asArray(rows?.items).map((row) => ({
      ...row,
      rowType: asString(row.rowType || row.lineType) || "data",
    }));
  }, [renderPreviewResult]);

  const renderPreviewSectionRows = useMemo(
    () =>
      mapSectionRowsToStructure(
        sampleBookColumns,
        renderPreviewSectionsMeta,
        isSectionsOnlyTemplate(templateCode) ? [] : renderPreviewRows,
      ),
    [
      sampleBookColumns,
      renderPreviewRows,
      templateCode,
      renderPreviewSectionsMeta,
    ],
  );

  const hasSectionRows = renderPreviewSectionRows.length > 0;
  const shouldPrioritizeSectionRows = isSectionDrivenTemplate(templateCode);

  const renderPreviewFormulaValues = useMemo(() => {
    const summary = renderPreviewSummaryMeta;
    const formulaValues = asRecord(summary?.formulaValues);
    if (!formulaValues) return [];
    return Object.entries(formulaValues).map(([code, value]) => ({
      code,
      value,
    }));
  }, [renderPreviewSummaryMeta]);

  const enrichedRowDefinitions = useMemo(() => {
    const formulaValues =
      asRecord(renderPreviewSummaryMeta?.formulaValues) ?? {};
    return rowDefinitions.map((row) => {
      const formulaCode = asString(row.formulaCode).trim();
      if (!formulaCode || !(formulaCode in formulaValues)) return row;
      return { ...row, formulaValue: formulaValues[formulaCode] };
    });
  }, [rowDefinitions, renderPreviewSummaryMeta]);

  const linkedFormulaIds = useMemo(() => {
    const ids = new Set<number>();
    fieldMappings.forEach((mapping) => {
      const formulaId = asNumber(mapping.formulaId);
      if (formulaId !== null) ids.add(formulaId);
    });
    rowDefinitions.forEach((row) => {
      const formulaId = asNumber(row.formulaId);
      if (formulaId !== null) ids.add(formulaId);
    });
    return Array.from(ids);
  }, [fieldMappings, rowDefinitions]);

  const linkedEntityIds = useMemo(() => {
    const ids = new Set<number>();
    fieldMappings.forEach((mapping) => {
      const entityId = asNumber(mapping.sourceEntityId);
      if (entityId !== null) ids.add(entityId);
    });
    return Array.from(ids);
  }, [fieldMappings]);

  const linkedFieldIdsByEntity = useMemo(() => {
    const map = new Map<number, Set<number>>();
    fieldMappings.forEach((mapping) => {
      const entityId = asNumber(mapping.sourceEntityId);
      const fieldId = asNumber(mapping.sourceFieldId);
      if (entityId === null || fieldId === null) return;
      if (!map.has(entityId)) map.set(entityId, new Set<number>());
      map.get(entityId)?.add(fieldId);
    });
    return map;
  }, [fieldMappings]);

  // Stable string keys to avoid infinite re-trigger when array refs change each render
  const linkedFormulaIdsKey = linkedFormulaIds.join(",");
  const linkedEntityIdsKey = linkedEntityIds.join(",");

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardLoading, setWizardLoading] = useState(false);
  const [wizardBusy, setWizardBusy] = useState(false);
  const [wizardError, setWizardError] = useState("");
  const [previewLoadedForVersionId, setPreviewLoadedForVersionId] =
    useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [createTemplateModalOpen, setCreateTemplateModalOpen] = useState(false);
  const [createVersionModalOpen, setCreateVersionModalOpen] = useState(false);
  const [createTemplateBusy, setCreateTemplateBusy] = useState(false);
  const [createVersionBusy, setCreateVersionBusy] = useState(false);
  const [createTemplateError, setCreateTemplateError] = useState("");
  const [createVersionError, setCreateVersionError] = useState("");
  const [createTemplateForm, setCreateTemplateForm] = useState({
    templateCode: "",
    name: "",
    description: "",
    applicableGroups: "1",
    applicableMethods: "method_1",
    dataSourceType: "revenues",
    initialVersionLabel: "v1-draft",
  });
  const [createVersionForm, setCreateVersionForm] = useState({
    templateId: "",
    versionLabel: "",
    effectiveFrom: "",
    changeNotes: "",
  });
  const [mappingFieldTypeOptions, setMappingFieldTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([
    { value: "decimal", label: "decimal" },
    { value: "string", label: "string" },
    { value: "date", label: "date" },
    { value: "long", label: "long" },
  ]);
  const [mappingSourceTypeOptions, setMappingSourceTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([
    { value: "query", label: "query" },
    { value: "formula", label: "formula" },
    { value: "static", label: "static" },
    { value: "auto", label: "auto" },
  ]);
  const [mappingAggregationOptions, setMappingAggregationOptions] = useState<
    Array<{ value: string; label: string }>
  >([{ value: "none", label: "none" }]);
  const [mappingFormulaOptions, setMappingFormulaOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [mappingEntityOptions, setMappingEntityOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [mappingEntityFieldOptions, setMappingEntityFieldOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [rowTypeOptions, setRowTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >(
    Object.entries(ROW_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  );
  const [rowPositionOptions, setRowPositionOptions] = useState<
    Array<{ value: string; label: string }>
  >(
    Object.entries(POSITION_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  );
  const [rowSectionTypeOptions, setRowSectionTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >(
    Object.entries(SECTION_TYPE_LABELS).map(([value, label]) => ({
      value,
      label,
    })),
  );
  const [rowTaxTypeOptions, setRowTaxTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([
    { value: "VAT", label: "VAT" },
    { value: "PIT_METHOD_1", label: "PIT_METHOD_1" },
  ]);
  const [rowTaxRateHints, setRowTaxRateHints] = useState<RowTaxRateHint[]>([]);
  const [referenceHelpCatalog, setReferenceHelpCatalog] = useState<
    Record<ReferenceHelpCategory, ReferenceHelpItem[]>
  >(EMPTY_REFERENCE_HELP_CATALOG);
  const [previewReferenceData, setPreviewReferenceData] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [linkedFormulas, setLinkedFormulas] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [linkedEntities, setLinkedEntities] = useState<
    Array<Record<string, unknown>>
  >([]);

  const [selectedMappingId, setSelectedMappingId] = useState<number | null>(
    null,
  );
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [selectedFormulaId, setSelectedFormulaId] = useState<number | null>(
    null,
  );
  const [selectedEntityId, setSelectedEntityId] = useState<number | null>(null);
  const [traceLocationId, setTraceLocationId] = useState("6");
  const [tracePeriodId, setTracePeriodId] = useState("");
  const [traceRulesetId, setTraceRulesetId] = useState("1");
  const [traceBusinessTypeIds, setTraceBusinessTypeIds] = useState("");
  const [traceResult, setTraceResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [traceBusy, setTraceBusy] = useState(false);
  const [traceError, setTraceError] = useState("");

  const selectedMapping = useMemo(
    () =>
      fieldMappings.find(
        (mapping) => asNumber(mapping.mappingId) === selectedMappingId,
      ) ?? null,
    [fieldMappings, selectedMappingId],
  );
  const selectedRow = useMemo(
    () =>
      rowDefinitions.find((row) => asNumber(row.rowDefId) === selectedRowId) ??
      null,
    [rowDefinitions, selectedRowId],
  );
  const selectedFormula = useMemo(
    () =>
      linkedFormulas.find(
        (formula) => asNumber(formula.formulaId) === selectedFormulaId,
      ) ?? null,
    [linkedFormulas, selectedFormulaId],
  );
  const selectedEntity = useMemo(
    () =>
      linkedEntities.find(
        (entity) => asNumber(entity.entityId) === selectedEntityId,
      ) ?? null,
    [linkedEntities, selectedEntityId],
  );

  const rowVisibleFieldOptions = useMemo(() => {
    return fieldMappings
      .map((mapping) => {
        const fieldCode = asString(mapping.fieldCode).trim();
        if (!fieldCode) return null;
        const fieldLabel = asString(mapping.fieldLabel).trim();
        return {
          value: fieldCode,
          label: fieldLabel ? `${fieldCode} - ${fieldLabel}` : fieldCode,
        };
      })
      .filter((option): option is { value: string; label: string } => !!option);
  }, [fieldMappings]);

  const reviewRows = useMemo(() => {
    return [...rowDefinitions]
      .sort((a, b) => {
        const aSort = asNumber(a.sortOrder) ?? Number.MAX_SAFE_INTEGER;
        const bSort = asNumber(b.sortOrder) ?? Number.MAX_SAFE_INTEGER;
        return aSort - bSort;
      })
      .map((row) => ({
        rowDefId: asNumber(row.rowDefId),
        rowType: asString(row.rowType),
        rowLabel: asString(row.rowLabel),
        position: asString(row.position),
        sortOrder: asNumber(row.sortOrder) ?? 0,
        sectionType: asString(row.sectionType),
        taxType: asString(row.taxType),
        formulaId: asNumber(row.formulaId),
        groupByField: asString(row.groupByField),
        visibleFieldCodes: asString(row.visibleFieldCodes),
      }));
  }, [rowDefinitions]);

  const reviewRenderPreview = asString(result?.renderPreview);
  const normalizedTemplateCode = templateCode.trim().toLowerCase();
  const isS2aTemplate = normalizedTemplateCode === "s2a";

  const [mappingDraft, setMappingDraft] = useState<MappingDraftState>(
    deriveMappingDraft(null),
  );
  const [rowDraft, setRowDraft] = useState<RowDraftState>(deriveRowDraft(null));
  const [formulaDraft, setFormulaDraft] = useState<FormulaDraftState>(
    deriveFormulaDraft(null),
  );
  const [entityDraft, setEntityDraft] = useState<EntityDraftState>(
    deriveEntityDraft(null),
  );

  const selectedRowTaxRateHints = useMemo(() => {
    const taxType = rowDraft.taxType.trim().toUpperCase();
    if (!taxType) return rowTaxRateHints;
    return rowTaxRateHints.filter((item) => item.taxType === taxType);
  }, [rowDraft.taxType, rowTaxRateHints]);

  useEffect(() => {
    if (createVersionForm.templateId) return;
    const firstTemplateId = props.templateOptions[0]?.value;
    if (!firstTemplateId) return;

    setCreateVersionForm((prev) => ({
      ...prev,
      templateId: firstTemplateId,
    }));
  }, [createVersionForm.templateId, props.templateOptions]);

  useEffect(() => {
    const nextMappingId = asNumber(fieldMappings[0]?.mappingId);
    const nextRowId = asNumber(rowDefinitions[0]?.rowDefId);

    setSelectedMappingId((current) => {
      if (
        current !== null &&
        fieldMappings.some((mapping) => asNumber(mapping.mappingId) === current)
      ) {
        return current;
      }
      return nextMappingId;
    });

    setSelectedRowId((current) => {
      if (
        current !== null &&
        rowDefinitions.some((row) => asNumber(row.rowDefId) === current)
      ) {
        return current;
      }
      return nextRowId;
    });
  }, [templateVersionId, fieldMappings, rowDefinitions]);

  useEffect(() => {
    setMappingDraft(deriveMappingDraft(selectedMapping));
  }, [selectedMapping]);

  useEffect(() => {
    setRowDraft(deriveRowDraft(selectedRow));
  }, [selectedRow]);

  useEffect(() => {
    setFormulaDraft(deriveFormulaDraft(selectedFormula));
  }, [selectedFormula]);

  useEffect(() => {
    setEntityDraft(deriveEntityDraft(selectedEntity));
  }, [selectedEntity]);

  useEffect(() => {
    if (!wizardOpen || !isDraft) return;

    let disposed = false;

    async function loadRelations() {
      setWizardLoading(true);
      setWizardError("");
      try {
        const versionId = toNullableNumber(selectedVersionId);
        if (!versionId) return;
        const rulesetId = asNumber(result?.rulesetId) ?? 1;

        const [
          formulaResults,
          entityResults,
          overview,
          entities,
          reference,
          businessTypeRates,
        ] = await Promise.all([
          Promise.all(
            linkedFormulaIds.map((formulaId) => getFormulaDetail(formulaId)),
          ),
          Promise.all(
            linkedEntityIds.map((entityId) =>
              getMappableEntityDetail(entityId),
            ),
          ),
          getAccountingOverview(),
          getMappableEntities(true),
          getAccountingReference(),
          getBusinessTypesWithRates(rulesetId).catch(() => []),
        ]);
        if (disposed) return;

        setPreviewReferenceData(reference as Record<string, unknown>);

        setLinkedFormulas(formulaResults);
        setLinkedEntities(entityResults);
        setSelectedFormulaId(asNumber(formulaResults[0]?.formulaId));
        setSelectedEntityId(asNumber(entityResults[0]?.entityId));

        setMappingFormulaOptions(
          overview.formulas
            .map((formula) => {
              if (!formula.isActive) return null;
              const formulaId = String(formula.formulaId ?? "").trim();
              if (!formulaId) return null;
              const formulaCode = String(formula.code ?? "").trim();
              const formulaName = String(formula.name ?? "").trim();
              return {
                value: formulaId,
                label:
                  `${formulaId} - ${formulaCode} ${formulaName ? `(${formulaName})` : ""}`.trim(),
              };
            })
            .filter(
              (option): option is { value: string; label: string } => !!option,
            ),
        );

        setMappingEntityOptions(
          entities
            .map((entity) => {
              const entityId = String(entity.entityId ?? "").trim();
              if (!entityId) return null;
              const entityCode = String(entity.entityCode ?? "").trim();
              const entityName = String(entity.displayName ?? "").trim();
              return {
                value: entityId,
                label: `${entityCode} - ${entityName}`,
              };
            })
            .filter(
              (option): option is { value: string; label: string } => !!option,
            ),
        );

        const fieldTypeReferences = asReferenceHelpList(reference.fieldTypes);
        if (fieldTypeReferences.length > 0) {
          setMappingFieldTypeOptions(toOptionList(fieldTypeReferences));
        }

        const sourceTypeReferences = asReferenceHelpList(reference.sourceTypes);
        if (sourceTypeReferences.length > 0) {
          setMappingSourceTypeOptions(toOptionList(sourceTypeReferences));
        }

        const aggregateTypeReferences = asReferenceHelpList(
          reference.aggregateTypes,
        );
        if (aggregateTypeReferences.length > 0) {
          setMappingAggregationOptions([
            { value: "none", label: "none" },
            ...toOptionList(aggregateTypeReferences),
          ]);
        }

        const rowTypeReferences = asReferenceHelpList(reference.rowTypes);
        if (rowTypeReferences.length > 0) {
          setRowTypeOptions(toOptionList(rowTypeReferences));
        }

        const positionReferences = asReferenceHelpList(reference.positions);
        if (positionReferences.length > 0) {
          setRowPositionOptions(toOptionList(positionReferences));
        }

        const sectionTypeReferences = asReferenceHelpList(
          reference.sectionTypes,
        );
        if (sectionTypeReferences.length > 0) {
          setRowSectionTypeOptions(toOptionList(sectionTypeReferences));
        }

        const taxTypeReferences = asReferenceHelpList(reference.taxTypes);
        const taxTypesFromRates = businessTypeRates
          .flatMap((item) => asArray(item.taxRates))
          .map((rate) => asString(rate.taxType).trim().toUpperCase())
          .filter(Boolean);
        const mergedTaxTypes = Array.from(
          new Set([
            ...taxTypeReferences.map((item) => item.value.toUpperCase()),
            ...taxTypesFromRates,
          ]),
        ).map((value) => {
          const refMatch = taxTypeReferences.find(
            (item) => item.value.toUpperCase() === value,
          );
          return {
            value,
            label: refMatch?.label || value,
            description: refMatch?.description || "",
            example: refMatch?.example || "",
          };
        });
        if (mergedTaxTypes.length > 0) {
          setRowTaxTypeOptions(toOptionList(mergedTaxTypes));
        }

        setReferenceHelpCatalog({
          fieldTypes: fieldTypeReferences,
          sourceTypes: sourceTypeReferences,
          aggregateTypes: aggregateTypeReferences,
          rowTypes: rowTypeReferences,
          positions: positionReferences,
          sectionTypes: sectionTypeReferences,
          taxTypes: mergedTaxTypes,
        });

        setRowTaxRateHints(
          businessTypeRates.flatMap((businessType) =>
            asArray(businessType.taxRates).map((rate) => ({
              taxType: asString(rate.taxType).trim().toUpperCase(),
              businessTypeCode: asString(businessType.code),
              businessTypeName: asString(businessType.name),
              taxRate: asNumber(rate.taxRate) ?? 0,
            })),
          ),
        );
      } catch (error) {
        if (!disposed) {
          setWizardError(
            error instanceof Error
              ? error.message
              : "Không tải được dữ liệu liên quan.",
          );
        }
      } finally {
        if (!disposed) setWizardLoading(false);
      }
    }

    void loadRelations();

    return () => {
      disposed = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    wizardOpen,
    isDraft,
    linkedFormulaIdsKey,
    linkedEntityIdsKey,
    selectedVersionId,
  ]);

  useEffect(() => {
    if (!selectedVersionId) {
      setPreviewReferenceData(null);
      return;
    }

    let disposed = false;

    async function loadReferenceForPreview() {
      try {
        const reference = await getAccountingReference();
        if (!disposed) {
          setPreviewReferenceData(reference as Record<string, unknown>);
        }
      } catch {
        if (!disposed) {
          setPreviewReferenceData(null);
        }
      }
    }

    void loadReferenceForPreview();

    return () => {
      disposed = true;
    };
  }, [selectedVersionId]);

  useEffect(() => {
    if (templateVersionId === null) {
      setTemplateVersionFormulas([]);
      setTemplateVersionFormulasError("");
      setTemplateVersionFormulasBusy(false);
      return;
    }

    const resolvedTemplateVersionId = templateVersionId as number;

    let disposed = false;

    async function loadTemplateVersionFormulas() {
      setTemplateVersionFormulasBusy(true);
      setTemplateVersionFormulasError("");

      try {
        const formulas = await getTemplateVersionFormulas(
          resolvedTemplateVersionId,
        );
        if (!disposed) {
          setTemplateVersionFormulas(formulas);
        }
      } catch (error) {
        if (!disposed) {
          setTemplateVersionFormulas([]);
          setTemplateVersionFormulasError(
            error instanceof Error
              ? error.message
              : "Không tải được danh sách formula của template version.",
          );
        }
      } finally {
        if (!disposed) {
          setTemplateVersionFormulasBusy(false);
        }
      }
    }

    void loadTemplateVersionFormulas();

    return () => {
      disposed = true;
    };
  }, [templateVersionId]);

  useEffect(() => {
    const entityId = toNullableNumber(mappingDraft.sourceEntityId);
    if (!entityId) return;

    let disposed = false;
    const targetEntityId = entityId;

    async function loadFields() {
      try {
        const detail = await getMappableEntityDetail(targetEntityId);
        if (disposed) return;

        const fields = asArray(detail.fields)
          .map((field) => {
            const fieldId = String(field.fieldId ?? "").trim();
            if (!fieldId) return null;
            const fieldCode = String(field.fieldCode ?? "").trim();
            const fieldName = String(field.displayName ?? "").trim();
            return {
              value: fieldId,
              label: `${fieldCode} - ${fieldName}`,
            };
          })
          .filter(
            (option): option is { value: string; label: string } => !!option,
          );

        setMappingEntityFieldOptions(fields);
      } catch {
        if (!disposed) setMappingEntityFieldOptions([]);
      }
    }

    void loadFields();

    return () => {
      disposed = true;
    };
  }, [mappingDraft.sourceEntityId]);

  useEffect(() => {
    setWizardOpen(false);
    setWizardStep(0);
    setWizardError("");
    setPreviewLoadedForVersionId("");
  }, [templateVersionId]);

  async function refreshCurrentStructure() {
    if (!selectedVersionId) return;
    await loadFullStructure(selectedVersionId);
    setPreviewLoadedForVersionId(selectedVersionId);
  }

  useEffect(() => {
    const versionId = toNullableNumber(selectedVersionId);
    if (!versionId || !previewPeriodId) {
      setRenderPreviewResult(null);
      setRenderPreviewError("");
      setRenderPreviewBusy(false);
      setRenderPreviewLoadingMore(false);
      setRenderPreviewCursor(null);
      setRenderPreviewHasMore(false);
      return;
    }

    let disposed = false;

    async function loadRenderPreviewData() {
      setRenderPreviewBusy(true);
      setRenderPreviewError("");
      setRenderPreviewLoadingMore(false);
      setRenderPreviewCursor(null);
      setRenderPreviewHasMore(false);
      renderPreviewCanAutoLoadRef.current = true;
      try {
        const response = await previewTemplateVersion({
          businessLocationId: previewLocationId,
          periodId: previewPeriodId!,
          templateVersionId: versionId!,
          rulesetId: PREVIEW_DEFAULT_RULESET_ID,
          batchSize: PREVIEW_BATCH_SIZE,
        });

        if (!disposed) {
          setRenderPreviewResult({
            summary: response.summary,
            rows: { items: response.rows.items },
            columns: response.columns,
            sections: response.sections,
            footerRows: response.footerRows,
          } as Record<string, unknown>);
          setRenderPreviewCursor(response.rows.nextCursor ?? null);
          setRenderPreviewHasMore(
            response.rows.hasMore && !!response.rows.nextCursor,
          );
        }
      } catch (error) {
        if (!disposed) {
          setRenderPreviewResult(null);
          setRenderPreviewCursor(null);
          setRenderPreviewHasMore(false);
          setRenderPreviewError(
            error instanceof Error
              ? error.message
              : "Không tải được dữ liệu preview.",
          );
        }
      } finally {
        if (!disposed) setRenderPreviewBusy(false);
      }
    }

    void loadRenderPreviewData();

    return () => {
      disposed = true;
    };
  }, [previewLocationId, previewPeriodId, selectedVersionId]);

  const loadMoreRenderPreviewRows = useCallback(async () => {
    const versionId = toNullableNumber(selectedVersionId);
    if (
      !versionId ||
      !previewPeriodId ||
      !renderPreviewHasMore ||
      !renderPreviewCursor
    )
      return;
    if (renderPreviewBusy || renderPreviewLoadingMore) return;

    setRenderPreviewLoadingMore(true);
    try {
      const response = await previewTemplateVersion({
        businessLocationId: previewLocationId,
        periodId: previewPeriodId,
        templateVersionId: versionId,
        rulesetId: PREVIEW_DEFAULT_RULESET_ID,
        batchSize: PREVIEW_BATCH_SIZE,
        cursor: renderPreviewCursor,
      });

      const nextRows = response.rows;

      setRenderPreviewResult((prev) => {
        const root = asRecord(prev) ?? {};
        const rowsRecord = asRecord(root.rows) ?? {};
        const currentItems = asArray(rowsRecord.items);
        const seen = new Set(
          currentItems.map((row) => buildPreviewRowDedupKey(row)),
        );
        const uniqueIncoming = nextRows.items.filter((row) => {
          const key = buildPreviewRowDedupKey(row);
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });

        return {
          ...root,
          rows: {
            ...rowsRecord,
            items: [...currentItems, ...uniqueIncoming],
          },
        };
      });

      const cursorLoop =
        !!nextRows.nextCursor && nextRows.nextCursor === renderPreviewCursor;
      if (!nextRows.hasMore || cursorLoop || !nextRows.nextCursor) {
        setRenderPreviewCursor(null);
        setRenderPreviewHasMore(false);
      } else {
        setRenderPreviewCursor(nextRows.nextCursor);
        setRenderPreviewHasMore(true);
      }
    } catch (error) {
      setRenderPreviewError(
        error instanceof Error
          ? error.message
          : "Không tải thêm được dữ liệu preview.",
      );
      setRenderPreviewHasMore(false);
      setRenderPreviewCursor(null);
    } finally {
      setRenderPreviewLoadingMore(false);
    }
  }, [
    previewLocationId,
    previewPeriodId,
    selectedVersionId,
    renderPreviewHasMore,
    renderPreviewCursor,
    renderPreviewBusy,
    renderPreviewLoadingMore,
  ]);

  useEffect(() => {
    const refs = [
      renderPreviewLoaderMainRef.current,
      renderPreviewLoaderWizardRef.current,
    ].filter((item): item is HTMLDivElement => Boolean(item));

    if (refs.length === 0 || !renderPreviewHasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some((entry) => entry.isIntersecting);

        if (!anyVisible) {
          renderPreviewCanAutoLoadRef.current = true;
          return;
        }

        if (
          renderPreviewCanAutoLoadRef.current &&
          !renderPreviewBusy &&
          !renderPreviewLoadingMore &&
          renderPreviewHasMore
        ) {
          renderPreviewCanAutoLoadRef.current = false;
          void loadMoreRenderPreviewRows();
        }
      },
      { threshold: 0.1 },
    );

    refs.forEach((refElement) => observer.observe(refElement));
    return () => observer.disconnect();
  }, [
    loadMoreRenderPreviewRows,
    renderPreviewBusy,
    renderPreviewHasMore,
    renderPreviewLoadingMore,
  ]);

  useEffect(() => {
    let disposed = false;

    async function loadPreviewLocations() {
      setPreviewLocationsBusy(true);
      setPreviewLocationsError("");
      try {
        const locationsResponse = await getLocations();
        const locations = locationsResponse.data ?? [];
        if (!disposed) {
          setPreviewLocations(locations);
        }
      } catch (error) {
        if (!disposed) {
          setPreviewLocationsError(
            error instanceof Error
              ? error.message
              : "Không tải được danh sách chi nhánh.",
          );
        }
      } finally {
        if (!disposed) setPreviewLocationsBusy(false);
      }
    }

    void loadPreviewLocations();

    return () => {
      disposed = true;
    };
  }, []);

  useEffect(() => {
    const versionId = toNullableNumber(selectedVersionId);
    if (!versionId) {
      setPreviewPeriods([]);
      setPreviewPeriodId(PREVIEW_DEFAULT_PERIOD_ID);
      setPreviewPeriodsError("");
      setPreviewPeriodsBusy(false);
      return;
    }

    let disposed = false;

    async function loadPreviewPeriods() {
      setPreviewPeriodsBusy(true);
      setPreviewPeriodsError("");
      try {
        const periodsResponse = await getAccountingPeriods(previewLocationId);
        const periods = periodsResponse.data ?? [];
        const sortedPeriods = [...periods].sort(
          (a, b) => b.periodId - a.periodId,
        );
        if (!disposed) {
          setPreviewPeriods(sortedPeriods);
          setPreviewPeriodId((current) => {
            if (
              current &&
              sortedPeriods.some((item) => item.periodId === current)
            ) {
              return current;
            }
            if (
              sortedPeriods.some(
                (item) => item.periodId === PREVIEW_DEFAULT_PERIOD_ID,
              )
            ) {
              return PREVIEW_DEFAULT_PERIOD_ID;
            }
            return sortedPeriods[0]?.periodId ?? null;
          });
        }
      } catch (error) {
        if (!disposed) {
          setPreviewPeriods([]);
          setPreviewPeriodsError(
            error instanceof Error
              ? error.message
              : "Không tải được danh sách kỳ kế toán.",
          );
        }
      } finally {
        if (!disposed) setPreviewPeriodsBusy(false);
      }
    }

    void loadPreviewPeriods();

    return () => {
      disposed = true;
    };
  }, [selectedVersionId, previewLocationId]);

  useEffect(() => {
    if (!wizardOpen || wizardStep !== 3 || !selectedVersionId) return;
    if (previewLoadedForVersionId === selectedVersionId) return;

    let disposed = false;

    async function loadPreviewStructure() {
      setWizardLoading(true);
      setWizardError("");
      try {
        await loadFullStructure(selectedVersionId);
        if (!disposed) {
          setPreviewLoadedForVersionId(selectedVersionId);
        }
      } catch (error) {
        if (!disposed) {
          setWizardError(
            error instanceof Error
              ? error.message
              : "Không tải được preview full structure.",
          );
        }
      } finally {
        if (!disposed) setWizardLoading(false);
      }
    }

    void loadPreviewStructure();

    return () => {
      disposed = true;
    };
  }, [
    loadFullStructure,
    previewLoadedForVersionId,
    selectedVersionId,
    wizardOpen,
    wizardStep,
  ]);

  async function handleCreateTemplate() {
    setCreateTemplateBusy(true);
    setCreateTemplateError("");

    try {
      const templateCode = createTemplateForm.templateCode.trim();
      const name = createTemplateForm.name.trim();
      if (!templateCode) {
        throw new Error("Template Code không được để trống.");
      }
      if (!name) {
        throw new Error("Template Name không được để trống.");
      }

      const applicableGroups = parseGroupNumbers(
        createTemplateForm.applicableGroups,
      );
      if (applicableGroups.length === 0) {
        throw new Error("Applicable Groups phải có ít nhất 1 số nguyên dương.");
      }

      const applicableMethods = parseCsvStrings(
        createTemplateForm.applicableMethods,
      );

      const payload: CreateTemplateRequest = {
        templateCode,
        name,
        description: createTemplateForm.description.trim() || undefined,
        applicableGroups,
        applicableMethods:
          applicableMethods.length > 0 ? applicableMethods : null,
        dataSourceType:
          createTemplateForm.dataSourceType as CreateTemplateRequest["dataSourceType"],
        initialVersionLabel:
          createTemplateForm.initialVersionLabel.trim() || undefined,
      };

      const createdVersionId = await props.onCreateTemplate(payload);
      if (createdVersionId) {
        setCreateTemplateForm((prev) => ({
          ...prev,
          templateCode: "",
          name: "",
          description: "",
          initialVersionLabel: "v1-draft",
        }));
      }
      setCreateTemplateModalOpen(false);
    } catch (error) {
      setCreateTemplateError(
        error instanceof Error ? error.message : "Không tạo được template.",
      );
    } finally {
      setCreateTemplateBusy(false);
    }
  }

  async function handleCreateVersion() {
    setCreateVersionBusy(true);
    setCreateVersionError("");

    try {
      const templateId = Number(createVersionForm.templateId);
      if (!Number.isInteger(templateId) || templateId <= 0) {
        throw new Error("Vui lòng chọn Template để tạo version.");
      }

      const versionLabel = createVersionForm.versionLabel.trim();
      if (!versionLabel) {
        throw new Error("Version Label không được để trống.");
      }

      const effectiveFrom = createVersionForm.effectiveFrom.trim();
      if (!effectiveFrom) {
        throw new Error("Hiệu lực từ không được để trống.");
      }

      const payload: CreateTemplateVersionRequest = {
        versionLabel,
        effectiveFrom,
        changeNotes: createVersionForm.changeNotes.trim() || undefined,
      };

      const createdVersionId = await props.onCreateVersion(templateId, payload);
      if (createdVersionId) {
        setCreateVersionForm((prev) => ({
          ...prev,
          versionLabel: "",
          effectiveFrom: "",
          changeNotes: "",
        }));
      }
      setCreateVersionModalOpen(false);
    } catch (error) {
      setCreateVersionError(
        error instanceof Error
          ? error.message
          : "Không tạo được draft version.",
      );
    } finally {
      setCreateVersionBusy(false);
    }
  }

  async function handleCloneAndOpenFlow() {
    setWizardBusy(true);
    setWizardError("");
    try {
      await props.onClone();
      setWizardStep(0);
      setWizardOpen(true);
    } catch (error) {
      setWizardError(
        error instanceof Error ? error.message : "Clone thất bại.",
      );
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleSaveTemplateMetadata() {
    if (!props.tvEffective.trim()) {
      setWizardError("Hiệu lực từ không được để trống.");
      return;
    }

    setWizardBusy(true);
    setWizardError("");
    try {
      await props.onUpdate();
    } catch (error) {
      setWizardError(
        error instanceof Error ? error.message : "Lưu template thất bại.",
      );
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleSaveMapping() {
    const mappingId = toNullableNumber(mappingDraft.mappingId);
    if (!mappingId) return;
    setWizardBusy(true);
    setWizardError("");
    try {
      const sourceType =
        mappingDraft.sourceType.trim().toLowerCase() || "query";
      const sortOrder = Number(mappingDraft.sortOrder || 0);
      const payload: {
        fieldLabel?: string;
        fieldType?: string;
        sourceType: string;
        sourceEntityId?: number;
        sourceFieldId?: number;
        filterJson?: string;
        aggregationType?: string;
        formulaId?: number;
        formulaExpression?: string;
        sortOrder: number;
      } = {
        fieldLabel: mappingDraft.fieldLabel.trim() || undefined,
        fieldType: mappingDraft.fieldType.trim() || undefined,
        sourceType,
        sourceEntityId: toNullableNumber(mappingDraft.sourceEntityId),
        sourceFieldId: toNullableNumber(mappingDraft.sourceFieldId),
        filterJson: mappingDraft.filterJson.trim() || undefined,
        aggregationType: mappingDraft.aggregationType.trim() || undefined,
        formulaId: toNullableNumber(mappingDraft.formulaId),
        formulaExpression: mappingDraft.formulaExpression.trim() || undefined,
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
      };

      await updateFieldMappingForTesting(mappingId, payload);
      await refreshCurrentStructure();
    } catch (error) {
      setWizardError(
        error instanceof Error ? error.message : "Lưu mapping thất bại.",
      );
    } finally {
      setWizardBusy(false);
    }
  }

  function toggleRowVisibleFieldCode(fieldCode: string) {
    setRowDraft((prev) => {
      const selected = new Set(parseVisibleFieldCodes(prev.visibleFieldCodes));
      if (selected.has(fieldCode)) {
        selected.delete(fieldCode);
      } else {
        selected.add(fieldCode);
      }
      return {
        ...prev,
        visibleFieldCodes: JSON.stringify(Array.from(selected)),
      };
    });
  }

  async function handleSaveRow() {
    const rowDefId = toNullableNumber(rowDraft.rowDefId);
    if (!rowDefId) return;
    setWizardBusy(true);
    setWizardError("");
    try {
      await updateRowDefinition(rowDefId, {
        rowType: rowDraft.rowType,
        rowLabel: rowDraft.rowLabel.trim() || null,
        position: rowDraft.position,
        sortOrder: Number(rowDraft.sortOrder || 100),
        sectionType: rowDraft.sectionType.trim() || null,
        sectionFilterValue: rowDraft.sectionFilterValue.trim() || null,
        groupByField: rowDraft.groupByField.trim() || null,
        formulaId: toNullableNumber(rowDraft.formulaId) ?? null,
        taxType: rowDraft.taxType.trim() || null,
        visibleFieldCodes: rowDraft.visibleFieldCodes.trim() || null,
      });
      await refreshCurrentStructure();
    } catch (error) {
      setWizardError(
        error instanceof Error ? error.message : "Lưu row definition thất bại.",
      );
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleSaveFormula() {
    const formulaId = toNullableNumber(formulaDraft.formulaId);
    if (!formulaId) return;
    setWizardBusy(true);
    setWizardError("");
    try {
      await updateFormulaTesting(formulaId, {
        code: formulaDraft.code.trim() || undefined,
        name: formulaDraft.name.trim() || undefined,
        description: formulaDraft.description.trim() || undefined,
        formulaType: formulaDraft.formulaType.trim() || undefined,
        expressionJson: formulaDraft.expressionJson.trim() || undefined,
        isActive: formulaDraft.isActive === "true",
      });
      const refreshed = await getFormulaDetail(formulaId);
      setLinkedFormulas((prev) =>
        prev.map((formula) =>
          asNumber(formula.formulaId) === formulaId ? refreshed : formula,
        ),
      );
    } catch (error) {
      setWizardError(
        error instanceof Error ? error.message : "Lưu formula thất bại.",
      );
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleRunTrace() {
    if (!selectedFormulaId) return;
    setTraceBusy(true);
    setTraceError("");
    setTraceResult(null);
    try {
      const res = await runAccountingTrace({
        formulaId: selectedFormulaId,
        businessLocationId: Number(traceLocationId) || 6,
        periodId: Number(tracePeriodId) || 0,
        rulesetId: Number(traceRulesetId) || 1,
        businessTypeIds: traceBusinessTypeIds
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setTraceResult((res as Record<string, unknown>) ?? null);
    } catch (err) {
      setTraceError(err instanceof Error ? err.message : "Lỗi khi chạy trace");
    } finally {
      setTraceBusy(false);
    }
  }

  async function handleCloneFormulaForDraft() {
    const formulaId = toNullableNumber(formulaDraft.formulaId);
    if (!formulaId) return;
    setWizardBusy(true);
    setWizardError("");
    try {
      const cloned = await cloneFormula(formulaId, { nameSuffix: " (draft)" });
      const newFormulaId = asNumber(cloned.formulaId);
      if (!newFormulaId) throw new Error("Không lấy được formula clone mới.");

      await Promise.all([
        ...fieldMappings
          .filter((mapping) => asNumber(mapping.formulaId) === formulaId)
          .map((mapping) =>
            updateFieldMappingForTesting(
              asNumber(mapping.mappingId) ?? 0,
              buildFieldMappingPatch(mapping, newFormulaId),
            ),
          ),
        ...rowDefinitions
          .filter((row) => asNumber(row.formulaId) === formulaId)
          .map((row) =>
            updateRowDefinition(
              asNumber(row.rowDefId) ?? 0,
              buildRowDefinitionPatch(row, newFormulaId),
            ),
          ),
      ]);

      await refreshCurrentStructure();
      const refreshedFormulas = await Promise.all(
        Array.from(
          new Set([
            ...linkedFormulaIds.filter((id) => id !== formulaId),
            newFormulaId,
          ]),
        ).map((id) => getFormulaDetail(id)),
      );
      setLinkedFormulas(refreshedFormulas);
      setSelectedFormulaId(newFormulaId);
    } catch (error) {
      setWizardError(
        error instanceof Error
          ? error.message
          : "Clone formula cho draft thất bại.",
      );
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleSaveEntity() {
    const entityId = toNullableNumber(entityDraft.entityId);
    if (!entityId) return;
    setWizardBusy(true);
    setWizardError("");
    try {
      await updateMappableEntity(entityId, {
        displayName: entityDraft.displayName.trim() || undefined,
        description: entityDraft.description.trim() || undefined,
      });
      const refreshed = await getMappableEntityDetail(entityId);
      setLinkedEntities((prev) =>
        prev.map((entity) =>
          asNumber(entity.entityId) === entityId ? refreshed : entity,
        ),
      );
    } catch (error) {
      setWizardError(
        error instanceof Error ? error.message : "Lưu entity thất bại.",
      );
    } finally {
      setWizardBusy(false);
    }
  }

  async function handleActivateDraft() {
    if (isConsultantMode) {
      setWizardError(
        "Consultant không có quyền activate draft. Vui lòng gửi Admin duyệt.",
      );
      return;
    }

    setWizardBusy(true);
    setWizardError("");
    try {
      await props.onActivate();
      await refreshCurrentStructure();
      setWizardOpen(false);
    } catch (error) {
      setWizardError(
        error instanceof Error ? error.message : "Kích hoạt draft thất bại.",
      );
    } finally {
      setWizardBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-medium text-gray-700">Chọn phiên bản:</p>
            <select
              value={props.tvId}
              onChange={(e) => {
                const nextId = e.target.value;
                props.setTvId(nextId);
                if (nextId) {
                  void loadDetail(nextId);
                }
              }}
              className="min-w-72 rounded-lg border px-3 py-2 text-sm"
            >
              <option value="">— Chọn template version —</option>
              {props.versionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCreateTemplateError("");
                setCreateTemplateModalOpen(true);
              }}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Tạo template mới
            </Button>
            <Button
              size="sm"
              className={PRIMARY}
              onClick={() => {
                setCreateVersionError("");
                setCreateVersionModalOpen(true);
              }}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              Tạo draft version
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Confirm delete dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa phiên bản</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa phiên bản draft này không? Hành động này
              không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDeleteOpen(false);
                void props.onDelete();
              }}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createTemplateModalOpen}
        onOpenChange={(open) => {
          setCreateTemplateModalOpen(open);
          if (!open) setCreateTemplateError("");
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo template mới</DialogTitle>
            <DialogDescription>
              Tạo accounting template và draft version đầu tiên.
            </DialogDescription>
          </DialogHeader>

          {createTemplateError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {createTemplateError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Mã template (VD: S1A)
              </label>
              <input
                value={createTemplateForm.templateCode}
                onChange={(e) =>
                  setCreateTemplateForm((prev) => ({
                    ...prev,
                    templateCode: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Tên template
              </label>
              <input
                value={createTemplateForm.name}
                onChange={(e) =>
                  setCreateTemplateForm((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Nhóm áp dụng (VD: 1,2)
              </label>
              <select
                value={createTemplateForm.applicableGroups}
                onChange={(e) =>
                  setCreateTemplateForm((prev) => ({
                    ...prev,
                    applicableGroups: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="1">Nhóm 1</option>
                <option value="2">Nhóm 2</option>
                <option value="3">Nhóm 3</option>
                <option value="4">Nhóm 4</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Phương pháp kế toán áp dụng
              </label>
              {/* //dùng select ở đây để có được value */}
              <select
                value={createTemplateForm.applicableMethods}
                onChange={(e) =>
                  setCreateTemplateForm((prev) => ({
                    ...prev,
                    applicableMethods: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="">Miễn Thuế</option>
                <option value="method_1">Tính theo cách 1</option>
                <option value="method_2">Tính theo cách 2</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Loại dữ liệu nguồn
              </label>
              <select
                value={createTemplateForm.dataSourceType}
                onChange={(e) =>
                  setCreateTemplateForm((prev) => ({
                    ...prev,
                    dataSourceType: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="revenues">revenues - Doanh thu</option>
                <option value="revenue_cost">
                  revenue_cost - Chi phí doanh thu
                </option>
                <option value="gl_entries">
                  gl_entries - Bút toán kế toán
                </option>
                <option value="stock_movements">
                  stock_movements - Di chuyển hàng tồn kho
                </option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Label phiên bản đầu tiên (VD: v1-draft)
              </label>
              <input
                value={createTemplateForm.initialVersionLabel}
                onChange={(e) =>
                  setCreateTemplateForm((prev) => ({
                    ...prev,
                    initialVersionLabel: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">Mô tả</label>
            <textarea
              value={createTemplateForm.description}
              onChange={(e) =>
                setCreateTemplateForm((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateTemplateModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className={PRIMARY}
              onClick={() => void handleCreateTemplate()}
              disabled={createTemplateBusy}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {createTemplateBusy ? "Đang tạo..." : "Tạo template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={createVersionModalOpen}
        onOpenChange={(open) => {
          setCreateVersionModalOpen(open);
          if (!open) setCreateVersionError("");
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tạo draft version mới</DialogTitle>
            <DialogDescription>
              Tạo blank draft cho một template đã có.
            </DialogDescription>
          </DialogHeader>

          {createVersionError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {createVersionError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Chọn template
              </label>
              <select
                value={createVersionForm.templateId}
                onChange={(e) =>
                  setCreateVersionForm((prev) => ({
                    ...prev,
                    templateId: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              >
                <option value="">Chọn template</option>
                {props.templateOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Label phiên bản (VD: v2-draft)
              </label>
              <input
                value={createVersionForm.versionLabel}
                onChange={(e) =>
                  setCreateVersionForm((prev) => ({
                    ...prev,
                    versionLabel: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">
                Hiệu lực từ
              </label>
              <input
                type="date"
                value={createVersionForm.effectiveFrom}
                onChange={(e) =>
                  setCreateVersionForm((prev) => ({
                    ...prev,
                    effectiveFrom: e.target.value,
                  }))
                }
                className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-600">
              Ghi chú thay đổi
            </label>
            <textarea
              value={createVersionForm.changeNotes}
              onChange={(e) =>
                setCreateVersionForm((prev) => ({
                  ...prev,
                  changeNotes: e.target.value,
                }))
              }
              rows={3}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCreateVersionModalOpen(false)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              className={PRIMARY}
              onClick={() => void handleCreateVersion()}
              disabled={createVersionBusy}
            >
              <Save className="mr-1.5 h-3.5 w-3.5" />
              {createVersionBusy ? "Đang tạo..." : "Tạo draft version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {!hasResult ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              Chọn một template version để xem cấu trúc trực quan của template.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {hasResult ? (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b bg-linear-to-r from-cyan-50/70 to-white p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      {templateCode || "—"}
                    </h2>
                    <span className="text-lg text-gray-400">·</span>
                    <span className="text-base font-medium text-gray-700">
                      {versionLabel || "—"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {templateName || "Chưa có tên template"}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={
                    isActive
                      ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                      : "bg-amber-50 text-amber-700 hover:bg-amber-50"
                  }
                >
                  {isActive ? (
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                  ) : (
                    <XCircle className="mr-1 h-3.5 w-3.5" />
                  )}
                  {isActive ? "Đang hoạt động" : "Bản nháp (Draft)"}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 p-5 md:grid-cols-4">
                <MetricCard
                  label="Version ID"
                  value={templateVersionId ?? "—"}
                  icon={FileText}
                />
                <MetricCard
                  label="Template"
                  value={templateCode ?? "—"}
                  icon={Layers}
                />
                <MetricCard
                  label="Field Mappings"
                  value={mappingCount}
                  icon={Activity}
                />
                <MetricCard
                  label="Row Definitions"
                  value={rowCount}
                  icon={Layers}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 border-t px-5 py-4 md:grid-cols-2">
                <div>
                  <p className="text-xs text-gray-500">Hiệu lực từ</p>
                  <p className="mt-0.5 inline-flex items-center text-sm font-medium text-gray-800">
                    <CalendarDays className="mr-1.5 h-4 w-4 text-[#15918f]" />
                    {formatDate(effectiveFrom)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Ghi chú thay đổi</p>
                  <p className="mt-0.5 text-sm text-gray-700">
                    {changeNotes || "Không có ghi chú."}
                  </p>
                </div>
              </div>

              <div className="border-t px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Công thức được sử dụng trong template version này
                  </p>
                  {templateVersionFormulasBusy ? (
                    <span className="text-xs text-gray-500">Đang tải...</span>
                  ) : null}
                </div>

                {templateVersionFormulasError ? (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                    {templateVersionFormulasError}
                  </div>
                ) : null}

                {!templateVersionFormulasBusy &&
                templateVersionFormulaItems.length === 0 ? (
                  <p className="mt-3 text-sm text-gray-500">
                    Chưa có formula nào được gắn cho template version này.
                  </p>
                ) : null}

                {templateVersionFormulaItems.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {templateVersionFormulaItems.map((formula) => (
                      <div
                        key={String(formula.formulaId ?? formula.code)}
                        className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {formula.code || "—"}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-600">
                              {formula.name || "Không có tên formula"}
                            </p>
                          </div>
                          <Badge
                            variant="secondary"
                            className={
                              formula.isActive
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                            }
                          >
                            {formula.formulaType || "Formula"}
                          </Badge>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {formula.usedByFieldCodes.length > 0 ? (
                            formula.usedByFieldCodes.map((fieldCode) => (
                              <span
                                key={`${formula.code}-${fieldCode}`}
                                className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700"
                              >
                                {fieldCode}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">
                              Chưa gắn field code
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Flow chỉnh sửa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isActiveVersion ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="mt-0.5 h-5 w-5 text-emerald-600" />
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium text-emerald-800">
                        Version active không được sửa trực tiếp.
                      </p>
                      <p className="text-xs text-emerald-700">
                        Yêu cầu phải tạo bản draft mới để chỉnh sửa.
                      </p>
                      <Button
                        size="sm"
                        className={PRIMARY}
                        onClick={() => void handleCloneAndOpenFlow()}
                        disabled={wizardBusy}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Tạo bản sao
                      </Button>
                      {!isConsultantMode ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={async () => {
                            if (
                              !confirm(
                                "Bạn có chắc muốn vô hiệu hóa phiên bản này?",
                              )
                            )
                              return;
                            setDeactivateError("");
                            setDeactivateBusy(true);
                            try {
                              await props.onDeactivate();
                            } catch (err: unknown) {
                              setDeactivateError(
                                err instanceof Error
                                  ? err.message
                                  : "Lỗi khi deactivate",
                              );
                            } finally {
                              setDeactivateBusy(false);
                            }
                          }}
                          disabled={deactivateBusy}
                          className="ml-2 bg-red-600 text-white hover:bg-red-700"
                        >
                          <Power className="mr-1.5 h-3.5 w-3.5" />
                          Vô hiệu hóa phiên bản
                        </Button>
                      ) : null}
                      {deactivateError ? (
                        <div className="mt-2 text-sm text-red-600">
                          {deactivateError}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {isDraft ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <Pencil className="mt-0.5 h-5 w-5 text-amber-600" />
                    <div className="flex-1 space-y-3">
                      <p className="text-sm font-medium text-amber-800">
                        {isConsultantMode
                          ? "Đây là draft. Bạn có thể chỉnh sửa và hoàn thiện template trước khi gửi Admin duyệt."
                          : "Đây là draft. Bạn có thể chỉnh sửa toàn bộ phụ thuộc theo flow step trước khi kích hoạt."}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          className={PRIMARY}
                          onClick={() => {
                            setWizardStep(0);
                            setWizardOpen(true);
                          }}
                        >
                          <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
                          Mở flow chỉnh sửa
                        </Button>
                        {!isConsultantMode ? (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => setConfirmDeleteOpen(true)}
                          >
                            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                            Xóa draft
                          </Button>
                        ) : (
                          <Badge className="border border-amber-300 bg-white text-amber-700 hover:bg-white">
                            Chờ Admin duyệt để publish
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {wizardError ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {wizardError}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Sổ mẫu</CardTitle>
            </CardHeader>
            <CardContent>
              {sampleBookColumns.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                  Chưa có dữ liệu cột để dựng sổ mẫu.
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Chi nhánh
                      </label>
                      <select
                        value={previewLocationId}
                        onChange={(event) => {
                          const next = Number(event.target.value);
                          if (Number.isFinite(next) && next > 0) {
                            setPreviewLocationId(next);
                          }
                        }}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        disabled={previewLocationsBusy}
                      >
                        {previewLocations.length === 0 ? (
                          <option value={previewLocationId}>
                            #{previewLocationId}
                          </option>
                        ) : null}
                        {previewLocations.map((loc) => (
                          <option key={loc.id} value={loc.id}>
                            #{loc.id} - {loc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Kỳ kế toán
                      </label>
                      <select
                        value={previewPeriodId ?? ""}
                        onChange={(event) => {
                          const nextPeriodId = Number(event.target.value);
                          setPreviewPeriodId(
                            Number.isFinite(nextPeriodId) && nextPeriodId > 0
                              ? nextPeriodId
                              : null,
                          );
                        }}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                        disabled={
                          previewPeriodsBusy || previewPeriods.length === 0
                        }
                      >
                        {previewPeriods.length === 0 ? (
                          <option value="">Không có kỳ kế toán</option>
                        ) : null}
                        {previewPeriods.map((period) => (
                          <option key={period.periodId} value={period.periodId}>
                            {formatAccountingPeriodLabel(period)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {previewLocationsError ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                      {previewLocationsError}
                    </div>
                  ) : null}
                  {previewPeriodsError ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                      {previewPeriodsError}
                    </div>
                  ) : null}
                  {renderPreviewBusy ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      Đang tải preview data...
                    </div>
                  ) : null}
                  {renderPreviewError ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                      {renderPreviewError}
                    </div>
                  ) : null}
                  <BookTemplatePreview
                    templateCode={templateCode}
                    templateName={templateName}
                    versionLabel={versionLabel}
                    columns={sampleBookColumns}
                    rows={
                      isSectionsOnlyTemplate(templateCode)
                        ? hasSectionRows
                          ? renderPreviewSectionRows
                          : sampleBookRows
                        : shouldPrioritizeSectionRows && hasSectionRows
                          ? renderPreviewSectionRows
                          : renderPreviewRows.length > 0
                            ? renderPreviewRows
                            : hasSectionRows
                              ? renderPreviewSectionRows
                              : sampleBookRows
                    }
                    rowDefinitions={enrichedRowDefinitions}
                    sectionsMeta={renderPreviewSectionsMeta}
                    referenceData={previewReferenceData}
                    summaryMeta={
                      renderPreviewSummaryMeta ?? asRecord(result?.summary)
                    }
                  />

                  {renderPreviewHasMore ? (
                    <div
                      ref={renderPreviewLoaderMainRef}
                      className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-xs text-gray-500"
                    >
                      {renderPreviewLoadingMore
                        ? "Đang tải thêm rows..."
                        : "Cuộn xuống để tải thêm rows"}
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Chỉnh sửa nhanh</DialogTitle>
          </DialogHeader>

          <div className="border-b px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-2">
                {wizardSteps.map((step, index) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setWizardStep(index)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                      wizardStep === index
                        ? "bg-[#23C4C1] text-white"
                        : index < wizardStep
                          ? "bg-[#23C4C1]/10 text-[#15918f]"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {index + 1}. {step}
                  </button>
                ))}
              </div>
              {!isConsultantMode ? (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 whitespace-nowrap"
                  onClick={() => void handleActivateDraft()}
                  disabled={wizardBusy}
                >
                  <Sparkles className="mr-1.5 h-4 w-4" />
                  Kích hoạt
                </Button>
              ) : null}
            </div>
          </div>

          <div className="max-h-[65vh] overflow-auto px-6 py-5">
            {wizardLoading ? (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center text-sm text-gray-500">
                Đang tải dữ liệu liên quan của draft...
              </div>
            ) : null}

            {wizardError ? (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {wizardError}
              </div>
            ) : null}

            {!wizardLoading && wizardStep === 0 ? (
              <div className="space-y-4">
                <div className="rounded-xl border bg-linear-to-r from-cyan-50 to-white p-4">
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Thông tin mẫu sổ
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-gray-900">
                    {templateCode || "Template"} · {versionLabel || "Draft"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Chỉnh thông tin nhận diện của draft trước khi đi tiếp các
                    phụ thuộc.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Nhãn phiên bản
                    </label>
                    <input
                      value={props.tvLabel}
                      onChange={(e) => props.setTvLabel(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Hiệu lực từ
                    </label>
                    <input
                      value={props.tvEffective}
                      onChange={(e) => props.setTvEffective(e.target.value)}
                      type="date"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Ghi chú thay đổi
                  </label>
                  <textarea
                    value={props.tvNotes}
                    onChange={(e) => props.setTvNotes(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                  />
                </div>
                <div className="flex justify-end">
                  <Button
                    className={PRIMARY}
                    onClick={() => void handleSaveTemplateMetadata()}
                    disabled={wizardBusy}
                  >
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                    Lưu bản draft
                  </Button>
                </div>
              </div>
            ) : null}

            {!wizardLoading && wizardStep === 1 ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Field mappings của bản sửa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[48vh] overflow-auto">
                    <div className="space-y-2">
                      {fieldMappings.map((mapping) => {
                        const mappingId = asNumber(mapping.mappingId);
                        const isSelected = mappingId === selectedMappingId;
                        return (
                          <button
                            key={String(mapping.mappingId)}
                            type="button"
                            onClick={() => setSelectedMappingId(mappingId)}
                            className={`w-full cursor-pointer rounded-lg border p-3 text-left transition ${
                              isSelected
                                ? "border-[#23C4C1] bg-[#23C4C1]/5"
                                : "border-gray-200 hover:border-[#23C4C1]/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-mono text-xs text-gray-700">
                                {asString(mapping.fieldCode)}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {asString(mapping.sourceType) || "—"}
                              </Badge>
                            </div>
                            <p className="mt-1 text-sm text-gray-900">
                              {asString(mapping.fieldLabel) || "Không có nhãn"}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              Formula #{asNumber(mapping.formulaId) ?? "—"} ·
                              Entity #{asNumber(mapping.sourceEntityId) ?? "—"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sửa mapping được chọn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Mã cột
                      </label>
                      <input
                        value={mappingDraft.fieldCode}
                        readOnly
                        className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Nhãn hiển thị
                      </label>
                      <input
                        value={mappingDraft.fieldLabel}
                        onChange={(e) =>
                          setMappingDraft((prev) => ({
                            ...prev,
                            fieldLabel: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <ReferenceHelpLabel
                        label="Kiểu dữ liệu"
                        items={referenceHelpCatalog.fieldTypes}
                      />
                      <select
                        value={mappingDraft.fieldType}
                        onChange={(e) =>
                          setMappingDraft((prev) => ({
                            ...prev,
                            fieldType: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="">Chọn kiểu dữ liệu</option>
                        {mappingFieldTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <ReferenceHelpLabel
                        label="Nguồn dữ liệu"
                        items={referenceHelpCatalog.sourceTypes}
                      />
                      <select
                        value={mappingDraft.sourceType}
                        onChange={(e) => {
                          const nextSourceType = e.target.value;
                          const isFormula =
                            nextSourceType.trim().toLowerCase() === "formula";
                          setMappingDraft((prev) => ({
                            ...prev,
                            sourceType: nextSourceType,
                            sourceEntityId: isFormula
                              ? ""
                              : prev.sourceEntityId,
                            sourceFieldId: isFormula ? "" : prev.sourceFieldId,
                          }));
                        }}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="">Chọn nguồn dữ liệu</option>
                        {mappingSourceTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Entity ID
                        </label>
                        <select
                          value={mappingDraft.sourceEntityId}
                          onChange={(e) =>
                            setMappingDraft((prev) => ({
                              ...prev,
                              sourceEntityId: e.target.value,
                              sourceFieldId: "",
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          disabled={
                            mappingDraft.sourceType.trim().toLowerCase() ===
                            "formula"
                          }
                        >
                          <option value="">
                            {mappingDraft.sourceType.trim().toLowerCase() ===
                            "formula"
                              ? "formula không dùng entity"
                              : "Chọn entity"}
                          </option>
                          {mappingEntityOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Field ID
                        </label>
                        <select
                          value={mappingDraft.sourceFieldId}
                          onChange={(e) =>
                            setMappingDraft((prev) => ({
                              ...prev,
                              sourceFieldId: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                          disabled={
                            mappingDraft.sourceType.trim().toLowerCase() ===
                              "formula" || !mappingDraft.sourceEntityId
                          }
                        >
                          <option value="">
                            {mappingDraft.sourceType.trim().toLowerCase() ===
                            "formula"
                              ? "formula không dùng field"
                              : "Chọn field"}
                          </option>
                          {mappingEntityFieldOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Formula ID
                      </label>
                      <select
                        value={mappingDraft.formulaId}
                        onChange={(e) =>
                          setMappingDraft((prev) => ({
                            ...prev,
                            formulaId: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="">Chọn formula</option>
                        {mappingFormulaOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <ReferenceHelpLabel
                        label="Kiểu tổng hợp"
                        items={referenceHelpCatalog.aggregateTypes}
                      />
                      <select
                        value={mappingDraft.aggregationType}
                        onChange={(e) =>
                          setMappingDraft((prev) => ({
                            ...prev,
                            aggregationType: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="">Chọn kiểu tổng hợp</option>
                        {mappingAggregationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Thứ tự sắp xếp
                      </label>
                      <input
                        value={mappingDraft.sortOrder}
                        onChange={(e) => {
                          const numericOnly = e.target.value.replace(/\D/g, "");
                          setMappingDraft((prev) => ({
                            ...prev,
                            sortOrder: numericOnly,
                          }));
                        }}
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    {/* <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Filter JSON
                      </label>
                      <textarea
                        value={mappingDraft.filterJson}
                        onChange={(e) =>
                          setMappingDraft((prev) => ({
                            ...prev,
                            filterJson: e.target.value,
                          }))
                        }
                        rows={3}
                        className="w-full rounded-lg border px-3 py-2 font-mono text-xs"
                      />
                    </div> */}
                    <Button
                      className={PRIMARY}
                      onClick={() => void handleSaveMapping()}
                      disabled={wizardBusy || !mappingDraft.mappingId}
                    >
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Lưu mapping
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {!wizardLoading && wizardStep === 2 ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Row definitions của bản sửa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[48vh] overflow-auto">
                    <div className="space-y-2">
                      {rowDefinitions.map((row) => {
                        const rowId = asNumber(row.rowDefId);
                        const isSelected = rowId === selectedRowId;
                        return (
                          <button
                            key={String(row.rowDefId)}
                            type="button"
                            onClick={() => setSelectedRowId(rowId)}
                            className={`w-full cursor-pointer rounded-lg border p-3 text-left transition ${
                              isSelected
                                ? "border-[#23C4C1] bg-[#23C4C1]/5"
                                : "border-gray-200 hover:border-[#23C4C1]/30"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-medium text-gray-900">
                                {asString(row.rowLabel) ||
                                  asString(row.rowType)}
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {asString(row.rowType)}
                              </Badge>
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                              Position {asString(row.position)} · Formula #
                              {asNumber(row.formulaId) ?? "—"}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sửa row được chọn
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Row ID
                      </label>
                      <input
                        value={rowDraft.rowDefId}
                        readOnly
                        className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <ReferenceHelpLabel
                        label="Loại dòng"
                        items={referenceHelpCatalog.rowTypes}
                      />
                      <select
                        value={rowDraft.rowType}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            rowType: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        {rowTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Nhãn dòng
                      </label>
                      <input
                        value={rowDraft.rowLabel}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            rowLabel: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <ReferenceHelpLabel
                          label="Vị trí (Position)"
                          items={referenceHelpCatalog.positions}
                        />
                        <select
                          value={rowDraft.position}
                          disabled
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed opacity-60"
                        >
                          {rowPositionOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Thứ tự
                        </label>
                        <input
                          value={rowDraft.sortOrder}
                          onChange={(e) =>
                            setRowDraft((prev) => ({
                              ...prev,
                              sortOrder: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Formula ID
                      </label>
                      <select
                        value={rowDraft.formulaId}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            formulaId: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="">Chọn formula</option>
                        {mappingFormulaOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <ReferenceHelpLabel
                        label="Section type"
                        items={referenceHelpCatalog.sectionTypes}
                      />
                      <select
                        value={rowDraft.sectionType}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            sectionType: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="">Không chọn section</option>
                        {rowSectionTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Section filter value
                      </label>
                      <input
                        value={rowDraft.sectionFilterValue}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            sectionFilterValue: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Group by field
                      </label>
                      <input
                        value={rowDraft.groupByField}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            groupByField: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <ReferenceHelpLabel
                        label="Tax type"
                        items={referenceHelpCatalog.taxTypes}
                      />
                      <select
                        value={rowDraft.taxType}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            taxType: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      >
                        <option value="">Không chọn tax type</option>
                        {rowTaxTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedRowTaxRateHints.length > 0 ? (
                      <div className="max-h-28 overflow-auto rounded-lg border border-sky-100 bg-sky-50 p-2 text-xs text-sky-700">
                        {selectedRowTaxRateHints.map((item, index) => (
                          <div
                            key={`${item.businessTypeCode}-${item.taxType}-${index}`}
                          >
                            {item.businessTypeCode} - {item.businessTypeName}:{" "}
                            {(item.taxRate * 100).toFixed(2)}%
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Hiển thị trong cột theo thứ tự:
                      </label>
                      <div className="max-h-28 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                        <div className="flex flex-wrap gap-1.5">
                          {rowVisibleFieldOptions.map((option) => {
                            const selected = parseVisibleFieldCodes(
                              rowDraft.visibleFieldCodes,
                            ).includes(option.value);
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() =>
                                  toggleRowVisibleFieldCode(option.value)
                                }
                                className={`rounded-full border px-2 py-1 text-[11px] ${
                                  selected
                                    ? "border-[#23C4C1]/40 bg-[#23C4C1]/10 text-[#15918f]"
                                    : "border-gray-200 bg-white text-gray-600"
                                }`}
                              >
                                {option.value}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Hiển thị trong cột theo thứ tự:
                      </label>
                      <input
                        value={rowDraft.visibleFieldCodes}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            visibleFieldCodes: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <Button
                      className={PRIMARY}
                      onClick={() => void handleSaveRow()}
                      disabled={wizardBusy || !rowDraft.rowDefId}
                    >
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Lưu định nghĩa dòng
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {!wizardLoading && wizardStep === 99 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Linked formulas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[48vh] overflow-auto">
                      {linkedFormulas.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                          Draft này chưa liên kết formula nào.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {linkedFormulas.map((formula) => {
                            const formulaId = asNumber(formula.formulaId);
                            const isSelected = formulaId === selectedFormulaId;
                            const affectedMappings = fieldMappings.filter(
                              (mapping) =>
                                asNumber(mapping.formulaId) === formulaId,
                            ).length;
                            const affectedRows = rowDefinitions.filter(
                              (row) => asNumber(row.formulaId) === formulaId,
                            ).length;
                            return (
                              <button
                                key={String(formula.formulaId)}
                                type="button"
                                onClick={() => setSelectedFormulaId(formulaId)}
                                className={`w-full cursor-pointer rounded-lg border p-3 text-left transition ${
                                  isSelected
                                    ? "border-[#23C4C1] bg-[#23C4C1]/5"
                                    : "border-gray-200 hover:border-[#23C4C1]/30"
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono text-xs text-gray-700">
                                    {asString(formula.code)}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px]"
                                  >
                                    #{formulaId}
                                  </Badge>
                                </div>
                                <p className="mt-1 text-sm text-gray-900">
                                  {asString(formula.name) ||
                                    "Không có tên formula"}
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                  Mapping dùng: {affectedMappings} · Rows dùng:{" "}
                                  {affectedRows}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">
                        Sửa formula được chọn
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Formula code
                        </label>
                        <input
                          value={formulaDraft.code}
                          onChange={(e) =>
                            setFormulaDraft((prev) => ({
                              ...prev,
                              code: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 font-mono text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Formula name
                        </label>
                        <input
                          value={formulaDraft.name}
                          onChange={(e) =>
                            setFormulaDraft((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Description
                        </label>
                        <input
                          value={formulaDraft.description}
                          onChange={(e) =>
                            setFormulaDraft((prev) => ({
                              ...prev,
                              description: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Loại công thức
                        </label>
                        <input
                          value={formulaDraft.formulaType}
                          onChange={(e) =>
                            setFormulaDraft((prev) => ({
                              ...prev,
                              formulaType: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Trạng thái
                        </label>
                        <select
                          value={formulaDraft.isActive}
                          onChange={(e) =>
                            setFormulaDraft((prev) => ({
                              ...prev,
                              isActive: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        >
                          <option value="true">Hiệu Lực</option>
                          <option value="false">Không Hiệu Lực</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-medium text-gray-600">
                          Expression JSON
                        </label>
                        <textarea
                          value={formulaDraft.expressionJson}
                          onChange={(e) =>
                            setFormulaDraft((prev) => ({
                              ...prev,
                              expressionJson: e.target.value,
                            }))
                          }
                          rows={8}
                          className="w-full rounded-lg border px-3 py-2 font-mono text-xs"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          className={PRIMARY}
                          onClick={() => void handleSaveFormula()}
                          disabled={wizardBusy || !formulaDraft.formulaId}
                        >
                          <Save className="mr-1.5 h-3.5 w-3.5" />
                          Lưu formula
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => void handleCloneFormulaForDraft()}
                          disabled={wizardBusy || !formulaDraft.formulaId}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          Clone formula cho draft
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Nếu formula này đang được active version dùng chung, hãy
                        clone rồi thay thế vào draft trước khi sửa sâu.
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-[#23C4C1]" />
                      Trace formula
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!selectedFormulaId ? (
                      <p className="text-sm text-gray-400 italic">
                        Chọn một formula ở trên để chạy trace.
                      </p>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              Formula ID
                            </label>
                            <input
                              value={selectedFormulaId}
                              readOnly
                              className="w-full rounded-lg border bg-gray-50 px-3 py-2 font-mono text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              Location ID
                            </label>
                            <input
                              value={traceLocationId}
                              onChange={(e) =>
                                setTraceLocationId(e.target.value)
                              }
                              className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              Period ID
                            </label>
                            <input
                              value={tracePeriodId}
                              onChange={(e) => setTracePeriodId(e.target.value)}
                              placeholder="ví dụ: 3"
                              className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              Ruleset ID
                            </label>
                            <input
                              value={traceRulesetId}
                              onChange={(e) =>
                                setTraceRulesetId(e.target.value)
                              }
                              className="w-full rounded-lg border px-3 py-2 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs font-medium text-gray-600">
                            Business Type IDs (phân cách bởi dấu phẩy)
                          </label>
                          <input
                            value={traceBusinessTypeIds}
                            onChange={(e) =>
                              setTraceBusinessTypeIds(e.target.value)
                            }
                            placeholder="ví dụ: retail,wholesale (để trống = tất cả)"
                            className="w-full rounded-lg border px-3 py-2 text-sm"
                          />
                        </div>
                        <Button
                          className={PRIMARY}
                          onClick={() => void handleRunTrace()}
                          disabled={traceBusy}
                        >
                          <Activity className="mr-1.5 h-3.5 w-3.5" />
                          {traceBusy ? "Đang chạy..." : "Chạy trace"}
                        </Button>
                        {traceError ? (
                          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                            {traceError}
                          </div>
                        ) : null}
                        {traceResult ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-3 rounded-lg border border-[#23C4C1]/30 bg-[#23C4C1]/5 px-3 py-2">
                              <span className="font-mono text-xs text-gray-600">
                                {String(traceResult.formulaCode ?? "")}
                              </span>
                              <span className="text-sm text-gray-700">
                                {String(traceResult.formulaName ?? "")}
                              </span>
                              <span className="ml-auto font-mono font-bold text-[#23C4C1]">
                                ={" "}
                                {typeof traceResult.finalValue === "number"
                                  ? traceResult.finalValue.toLocaleString(
                                      "vi-VN",
                                    )
                                  : String(traceResult.finalValue ?? "—")}
                              </span>
                            </div>
                            <div className="rounded-lg border bg-white p-2 max-h-96 overflow-auto">
                              {(traceResult.trace as TraceNode[] | null)?.map(
                                (node) => (
                                  <TraceNodeRow
                                    key={node.step}
                                    node={node}
                                    depth={0}
                                  />
                                ),
                              ) ?? (
                                <p className="text-xs text-gray-400 italic p-2">
                                  Không có trace data.
                                </p>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {!wizardLoading && wizardStep === 100 ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Nguồn dữ liệu liên quan
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[48vh] overflow-auto">
                    {linkedEntities.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                        Draft này chưa tham chiếu entity nào.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {linkedEntities.map((entity) => {
                          const entityId = asNumber(entity.entityId);
                          const usedFieldIds = Array.from(
                            linkedFieldIdsByEntity.get(entityId ?? -1) ?? [],
                          );
                          const fields = asArray(entity.fields);
                          const usedFields = fields.filter((field) => {
                            const fieldId = asNumber(field.fieldId);
                            return (
                              fieldId !== null && usedFieldIds.includes(fieldId)
                            );
                          });
                          const isSelected = entityId === selectedEntityId;
                          return (
                            <button
                              key={String(entity.entityId)}
                              type="button"
                              onClick={() => setSelectedEntityId(entityId)}
                              className={`w-full cursor-pointer rounded-lg border p-3 text-left transition ${
                                isSelected
                                  ? "border-[#23C4C1] bg-[#23C4C1]/5"
                                  : "border-gray-200 hover:border-[#23C4C1]/30"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-xs text-gray-700">
                                  {asString(entity.entityCode)}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px]"
                                >
                                  #{entityId}
                                </Badge>
                              </div>
                              <p className="mt-1 text-sm text-gray-900">
                                {asString(entity.displayName) ||
                                  "Không có tên entity"}
                              </p>
                              <p className="mt-2 text-xs text-gray-500">
                                Fields đang dùng:{" "}
                                {usedFields
                                  .map(
                                    (field) =>
                                      asString(field.displayName) ||
                                      asString(field.fieldCode),
                                  )
                                  .join(", ") || "—"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Sửa entity metadata
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Entity code
                      </label>
                      <input
                        value={entityDraft.entityCode}
                        readOnly
                        className="w-full rounded-lg border bg-gray-50 px-3 py-2 font-mono text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Display name
                      </label>
                      <input
                        value={entityDraft.displayName}
                        onChange={(e) =>
                          setEntityDraft((prev) => ({
                            ...prev,
                            displayName: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Description
                      </label>
                      <textarea
                        value={entityDraft.description}
                        onChange={(e) =>
                          setEntityDraft((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={4}
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                      Entity là metadata dùng chung. Chỉ sửa khi bạn muốn cập
                      nhật nhãn hoặc mô tả nguồn dữ liệu cho toàn hệ thống.
                    </div>
                    <Button
                      className={PRIMARY}
                      onClick={() => void handleSaveEntity()}
                      disabled={wizardBusy || !entityDraft.entityId}
                    >
                      <Save className="mr-1.5 h-3.5 w-3.5" />
                      Lưu entity metadata
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {!wizardLoading && wizardStep === 3 ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Xem Lại Mẫu Sổ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {sampleBookColumns.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                        Chưa có dữ liệu cột để dựng sổ mẫu.
                      </div>
                    ) : (
                      <div className="space-y-3 rounded-lg border border-gray-300 bg-white p-4 text-gray-900">
                        <div className="grid grid-cols-1 gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 md:grid-cols-2">
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              Chi nhánh
                            </label>
                            <select
                              value={previewLocationId}
                              onChange={(event) => {
                                const next = Number(event.target.value);
                                if (Number.isFinite(next) && next > 0) {
                                  setPreviewLocationId(next);
                                }
                              }}
                              className="w-full rounded-lg border px-3 py-2 text-sm"
                              disabled={previewLocationsBusy}
                            >
                              {previewLocations.length === 0 ? (
                                <option value={previewLocationId}>
                                  #{previewLocationId}
                                </option>
                              ) : null}
                              {previewLocations.map((loc) => (
                                <option key={loc.id} value={loc.id}>
                                  #{loc.id} - {loc.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="block text-xs font-medium text-gray-600">
                              Kỳ kế toán
                            </label>
                            <select
                              value={previewPeriodId ?? ""}
                              onChange={(event) => {
                                const nextPeriodId = Number(event.target.value);
                                setPreviewPeriodId(
                                  Number.isFinite(nextPeriodId) &&
                                    nextPeriodId > 0
                                    ? nextPeriodId
                                    : null,
                                );
                              }}
                              className="w-full rounded-lg border px-3 py-2 text-sm"
                              disabled={
                                previewPeriodsBusy ||
                                previewPeriods.length === 0
                              }
                            >
                              {previewPeriods.length === 0 ? (
                                <option value="">Không có kỳ kế toán</option>
                              ) : null}
                              {previewPeriods.map((period) => (
                                <option
                                  key={period.periodId}
                                  value={period.periodId}
                                >
                                  {formatAccountingPeriodLabel(period)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        {previewLocationsError ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                            {previewLocationsError}
                          </div>
                        ) : null}
                        {previewPeriodsError ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                            {previewPeriodsError}
                          </div>
                        ) : null}
                        {renderPreviewBusy ? (
                          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                            Đang tải preview data...
                          </div>
                        ) : null}
                        {renderPreviewError ? (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-700">
                            {renderPreviewError}
                          </div>
                        ) : null}

                        <BookTemplatePreview
                          templateCode={templateCode}
                          templateName={templateName}
                          versionLabel={props.tvLabel || versionLabel}
                          columns={sampleBookColumns}
                          rows={
                            shouldPrioritizeSectionRows && hasSectionRows
                              ? renderPreviewSectionRows
                              : renderPreviewRows.length > 0
                                ? renderPreviewRows
                                : hasSectionRows
                                  ? renderPreviewSectionRows
                                  : sampleBookRows
                          }
                          rowDefinitions={enrichedRowDefinitions}
                          sectionsMeta={renderPreviewSectionsMeta}
                          referenceData={previewReferenceData}
                          summaryMeta={
                            renderPreviewSummaryMeta ??
                            asRecord(result?.summary)
                          }
                        />

                        {renderPreviewHasMore ? (
                          <div
                            ref={renderPreviewLoaderWizardRef}
                            className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2 text-xs text-gray-500"
                          >
                            {renderPreviewLoadingMore
                              ? "Đang tải thêm rows..."
                              : "Cuộn xuống để tải thêm rows"}
                          </div>
                        ) : null}

                        {renderPreviewFormulaValues.length > 0 ? (
                          <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                            <table className="w-full min-w-120 border-collapse text-xs">
                              <thead>
                                <tr className="bg-gray-50 text-gray-700">
                                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                                    Formula
                                  </th>
                                  <th className="border border-gray-200 px-2 py-1 text-left font-semibold">
                                    Giá trị
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {renderPreviewFormulaValues.map((formula) => (
                                  <tr key={formula.code}>
                                    <td className="border border-gray-200 px-2 py-1 font-mono">
                                      {formula.code}
                                    </td>
                                    <td className="border border-gray-200 px-2 py-1">
                                      {formula.value == null
                                        ? "-"
                                        : typeof formula.value === "number"
                                          ? formula.value.toLocaleString(
                                              "vi-VN",
                                            )
                                          : String(formula.value)}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </div>
                    )}

                    {/* {!isS2aTemplate ? (
                      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                        <div className="rounded-lg border bg-gray-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Render Preview (BE)
                          </p>
                          <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap rounded border bg-white p-3 text-xs">
                            {reviewRenderPreview || "(Khong co renderPreview)"}
                          </pre>
                        </div>
                        <div className="rounded-lg border bg-gray-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Row Rules (Draft)
                          </p>
                          <div className="mt-2 max-h-40 space-y-2 overflow-auto text-xs text-gray-700">
                            {reviewRows.length === 0 ? (
                              <p>Khong co row definition.</p>
                            ) : (
                              reviewRows.map((row, index) => (
                                <div
                                  key={`rule-${index}`}
                                  className="rounded border bg-white p-2"
                                >
                                  <p>
                                    <span className="font-semibold">
                                      {ROW_TYPE_LABELS[row.rowType] ||
                                        row.rowType ||
                                        "row"}
                                    </span>{" "}
                                    @{" "}
                                    {POSITION_LABELS[row.position] ||
                                      row.position ||
                                      "-"}
                                  </p>
                                  <p>Label: {row.rowLabel || "-"}</p>
                                  <p>
                                    Section:{" "}
                                    {SECTION_TYPE_LABELS[row.sectionType] ||
                                      row.sectionType ||
                                      "-"}
                                  </p>
                                  <p>Visible: {row.visibleFieldCodes || "-"}</p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    ) : null} */}
                  </CardContent>
                </Card>

                {isConsultantMode ? (
                  <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
                    Draft sau khi hoàn thiện sẽ được{" "}
                    <strong>Admin review và activate</strong>. Consultant không
                    publish trực tiếp trên màn này.
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <Button
                      className={PRIMARY}
                      onClick={() => void handleActivateDraft()}
                      disabled={wizardBusy}
                    >
                      <Power className="mr-1.5 h-3.5 w-3.5" />
                      Activate draft này
                    </Button>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className="border-t px-6 py-4 sm:justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setWizardStep((prev) => Math.max(prev - 1, 0))}
                disabled={wizardStep === 0 || wizardBusy}
              >
                Quay lại
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  setWizardStep((prev) =>
                    Math.min(prev + 1, wizardSteps.length - 1),
                  )
                }
                disabled={wizardStep === wizardSteps.length - 1 || wizardBusy}
              >
                Bước tiếp
              </Button>
            </div>
            <Button
              variant="ghost"
              onClick={() => setWizardOpen(false)}
              disabled={wizardBusy}
            >
              Đóng flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
