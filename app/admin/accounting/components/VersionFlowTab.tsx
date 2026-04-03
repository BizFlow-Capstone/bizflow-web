"use client";

import { useEffect, useMemo, useState } from "react";
import type { ElementType, ReactNode } from "react";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
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
  getAccountingReference,
  getFormulaDetail,
  getMappableEntities,
  getMappableEntityDetail,
  getTemplateVersionFormulas,
  updateFieldMappingForTesting,
  updateFormulaTesting,
  updateMappableEntity,
  updateRowDefinition,
} from "@/lib/admin-accounting-api";
import type { VersionOption } from "./types";

interface VersionTabProps {
  tvId: string;
  tvLabel: string;
  tvEffective: string;
  tvNotes: string;
  tvResult: unknown;
  versionOptions: VersionOption[];
  setTvId: (value: string) => void;
  setTvLabel: (value: string) => void;
  setTvEffective: (value: string) => void;
  setTvNotes: (value: string) => void;
  onDetail: (rawId?: string) => Promise<void> | void;
  onFull: (rawId?: string) => Promise<void> | void;
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

function toReadableToken(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
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

function renderS2aLabel(
  row: {
    rowType: string;
    rowLabel: string;
    taxType: string;
  },
  groupIndex: number,
): string {
  const baseLabel = row.rowLabel || ROW_TYPE_LABELS[row.rowType] || "";
  const withGroup = baseLabel
    .replaceAll("{groupIndex}", String(groupIndex))
    .replaceAll("{businessTypeName}", "Nganh nghe ....");

  if (row.rowType === "industry_header") {
    return withGroup || `${groupIndex}. Nganh nghe ....`;
  }
  if (row.rowType === "data_placeholder") {
    return "....";
  }
  if (row.rowType === "subtotal") {
    return withGroup || `Tong cong (${groupIndex})`;
  }
  if (row.rowType === "tax_line") {
    if (withGroup) return withGroup;
    if (row.taxType === "VAT") return "Thue GTGT";
    if (row.taxType === "PIT") return "Thue TNCN";
    return "Dong thue";
  }

  return withGroup || "";
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

function asString(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "boolean") return value ? "true" : "false";
  return "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

function CollapsibleSection({
  title,
  icon: Icon,
  count,
  children,
}: {
  title: string;
  icon: ElementType;
  count: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(true);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-2 px-5 py-4 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
      >
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        <Icon className="h-4 w-4 text-[#15918f]" />
        {title}
        <Badge variant="secondary" className="ml-auto text-xs">
          {count}
        </Badge>
      </button>
      {open ? <div className="border-t">{children}</div> : null}
    </Card>
  );
}

export default function VersionTab(props: VersionTabProps) {
  const selectedVersionId = props.tvId;
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
  const templateId = asNumber(result?.templateId);
  const isActive = asBoolean(result?.isActive);

  const fieldMappings = asArray(result?.fieldMappings);
  const rowDefinitions = asArray(result?.rowDefinitions);
  const mappingCount =
    fieldMappings.length || (asNumber(result?.mappingCount) ?? 0);
  const rowCount = rowDefinitions.length || (asNumber(result?.rowCount) ?? 0);
  const isLoaded = hasResult && templateVersionId !== null;
  const isDraft = isLoaded && isActive === false;
  const isActiveVersion = isLoaded && isActive === true;

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

  const reviewColumns = useMemo(() => {
    return [...fieldMappings]
      .sort((a, b) => {
        const aSort = asNumber(a.sortOrder) ?? Number.MAX_SAFE_INTEGER;
        const bSort = asNumber(b.sortOrder) ?? Number.MAX_SAFE_INTEGER;
        return aSort - bSort;
      })
      .map((mapping) => ({
        fieldCode: asString(mapping.fieldCode),
        fieldLabel: asString(mapping.fieldLabel) || asString(mapping.fieldCode),
        fieldType: asString(mapping.fieldType),
      }));
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

  const orderedReviewRows = useMemo(() => {
    const positionWeight: Record<string, number> = {
      start_of_book: 0,
      per_section: 1,
      per_group: 2,
      end_of_book: 3,
    };

    return [...reviewRows].sort((a, b) => {
      const weightDiff =
        (positionWeight[a.position] ?? 9) - (positionWeight[b.position] ?? 9);
      if (weightDiff !== 0) return weightDiff;

      if (a.position === "per_section") {
        const sectionDiff = a.sectionType.localeCompare(b.sectionType);
        if (sectionDiff !== 0) return sectionDiff;
      }

      return a.sortOrder - b.sortOrder;
    });
  }, [reviewRows]);

  const previewColumns = useMemo(
    () =>
      reviewColumns.length
        ? reviewColumns
        : [
            { fieldCode: "col_1", fieldLabel: "Cot 1", fieldType: "text" },
            { fieldCode: "col_2", fieldLabel: "Cot 2", fieldType: "text" },
            {
              fieldCode: "col_3",
              fieldLabel: "Cot 3",
              fieldType: "decimal",
            },
          ],
    [reviewColumns],
  );

  const displayColumns = useMemo(() => {
    if (!isS2aTemplate) return previewColumns;

    return [
      { fieldCode: "ngay_thang", fieldLabel: "Ngay thang", fieldType: "date" },
      { fieldCode: "dien_giai", fieldLabel: "Dien giai", fieldType: "text" },
      { fieldCode: "so_tien", fieldLabel: "So tien", fieldType: "decimal" },
    ];
  }, [isS2aTemplate, previewColumns]);

  const startRows = orderedReviewRows.filter(
    (row) => row.position === "start_of_book",
  );
  const perGroupRows = orderedReviewRows.filter(
    (row) => row.position === "per_group",
  );
  const endRows = orderedReviewRows.filter(
    (row) => row.position === "end_of_book",
  );

  const perSectionGroups = useMemo(() => {
    const groups = new Map<string, typeof orderedReviewRows>();
    orderedReviewRows
      .filter((row) => row.position === "per_section")
      .forEach((row) => {
        const sectionKey = row.sectionType || "default_section";
        const bucket = groups.get(sectionKey) ?? [];
        bucket.push(row);
        groups.set(sectionKey, bucket);
      });
    return groups;
  }, [orderedReviewRows]);

  const lastColumnIndex = Math.max(displayColumns.length - 1, 0);
  const labelColumnCode =
    isS2aTemplate && displayColumns.some((col) => col.fieldCode === "dien_giai")
      ? "dien_giai"
      : displayColumns[Math.max(lastColumnIndex - 1, 0)]?.fieldCode || "";
  const metaColumnCode =
    isS2aTemplate && displayColumns.some((col) => col.fieldCode === "so_tien")
      ? "so_tien"
      : displayColumns[lastColumnIndex]?.fieldCode || "";

  const s2aPerGroupRows = useMemo(
    () =>
      perGroupRows
        .filter((row) =>
          [
            "industry_header",
            "data_placeholder",
            "subtotal",
            "tax_line",
          ].includes(row.rowType),
        )
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [perGroupRows],
  );

  const s2aEndRows = useMemo(() => {
    const normalized = [...endRows].sort((a, b) => a.sortOrder - b.sortOrder);
    const hasVat = normalized.some((row) => row.taxType === "VAT");
    const hasPit = normalized.some((row) => row.taxType === "PIT");
    const hasCombined = normalized.some(
      (row) => row.rowLabel.trim().toLowerCase() === "tong cong = gtgt + tncn",
    );

    if (hasVat && hasPit && !hasCombined) {
      normalized.push({
        rowDefId: null,
        rowType: "grand_total",
        rowLabel: "Tong cong = GTGT + TNCN",
        position: "end_of_book",
        sortOrder: 999,
        sectionType: "",
        taxType: "",
        formulaId: null,
        groupByField: "",
        visibleFieldCodes: "",
      });
    }
    return normalized;
  }, [endRows]);

  const s2aDataPlaceholderCount = useMemo(() => {
    const placeholder = s2aPerGroupRows.find(
      (row) => row.rowType === "data_placeholder",
    );
    return placeholder ? 6 : 0;
  }, [s2aPerGroupRows]);

  function renderTemplateLikeRow(
    row: (typeof orderedReviewRows)[number],
    key: string,
  ) {
    const visibleCodes = parseVisibleFieldCodes(row.visibleFieldCodes);
    const metaBadges = [
      row.sectionType
        ? `Section: ${SECTION_TYPE_LABELS[row.sectionType] ?? toReadableToken(row.sectionType)}`
        : "",
      row.taxType ? `Tax: ${row.taxType}` : "",
      row.groupByField ? `GroupBy: ${row.groupByField}` : "",
      row.formulaId !== null ? `Formula #${row.formulaId}` : "",
      visibleCodes.length ? `Visible: ${visibleCodes.join(", ")}` : "",
    ].filter(Boolean);

    const label =
      row.rowLabel ||
      ROW_TYPE_LABELS[row.rowType] ||
      toReadableToken(row.rowType);

    return (
      <tr key={key}>
        {displayColumns.map((col) => {
          const isLabelCell = col.fieldCode === labelColumnCode;
          const isMetaCell = col.fieldCode === metaColumnCode;
          return (
            <td
              key={`${key}-${col.fieldCode}`}
              className="h-9 border border-gray-700 px-2 py-1 align-top"
            >
              {isLabelCell ? (
                <div className="font-semibold text-gray-900">{label}</div>
              ) : null}
              {isMetaCell && metaBadges.length ? (
                <div className="text-[11px] text-gray-600">
                  {metaBadges.join(" | ")}
                </div>
              ) : null}
            </td>
          );
        })}
      </tr>
    );
  }

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

        const [
          formulaResults,
          entityResults,
          versionFormulas,
          entities,
          reference,
        ] = await Promise.all([
          Promise.all(
            linkedFormulaIds.map((formulaId) => getFormulaDetail(formulaId)),
          ),
          Promise.all(
            linkedEntityIds.map((entityId) =>
              getMappableEntityDetail(entityId),
            ),
          ),
          getTemplateVersionFormulas(versionId),
          getMappableEntities(true),
          getAccountingReference(),
        ]);
        if (disposed) return;

        setLinkedFormulas(formulaResults);
        setLinkedEntities(entityResults);
        setSelectedFormulaId(asNumber(formulaResults[0]?.formulaId));
        setSelectedEntityId(asNumber(entityResults[0]?.entityId));

        setMappingFormulaOptions(
          versionFormulas
            .map((formula) => {
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

        const fieldTypes = asOptionList(reference.fieldTypes);
        if (fieldTypes.length > 0) setMappingFieldTypeOptions(fieldTypes);

        const sourceTypes = asOptionList(reference.sourceTypes);
        if (sourceTypes.length > 0) setMappingSourceTypeOptions(sourceTypes);

        const aggregationTypes = asOptionList(reference.aggregateTypes);
        if (aggregationTypes.length > 0) {
          setMappingAggregationOptions([
            { value: "none", label: "none" },
            ...aggregationTypes,
          ]);
        }
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
    await loadDetail(selectedVersionId);
  }

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
          </div>
        </CardContent>
      </Card>

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
                  label="Template ID"
                  value={templateId ?? "—"}
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
                        Flow đúng theo BE: clone ra draft mới, mở wizard step,
                        rà soát template, mappings, rows, formulas và entities
                        rồi mới activate draft.
                      </p>
                      <Button
                        size="sm"
                        className={PRIMARY}
                        onClick={() => void handleCloneAndOpenFlow()}
                        disabled={wizardBusy}
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                        Clone và mở flow chỉnh sửa
                      </Button>
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
                        Đây là draft. Bạn có thể chỉnh sửa toàn bộ phụ thuộc
                        theo flow step trước khi kích hoạt.
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
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => void props.onDelete()}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Xóa draft
                        </Button>
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

          <CollapsibleSection
            title="Cột dữ liệu"
            icon={Activity}
            count={fieldMappings.length}
          >
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Mã cột</th>
                    <th className="px-3 py-2">Nhãn</th>
                    <th className="px-3 py-2">Kiểu</th>
                    <th className="px-3 py-2">Nguồn</th>
                    <th className="px-3 py-2">Formula</th>
                  </tr>
                </thead>
                <tbody>
                  {fieldMappings.map((mapping, index) => (
                    <tr
                      key={String(mapping.mappingId ?? index)}
                      className="border-t"
                    >
                      <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {asString(mapping.fieldCode)}
                      </td>
                      <td className="px-3 py-2">
                        {asString(mapping.fieldLabel)}
                      </td>
                      <td className="px-3 py-2">
                        {asString(mapping.fieldType)}
                      </td>
                      <td className="px-3 py-2">
                        {asString(mapping.sourceType) || "—"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-500">
                        {asNumber(mapping.formulaId) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Dòng mẫu"
            icon={Layers}
            count={rowDefinitions.length}
          >
            <div className="max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Loại dòng</th>
                    <th className="px-3 py-2">Nhãn</th>
                    <th className="px-3 py-2">Vị trí</th>
                    <th className="px-3 py-2">Formula</th>
                    <th className="px-3 py-2">Sort</th>
                  </tr>
                </thead>
                <tbody>
                  {rowDefinitions.map((row, index) => (
                    <tr
                      key={String(row.rowDefId ?? index)}
                      className="border-t"
                    >
                      <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                      <td className="px-3 py-2">{asString(row.rowType)}</td>
                      <td className="px-3 py-2">
                        {asString(row.rowLabel) || "—"}
                      </td>
                      <td className="px-3 py-2">{asString(row.position)}</td>
                      <td className="px-3 py-2 font-mono text-xs text-gray-500">
                        {asNumber(row.formulaId) ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        {asNumber(row.sortOrder) ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CollapsibleSection>
        </>
      ) : null}

      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-h-[92vh] overflow-hidden p-0 sm:max-w-6xl">
          <DialogHeader className="border-b px-6 py-5">
            <DialogTitle>Template Draft Flow</DialogTitle>
            <DialogDescription>
              Clone xong sẽ đi tuần tự: chỉnh template, mappings, rows rồi
              review trước khi activate. Formulas và entities được quản lý ở tab
              riêng.
            </DialogDescription>
          </DialogHeader>

          <div className="border-b px-6 py-4">
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
                    Draft metadata
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
                      Version label
                    </label>
                    <input
                      value={props.tvLabel}
                      onChange={(e) => props.setTvLabel(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      Effective from
                    </label>
                    <input
                      value={props.tvEffective}
                      onChange={(e) => props.setTvEffective(e.target.value)}
                      type="date"
                      className="w-full rounded-lg border px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Change notes
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
                    Lưu metadata draft
                  </Button>
                </div>
              </div>
            ) : null}

            {!wizardLoading && wizardStep === 1 ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Field mappings của draft
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
                      <label className="block text-xs font-medium text-gray-600">
                        Kiểu dữ liệu
                      </label>
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
                      <label className="block text-xs font-medium text-gray-600">
                        Nguồn dữ liệu
                      </label>
                      <select
                        value={mappingDraft.sourceType}
                        onChange={(e) =>
                          setMappingDraft((prev) => ({
                            ...prev,
                            sourceType: e.target.value,
                          }))
                        }
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
                        >
                          <option value="">Chọn entity</option>
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
                          disabled={!mappingDraft.sourceEntityId}
                        >
                          <option value="">Chọn field</option>
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
                      <label className="block text-xs font-medium text-gray-600">
                        Kiểu tổng hợp
                      </label>
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
                        onChange={(e) =>
                          setMappingDraft((prev) => ({
                            ...prev,
                            sortOrder: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
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
                    </div>
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
                      Row definitions của draft
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
                      <label className="block text-xs font-medium text-gray-600">
                        Loại dòng
                      </label>
                      <input
                        value={rowDraft.rowType}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            rowType: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
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
                        <label className="block text-xs font-medium text-gray-600">
                          Position
                        </label>
                        <input
                          value={rowDraft.position}
                          onChange={(e) =>
                            setRowDraft((prev) => ({
                              ...prev,
                              position: e.target.value,
                            }))
                          }
                          className="w-full rounded-lg border px-3 py-2 text-sm"
                        />
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
                      <input
                        value={rowDraft.formulaId}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            formulaId: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Section type
                      </label>
                      <input
                        value={rowDraft.sectionType}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            sectionType: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
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
                      <label className="block text-xs font-medium text-gray-600">
                        Tax type
                      </label>
                      <input
                        value={rowDraft.taxType}
                        onChange={(e) =>
                          setRowDraft((prev) => ({
                            ...prev,
                            taxType: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Visible field codes
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
                      Lưu row definition
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {!wizardLoading && wizardStep === 99 ? (
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Linked formulas</CardTitle>
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
                        readOnly
                        className="w-full rounded-lg border bg-gray-50 px-3 py-2 font-mono text-xs"
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
                        Formula type
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
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
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
                <div className="rounded-xl border bg-linear-to-r from-cyan-50 to-white p-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Review trước khi activate draft
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    Kiểm tra lại draft và các phụ thuộc trước khi đưa phiên bản
                    này lên active.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard
                    label="Template"
                    value={templateCode || "—"}
                    icon={FileText}
                  />
                  <MetricCard
                    label="Version"
                    value={props.tvLabel || versionLabel || "—"}
                    icon={Layers}
                  />
                  <MetricCard
                    label="Formulas linked"
                    value={linkedFormulaIds.length}
                    icon={Sparkles}
                  />
                  <MetricCard
                    label="Entities linked"
                    value={linkedEntityIds.length}
                    icon={Database}
                  />
                </div>
                <div className="rounded-lg border bg-white p-4">
                  <p className="text-xs text-gray-500">Checklist flow</p>
                  <div className="mt-3 space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      Metadata draft đã được rà soát
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      Field mappings và row definitions đã được kiểm tra
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      Formula liên quan đã được xác nhận ở tab Formulas (nếu có
                      thay đổi)
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                      Nguồn dữ liệu (entities/fields) đã được xác nhận ở tab
                      Entities
                    </div>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Mẫu sổ preview (Full Structure)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-gray-300 bg-white p-4 text-gray-900">
                      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-gray-300 pb-4">
                        <div className="space-y-1 text-sm">
                          <p className="font-semibold uppercase">
                            HO, CA NHAN KINH DOANH: ........
                          </p>
                          <p>Dia chi: .........................</p>
                          <p>Ma so thue: .......................</p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="font-semibold">
                            Mau so {templateCode || "S1a"}-HKD
                          </p>
                          <p className="italic text-gray-600">
                            (
                            {templateName ||
                              "So doanh thu ban hang hoa, dich vu"}
                            )
                          </p>
                          <p className="text-xs text-gray-500">
                            Version: {props.tvLabel || versionLabel || "-"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-2 text-sm">
                        <p className="text-base font-bold uppercase">
                          SO DOANH THU BAN HANG HOA, DICH VU
                        </p>
                        <p>Dia diem kinh doanh: ............................</p>
                        <p>Ky ke khai: ....................................</p>
                        <p className="italic">
                          Don vi tinh: ...................................
                        </p>
                      </div>

                      <div className="mt-3 overflow-x-auto">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            {isS2aTemplate ? (
                              <>
                                <tr>
                                  <th className="border border-gray-700 bg-gray-100 px-2 py-1 text-left font-semibold">
                                    Chung tu
                                  </th>
                                  <th
                                    rowSpan={2}
                                    className="border border-gray-700 bg-gray-100 px-2 py-1 text-left font-semibold"
                                  >
                                    Dien giai
                                  </th>
                                  <th
                                    rowSpan={2}
                                    className="border border-gray-700 bg-gray-100 px-2 py-1 text-left font-semibold"
                                  >
                                    So tien
                                  </th>
                                </tr>
                                <tr>
                                  <th className="border border-gray-700 bg-gray-50 px-2 py-1 text-left text-xs font-medium text-gray-700">
                                    So hieu
                                  </th>
                                  <th className="border border-gray-700 bg-gray-50 px-2 py-1 text-left text-xs font-medium text-gray-700">
                                    Ngay, thang
                                  </th>
                                </tr>
                                <tr>
                                  <th className="border border-gray-700 px-2 py-1 text-left text-xs italic">
                                    A
                                  </th>
                                  <th className="border border-gray-700 px-2 py-1 text-left text-xs italic">
                                    B
                                  </th>
                                  <th className="border border-gray-700 px-2 py-1 text-left text-xs italic">
                                    C
                                  </th>
                                </tr>
                              </>
                            ) : (
                              <>
                                <tr>
                                  {displayColumns.map((col) => (
                                    <th
                                      key={col.fieldCode || col.fieldLabel}
                                      className="border border-gray-700 bg-gray-100 px-2 py-1 text-left font-semibold"
                                    >
                                      {col.fieldLabel || "Cot"}
                                    </th>
                                  ))}
                                </tr>
                                <tr>
                                  {displayColumns.map((col) => (
                                    <th
                                      key={`${col.fieldCode}-type`}
                                      className="border border-gray-700 px-2 py-1 text-left text-xs font-medium text-gray-600"
                                    >
                                      {col.fieldCode || "-"} ·{" "}
                                      {col.fieldType || "text"}
                                    </th>
                                  ))}
                                </tr>
                              </>
                            )}
                          </thead>
                          <tbody>
                            {startRows.map((row, index) =>
                              renderTemplateLikeRow(row, `start-${index}`),
                            )}

                            {perSectionGroups.size > 0
                              ? Array.from(perSectionGroups.entries()).map(
                                  ([sectionKey, sectionRows]) => (
                                    <>
                                      <tr key={`section-title-${sectionKey}`}>
                                        <td
                                          colSpan={displayColumns.length}
                                          className="border border-gray-700 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700"
                                        >
                                          Phan:{" "}
                                          {SECTION_TYPE_LABELS[sectionKey] ??
                                            toReadableToken(sectionKey)}
                                        </td>
                                      </tr>
                                      {sectionRows.map((row, index) =>
                                        renderTemplateLikeRow(
                                          row,
                                          `section-${sectionKey}-${index}`,
                                        ),
                                      )}
                                    </>
                                  ),
                                )
                              : null}

                            {isS2aTemplate && s2aPerGroupRows.length > 0 ? (
                              <tr>
                                <td
                                  colSpan={displayColumns.length}
                                  className="border border-gray-700 bg-gray-50 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700"
                                >
                                  Nhom lap lai theo nghiep vu (per_group)
                                </td>
                              </tr>
                            ) : null}
                            {isS2aTemplate
                              ? [1, 2, 3].flatMap((groupIndex) =>
                                  s2aPerGroupRows.map((row, rowIndex) => {
                                    const displayLabel =
                                      row.rowType === "industry_header"
                                        ? row.rowLabel
                                            .replaceAll(
                                              "{groupIndex}",
                                              String(groupIndex),
                                            )
                                            .replaceAll(
                                              "{businessTypeName}",
                                              "Nganh nghe ....",
                                            ) ||
                                          `${groupIndex}. Nganh nghe ....`
                                        : row.rowType === "data_placeholder"
                                          ? ""
                                          : row.rowType === "subtotal"
                                            ? row.rowLabel.replaceAll(
                                                "{groupIndex}",
                                                String(groupIndex),
                                              ) || `Tong cong (${groupIndex})`
                                            : row.rowType === "tax_line"
                                              ? row.taxType === "VAT"
                                                ? "Thue GTGT"
                                                : "Thue TNCN"
                                              : renderS2aLabel(row, groupIndex);

                                    return (
                                      <tr
                                        key={`s2a-group-${groupIndex}-${rowIndex}`}
                                      >
                                        <td className="h-8 border border-gray-700 px-2 py-1" />
                                        <td className="h-8 border border-gray-700 px-2 py-1" />
                                        <td className="h-8 border border-gray-700 px-2 py-1 font-semibold">
                                          {displayLabel}
                                        </td>
                                      </tr>
                                    );
                                  }),
                                )
                              : perGroupRows.map((row, index) =>
                                  renderTemplateLikeRow(row, `group-${index}`),
                                )}

                            {isS2aTemplate
                              ? Array.from({
                                  length: s2aDataPlaceholderCount || 6,
                                }).map((_, index) => (
                                  <tr key={`s2a-data-${index}`}>
                                    <td className="h-8 border border-gray-700 px-2 py-1" />
                                    <td className="h-8 border border-gray-700 px-2 py-1" />
                                    <td className="h-8 border border-gray-700 px-2 py-1">
                                      {index === 0
                                        ? "... data rows from query ..."
                                        : ""}
                                    </td>
                                  </tr>
                                ))
                              : perGroupRows.some(
                                    (row) => row.rowType === "data_placeholder",
                                  )
                                ? Array.from({ length: 4 }).map((_, index) => (
                                    <tr key={`data-area-${index}`}>
                                      {displayColumns.map((col, colIndex) => (
                                        <td
                                          key={`data-area-${index}-${col.fieldCode}`}
                                          className="h-8 border border-gray-700 px-2 py-1"
                                        >
                                          {index === 0 && colIndex === 0
                                            ? "... data rows from query ..."
                                            : null}
                                        </td>
                                      ))}
                                    </tr>
                                  ))
                                : null}

                            {isS2aTemplate
                              ? s2aEndRows.map((row, index) => (
                                  <tr key={`s2a-end-${index}`}>
                                    <td className="h-8 border border-gray-700 px-2 py-1" />
                                    <td className="h-8 border border-gray-700 px-2 py-1" />
                                    <td className="h-8 border border-gray-700 px-2 py-1 font-semibold">
                                      {row.rowLabel ||
                                        ROW_TYPE_LABELS[row.rowType] ||
                                        toReadableToken(row.rowType)}
                                    </td>
                                  </tr>
                                ))
                              : endRows.map((row, index) =>
                                  renderTemplateLikeRow(row, `end-${index}`),
                                )}
                          </tbody>
                        </table>
                      </div>

                      {isS2aTemplate ? null : (
                        <div className="mt-4 flex justify-end text-sm">
                          <div className="w-full max-w-xs text-center">
                            <p>Ngay ... thang ... nam ...</p>
                            <p className="font-semibold uppercase">
                              NGUOI DAI DIEN HO KINH DOANH
                            </p>
                            <p className="italic text-gray-600">
                              (Ky, ghi ro ho ten, dong dau neu co)
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isS2aTemplate ? (
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
                    ) : null}
                  </CardContent>
                </Card>

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
