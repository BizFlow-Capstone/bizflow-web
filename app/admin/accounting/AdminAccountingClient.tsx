"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Boxes,
  Database,
  FileJson,
  FunctionSquare,
  GitBranch,
  MoreVertical,
  Play,
  Plug,
  Rows,
  Scale,
  Trash2,
  TreePine,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  activateTemplateVersion,
  cloneFormula,
  cloneTemplateVersion,
  createTemplate,
  createTemplateVersion,
  createFormula,
  createFieldMapping,
  createMappableEntity,
  createMappableField,
  createRowDefinition,
  deleteMappableEntity,
  deactivateTemplateVersion,
  deleteFieldMapping,
  deleteRowDefinition,
  deleteTemplateVersion,
  getAccountingOverview,
  getAccountingReference,
  getBusinessTypesWithRates,
  getFormulaDetail,
  getFormulaNodeSchemas,
  getMappableEntities,
  getMappableEntityDetail,
  getRowDefinitions,
  getTemplateVersionDetail,
  getTemplateVersionFullStructure,
  runAccountingCompare,
  runAccountingTrace,
  replaceBusinessTypeTaxRates,
  updateFieldMappingForTesting,
  updateFormulaTesting,
  updateBusinessTypeMetadata,
  updateMappableEntity,
  updateMappableField,
  updateRowDefinition,
  updateTemplateVersion,
  createTaxRuleset,
  activateTaxRuleset,
  deactivateTaxRuleset,
  createBusinessType,
} from "@/lib/admin-accounting-api";
import type {
  BusinessTypeWithRatesDto,
  CreateTemplateRequest,
  CreateTemplateVersionRequest,
  CreateTaxRulesetRequest,
  CreateBusinessTypeRequest,
} from "@/lib/admin-accounting-api";
import type {
  AccountingBookRow,
  AccountingBusinessTypeSummary,
  AccountingFormulaSummary,
  AccountingOverviewResponse,
  AccountingTemplateColumnSummary,
  AccountingTemplateSummary,
} from "@/lib/types/adminAccounting";
import VersionFlowTab from "./components/VersionFlowTab";
import FormulaTab from "./components/FormulaTab";
import MappingTab from "./components/MappingTab";
import BookTemplatePreview from "@/components/accounting/BookTemplatePreview";
import type { MappingFormState } from "./components/types";

type AccountingTabKey =
  | "overview"
  | "business-types"
  | "version"
  | "formulas"
  | "mappings"
  | "rowdefs"
  | "entities"
  | "reference"
  | "compare"
  | "preview"
  | "trace"
  | "schema";

type LogType = "info" | "ok" | "error";

interface LogEntry {
  id: number;
  message: string;
  type: LogType;
}

interface RowFormState {
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

interface RowTaxRateHint {
  taxType: string;
  businessTypeCode: string;
  businessTypeName: string;
  taxRate: number;
  description: string;
}

interface BusinessTypeMetadataForm {
  name: string;
  description: string;
  status: string;
}

interface BusinessTypeTaxRateForm {
  taxType: string;
  taxRate: string;
  description: string;
}

interface EntityDeleteTarget {
  id: number;
  code: string;
}

interface AdminAccountingClientProps {
  mode?: "admin" | "consultant";
}

const tabs: Array<{
  key: AccountingTabKey;
  label: string;
  icon: React.ReactNode;
  group: "core" | "support";
}> = [
  {
    key: "overview",
    label: "Tổng Quan Mẫu Sổ",
    icon: <Boxes className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "business-types",
    label: "Loại Hình Kinh Doanh & Thuế Suất",
    icon: <BookOpen className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "version",
    label: "Phiên Bản Template",
    icon: <GitBranch className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "formulas",
    label: "Công Thức",
    icon: <FunctionSquare className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "mappings",
    label: "Mappings: Trường & Nguồn Dữ Liệu",
    icon: <Plug className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "rowdefs",
    label: "Định Nghĩa Dòng Sổ",
    icon: <Rows className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "entities",
    label: "Entities Và Trường Dữ Liệu",
    icon: <Database className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "compare",
    label: "So sánh Mẫu Sổ",
    icon: <Scale className="h-4 w-4" />,
    group: "support",
  },
  // {
  //   key: "preview",
  //   label: "Xem Trước",
  //   icon: <Play className="h-4 w-4" />,
  //   group: "support",
  // },
  {
    key: "trace",
    label: "Theo Dõi Luồng Tính Toán",
    icon: <TreePine className="h-4 w-4" />,
    group: "support",
  },
  {
    key: "reference",
    label: "Reference",
    icon: <BookOpen className="h-4 w-4" />,
    group: "support",
  },
  {
    key: "schema",
    label: "Schemas Công Thức",
    icon: <FileJson className="h-4 w-4" />,
    group: "support",
  },
];

const emptyMappingForm: MappingFormState = {
  mappingId: "",
  fieldCode: "",
  fieldLabel: "",
  fieldType: "decimal",
  sourceType: "query",
  sourceEntityId: "",
  sourceFieldId: "",
  filterJson: "",
  aggregationType: "",
  formulaId: "",
  formulaExpression: "",
  sortOrder: "0",
  isRequired: "false",
};

const emptyRowForm: RowFormState = {
  rowDefId: "",
  rowType: "data_placeholder",
  rowLabel: "",
  position: "per_group",
  sortOrder: "100",
  sectionType: "",
  sectionFilterValue: "",
  groupByField: "",
  formulaId: "",
  taxType: "",
  visibleFieldCodes: "",
};

const emptyBusinessTypeMetadataForm: BusinessTypeMetadataForm = {
  name: "",
  description: "",
  status: "active",
};

const emptyBusinessTypeTaxRateForm: BusinessTypeTaxRateForm = {
  taxType: "",
  taxRate: "",
  description: "",
};

const CANONICAL_TAX_TYPES = ["VAT", "PIT_METHOD_1", "PIT_METHOD_2"] as const;

const TAX_TYPE_ALIASES: Record<string, string> = {
  PIT_M1: "PIT_METHOD_1",
  PIT_METHOD1: "PIT_METHOD_1",
  PIT_MEHTHOD_1: "PIT_METHOD_1",
  PIT_MEHTOD_1: "PIT_METHOD_1",
  PIT_METHOD_01: "PIT_METHOD_1",
  PIT_M2: "PIT_METHOD_2",
  PIT_METHOD2: "PIT_METHOD_2",
  PIT_MEHTHOD_2: "PIT_METHOD_2",
  PIT_MEHTOD_2: "PIT_METHOD_2",
  PIT_METHOD_02: "PIT_METHOD_2",
};

function normalizeTaxTypeKey(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!normalized) return "";
  return TAX_TYPE_ALIASES[normalized] ?? normalized;
}

function toTaxTypeLabel(value: string): string {
  const normalized = normalizeTaxTypeKey(value);
  if (normalized === "PIT_METHOD_1") return "PIT_METHOD_1";
  if (normalized === "PIT_METHOD_2") return "PIT_METHOD_2";
  if (normalized === "VAT") return "VAT";
  return normalized;
}

function toNum(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function isDateOnly(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function isRulesetEffectiveAt(
  ruleset: AccountingOverviewResponse["taxRulesets"][number],
  at: Date,
): boolean {
  const fromDate = parseDate(ruleset.effectiveFrom);
  if (fromDate && fromDate.getTime() > at.getTime()) return false;

  const toDate = parseDate(ruleset.effectiveTo);
  if (!toDate) return true;

  const end = new Date(toDate);
  if (isDateOnly(ruleset.effectiveTo)) {
    end.setHours(23, 59, 59, 999);
  }
  return end.getTime() >= at.getTime();
}

function asArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === "object",
  );
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toDisplayText(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "number") return value.toLocaleString("vi-VN");
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "string") return value || "-";
  return JSON.stringify(value);
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

function buildFormulaSelectOptions(
  formulas: AccountingFormulaSummary[],
): Array<{ value: string; label: string }> {
  return formulas
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
    .filter((option): option is { value: string; label: string } => !!option);
}

function parseVisibleFieldCodes(raw: string): string[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => (typeof item === "string" ? item.trim() : ""))
      .filter(Boolean);
  } catch {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function pickFirstRowValue(
  row: Record<string, unknown>,
  fieldCodes: Array<string | undefined>,
): unknown {
  for (const fieldCode of fieldCodes) {
    if (!fieldCode) continue;
    const value = row[fieldCode];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return null;
}

function resolveRowAmountValue(row: Record<string, unknown>): unknown {
  const visibleCodes = parseVisibleFieldCodes(
    String(row.visibleFieldCodes ?? ""),
  );
  const preferredValue = pickFirstRowValue(row, [
    ...visibleCodes.filter((code) => {
      const normalized = code.toLowerCase();
      return normalized !== "dien_giai" && normalized !== "description";
    }),
    "so_tien",
    "amount",
    "revenue",
    "value",
  ]);

  if (preferredValue !== null) return preferredValue;

  const ignoredKeys = new Set([
    "stt",
    "lineType",
    "line_type",
    "rowType",
    "row_type",
    "rowLabel",
    "row_label",
    "dien_giai",
    "description",
    "so_hieu",
    "chung_tu_so_hieu",
    "ngay_thang",
    "chung_tu_ngay_thang",
    "date",
    "businessTypeId",
    "business_type_id",
  ]);

  const numericFallback = Object.entries(row).find(([key, value]) => {
    if (ignoredKeys.has(key)) return false;
    return typeof value === "number" && Number.isFinite(value);
  });

  return numericFallback?.[1] ?? null;
}

function formatAmountValue(value: unknown): string {
  if (value == null || value === "") return "-";
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toLocaleString("vi-VN");
  }

  const parsed = Number(value);
  if (Number.isFinite(parsed)) return parsed.toLocaleString("vi-VN");

  return String(value);
}

function stringifyVisibleFieldCodes(values: string[]): string {
  return JSON.stringify(Array.from(new Set(values.filter(Boolean))));
}

function parseAllowedAggregations(raw: string): string[] {
  if (!raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean);
    }
  } catch {
    // Fallback for legacy comma-separated values.
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function stringifyAllowedAggregations(values: string[]): string {
  return JSON.stringify(Array.from(new Set(values.filter(Boolean))));
}

function derivePreviewColumnsFromRows(
  rows: Array<Record<string, unknown>>,
): AccountingTemplateColumnSummary[] {
  if (rows.length === 0) return [];

  const ignoredKeys = new Set([
    "lineType",
    "line_type",
    "rowType",
    "row_type",
    "rowLabel",
    "row_label",
    "visibleFieldCodes",
  ]);

  const labelMap: Record<string, string> = {
    so_hieu: "Số hiệu chứng từ",
    chung_tu_so_hieu: "Số hiệu chứng từ",
    ngay_thang: "Ngày, tháng",
    chung_tu_ngay_thang: "Ngày, tháng",
    date: "Ngày, tháng",
    dien_giai: "Diễn giải",
    description: "Diễn giải",
    so_tien: "Số tiền",
    amount: "Số tiền",
    revenue: "Số tiền",
    value: "Giá trị",
    businessTypeId: "Business Type ID",
  };

  const preferredOrder = [
    "so_hieu",
    "chung_tu_so_hieu",
    "ngay_thang",
    "chung_tu_ngay_thang",
    "date",
    "dien_giai",
    "description",
    "so_tien",
    "amount",
    "revenue",
    "value",
  ];

  const keySet = new Set<string>();
  rows.slice(0, 50).forEach((row) => {
    Object.keys(row).forEach((key) => {
      if (!ignoredKeys.has(key)) keySet.add(key);
    });
  });

  const keys = Array.from(keySet).sort((left, right) => {
    const leftIndex = preferredOrder.indexOf(left);
    const rightIndex = preferredOrder.indexOf(right);
    if (leftIndex !== -1 && rightIndex !== -1) return leftIndex - rightIndex;
    if (leftIndex !== -1) return -1;
    if (rightIndex !== -1) return 1;
    return left.localeCompare(right);
  });

  return keys.map((fieldCode) => {
    const sampleValues = rows
      .map((row) => row[fieldCode])
      .filter((value) => value !== undefined && value !== null && value !== "")
      .slice(0, 12);

    const hasNumericSample = sampleValues.some((value) => {
      if (typeof value === "number" && Number.isFinite(value)) return true;
      const parsed = Number(value);
      return (
        typeof value === "string" &&
        value.trim() !== "" &&
        Number.isFinite(parsed)
      );
    });

    const looksLikeDate =
      fieldCode.toLowerCase().includes("date") ||
      fieldCode.toLowerCase().includes("ngay");

    const fieldType = looksLikeDate
      ? "date"
      : hasNumericSample
        ? "decimal"
        : "text";

    return {
      fieldCode,
      label: labelMap[fieldCode] || fieldCode,
      fieldType,
      exportColumn: "",
    };
  });
}

function isAccountingTabKey(value: string | null): value is AccountingTabKey {
  return Boolean(value) && tabs.some((tab) => tab.key === value);
}

function shouldToastSuccessLog(message: string): boolean {
  const trimmed = message.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith("Loaded ")) return false;
  if (trimmed.startsWith("No ")) return false;
  return true;
}

export default function AdminAccountingClient({
  mode = "admin",
}: AdminAccountingClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isConsultantMode = mode === "consultant";
  const [overview, setOverview] = useState<AccountingOverviewResponse | null>(
    null,
  );
  const [, setError] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [tvId, setTvId] = useState("");
  const [tvLabel, setTvLabel] = useState("");
  const [tvEffective, setTvEffective] = useState("");
  const [tvNotes, setTvNotes] = useState("");
  const [tvResult, setTvResult] = useState<unknown>(null);

  const [fmId, setFmId] = useState("");
  const [fmCode, setFmCode] = useState("-");
  const [fmType, setFmType] = useState("-");
  const [fmActive, setFmActive] = useState("-");
  const [fmName, setFmName] = useState("");
  const [fmDesc, setFmDesc] = useState("");
  const [fmExprJson, setFmExprJson] = useState("{}");
  const [fmFType, setFmFType] = useState("");
  const [fmIsActive, setFmIsActive] = useState("");
  const [fmExplanation, setFmExplanation] = useState("-");
  const [fmCloneCode, setFmCloneCode] = useState("");
  const [fmCloneSuffix, setFmCloneSuffix] = useState(" (draft)");
  const [fmResultDataType, setFmResultDataType] = useState("decimal");
  const [fmRoundingMode, setFmRoundingMode] = useState("");
  const [fmRoundingPrecision, setFmRoundingPrecision] = useState("2");

  const [fldVer, setFldVer] = useState("");
  const [fieldMappings, setFieldMappings] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [mappingForm, setMappingForm] =
    useState<MappingFormState>(emptyMappingForm);
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

  const [rdVer, setRdVer] = useState("");
  const [rdRulesetId, setRdRulesetId] = useState("1");
  const [rowDefs, setRowDefs] = useState<Array<Record<string, unknown>>>([]);
  const [rowForm, setRowForm] = useState<RowFormState>(emptyRowForm);
  const [rowEditorMode, setRowEditorMode] = useState<"create" | "update">(
    "create",
  );
  const [rowActionMenuId, setRowActionMenuId] = useState("");
  const [rowTypeOptions, setRowTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([
    { value: "data_placeholder", label: "Vùng dữ liệu" },
    { value: "industry_header", label: "Tiêu đề ngành" },
    { value: "subtotal", label: "Cộng nhóm" },
    { value: "tax_line", label: "Dòng thuế" },
    { value: "grand_total", label: "Tổng cộng" },
  ]);
  const [rowPositionOptions, setRowPositionOptions] = useState<
    Array<{ value: string; label: string }>
  >([
    { value: "per_group", label: "Mỗi nhóm" },
    { value: "per_section", label: "Mỗi phần" },
    { value: "start_of_book", label: "Đầu sổ" },
    { value: "end_of_book", label: "Cuối sổ" },
  ]);
  const [rowSectionTypeOptions, setRowSectionTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([
    { value: "industry_group", label: "Nhóm ngành nghề" },
    { value: "revenue_cost", label: "Doanh thu / Chi phí" },
    { value: "cash_bank", label: "Tiền mặt / Ngân hàng" },
    { value: "per_product", label: "Theo sản phẩm" },
  ]);
  const [rowTaxTypeOptions, setRowTaxTypeOptions] = useState<
    Array<{ value: string; label: string }>
  >([
    ...CANONICAL_TAX_TYPES.map((item) => ({
      value: item,
      label: toTaxTypeLabel(item),
    })),
  ]);
  const [rowFormulaOptions, setRowFormulaOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [rowVisibleFieldOptions, setRowVisibleFieldOptions] = useState<
    Array<{ value: string; label: string }>
  >([]);
  const [rowTaxRateHints, setRowTaxRateHints] = useState<RowTaxRateHint[]>([]);

  const [btRulesetId, setBtRulesetId] = useState("1");
  const [businessTypesWithRates, setBusinessTypesWithRates] = useState<
    BusinessTypeWithRatesDto[]
  >([]);
  const [btSelectedId, setBtSelectedId] = useState("");
  const [btMetadataForm, setBtMetadataForm] =
    useState<BusinessTypeMetadataForm>(emptyBusinessTypeMetadataForm);
  const [btRatesForm, setBtRatesForm] = useState<BusinessTypeTaxRateForm[]>([]);

  // Create Ruleset form state
  const [showCreateRulesetModal, setShowCreateRulesetModal] = useState(false);
  const [createRulesetForm, setCreateRulesetForm] =
    useState<CreateTaxRulesetRequest>({
      code: "",
      name: "",
      description: "",
      version: "",
      effectiveFrom: "",
      effectiveTo: "",
      cloneFromRulesetId: null,
    });
  const [createRulesetLoading, setCreateRulesetLoading] = useState(false);

  // Create Business Type form state
  const [showCreateBtModal, setShowCreateBtModal] = useState(false);
  const [createBtForm, setCreateBtForm] = useState<CreateBusinessTypeRequest>({
    code: "",
    name: "",
    description: "",
  });
  const [createBtLoading, setCreateBtLoading] = useState(false);

  const [entities, setEntities] = useState<Array<Record<string, unknown>>>([]);
  const [entityFields, setEntityFields] = useState<
    Array<Record<string, unknown>>
  >([]);
  const [selectedEntityName, setSelectedEntityName] = useState("-");
  const [entEditId, setEntEditId] = useState("");
  const [entCode, setEntCode] = useState("");
  const [entName, setEntName] = useState("");
  const [entCat, setEntCat] = useState("revenue");
  const [entDesc, setEntDesc] = useState("");
  const [entIsActive, setEntIsActive] = useState("true");
  const [entityDeleteTarget, setEntityDeleteTarget] =
    useState<EntityDeleteTarget | null>(null);
  const [entityDeleteBusy, setEntityDeleteBusy] = useState(false);
  const [efEditId, setEfEditId] = useState("");
  const [efEntId, setEfEntId] = useState("");
  const [efCode, setEfCode] = useState("");
  const [efName, setEfName] = useState("");
  const [efDtype, setEfDtype] = useState("decimal");
  const [efAggs, setEfAggs] = useState('["sum","none"]');
  const [efDesc, setEfDesc] = useState("");
  const [efIsActive, setEfIsActive] = useState("true");

  const [refData, setRefData] = useState<Record<string, unknown>>({});
  const [schemas, setSchemas] = useState<Array<Record<string, unknown>>>([]);

  const [cmpLoc, setCmpLoc] = useState("6");
  const [cmpPer, setCmpPer] = useState("1");
  const [cmpDraft, setCmpDraft] = useState("");
  const [cmpActive, setCmpActive] = useState("");
  const [cmpGrp, setCmpGrp] = useState("2");
  const [cmpMeth, setCmpMeth] = useState("method_1");
  const [cmpRule, setCmpRule] = useState("1");
  const [cmpBatch, setCmpBatch] = useState("20");
  const [cmpBiz, setCmpBiz] = useState("");
  const [compareResult, setCompareResult] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [pvLoc, setPvLoc] = useState("6");
  const [pvPer, setPvPer] = useState("1");
  const [pvVer, setPvVer] = useState("");
  const [pvGrp, setPvGrp] = useState("3");
  const [pvMeth, setPvMeth] = useState("method_1");
  const [pvRule, setPvRule] = useState("1");
  const [pvBiz, setPvBiz] = useState("");
  const [pvBatch, setPvBatch] = useState("20");
  const [previewResult, setPreviewResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [previewFullStructure, setPreviewFullStructure] = useState<Record<
    string,
    unknown
  > | null>(null);

  const [trFId, setTrFId] = useState("");
  const [trLoc, setTrLoc] = useState("6");
  const [trPer, setTrPer] = useState("1");
  const [trRule, setTrRule] = useState("1");
  const [trBiz, setTrBiz] = useState("");
  const [traceResult, setTraceResult] = useState<Record<
    string,
    unknown
  > | null>(null);

  const templates = useMemo(
    () => overview?.templates ?? [],
    [overview?.templates],
  );
  const formulas = useMemo(
    () => overview?.formulas ?? [],
    [overview?.formulas],
  );
  const businessTypes = useMemo(
    () => overview?.businessTypes ?? [],
    [overview?.businessTypes],
  );

  const activeEffectiveRulesets = useMemo(() => {
    const now = new Date();
    return (overview?.taxRulesets ?? []).filter(
      (ruleset) =>
        Boolean(ruleset.isActive) && isRulesetEffectiveAt(ruleset, now),
    );
  }, [overview?.taxRulesets]);

  const overviewAppliedRuleset = useMemo(() => {
    if (activeEffectiveRulesets.length === 0) return null;
    return [...activeEffectiveRulesets].sort((left, right) => {
      const leftTime = parseDate(left.effectiveFrom)?.getTime() ?? 0;
      const rightTime = parseDate(right.effectiveFrom)?.getTime() ?? 0;
      return rightTime - leftTime;
    })[0];
  }, [activeEffectiveRulesets]);

  const previewSummary = useMemo(() => {
    const root = asRecord(previewResult);
    const summary = asRecord(root?.summary);
    if (!summary) return null;
    return {
      totalRows: Number(summary.totalRows ?? 0),
      totalRevenue: summary.totalRevenue,
      totalCost: summary.totalCost,
      totalTax: summary.totalTax,
    };
  }, [previewResult]);

  const previewFormulaValues = useMemo(() => {
    const root = asRecord(previewResult);
    const summary = asRecord(root?.summary);
    const formulaValues = asRecord(summary?.formulaValues);
    if (!formulaValues) return [];
    return Object.entries(formulaValues).map(([code, value]) => ({
      code,
      value,
    }));
  }, [previewResult]);

  const previewRowsMeta = useMemo(() => {
    const root = asRecord(previewResult);
    const rows = asRecord(root?.rows);
    if (!rows) return null;

    return {
      hasMore: Boolean(rows.hasMore),
      loadedCount: Number(rows.loadedCount ?? 0),
      totalEstimated: Number(rows.totalEstimated ?? 0),
      nextCursor: String(rows.nextCursor ?? ""),
    };
  }, [previewResult]);

  const previewRowItems = useMemo(() => {
    const root = asRecord(previewResult);
    const rows = asRecord(root?.rows);
    return asArray(rows?.items);
  }, [previewResult]);

  const previewSummaryMeta = useMemo(() => {
    const root = asRecord(previewResult);
    return asRecord(root?.summary);
  }, [previewResult]);

  const previewTemplateIdentity = useMemo(() => {
    const structure = asRecord(previewFullStructure);
    return {
      templateCode: String(structure?.templateCode ?? "").trim(),
      templateName: String(structure?.templateName ?? "").trim(),
      versionLabel: String(structure?.versionLabel ?? "").trim(),
      templateVersionId: Number(structure?.templateVersionId ?? 0),
    };
  }, [previewFullStructure]);

  const previewTemplateColumns = useMemo<
    AccountingTemplateColumnSummary[]
  >(() => {
    const structure = asRecord(previewFullStructure);
    const fieldMappings = asArray(structure?.fieldMappings)
      .map((mapping) => ({
        fieldCode: String(mapping.fieldCode ?? "").trim(),
        label: String(mapping.fieldLabel ?? mapping.fieldCode ?? "").trim(),
        fieldType: String(mapping.fieldType ?? "text").trim() || "text",
        exportColumn: String(mapping.exportColumn ?? "").trim(),
        sortOrder: Number(mapping.sortOrder ?? 0),
      }))
      .filter((mapping) => mapping.fieldCode.length > 0)
      .sort((left, right) => left.sortOrder - right.sortOrder);

    return fieldMappings.map((mapping) => ({
      fieldCode: mapping.fieldCode,
      label: mapping.label,
      fieldType: mapping.fieldType,
      exportColumn: mapping.exportColumn,
    }));
  }, [previewFullStructure]);

  const previewTemplateRows = useMemo<AccountingBookRow[]>(() => {
    return previewRowItems.map((row) => ({
      ...row,
      rowType: row.rowType ?? row.lineType ?? "data",
    }));
  }, [previewRowItems]);

  const previewTemplateRowDefinitions = useMemo(() => {
    const structure = asRecord(previewFullStructure);
    return asArray(structure?.rowDefinitions);
  }, [previewFullStructure]);

  const previewRenderableColumns = useMemo<
    AccountingTemplateColumnSummary[]
  >(() => {
    if (previewTemplateColumns.length > 0) return previewTemplateColumns;
    return derivePreviewColumnsFromRows(previewRowItems);
  }, [previewTemplateColumns, previewRowItems]);

  const previewRenderIdentity = useMemo(() => {
    const fallbackVersionId = Number(pvVer || 0);
    return {
      templateCode: previewTemplateIdentity.templateCode || "unknown",
      templateName: previewTemplateIdentity.templateName || "Mẫu sổ tổng quát",
      versionLabel:
        previewTemplateIdentity.versionLabel ||
        (fallbackVersionId > 0 ? `v${fallbackVersionId}` : ""),
      templateVersionId:
        previewTemplateIdentity.templateVersionId || fallbackVersionId,
    };
  }, [previewTemplateIdentity, pvVer]);

  const compareActive = useMemo(() => {
    const root = asRecord(compareResult);
    const active = asRecord(root?.active);
    const summary = asRecord(active?.summary);
    const formulaValues = asRecord(summary?.formulaValues);
    const rows = asRecord(active?.rows);

    return {
      summary: summary
        ? {
            totalRows: Number(summary.totalRows ?? 0),
            totalRevenue: summary.totalRevenue,
            totalCost: summary.totalCost,
            totalTax: summary.totalTax,
          }
        : null,
      formulaValues: formulaValues
        ? Object.entries(formulaValues).map(([code, value]) => ({
            code,
            value,
          }))
        : [],
      rowsMeta: rows
        ? {
            hasMore: Boolean(rows.hasMore),
            loadedCount: Number(rows.loadedCount ?? 0),
            totalEstimated: Number(rows.totalEstimated ?? 0),
            nextCursor: String(rows.nextCursor ?? ""),
          }
        : null,
      rowItems: asArray(rows?.items),
    };
  }, [compareResult]);

  const compareDraft = useMemo(() => {
    const root = asRecord(compareResult);
    const draft = asRecord(root?.draft);
    const summary = asRecord(draft?.summary);
    const formulaValues = asRecord(summary?.formulaValues);
    const rows = asRecord(draft?.rows);

    return {
      summary: summary
        ? {
            totalRows: Number(summary.totalRows ?? 0),
            totalRevenue: summary.totalRevenue,
            totalCost: summary.totalCost,
            totalTax: summary.totalTax,
          }
        : null,
      formulaValues: formulaValues
        ? Object.entries(formulaValues).map(([code, value]) => ({
            code,
            value,
          }))
        : [],
      rowsMeta: rows
        ? {
            hasMore: Boolean(rows.hasMore),
            loadedCount: Number(rows.loadedCount ?? 0),
            totalEstimated: Number(rows.totalEstimated ?? 0),
            nextCursor: String(rows.nextCursor ?? ""),
          }
        : null,
      rowItems: asArray(rows?.items),
    };
  }, [compareResult]);

  const compareDiff = useMemo(() => {
    const root = asRecord(compareResult);
    const diff = asRecord(root?.diff);

    return {
      changedFormulas: Array.isArray(diff?.changedFormulas)
        ? diff.changedFormulas.map((item) => String(item ?? "")).filter(Boolean)
        : [],
      valueChanges: asArray(diff?.valueChanges).map((item) => ({
        code: String(item.code ?? ""),
        before: item.before,
        after: item.after,
      })),
    };
  }, [compareResult]);

  const traceOverview = useMemo(() => {
    const root = asRecord(traceResult);
    const traceItems = asArray(root?.trace).map((item) => {
      const rawDebug = item.debug;
      const debugText =
        rawDebug == null
          ? "-"
          : typeof rawDebug === "string"
            ? rawDebug
            : JSON.stringify(rawDebug);

      return {
        step: Number(item.step ?? 0),
        nodeType: String(item.nodeType ?? ""),
        description: String(item.description ?? ""),
        resolvedValue: item.resolvedValue,
        source: String(item.source ?? ""),
        debug: debugText,
        childrenCount: Array.isArray(item.children) ? item.children.length : 0,
      };
    });

    return {
      formulaCode: String(root?.formulaCode ?? ""),
      formulaName: String(root?.formulaName ?? ""),
      finalValue: root?.finalValue,
      traceItems,
    };
  }, [traceResult]);

  const referenceRows = useMemo(() => {
    return Object.entries(refData).map(([groupName, rawValue]) => {
      const normalizedValues: string[] = Array.isArray(rawValue)
        ? rawValue
            .map((item) => {
              if (item && typeof item === "object") {
                const record = item as Record<string, unknown>;
                const value = String(
                  record.value ?? record.code ?? record.key ?? "",
                ).trim();
                const label = String(
                  record.label ?? record.name ?? record.description ?? "",
                ).trim();
                if (value && label && label !== value) {
                  return `${value} (${label})`;
                }
                return value || label || toDisplayText(record);
              }
              return toDisplayText(item);
            })
            .filter(Boolean)
        : rawValue && typeof rawValue === "object"
          ? Object.entries(rawValue as Record<string, unknown>).map(
              ([k, v]) => `${k}: ${toDisplayText(v)}`,
            )
          : [toDisplayText(rawValue)];

      const previewItems = normalizedValues.slice(0, 20);
      return {
        groupName,
        count: normalizedValues.length,
        previewText: previewItems.join(", ") || "-",
        remainingCount:
          normalizedValues.length > previewItems.length
            ? normalizedValues.length - previewItems.length
            : 0,
      };
    });
  }, [refData]);

  const schemaRows = useMemo(() => {
    return schemas.map((schema, index) => {
      const nodeType = String(
        schema.nodeType ?? schema.type ?? schema.code ?? `schema-${index + 1}`,
      );
      const name = String(schema.displayName ?? schema.name ?? "-");
      const category = String(
        schema.category ?? schema.group ?? schema.nodeGroup ?? "-",
      );
      const resultType = String(
        schema.resultType ?? schema.returnType ?? schema.outputType ?? "-",
      );
      const inputCount = Array.isArray(schema.inputs)
        ? schema.inputs.length
        : Array.isArray(schema.parameters)
          ? schema.parameters.length
          : 0;
      const description = String(schema.description ?? schema.summary ?? "-");

      return {
        nodeType,
        name,
        category,
        resultType,
        inputCount,
        description,
        fieldCount: Object.keys(schema).length,
      };
    });
  }, [schemas]);

  const filteredRowTaxRateHints = useMemo(() => {
    const taxType = normalizeTaxTypeKey(rowForm.taxType);
    if (!taxType) return rowTaxRateHints;
    return rowTaxRateHints.filter((item) => item.taxType === taxType);
  }, [rowForm.taxType, rowTaxRateHints]);

  const fieldAggregationOptions = useMemo(
    () => ["none", "sum", "avg", "count", "min", "max"],
    [],
  );
  const selectedFieldAggregations = useMemo(
    () => parseAllowedAggregations(efAggs),
    [efAggs],
  );

  const hasSelectedEntity = Boolean(toNum(entEditId));
  const hasSelectedField = Boolean(toNum(efEditId));
  const currentFieldEntityId = efEntId || entEditId;

  const toggleFieldAggregation = (aggregation: string) => {
    setEfAggs((prev) => {
      const selected = new Set(parseAllowedAggregations(prev));
      if (selected.has(aggregation)) {
        selected.delete(aggregation);
      } else {
        selected.add(aggregation);
      }
      return stringifyAllowedAggregations(Array.from(selected));
    });
  };

  const versionIsActiveMap = useMemo(() => {
    const map = new Map<number, boolean>();
    templates.forEach((template: AccountingTemplateSummary) => {
      template.versions.forEach((version) => {
        map.set(version.templateVersionId, Boolean(version.isActive));
      });
    });
    return map;
  }, [templates]);

  const allowedTabKeys = useMemo<AccountingTabKey[]>(
    () => tabs.map((tab) => tab.key),
    [],
  );
  const coreTabs = useMemo(
    () =>
      tabs.filter(
        (tab) => tab.group === "core" && allowedTabKeys.includes(tab.key),
      ),
    [allowedTabKeys],
  );
  const supportTabs = useMemo(
    () =>
      tabs.filter(
        (tab) => tab.group === "support" && allowedTabKeys.includes(tab.key),
      ),
    [allowedTabKeys],
  );
  const searchParamsString = searchParams.toString();
  const tabParam = searchParams.get("tab");
  const activeTab: AccountingTabKey =
    isAccountingTabKey(tabParam) && allowedTabKeys.includes(tabParam)
      ? tabParam
      : "overview";

  const navigateToTab = useCallback(
    (tab: AccountingTabKey) => {
      const params = new URLSearchParams(searchParamsString);
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParamsString],
  );

  const log = useCallback((message: string, type: LogType = "info") => {
    setLogs((prev) =>
      [{ id: Date.now() + Math.random(), message, type }, ...prev].slice(
        0,
        100,
      ),
    );

    if (type === "error") {
      toast.error(message);
      return;
    }

    if (type === "ok" && shouldToastSuccessLog(message)) {
      toast.success(message);
    }
  }, []);

  const runSafe = useCallback(
    async (action: () => Promise<void>) => {
      try {
        setError("");
        await action();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
        setError(msg);
        log(msg, "error");
      }
    },
    [log],
  );

  const ensureDraftVersion = useCallback(
    (rawVersionId: string, featureName: string): number | null => {
      const versionId = toNum(rawVersionId);
      if (!versionId) {
        log(`Thiếu Template Version ID cho ${featureName}`, "error");
        return null;
      }

      const isActive = versionIsActiveMap.get(versionId);
      if (isActive === undefined) {
        const msg =
          "Không xác định được trạng thái phiên bản. Vui lòng Load Overview trước.";
        setError(msg);
        log(msg, "error");
        return null;
      }

      if (isActive) {
        const msg =
          "Phiên bản ACTIVE không được sửa trực tiếp. Hãy clone sang DRAFT rồi cập nhật.";
        setError(msg);
        log(msg, "error");
        return null;
      }

      return versionId;
    },
    [log, versionIsActiveMap],
  );

  const loadOverview = useCallback(async () => {
    await runSafe(async () => {
      const data = await getAccountingOverview();
      setOverview(data);
      log("Loaded overview", "ok");
    });
  }, [log, runSafe]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadOverview();
    });
  }, [loadOverview]);

  const versionOptions = useMemo(() => {
    const options: Array<{ label: string; value: string }> = [];
    templates.forEach((t: AccountingTemplateSummary) => {
      t.versions.forEach((v) => {
        options.push({
          value: String(v.templateVersionId),
          label: `${t.templateCode}/v${v.templateVersionId}: ${v.versionLabel} ${v.isActive ? "[ACT]" : "[DRAFT]"}`,
        });
      });
    });
    return options;
  }, [templates]);

  const templateOptions = useMemo(() => {
    return templates.map((template: AccountingTemplateSummary) => ({
      value: String(template.templateId),
      label: `${template.templateCode} - ${template.name}`,
    }));
  }, [templates]);

  const effectiveFldVer = fldVer || versionOptions[0]?.value || "";

  const rowRulesetOptions = useMemo(() => {
    return (overview?.taxRulesets ?? []).map((ruleset) => ({
      value: String(ruleset.rulesetId),
      label: `${ruleset.rulesetId} - ${ruleset.name} (${ruleset.code})`,
    }));
  }, [overview?.taxRulesets]);

  const effectiveRdVer = rdVer || versionOptions[0]?.value || "";
  const effectiveRdRulesetId = useMemo(() => {
    if (rowRulesetOptions.length === 0) {
      return rdRulesetId || "1";
    }
    const matched = rowRulesetOptions.some(
      (option) => option.value === rdRulesetId,
    );
    return matched ? rdRulesetId : rowRulesetOptions[0].value;
  }, [rdRulesetId, rowRulesetOptions]);

  const effectiveBtRulesetId = useMemo(() => {
    if (rowRulesetOptions.length === 0) {
      return btRulesetId || "1";
    }
    const matched = rowRulesetOptions.some(
      (option) => option.value === btRulesetId,
    );
    return matched ? btRulesetId : rowRulesetOptions[0].value;
  }, [btRulesetId, rowRulesetOptions]);

  const selectedRulesetMeta = useMemo(() => {
    const selectedId = Number(effectiveBtRulesetId);
    if (!selectedId) return null;
    return (
      (overview?.taxRulesets ?? []).find(
        (ruleset) => Number(ruleset.rulesetId ?? 0) === selectedId,
      ) ?? null
    );
  }, [effectiveBtRulesetId, overview?.taxRulesets]);

  const selectedRulesetId = Number(selectedRulesetMeta?.rulesetId ?? 0);
  const selectedRulesetIsActive = Boolean(selectedRulesetMeta?.isActive);
  const selectedRulesetStatus = selectedRulesetIsActive ? "active" : "inactive";

  const selectedBusinessTypeWithRates = useMemo(
    () =>
      businessTypesWithRates.find(
        (item) => item.businessTypeId === btSelectedId,
      ) ?? null,
    [businessTypesWithRates, btSelectedId],
  );

  const formulaOptions = useMemo(() => {
    return formulas.map((f: AccountingFormulaSummary) => ({
      value: String(f.formulaId),
      label: `${f.formulaId} - ${f.code}`,
    }));
  }, [formulas]);

  const businessTypeTaxTypeOptions = useMemo(() => {
    const values = new Set<string>(CANONICAL_TAX_TYPES);
    rowTaxTypeOptions.forEach((option) => {
      const normalized = normalizeTaxTypeKey(option.value);
      if (normalized) values.add(normalized);
    });
    btRatesForm.forEach((rate) => {
      const normalized = normalizeTaxTypeKey(rate.taxType);
      if (normalized) values.add(normalized);
    });

    return Array.from(values).map((value) => ({
      value,
      label: toTaxTypeLabel(value),
    }));
  }, [btRatesForm, rowTaxTypeOptions]);

  const goVersion = (id: number) => {
    setTvId(String(id));
    setFldVer(String(id));
    setRdVer(String(id));
    navigateToTab("version");
    void tvDetail(String(id));
  };

  const goFormula = (id: number) => {
    setFmId(String(id));
    setTrFId(String(id));
    navigateToTab("formulas");
    void fmDetail(String(id));
  };

  const hydrateBusinessTypeEditor = useCallback(
    (businessType: BusinessTypeWithRatesDto | null) => {
      if (!businessType) {
        setBtSelectedId("");
        setBtMetadataForm(emptyBusinessTypeMetadataForm);
        setBtRatesForm([]);
        return;
      }

      setBtSelectedId(businessType.businessTypeId);
      setBtMetadataForm({
        name: String(businessType.name ?? ""),
        description: String(businessType.description ?? ""),
        status: String(businessType.status ?? "active") || "active",
      });
      setBtRatesForm(
        (businessType.taxRates ?? []).map((rate) => ({
          taxType: normalizeTaxTypeKey(String(rate.taxType ?? "")),
          taxRate: String(rate.taxRate ?? ""),
          description: String(rate.description ?? ""),
        })),
      );
    },
    [],
  );

  const btLoad = useCallback(
    async (rawRulesetId?: string, preferredBusinessTypeId?: string) => {
      const rulesetId = toNum(rawRulesetId ?? effectiveBtRulesetId) ?? 1;
      await runSafe(async () => {
        const list = await getBusinessTypesWithRates(rulesetId);
        setBusinessTypesWithRates(list);

        if (list.length === 0) {
          hydrateBusinessTypeEditor(null);
          log(`No business types for ruleset ${rulesetId}`, "info");
          return;
        }

        const selected =
          list.find(
            (item) => item.businessTypeId === preferredBusinessTypeId,
          ) ?? list[0];
        hydrateBusinessTypeEditor(selected);
        log(`Loaded business types for ruleset ${rulesetId}`, "ok");
      });
    },
    [effectiveBtRulesetId, hydrateBusinessTypeEditor, log, runSafe],
  );

  const goBusinessType = useCallback(
    (businessTypeId?: string) => {
      const targetRulesetId = effectiveBtRulesetId;
      setBtRulesetId(targetRulesetId);
      navigateToTab("business-types");
      void btLoad(targetRulesetId, businessTypeId);
    },
    [btLoad, effectiveBtRulesetId, navigateToTab],
  );

  const handleBtRulesetSelect = (nextRulesetId: string) => {
    setBtRulesetId(nextRulesetId);
    void btLoad(nextRulesetId, btSelectedId || undefined);
  };

  const handleBtSelect = (nextBusinessTypeId: string) => {
    const selected =
      businessTypesWithRates.find(
        (item) => item.businessTypeId === nextBusinessTypeId,
      ) ?? null;
    hydrateBusinessTypeEditor(selected);
  };

  const addBtRate = () => {
    setBtRatesForm((prev) => [...prev, emptyBusinessTypeTaxRateForm]);
  };

  const updateBtRateField = (
    index: number,
    key: keyof BusinessTypeTaxRateForm,
    value: string,
  ) => {
    setBtRatesForm((prev) =>
      prev.map((rate, rateIndex) =>
        rateIndex === index
          ? {
              ...rate,
              [key]: key === "taxType" ? normalizeTaxTypeKey(value) : value,
            }
          : rate,
      ),
    );
  };

  const removeBtRate = (index: number) => {
    setBtRatesForm((prev) =>
      prev.filter((_, rateIndex) => rateIndex !== index),
    );
  };

  const btUpdateMetadata = async () => {
    if (!selectedBusinessTypeWithRates) return;
    await runSafe(async () => {
      const payload = {
        name: btMetadataForm.name.trim(),
        description: btMetadataForm.description.trim(),
        status: btMetadataForm.status.trim() || "active",
      };

      if (!payload.name) {
        throw new Error("Business type name không được để trống.");
      }

      await updateBusinessTypeMetadata(
        selectedBusinessTypeWithRates.businessTypeId,
        payload,
      );
      log(`Updated metadata for ${selectedBusinessTypeWithRates.code}`, "ok");
      await loadOverview();
      await btLoad(
        effectiveBtRulesetId,
        selectedBusinessTypeWithRates.businessTypeId,
      );
    });
  };

  const btReplaceRates = async () => {
    if (!selectedBusinessTypeWithRates) return;
    const rulesetId = toNum(effectiveBtRulesetId) ?? 1;

    await runSafe(async () => {
      const normalizedRows = btRatesForm
        .map((rate) => ({
          taxType: normalizeTaxTypeKey(rate.taxType),
          taxRate: rate.taxRate.trim(),
          description: rate.description.trim(),
        }))
        .filter((rate) => rate.taxType || rate.taxRate || rate.description);

      const rates = normalizedRows.map((rate, index) => {
        if (!rate.taxType) {
          throw new Error(`Thiếu taxType ở dòng ${index + 1}.`);
        }
        const parsedTaxRate = Number(rate.taxRate);
        if (!Number.isFinite(parsedTaxRate)) {
          throw new Error(`taxRate không hợp lệ ở dòng ${index + 1}.`);
        }

        return {
          taxType: rate.taxType,
          taxRate: parsedTaxRate,
          description: rate.description,
        };
      });

      await replaceBusinessTypeTaxRates(
        rulesetId,
        selectedBusinessTypeWithRates.businessTypeId,
        { rates },
      );
      log(
        `Replaced tax rates for ${selectedBusinessTypeWithRates.code} (ruleset ${rulesetId})`,
        "ok",
      );
      await btLoad(
        effectiveBtRulesetId,
        selectedBusinessTypeWithRates.businessTypeId,
      );
    });
  };

  const handleCreateRuleset = async () => {
    setCreateRulesetLoading(true);
    await runSafe(async () => {
      const payload: CreateTaxRulesetRequest = {
        code: createRulesetForm.code?.trim() || undefined,
        name: createRulesetForm.name?.trim() || undefined,
        description: createRulesetForm.description?.trim() || undefined,
        version: createRulesetForm.version?.trim() || undefined,
        effectiveFrom: createRulesetForm.effectiveFrom?.trim() || undefined,
        effectiveTo: createRulesetForm.effectiveTo?.trim() || undefined,
        cloneFromRulesetId: createRulesetForm.cloneFromRulesetId
          ? Number(createRulesetForm.cloneFromRulesetId)
          : null,
      };
      if (!payload.name) throw new Error("Ruleset name không được để trống.");
      if (!payload.effectiveFrom)
        throw new Error("effectiveFrom không được để trống.");
      await createTaxRuleset(payload);
      log(`Created ruleset: ${payload.name}`, "ok");
      setCreateRulesetForm({
        code: "",
        name: "",
        description: "",
        version: "",
        effectiveFrom: "",
        effectiveTo: "",
        cloneFromRulesetId: null,
      });
      setShowCreateRulesetModal(false);
      await loadOverview();
    });
    setCreateRulesetLoading(false);
  };

  const handleActivateRuleset = async (rulesetId: number) => {
    await runSafe(async () => {
      await activateTaxRuleset(rulesetId);
      log(`Activated ruleset ${rulesetId}`, "ok");
      await loadOverview();
      await btLoad(effectiveBtRulesetId);
    });
  };

  const handleDeactivateRuleset = async (rulesetId: number) => {
    await runSafe(async () => {
      await deactivateTaxRuleset(rulesetId);
      log(`Deactivated ruleset ${rulesetId}`, "ok");
      await loadOverview();
      await btLoad(effectiveBtRulesetId);
    });
  };

  const handleCreateBusinessType = async () => {
    setCreateBtLoading(true);
    await runSafe(async () => {
      const payload: CreateBusinessTypeRequest = {
        code: createBtForm.code?.trim() || undefined,
        name: createBtForm.name?.trim() || undefined,
        description: createBtForm.description?.trim() || undefined,
      };
      if (!payload.name)
        throw new Error("Business type name không được để trống.");
      await createBusinessType(payload);
      log(`Created business type: ${payload.name}`, "ok");
      setCreateBtForm({ code: "", name: "", description: "" });
      setShowCreateBtModal(false);
      await btLoad(effectiveBtRulesetId);
    });
    setCreateBtLoading(false);
  };

  useEffect(() => {
    if (activeTab !== "business-types") return;
    queueMicrotask(() => {
      void btLoad();
    });
  }, [activeTab, btLoad]);

  const getFirstCreatedVersionId = (
    templateData: Record<string, unknown>,
  ): number | null => {
    const versions = asArray(templateData.versions);
    for (const version of versions) {
      const versionId = Number(version.templateVersionId ?? 0);
      if (versionId > 0) {
        return versionId;
      }
    }

    return null;
  };

  const tvDetail = async (rawId?: string) => {
    const id = toNum(rawId ?? tvId);
    if (!id) return;
    await runSafe(async () => {
      const [d, rowDefinitions] = await Promise.all([
        getTemplateVersionDetail(id),
        getRowDefinitions(id),
      ]);
      setTvLabel(String(d.versionLabel ?? ""));
      setTvEffective(String(d.effectiveFrom ?? ""));
      setTvNotes(String(d.changeNotes ?? ""));
      setTvResult({ ...d, rowDefinitions });
      log(`Loaded template version ${id}`, "ok");
    });
  };

  const tvFull = async (rawId?: string) => {
    const id = toNum(rawId ?? tvId);
    if (!id) return;
    await runSafe(async () => {
      const d = await getTemplateVersionFullStructure(id);
      // Only update metadata fields if the full-structure response provides them.
      // tvDetail is the authoritative source for metadata; avoid overwriting with empty values.
      const newLabel = String(d.versionLabel ?? "");
      const newEffective = String(d.effectiveFrom ?? "");
      const newNotes = String(d.changeNotes ?? "");
      if (newLabel) setTvLabel(newLabel);
      if (newEffective) setTvEffective(newEffective);
      if (newNotes) setTvNotes(newNotes);
      setTvResult(d);
      log(`Loaded full structure ${id}`, "ok");
    });
  };

  const tvClone = async () => {
    const id = toNum(tvId);
    if (!id) return;
    await runSafe(async () => {
      const d = await cloneTemplateVersion(id);
      const newId = Number(d.templateVersionId ?? 0);
      if (newId > 0) {
        setTvId(String(newId));
        setFldVer(String(newId));
        setRdVer(String(newId));
        await tvDetail(String(newId));
      } else {
        setTvResult(d);
      }
      log(`Cloned version ${id}`, "ok");
      await loadOverview();
    });
  };

  const tvCreateTemplate = async (payload: CreateTemplateRequest) => {
    let createdVersionId: number | null = null;

    await runSafe(async () => {
      const createdTemplate = await createTemplate(payload);
      const firstVersionId = getFirstCreatedVersionId(createdTemplate);

      if (firstVersionId) {
        setTvId(String(firstVersionId));
        setFldVer(String(firstVersionId));
        setRdVer(String(firstVersionId));
        await tvDetail(String(firstVersionId));
        createdVersionId = firstVersionId;
      } else {
        setTvResult(createdTemplate);
      }

      const createdCode = String(createdTemplate.templateCode ?? "").trim();
      log(
        `Created template ${createdCode || payload.templateCode.toUpperCase()}`,
        "ok",
      );
      await loadOverview();
    });

    return createdVersionId;
  };

  const tvCreateVersion = async (
    templateId: number,
    payload: CreateTemplateVersionRequest,
  ) => {
    let createdVersionId: number | null = null;

    await runSafe(async () => {
      const createdVersion = await createTemplateVersion(templateId, payload);
      const newVersionId = Number(createdVersion.templateVersionId ?? 0);

      if (newVersionId > 0) {
        setTvId(String(newVersionId));
        setFldVer(String(newVersionId));
        setRdVer(String(newVersionId));
        await tvDetail(String(newVersionId));
        createdVersionId = newVersionId;
      } else {
        setTvResult(createdVersion);
      }

      log(`Created draft version for template ${templateId}`, "ok");
      await loadOverview();
    });

    return createdVersionId;
  };

  const tvUpdate = async () => {
    const id = ensureDraftVersion(tvId, "template metadata update");
    if (!id) return;
    await runSafe(async () => {
      const payload: Record<string, string> = {};
      if (tvLabel.trim()) payload.versionLabel = tvLabel;
      if (tvEffective.trim()) payload.effectiveFrom = tvEffective;
      if (tvNotes.trim()) payload.changeNotes = tvNotes;
      await updateTemplateVersion(id, payload);
      await tvDetail(String(id));
      log(`Updated version ${id}`, "ok");
    });
  };

  const tvActivate = async () => {
    const id = toNum(tvId);
    if (!id) return;
    await runSafe(async () => {
      await activateTemplateVersion(id);
      await tvDetail(String(id));
      log(`Activated version ${id}`, "ok");
      await loadOverview();
    });
  };

  const tvDeactivate = async () => {
    const id = toNum(tvId);
    if (!id) return;
    await runSafe(async () => {
      await deactivateTemplateVersion(id);
      await tvDetail(String(id));
      log(`Deactivated version ${id}`, "ok");
      await loadOverview();
    });
  };

  const tvDelete = async () => {
    const id = toNum(tvId);
    if (!id) return;
    await runSafe(async () => {
      await deleteTemplateVersion(id);
      // Clear current selection to avoid fetching detail/full-structure for a deleted version.
      setTvId("");
      setFldVer("");
      setRdVer("");
      setTvLabel("");
      setTvEffective("");
      setTvNotes("");
      setTvResult(null);
      log(`Deleted version ${id}`, "ok");
      await loadOverview();
    });
  };

  const fmDetail = async (rawId?: string) => {
    const id = toNum(rawId ?? fmId);
    if (!id) return;
    await runSafe(async () => {
      const d = await getFormulaDetail(id);
      setFmCode(String(d.code ?? "-"));
      setFmType(String(d.formulaType ?? "-"));
      setFmActive(Boolean(d.isActive) ? "Active" : "Inactive");
      setFmExplanation(
        String(d.explanation ?? "No explanation provided by AST Analyzer."),
      );
      setFmName(String(d.name ?? ""));
      setFmDesc(String(d.description ?? ""));
      setFmFType(String(d.formulaType ?? ""));
      setFmIsActive(Boolean(d.isActive) ? "true" : "false");
      setFmResultDataType(String(d.resultDataType ?? "decimal"));
      setFmRoundingMode(String(d.roundingMode ?? ""));
      setFmRoundingPrecision(String(d.roundingPrecision ?? "2"));
      const expr = String(d.expressionJson ?? "{}");
      setFmExprJson(expr);
      log(`Loaded formula ${id}`, "ok");
    });
  };

  const fmCreate = async () => {
    await runSafe(async () => {
      if (!fmCode.trim() || !fmName.trim() || !fmFType.trim()) {
        throw new Error("Tạo công thức cần nhập đủ code, name, formulaType.");
      }

      const payload: Record<string, unknown> = {
        code: fmCode.trim(),
        name: fmName.trim(),
        formulaType: fmFType.trim(),
        expressionJson: fmExprJson.trim() || "{}",
      };

      if (fmDesc.trim()) payload.description = fmDesc.trim();
      if (fmResultDataType.trim())
        payload.resultDataType = fmResultDataType.trim();
      if (fmRoundingMode.trim()) payload.roundingMode = fmRoundingMode.trim();
      if (fmRoundingPrecision.trim()) {
        const precision = Number(fmRoundingPrecision);
        if (Number.isFinite(precision)) payload.roundingPrecision = precision;
      }

      const created = await createFormula(payload as never);
      const newId = Number(created.formulaId ?? 0);
      if (newId > 0) {
        setFmId(String(newId));
        await fmDetail(String(newId));
      }

      log("Created formula", "ok");
      await loadOverview();
    });
  };

  const fmUpdate = async () => {
    const id = toNum(fmId);
    if (!id) return;
    await runSafe(async () => {
      const payload: Record<string, unknown> = {};
      if (fmName.trim()) payload.name = fmName;
      if (fmDesc.trim()) payload.description = fmDesc;
      if (fmFType.trim()) payload.formulaType = fmFType;
      if (fmExprJson.trim()) payload.expressionJson = fmExprJson;
      if (fmIsActive.trim()) payload.isActive = fmIsActive === "true";
      await updateFormulaTesting(id, payload);
      log(`Updated formula ${id}`, "ok");
      await fmDetail();
    });
  };

  const fmClone = async (payloadInput?: {
    newCode?: string;
    nameSuffix?: string;
  }) => {
    const id = toNum(fmId);
    if (!id) return;
    await runSafe(async () => {
      const payload: Record<string, string> = {};
      const nextCode = (payloadInput?.newCode ?? fmCloneCode).trim();
      const nextSuffix = (payloadInput?.nameSuffix ?? fmCloneSuffix).trim();
      if (nextCode) payload.newCode = nextCode;
      if (nextSuffix) payload.nameSuffix = nextSuffix;
      const d = await cloneFormula(id, payload);
      const newId = Number(d.formulaId ?? 0);
      if (newId > 0) {
        setFmId(String(newId));
        await fmDetail(String(newId));
      }
      log(`Cloned formula ${id}`, "ok");
      await loadOverview();
    });
  };

  const fmActivate = async () => {
    const id = toNum(fmId);
    if (!id) return;
    await runSafe(async () => {
      await updateFormulaTesting(id, { isActive: true });
      setFmIsActive("true");
      await fmDetail(String(id));
      log(`Activated formula ${id}`, "ok");
      await loadOverview();
    });
  };

  const fmDeactivate = async () => {
    const id = toNum(fmId);
    if (!id) return;
    await runSafe(async () => {
      await updateFormulaTesting(id, { isActive: false });
      setFmIsActive("false");
      await fmDetail(String(id));
      log(`Deactivated formula ${id}`, "ok");
      await loadOverview();
    });
  };

  const fldLoad = useCallback(
    async (rawVersionId?: string) => {
      const versionId = toNum(rawVersionId ?? effectiveFldVer);
      if (!versionId) return;
      await runSafe(async () => {
        const [d, overviewData, activeEntities, reference] = await Promise.all([
          getTemplateVersionDetail(versionId),
          getAccountingOverview(),
          getMappableEntities(true),
          getAccountingReference(),
        ]);

        setFieldMappings(asArray(d.fieldMappings));
        setMappingFormulaOptions(
          buildFormulaSelectOptions(overviewData.formulas ?? []),
        );

        setMappingEntityOptions(
          activeEntities.map((entity) => {
            const entityId = String(entity.entityId ?? "");
            const entityCode = String(entity.entityCode ?? "");
            const entityName = String(entity.displayName ?? "");
            return {
              value: entityId,
              label: `${entityCode} - ${entityName}`,
            };
          }),
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

        log(`Loaded field mappings for v${versionId}`, "ok");
      });
    },
    [effectiveFldVer, log, runSafe],
  );

  const handleFldVersionSelect = (nextVersionId: string) => {
    setFldVer(nextVersionId);
    void fldLoad(nextVersionId);
  };

  useEffect(() => {
    if (activeTab !== "mappings") return;
    queueMicrotask(() => {
      void fldLoad();
    });
  }, [activeTab, fldLoad]);

  useEffect(() => {
    const entityId = toNum(mappingForm.sourceEntityId);
    if (!entityId) return;

    let disposed = false;
    const targetEntityId = entityId;

    async function loadEntityFields() {
      try {
        const entityDetail = await getMappableEntityDetail(targetEntityId);
        const fields = asArray(entityDetail.fields).map((field) => ({
          value: String(field.fieldId ?? ""),
          label: `${String(field.fieldCode ?? "")} - ${String(field.displayName ?? "")}`,
        }));
        if (!disposed) {
          setMappingEntityFieldOptions(fields.filter((field) => field.value));
        }
      } catch {
        if (!disposed) {
          setMappingEntityFieldOptions([]);
        }
      }
    }

    void loadEntityFields();

    return () => {
      disposed = true;
    };
  }, [mappingForm.sourceEntityId]);

  const fldPick = (m: Record<string, unknown>) => {
    setMappingForm({
      mappingId: String(m.mappingId ?? ""),
      fieldCode: String(m.fieldCode ?? ""),
      fieldLabel: String(m.fieldLabel ?? ""),
      fieldType: String(m.fieldType ?? "decimal"),
      sourceType: String(m.sourceType ?? "query"),
      sourceEntityId: String(m.sourceEntityId ?? ""),
      sourceFieldId: String(m.sourceFieldId ?? ""),
      filterJson: String(m.filterJson ?? ""),
      aggregationType: String(m.aggregationType ?? ""),
      formulaId: String(m.formulaId ?? ""),
      formulaExpression: String(m.formulaExpression ?? ""),
      sortOrder: String(m.sortOrder ?? "0"),
      isRequired: String(Boolean(m.isRequired)),
    });
  };

  const fldCreate = async () => {
    const versionId = ensureDraftVersion(
      effectiveFldVer,
      "field mapping create",
    );
    if (!versionId) return;
    await runSafe(async () => {
      const sourceType = mappingForm.sourceType.trim().toLowerCase();
      const payload: Record<string, unknown> = {
        fieldCode: mappingForm.fieldCode,
        fieldLabel: mappingForm.fieldLabel,
        fieldType: mappingForm.fieldType,
        sourceType,
        sortOrder: Number(mappingForm.sortOrder || 0),
        isRequired: mappingForm.isRequired === "true",
      };
      const sourceEntityId = toNum(mappingForm.sourceEntityId);
      const sourceFieldId = toNum(mappingForm.sourceFieldId);
      const formulaId = toNum(mappingForm.formulaId);

      if (sourceType === "query") {
        if (!sourceEntityId || !sourceFieldId) {
          throw new Error(
            "Mapping nguồn query cần chọn đủ Source Entity và Source Field.",
          );
        }
        payload.sourceEntityId = sourceEntityId;
        payload.sourceFieldId = sourceFieldId;

        const filterJson = mappingForm.filterJson.trim();
        if (filterJson) {
          JSON.parse(filterJson);
          payload.filterJson = filterJson;
        }

        const aggregationType = mappingForm.aggregationType.trim();
        if (aggregationType && aggregationType.toLowerCase() !== "none") {
          payload.aggregationType = aggregationType;
        }
      }

      if (sourceType === "formula") {
        if (!formulaId) {
          throw new Error("Mapping nguồn formula cần chọn Formula ID.");
        }
        payload.formulaId = formulaId;
        if (mappingForm.formulaExpression.trim()) {
          payload.formulaExpression = mappingForm.formulaExpression;
        }
      }

      await createFieldMapping(versionId, payload as never);
      log("Created field mapping", "ok");
      await fldLoad();
    });
  };

  const fldUpdate = async () => {
    const versionId = ensureDraftVersion(
      effectiveFldVer,
      "field mapping update",
    );
    if (!versionId) return;
    const mappingId = toNum(mappingForm.mappingId);
    if (!mappingId) return;
    await runSafe(async () => {
      const sourceType = mappingForm.sourceType.trim().toLowerCase();
      const payload: Record<string, unknown> = {
        sourceType,
        sortOrder: Number(mappingForm.sortOrder || 0),
      };
      if (mappingForm.fieldLabel.trim())
        payload.fieldLabel = mappingForm.fieldLabel;
      if (mappingForm.fieldType.trim())
        payload.fieldType = mappingForm.fieldType;
      const sourceEntityId = toNum(mappingForm.sourceEntityId);
      const sourceFieldId = toNum(mappingForm.sourceFieldId);
      const formulaId = toNum(mappingForm.formulaId);

      if (sourceType === "query") {
        if (!sourceEntityId || !sourceFieldId) {
          throw new Error(
            "Mapping nguồn query cần chọn đủ Source Entity và Source Field.",
          );
        }
        payload.sourceEntityId = sourceEntityId;
        payload.sourceFieldId = sourceFieldId;

        const filterJson = mappingForm.filterJson.trim();
        if (filterJson) {
          JSON.parse(filterJson);
          payload.filterJson = filterJson;
        }

        const aggregationType = mappingForm.aggregationType.trim();
        if (aggregationType && aggregationType.toLowerCase() !== "none") {
          payload.aggregationType = aggregationType;
        }
      }

      if (sourceType === "formula") {
        if (!formulaId) {
          throw new Error("Mapping nguồn formula cần chọn Formula ID.");
        }
        payload.formulaId = formulaId;
        if (mappingForm.formulaExpression.trim()) {
          payload.formulaExpression = mappingForm.formulaExpression;
        }
      }

      await updateFieldMappingForTesting(mappingId, payload as never);
      log(`Updated mapping ${mappingId}`, "ok");
      await fldLoad();
    });
  };

  const fldDelete = async (rawMappingId?: string) => {
    const versionId = ensureDraftVersion(
      effectiveFldVer,
      "field mapping delete",
    );
    if (!versionId) return;
    const mappingId = toNum(rawMappingId ?? mappingForm.mappingId);
    if (!mappingId) return;
    await runSafe(async () => {
      await deleteFieldMapping(mappingId);
      if (String(mappingId) === mappingForm.mappingId) {
        setMappingForm(emptyMappingForm);
      }
      log(`Deleted mapping ${mappingId}`, "ok");
      await fldLoad();
    });
  };

  const rdLoad = useCallback(
    async (rawVersionId?: string, rawRulesetId?: string) => {
      const versionId = toNum(rawVersionId ?? effectiveRdVer);
      if (!versionId) return;
      const rulesetId = toNum(rawRulesetId ?? effectiveRdRulesetId) ?? 1;
      await runSafe(async () => {
        const [rows, detail, overviewData, reference, businessTypeRates] =
          await Promise.all([
            getRowDefinitions(versionId),
            getTemplateVersionDetail(versionId),
            getAccountingOverview(),
            getAccountingReference(),
            getBusinessTypesWithRates(rulesetId),
          ]);

        setRowDefs(asArray(rows));

        setRowFormulaOptions(
          buildFormulaSelectOptions(overviewData.formulas ?? []),
        );

        const visibleOptions = asArray(detail.fieldMappings)
          .map((mapping) => {
            const code = String(mapping.fieldCode ?? "").trim();
            if (!code) return null;
            const label = String(mapping.fieldLabel ?? code).trim();
            return {
              value: code,
              label: `${code} - ${label}`,
            };
          })
          .filter(
            (option): option is { value: string; label: string } => !!option,
          );
        setRowVisibleFieldOptions(visibleOptions);

        const refRowTypes = asOptionList(
          (reference as Record<string, unknown>).rowTypes,
        );
        if (refRowTypes.length > 0) setRowTypeOptions(refRowTypes);
        const refPositions = asOptionList(
          (reference as Record<string, unknown>).positions,
        );
        if (refPositions.length > 0) setRowPositionOptions(refPositions);
        const refSections = asOptionList(
          (reference as Record<string, unknown>).sectionTypes,
        );
        if (refSections.length > 0) setRowSectionTypeOptions(refSections);

        const refTaxTypes = asOptionList(
          (reference as Record<string, unknown>).taxTypes,
        );
        const taxTypeFromRates = businessTypeRates
          .flatMap((item) => item.taxRates ?? [])
          .map((rate) => normalizeTaxTypeKey(String(rate.taxType ?? "")))
          .filter(Boolean);
        const mergedTaxTypes = Array.from(
          new Set([
            ...CANONICAL_TAX_TYPES,
            ...refTaxTypes.map((item) => normalizeTaxTypeKey(item.value)),
            ...taxTypeFromRates,
          ]),
        ).map((value) => {
          const refMatch = refTaxTypes.find(
            (item) => normalizeTaxTypeKey(item.value) === value,
          );
          return {
            value,
            label: refMatch?.label || toTaxTypeLabel(value),
          };
        });
        if (mergedTaxTypes.length > 0) setRowTaxTypeOptions(mergedTaxTypes);

        const hints: RowTaxRateHint[] = businessTypeRates.flatMap(
          (businessType) =>
            (businessType.taxRates ?? []).map((rate) => ({
              taxType: normalizeTaxTypeKey(String(rate.taxType ?? "")),
              businessTypeCode: String(businessType.code ?? ""),
              businessTypeName: String(businessType.name ?? ""),
              taxRate: Number(rate.taxRate ?? 0),
              description: String(rate.description ?? ""),
            })),
        );
        setRowTaxRateHints(hints);

        log(`Loaded row definitions for v${versionId}`, "ok");
      });
    },
    [effectiveRdRulesetId, effectiveRdVer, runSafe, log],
  );

  const handleRdVersionSelect = (nextVersionId: string) => {
    setRdVer(nextVersionId);
    void rdLoad(nextVersionId, effectiveRdRulesetId);
  };

  const handleRdRulesetSelect = (nextRulesetId: string) => {
    setRdRulesetId(nextRulesetId);
    void rdLoad(effectiveRdVer, nextRulesetId);
  };

  useEffect(() => {
    if (activeTab !== "rowdefs") return;
    queueMicrotask(() => {
      void rdLoad();
    });
  }, [activeTab, rdLoad]);

  const toggleRowVisibleFieldCode = (fieldCode: string) => {
    setRowForm((prev) => {
      const selected = new Set(parseVisibleFieldCodes(prev.visibleFieldCodes));
      if (selected.has(fieldCode)) {
        selected.delete(fieldCode);
      } else {
        selected.add(fieldCode);
      }
      return {
        ...prev,
        visibleFieldCodes: stringifyVisibleFieldCodes(Array.from(selected)),
      };
    });
  };

  const rdPick = (r: Record<string, unknown>) => {
    setRowForm({
      rowDefId: String(r.rowDefId ?? ""),
      rowType: String(r.rowType ?? "data_placeholder"),
      rowLabel: String(r.rowLabel ?? ""),
      position: String(r.position ?? "per_group"),
      sortOrder: String(r.sortOrder ?? "100"),
      sectionType: String(r.sectionType ?? ""),
      sectionFilterValue: String(r.sectionFilterValue ?? ""),
      groupByField: String(r.groupByField ?? ""),
      formulaId: String(r.formulaId ?? ""),
      taxType: normalizeTaxTypeKey(String(r.taxType ?? "")),
      visibleFieldCodes: String(r.visibleFieldCodes ?? ""),
    });
    setRowActionMenuId("");
    setRowEditorMode("update");
  };

  const rdCreate = async () => {
    const versionId = ensureDraftVersion(
      effectiveRdVer,
      "row definition create",
    );
    if (!versionId) return;
    await runSafe(async () => {
      const payload: Record<string, unknown> = {
        rowType: rowForm.rowType,
        rowLabel: rowForm.rowLabel || null,
        position: rowForm.position,
        sortOrder: Number(rowForm.sortOrder || 100),
      };
      const formulaId = toNum(rowForm.formulaId);
      if (rowForm.sectionType.trim()) payload.sectionType = rowForm.sectionType;
      if (rowForm.sectionFilterValue.trim())
        payload.sectionFilterValue = rowForm.sectionFilterValue;
      if (rowForm.groupByField.trim())
        payload.groupByField = rowForm.groupByField;
      if (formulaId) payload.formulaId = formulaId;
      if (rowForm.taxType.trim()) {
        payload.taxType = normalizeTaxTypeKey(rowForm.taxType);
      }
      if (rowForm.visibleFieldCodes.trim())
        payload.visibleFieldCodes = rowForm.visibleFieldCodes;
      await createRowDefinition(versionId, payload as never);
      log("Created row definition", "ok");
      setRowForm(emptyRowForm);
      setRowEditorMode("create");
      await rdLoad();
    });
  };

  const rdUpdate = async () => {
    const versionId = ensureDraftVersion(
      effectiveRdVer,
      "row definition update",
    );
    if (!versionId) return;
    const rowId = toNum(rowForm.rowDefId);
    if (!rowId) return;
    await runSafe(async () => {
      await updateRowDefinition(rowId, {
        rowType: rowForm.rowType,
        rowLabel: rowForm.rowLabel || null,
        position: rowForm.position,
        sortOrder: Number(rowForm.sortOrder || 100),
        sectionType: rowForm.sectionType || null,
        sectionFilterValue: rowForm.sectionFilterValue || null,
        groupByField: rowForm.groupByField || null,
        formulaId: toNum(rowForm.formulaId),
        taxType: rowForm.taxType ? normalizeTaxTypeKey(rowForm.taxType) : null,
        visibleFieldCodes: rowForm.visibleFieldCodes || null,
      });
      log(`Updated row definition ${rowId}`, "ok");
      await rdLoad();
    });
  };

  const rdDelete = async (rawRowId?: string) => {
    const versionId = ensureDraftVersion(
      effectiveRdVer,
      "row definition delete",
    );
    if (!versionId) return;
    const rowId = toNum(rawRowId ?? rowForm.rowDefId);
    if (!rowId) return;
    await runSafe(async () => {
      await deleteRowDefinition(rowId);
      setRowForm(emptyRowForm);
      setRowActionMenuId("");
      setRowEditorMode("create");
      log(`Deleted row definition ${rowId}`, "ok");
      await rdLoad();
    });
  };

  const entApplyDetail = useCallback((entity: Record<string, unknown>) => {
    const entityId = String(entity.entityId ?? "");
    setEntEditId(entityId);
    setEntCode(String(entity.entityCode ?? ""));
    setEntName(String(entity.displayName ?? ""));
    setEntCat(String(entity.category ?? "revenue"));
    setEntDesc(String(entity.description ?? ""));
    setEntIsActive(Boolean(entity.isActive) ? "true" : "false");
    setSelectedEntityName(String(entity.entityCode ?? "-"));

    setEntityFields(asArray(entity.fields));

    setEfEditId("");
    setEfEntId(entityId);
    setEfCode("");
    setEfName("");
    setEfDtype("decimal");
    setEfAggs('["sum","none"]');
    setEfDesc("");
    setEfIsActive("true");
  }, []);

  const entLoad = useCallback(
    async (preferredEntityId?: number) => {
      await runSafe(async () => {
        const data = await getMappableEntities();
        const list = asArray(data);
        setEntities(list);

        const firstEntityId = Number(list[0]?.entityId ?? 0);
        const hasPreferred =
          typeof preferredEntityId === "number" &&
          list.some(
            (entity) => Number(entity.entityId ?? 0) === preferredEntityId,
          );
        const targetEntityId = hasPreferred
          ? preferredEntityId
          : firstEntityId > 0
            ? firstEntityId
            : 0;

        if (targetEntityId > 0) {
          const detail = await getMappableEntityDetail(targetEntityId);
          entApplyDetail(detail);
        } else {
          setSelectedEntityName("-");
          setEntityFields([]);
          setEntEditId("");
          setEntCode("");
          setEntName("");
          setEntCat("revenue");
          setEntDesc("");
          setEntIsActive("true");
          setEfEditId("");
          setEfEntId("");
          setEfCode("");
          setEfName("");
          setEfDtype("decimal");
          setEfAggs('["sum","none"]');
          setEfDesc("");
          setEfIsActive("true");
        }

        log("Loaded entities", "ok");
      });
    },
    [entApplyDetail, log, runSafe],
  );

  const entSelect = useCallback(
    async (entityId: number) => {
      if (!entityId) return;
      await runSafe(async () => {
        const detail = await getMappableEntityDetail(entityId);
        entApplyDetail(detail);
        log(`Loaded fields for entity ${entityId}`, "ok");
      });
    },
    [entApplyDetail, log, runSafe],
  );

  const entCreate = async () => {
    await runSafe(async () => {
      const payload: Record<string, unknown> = {
        entityCode: entCode.trim(),
        displayName: entName.trim(),
        category: entCat,
      };
      if (entDesc.trim()) payload.description = entDesc.trim();
      const created = await createMappableEntity(payload as never);
      const newId = Number(created.entityId ?? 0);
      log("Created entity", "ok");
      await entLoad(newId > 0 ? newId : undefined);
    });
  };

  const entUpdate = async () => {
    const id = toNum(entEditId);
    if (!id) return;
    await runSafe(async () => {
      const payload: Record<string, unknown> = {};
      if (entCode.trim()) payload.entityCode = entCode.trim();
      if (entName.trim()) payload.displayName = entName.trim();
      if (entCat.trim()) payload.category = entCat.trim();
      if (entDesc.trim()) payload.description = entDesc.trim();
      payload.isActive = entIsActive === "true";
      await updateMappableEntity(id, payload as never);
      log(`Updated entity ${id}`, "ok");
      await entLoad(id);
    });
  };

  const openEntityDeleteConfirm = useCallback(
    (rawEntityId?: string, entityCode?: string) => {
      const id = toNum(rawEntityId ?? entEditId);
      if (!id) return;
      const selectedEntityId = toNum(entEditId);
      const resolvedCode =
        entityCode?.trim() || (selectedEntityId === id ? entCode.trim() : "");
      setEntityDeleteTarget({ id, code: resolvedCode });
    },
    [entCode, entEditId],
  );

  const entDelete = async () => {
    const id = entityDeleteTarget?.id;
    if (!id) return;
    try {
      setEntityDeleteBusy(true);
      setError("");
      await deleteMappableEntity(id);
      log(`Deleted entity ${id}`, "ok");
      await entLoad();
      setEntityDeleteTarget(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Có lỗi xảy ra";
      setError(msg);
      log(msg, "error");
    } finally {
      setEntityDeleteBusy(false);
    }
  };

  const efCreate = async () => {
    const entityId = toNum(currentFieldEntityId);
    if (!entityId) return;
    await runSafe(async () => {
      const payload: Record<string, unknown> = {
        fieldCode: efCode.trim(),
        displayName: efName.trim(),
        dataType: efDtype,
        allowedAggregations: efAggs,
      };
      if (efDesc.trim()) payload.description = efDesc.trim();
      await createMappableField(entityId, payload as never);
      log("Created field", "ok");
      await entSelect(entityId);
    });
  };

  const efUpdate = async () => {
    const fieldId = toNum(efEditId);
    const entityId = toNum(currentFieldEntityId);
    if (!fieldId || !entityId) return;
    await runSafe(async () => {
      const payload: Record<string, unknown> = {};
      if (efCode.trim()) payload.fieldCode = efCode.trim();
      if (efName.trim()) payload.displayName = efName.trim();
      if (efDesc.trim()) payload.description = efDesc.trim();
      if (efDtype.trim()) payload.dataType = efDtype;
      if (efAggs.trim()) payload.allowedAggregations = efAggs;
      payload.isActive = efIsActive === "true";
      await updateMappableField(fieldId, payload as never);
      log(`Updated field ${fieldId}`, "ok");
      await entSelect(entityId);
    });
  };

  useEffect(() => {
    if (activeTab !== "entities") return;
    queueMicrotask(() => {
      void entLoad();
    });
  }, [activeTab, entLoad]);

  const loadRef = async () => {
    await runSafe(async () => {
      const d = await getAccountingReference();
      setRefData(d);
      log("Loaded enum reference", "ok");
    });
  };

  const loadSchemas = async () => {
    await runSafe(async () => {
      const d = await getFormulaNodeSchemas();
      setSchemas(asArray(d));
      log("Loaded node schemas", "ok");
    });
  };

  const runCompare = async () => {
    await runSafe(async () => {
      const payload = {
        businessLocationId: Number(cmpLoc || 0),
        periodId: Number(cmpPer || 0),
        draftVersionId: Number(cmpDraft || 0),
        activeVersionId: toNum(cmpActive),
        groupNumber: Number(cmpGrp || 0),
        taxMethod: cmpMeth,
        rulesetId: Number(cmpRule || 0),
        batchSize: Number(cmpBatch || 20),
        businessTypeIds: cmpBiz
          ? cmpBiz
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      };
      const d = await runAccountingCompare(payload);
      setCompareResult(d);
      log("Compare finished", "ok");
    });
  };

  const runTrace = async () => {
    await runSafe(async () => {
      const payload = {
        formulaId: Number(trFId || 0),
        businessLocationId: Number(trLoc || 0),
        periodId: Number(trPer || 0),
        rulesetId: Number(trRule || 0),
        businessTypeIds: trBiz
          ? trBiz
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
      };
      const d = await runAccountingTrace(payload);
      setTraceResult(d);
      log("Trace finished", "ok");
    });
  };

  const runPreview = async () => {
    await runSafe(async () => {
      const payload = {
        businessLocationId: Number(pvLoc || 0),
        periodId: Number(pvPer || 0),
        templateVersionId: Number(pvVer || 0),
        groupNumber: Number(pvGrp || 0),
        taxMethod: pvMeth,
        rulesetId: Number(pvRule || 0),
        businessTypeIds: pvBiz
          ? pvBiz
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
          : [],
        batchSize: Number(pvBatch || 20),
      };

      setPreviewFullStructure(null);
      setPreviewResult(null);
      const reference = await getAccountingReference();
      setRefData(reference);

      if (payload.templateVersionId > 0) {
        try {
          const fullStructure = await getTemplateVersionFullStructure(
            payload.templateVersionId,
          );
          setPreviewFullStructure(fullStructure);
        } catch {
          log(
            "Preview data loaded nhưng không tải được full structure để dựng mẫu sổ.",
            "error",
          );
        }
      }

      log("Preview finished", "ok");
    });
  };

  const toggleBusinessTypeCsv = useCallback(
    (
      currentValue: string,
      setValue: (value: string) => void,
      businessTypeId: string,
    ) => {
      const currentIds = currentValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const hasId = currentIds.includes(businessTypeId);
      const nextIds = hasId
        ? currentIds.filter((item) => item !== businessTypeId)
        : [...currentIds, businessTypeId];
      setValue(nextIds.join(", "));
    },
    [],
  );

  return (
    <main className="space-y-6" aria-labelledby="admin-accounting-title">
      <Dialog
        open={Boolean(entityDeleteTarget)}
        onOpenChange={(open) => {
          if (!open && !entityDeleteBusy) {
            setEntityDeleteTarget(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa entity</DialogTitle>
            <DialogDescription>
              {entityDeleteTarget
                ? `Bạn có chắc chắn muốn xóa entity ${entityDeleteTarget.code ? `${entityDeleteTarget.code} (#${entityDeleteTarget.id})` : `#${entityDeleteTarget.id}`} không? Chỉ entity đang Inactive mới xóa được.`
                : "Chỉ entity đang Inactive mới xóa được."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEntityDeleteTarget(null)}
              disabled={entityDeleteBusy}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => void entDelete()}
              disabled={entityDeleteBusy}
            >
              {entityDeleteBusy ? "Đang xóa..." : "Xóa entity"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-3">
          <nav aria-label="Admin accounting sections" className="space-y-3">
            <section aria-label="Core management" className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Chức năng chính
              </p>
              <div className="flex flex-wrap gap-2">
                {coreTabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => navigateToTab(tab.key)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                      activeTab === tab.key
                        ? "border-[#23C4C1]/40 bg-[#23C4C1]/10 text-[#15918f]"
                        : "border-gray-200 bg-white text-gray-600 hover:border-[#23C4C1]/30 hover:bg-[#23C4C1]/5"
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </section>

            {supportTabs.length > 0 ? (
              <section aria-label="Support tools" className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Công cụ hỗ trợ
                </p>
                <div className="flex flex-wrap gap-2">
                  {supportTabs.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => navigateToTab(tab.key)}
                      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                        activeTab === tab.key
                          ? "border-[#23C4C1]/40 bg-[#23C4C1]/10 text-[#15918f]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#23C4C1]/30 hover:bg-[#23C4C1]/5"
                      }`}
                    >
                      {tab.icon}
                      {tab.label}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </nav>
        </CardContent>
      </Card>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Các Mẫu Sổ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Mã</th>
                      <th className="px-3 py-2">Tên</th>
                      <th className="px-3 py-2">Trạng thái</th>
                      <th className="px-3 py-2">Hiệu Lực</th>
                      <th className="px-3 py-2">Phiên bản</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((t) => {
                      const activeVersion = t.versions.find((v) => v.isActive);
                      return (
                        <tr key={t.templateId} className="border-t">
                          <td className="px-3 py-2">{t.templateId}</td>
                          <td className="px-3 py-2 font-mono text-xs">
                            {t.templateCode}
                          </td>
                          <td className="px-3 py-2">
                            {t.name}
                            {t.description && (
                              <div className=" text-gray-400 ">
                                {t.description}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <Badge
                              variant="secondary"
                              className={
                                t.isActive
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-red-50 text-red-700"
                              }
                            >
                              {t.isActive ? "Hoạt động" : "Không hoạt động"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2">
                            {activeVersion?.effectiveFrom
                              ? new Date(
                                  activeVersion.effectiveFrom,
                                ).toLocaleDateString("vi-VN")
                              : "—"}
                          </td>
                          <td className="px-3 py-2">
                            <div className="space-y-1">
                              {t.versions.map((v) => (
                                <button
                                  key={v.templateVersionId}
                                  type="button"
                                  onClick={() => goVersion(v.templateVersionId)}
                                  className={`block text-left text-xs ${v.isActive ? "text-emerald-700" : "text-gray-600 hover:text-sky-700"} hover:underline`}
                                >
                                  {v.versionLabel}{" "}
                                  {v.isActive ? "[ACT]" : "[DRAFT]"}
                                </button>
                              ))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Loại Hình Kinh Doanh</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Mã</th>
                      <th className="px-3 py-2">Tên ngành</th>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessTypes.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={4}>
                          Chưa có business type trong overview.
                        </td>
                      </tr>
                    ) : (
                      businessTypes.map(
                        (item: AccountingBusinessTypeSummary) => (
                          <tr key={item.businessTypeId} className="border-t">
                            <td className="px-3 py-2 font-mono text-xs">
                              {item.code}
                            </td>
                            <td className="px-3 py-2">{item.name}</td>
                            <td className="px-3 py-2 font-mono text-[11px] text-gray-500">
                              {item.businessTypeId}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button
                                type="button"
                                onClick={() =>
                                  goBusinessType(item.businessTypeId)
                                }
                                className="inline-flex items-center gap-1 text-sky-700 hover:underline"
                              >
                                Di chuyển <ArrowRight className="h-3 w-3" />
                              </button>
                            </td>
                          </tr>
                        ),
                      )
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Công Thức</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Mã Công Thức</th>
                      <th className="px-3 py-2">Tên</th>
                      <th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Hoạt động</th>
                      <th className="px-3 py-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formulas.map((f) => (
                      <tr key={f.formulaId} className="border-t">
                        <td className="px-3 py-2">{f.formulaId}</td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {f.code}
                        </td>
                        <td className="px-3 py-2">{f.name}</td>
                        <td className="px-3 py-2">{f.formulaType}</td>
                        <td className="px-3 py-2">
                          <Badge
                            variant="secondary"
                            className={
                              f.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }
                          >
                            {f.isActive ? "Hoạt động" : "Không hoạt động"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => goFormula(f.formulaId)}
                            className="inline-flex items-center gap-1 text-sky-700"
                          >
                            Di chuyển <ArrowRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "business-types" ? (
        <>
          {showCreateRulesetModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div
                className="absolute inset-0"
                onClick={() => setShowCreateRulesetModal(false)}
              />
              <Card className="relative z-10 max-h-[85vh] w-full max-w-2xl overflow-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>Tạo mới Ruleset</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => setShowCreateRulesetModal(false)}
                    >
                      Đóng
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      value={createRulesetForm.code ?? ""}
                      onChange={(e) =>
                        setCreateRulesetForm((prev) => ({
                          ...prev,
                          code: e.target.value,
                        }))
                      }
                      placeholder="Code (e.g. CIRCULAR_2025)"
                      className="col-span-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                    <input
                      value={createRulesetForm.name ?? ""}
                      onChange={(e) =>
                        setCreateRulesetForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Name *"
                      className="col-span-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                    <input
                      value={createRulesetForm.version ?? ""}
                      onChange={(e) =>
                        setCreateRulesetForm((prev) => ({
                          ...prev,
                          version: e.target.value,
                        }))
                      }
                      placeholder="Version (e.g. v1)"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                    <input
                      value={
                        createRulesetForm.cloneFromRulesetId != null
                          ? String(createRulesetForm.cloneFromRulesetId)
                          : ""
                      }
                      onChange={(e) =>
                        setCreateRulesetForm((prev) => ({
                          ...prev,
                          cloneFromRulesetId: e.target.value
                            ? Number(e.target.value)
                            : null,
                        }))
                      }
                      placeholder="Clone từ ruleset ID (tùy chọn)"
                      type="number"
                      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Hiệu lực từ *
                      </label>
                      <input
                        type="date"
                        value={createRulesetForm.effectiveFrom ?? ""}
                        onChange={(e) =>
                          setCreateRulesetForm((prev) => ({
                            ...prev,
                            effectiveFrom: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500">
                        Hiệu lực đến (tùy chọn)
                      </label>
                      <input
                        type="date"
                        value={createRulesetForm.effectiveTo ?? ""}
                        onChange={(e) =>
                          setCreateRulesetForm((prev) => ({
                            ...prev,
                            effectiveTo: e.target.value,
                          }))
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <textarea
                      value={createRulesetForm.description ?? ""}
                      onChange={(e) =>
                        setCreateRulesetForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Mô tả"
                      rows={2}
                      className="col-span-2 w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void handleCreateRuleset()}
                    disabled={createRulesetLoading}
                  >
                    {createRulesetLoading ? "Creating..." : "Create Ruleset"}
                  </Button>

                  {(overview?.taxRulesets ?? []).length > 0 ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Existing Rulesets
                      </p>
                      <div className="max-h-56 space-y-1 overflow-auto">
                        {(overview?.taxRulesets ?? []).map((rs) => {
                          const id = Number(rs.rulesetId ?? 0);
                          const name = String(rs.name ?? "");
                          const isActive = Boolean(rs.isActive);
                          const status = isActive ? "active" : "inactive";
                          return (
                            <div
                              key={id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                            >
                              <div>
                                <span className="font-medium">
                                  [{id}] {name}
                                </span>
                                <Badge
                                  variant="secondary"
                                  className={
                                    isActive
                                      ? "ml-2 bg-emerald-50 text-emerald-700"
                                      : "ml-2 bg-gray-100 text-gray-500"
                                  }
                                >
                                  {status || "unknown"}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                {!isActive ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 border-emerald-300 px-2 text-xs text-emerald-700 hover:bg-emerald-50"
                                    onClick={() =>
                                      void handleActivateRuleset(id)
                                    }
                                  >
                                    Activate
                                  </Button>
                                ) : null}
                                {isActive ? (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-6 border-red-300 px-2 text-xs text-red-600 hover:bg-red-50"
                                    onClick={() =>
                                      void handleDeactivateRuleset(id)
                                    }
                                  >
                                    Deactivate
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>
          ) : null}

          {showCreateBtModal ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
              <div
                className="absolute inset-0"
                onClick={() => setShowCreateBtModal(false)}
              />
              <Card className="relative z-10 w-full max-w-xl rounded-xl border border-gray-200 bg-white shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>Create New Business Type</CardTitle>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={() => setShowCreateBtModal(false)}
                    >
                      Close
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <input
                    value={createBtForm.code ?? ""}
                    onChange={(e) =>
                      setCreateBtForm((prev) => ({
                        ...prev,
                        code: e.target.value,
                      }))
                    }
                    placeholder="Code (e.g. HKD_RETAIL)"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                  <input
                    value={createBtForm.name ?? ""}
                    onChange={(e) =>
                      setCreateBtForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Name *"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                  <textarea
                    value={createBtForm.description ?? ""}
                    onChange={(e) =>
                      setCreateBtForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description"
                    rows={3}
                    className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                  <Button
                    size="sm"
                    className="w-full bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void handleCreateBusinessType()}
                    disabled={createBtLoading}
                  >
                    {createBtLoading ? "Creating..." : "Create Business Type"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>Các Loại Hình Kinh Doanh</CardTitle>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCreateRulesetModal(true)}
                    >
                      Tạo Ruleset Mới
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setShowCreateBtModal(true)}
                    >
                      Tạo Loại Hình Kinh Doanh Mới
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <select
                    value={effectiveBtRulesetId}
                    onChange={(e) => handleBtRulesetSelect(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  >
                    {rowRulesetOptions.length === 0 ? (
                      <option value="1">1 - Default Ruleset</option>
                    ) : (
                      rowRulesetOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))
                    )}
                  </select>
                  <div className="flex flex-wrap items-center gap-2">
                    {selectedRulesetId > 0 ? (
                      <Badge
                        variant="secondary"
                        className={
                          selectedRulesetIsActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {selectedRulesetStatus || "unknown"}
                      </Badge>
                    ) : null}
                    {selectedRulesetId > 0 ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className={
                          selectedRulesetIsActive
                            ? "border-red-300 text-red-600 hover:bg-red-50"
                            : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                        }
                        onClick={() =>
                          selectedRulesetIsActive
                            ? void handleDeactivateRuleset(selectedRulesetId)
                            : void handleActivateRuleset(selectedRulesetId)
                        }
                      >
                        {selectedRulesetIsActive
                          ? "Vô hiệu hóa Ruleset"
                          : "Kích hoạt Ruleset"}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-3 py-2">Mã</th>
                        <th className="px-3 py-2">Tên</th>
                        <th className="px-3 py-2">Trạng Thái</th>
                        <th className="px-3 py-2">Tỷ Lệ Thuế</th>
                      </tr>
                    </thead>
                    <tbody>
                      {businessTypesWithRates.length === 0 ? (
                        <tr>
                          <td className="px-3 py-3 text-gray-500" colSpan={4}>
                            Chưa có dữ liệu business type theo ruleset này.
                          </td>
                        </tr>
                      ) : (
                        businessTypesWithRates.map((item) => {
                          const isSelected =
                            item.businessTypeId === btSelectedId;
                          return (
                            <tr
                              key={item.businessTypeId}
                              className={`cursor-pointer border-t transition-colors ${
                                isSelected
                                  ? "bg-[#23C4C1]/15 text-teal-900 shadow-[inset_4px_0_0_0_#23C4C1]"
                                  : "hover:bg-gray-50/70"
                              }`}
                              onClick={() =>
                                handleBtSelect(item.businessTypeId)
                              }
                            >
                              <td className="px-3 py-2 font-mono text-xs">
                                {item.code}
                              </td>
                              <td className="px-3 py-2">{item.name}</td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant="secondary"
                                  className={
                                    item.status?.toLowerCase() === "active"
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-red-50 text-red-700"
                                  }
                                >
                                  {item.status || "unknown"}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600">
                                {(item.taxRates ?? [])
                                  .map(
                                    (rate) =>
                                      `${toTaxTypeLabel(String(rate.taxType ?? ""))}: ${(Number(rate.taxRate || 0) * 100).toFixed(2)}%`,
                                  )
                                  .join(" | ") || "-"}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Chỉnh Sửa Loại Hình Kinh Doanh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  <div className="font-medium text-gray-700">
                    {selectedBusinessTypeWithRates
                      ? `${selectedBusinessTypeWithRates.code} - ${selectedBusinessTypeWithRates.businessTypeId}`
                      : "Chọn business type để chỉnh sửa"}
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Mô Tả
                  </p>
                  <input
                    value={btMetadataForm.name}
                    onChange={(e) =>
                      setBtMetadataForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Name"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    disabled={!selectedBusinessTypeWithRates}
                  />
                  <textarea
                    value={btMetadataForm.description}
                    onChange={(e) =>
                      setBtMetadataForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description"
                    rows={2}
                    className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    disabled={!selectedBusinessTypeWithRates}
                  />
                  <select
                    value={btMetadataForm.status}
                    onChange={(e) =>
                      setBtMetadataForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    disabled={!selectedBusinessTypeWithRates}
                  >
                    <option value="active">Kích hoạt</option>
                    <option value="inactive">Vô hiệu hóa</option>
                  </select>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void btUpdateMetadata()}
                    disabled={!selectedBusinessTypeWithRates}
                  >
                    Lưu
                  </Button>
                </div>

                <div className="space-y-2 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Tỷ Lệ Thuế Áp Dụng
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={addBtRate}
                      disabled={!selectedBusinessTypeWithRates}
                    >
                      Thêm Tỷ Lệ Thuế
                    </Button>
                  </div>
                  <div className="max-h-72 space-y-2 overflow-auto">
                    {btRatesForm.length === 0 ? (
                      <div className="rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500">
                        Chưa có tax rate. Bấm Add Rate để thêm mới.
                      </div>
                    ) : (
                      btRatesForm.map((rate, index) => (
                        <div
                          key={index}
                          className="space-y-2 rounded-lg border border-gray-200 bg-white p-2"
                        >
                          <select
                            value={rate.taxType}
                            onChange={(e) =>
                              updateBtRateField(
                                index,
                                "taxType",
                                e.target.value,
                              )
                            }
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                            disabled={!selectedBusinessTypeWithRates}
                          >
                            <option value="">Chọn tax type</option>
                            {businessTypeTaxTypeOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <input
                            value={rate.taxRate}
                            onChange={(e) =>
                              updateBtRateField(
                                index,
                                "taxRate",
                                e.target.value,
                              )
                            }
                            placeholder="Tax Rate (e.g. 0.05)"
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                            disabled={!selectedBusinessTypeWithRates}
                          />
                          <input
                            value={rate.description}
                            onChange={(e) =>
                              updateBtRateField(
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            placeholder="Description"
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                            disabled={!selectedBusinessTypeWithRates}
                          />
                          <div className="text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700"
                              onClick={() => removeBtRate(index)}
                              disabled={!selectedBusinessTypeWithRates}
                            >
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <Button
                    size="sm"
                    className="w-full bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void btReplaceRates()}
                    disabled={!selectedBusinessTypeWithRates}
                  >
                    Áp Dụng
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      ) : null}

      {activeTab === "version" ? (
        <VersionFlowTab
          mode={mode}
          tvId={tvId}
          tvLabel={tvLabel}
          tvEffective={tvEffective}
          tvNotes={tvNotes}
          tvResult={tvResult}
          versionOptions={versionOptions}
          templateOptions={templateOptions}
          setTvId={setTvId}
          setTvLabel={setTvLabel}
          setTvEffective={setTvEffective}
          setTvNotes={setTvNotes}
          onDetail={(rawId) => void tvDetail(rawId)}
          onFull={(rawId) => void tvFull(rawId)}
          onCreateTemplate={(payload) => tvCreateTemplate(payload)}
          onCreateVersion={(templateId, payload) =>
            tvCreateVersion(templateId, payload)
          }
          onClone={() => tvClone()}
          onActivate={() => tvActivate()}
          onDeactivate={() => tvDeactivate()}
          onDelete={() => tvDelete()}
          onUpdate={() => tvUpdate()}
        />
      ) : null}

      {activeTab === "formulas" ? (
        <FormulaTab
          fmId={fmId}
          fmCode={fmCode}
          fmType={fmType}
          fmActive={fmActive}
          fmName={fmName}
          fmDesc={fmDesc}
          fmExprJson={fmExprJson}
          fmFType={fmFType}
          fmIsActive={fmIsActive}
          fmExplanation={fmExplanation}
          fmCloneCode={fmCloneCode}
          fmCloneSuffix={fmCloneSuffix}
          fmResultDataType={fmResultDataType}
          fmRoundingMode={fmRoundingMode}
          fmRoundingPrecision={fmRoundingPrecision}
          formulaOptions={formulaOptions}
          formulaList={formulas}
          setFmId={setFmId}
          setFmCode={setFmCode}
          setFmName={setFmName}
          setFmDesc={setFmDesc}
          setFmExprJson={setFmExprJson}
          setFmFType={setFmFType}
          setFmIsActive={setFmIsActive}
          setFmCloneCode={setFmCloneCode}
          setFmCloneSuffix={setFmCloneSuffix}
          setFmResultDataType={setFmResultDataType}
          setFmRoundingMode={setFmRoundingMode}
          setFmRoundingPrecision={setFmRoundingPrecision}
          onDetail={(rawId) => void fmDetail(rawId)}
          onClone={(payload) => void fmClone(payload)}
          onCreate={() => void fmCreate()}
          onActivate={() => void fmActivate()}
          onDeactivate={() => void fmDeactivate()}
          onUpdate={() => void fmUpdate()}
        />
      ) : null}

      {activeTab === "mappings" ? (
        <MappingTab
          fldVer={effectiveFldVer}
          versionOptions={versionOptions}
          fieldMappings={fieldMappings}
          mappingForm={mappingForm}
          fieldTypeOptions={mappingFieldTypeOptions}
          sourceTypeOptions={mappingSourceTypeOptions}
          aggregationOptions={mappingAggregationOptions}
          formulaOptions={mappingFormulaOptions}
          entityOptions={mappingEntityOptions}
          entityFieldOptions={mappingEntityFieldOptions}
          onVersionChange={handleFldVersionSelect}
          setMappingForm={setMappingForm}
          onPick={fldPick}
          onCreate={() => void fldCreate()}
          onUpdate={() => void fldUpdate()}
          onDelete={(mappingId) => void fldDelete(mappingId)}
        />
      ) : null}

      {activeTab === "rowdefs" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Định nghĩa hàng</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <select
                  value={effectiveRdVer}
                  onChange={(e) => handleRdVersionSelect(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Chọn Template Version</option>
                  {versionOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <select
                  value={effectiveRdRulesetId}
                  onChange={(e) => handleRdRulesetSelect(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  {rowRulesetOptions.length === 0 ? (
                    <option value="1">1 - Default Ruleset</option>
                  ) : (
                    rowRulesetOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs  text-gray-500">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Vị trí</th>
                      <th className="px-3 py-2">Thứ tự</th>
                      <th className="px-3 py-2">Công thức</th>
                      <th className="px-3 py-2">Loại thuế</th>
                      <th className="px-3 py-2 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rowDefs.map((r, index) => (
                      <tr
                        key={String(r.rowDefId ?? `row-${index}`)}
                        className="cursor-pointer border-t hover:bg-gray-50/70"
                        onClick={() => rdPick(r)}
                      >
                        <td className="px-3 py-2">
                          {String(r.rowDefId ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(r.rowType ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(r.rowLabel ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(r.position ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(r.sortOrder ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {r.formulaId
                            ? `Số ${String(r.formulaId)} ( ${String(r.formulaCode)} )`
                            : "-"}
                        </td>
                        <td className="px-3 py-2">
                          {toTaxTypeLabel(String(r.taxType ?? "")) || "-"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const rowId = String(
                                  r.rowDefId ?? `row-${index}`,
                                );
                                setRowActionMenuId((prev) =>
                                  prev === rowId ? "" : rowId,
                                );
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              aria-label="Row actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {rowActionMenuId ===
                            String(r.rowDefId ?? `row-${index}`) ? (
                              <div className="absolute right-0 top-9 z-10 w-28 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void rdDelete(String(r.rowDefId ?? ""));
                                  }}
                                  className="w-full rounded px-2 py-1.5 text-left text-xs text-red-600 hover:bg-red-50"
                                >
                                  Xóa
                                </button>
                              </div>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Chỉnh sửa</CardTitle>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    if (rowEditorMode === "update") {
                      setRowEditorMode("create");
                      setRowForm(emptyRowForm);
                      setRowActionMenuId("");
                      return;
                    }

                    setRowEditorMode("update");
                    setRowActionMenuId("");
                    if (!rowForm.rowDefId && rowDefs.length > 0) {
                      rdPick(rowDefs[0]);
                    }
                  }}
                  className=" text-[#23C4C1] hover:text-[#1ea8a6]"
                >
                  {rowEditorMode === "create" ? "Cập nhật" : "Tạo mới"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {rowEditorMode === "update" ? (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">
                    ID
                  </label>
                  <input
                    value={rowForm.rowDefId}
                    readOnly
                    placeholder="ID"
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  />
                </div>
              ) : null}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Loại dòng
                </label>
                <select
                  value={rowForm.rowType}
                  onChange={(e) =>
                    setRowForm((p) => ({ ...p, rowType: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
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
                  value={rowForm.rowLabel}
                  onChange={(e) =>
                    setRowForm((p) => ({ ...p, rowLabel: e.target.value }))
                  }
                  placeholder="Row Label"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-600">
                    Vị trí
                  </label>
                  <select
                    value={rowForm.position}
                    onChange={(e) =>
                      setRowForm((p) => ({ ...p, position: e.target.value }))
                    }
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
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
                    value={rowForm.sortOrder}
                    onChange={(e) =>
                      setRowForm((p) => ({ ...p, sortOrder: e.target.value }))
                    }
                    placeholder="Sort"
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Công thức
                </label>
                <select
                  value={rowForm.formulaId}
                  onChange={(e) =>
                    setRowForm((p) => ({ ...p, formulaId: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Chọn formula</option>
                  {rowFormulaOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Section type
                </label>
                <select
                  value={rowForm.sectionType}
                  onChange={(e) =>
                    setRowForm((p) => ({ ...p, sectionType: e.target.value }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
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
                  value={rowForm.sectionFilterValue}
                  onChange={(e) =>
                    setRowForm((p) => ({
                      ...p,
                      sectionFilterValue: e.target.value,
                    }))
                  }
                  placeholder="Section Filter"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Group by field
                </label>
                <input
                  value={rowForm.groupByField}
                  onChange={(e) =>
                    setRowForm((p) => ({ ...p, groupByField: e.target.value }))
                  }
                  placeholder="GroupBy Field"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-600">
                  Tax type
                </label>
                <select
                  value={rowForm.taxType}
                  onChange={(e) =>
                    setRowForm((p) => ({
                      ...p,
                      taxType: normalizeTaxTypeKey(e.target.value),
                    }))
                  }
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Không chọn tax type</option>
                  {rowTaxTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {filteredRowTaxRateHints.length > 0 ? (
                <div className="max-h-28 overflow-auto rounded-lg border border-sky-100 bg-sky-50 p-2 text-xs text-sky-700">
                  {filteredRowTaxRateHints.map((item, index) => (
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
                  Thứ tự các field hiển thị
                </label>
                <div className="max-h-28 overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {rowVisibleFieldOptions.map((option) => {
                      const selected = parseVisibleFieldCodes(
                        rowForm.visibleFieldCodes,
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
                  Mã các field hiển thị
                </label>
                <input
                  value={rowForm.visibleFieldCodes}
                  onChange={(e) =>
                    setRowForm((p) => ({
                      ...p,
                      visibleFieldCodes: e.target.value,
                    }))
                  }
                  placeholder="Visible field codes"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
              </div>
              {rowEditorMode === "create" ? (
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void rdCreate()}
                  >
                    Tạo mới
                  </Button>
                </div>
              ) : (
                <div className="pt-2">
                  <Button
                    size="sm"
                    className="w-full bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void rdUpdate()}
                    disabled={!rowForm.rowDefId}
                  >
                    Cập nhật
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "entities" ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 backdrop-blur">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Mã</th>
                        <th className="px-3 py-2">Tên</th>
                        <th className="px-3 py-2">Danh mục</th>
                        <th className="px-3 py-2">Fields</th>
                        <th className="px-3 py-2">Trạng thái</th>
                        <th className="px-3 py-2 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entities.length === 0 ? (
                        <tr>
                          <td className="px-3 py-3 text-gray-500" colSpan={7}>
                            Chưa có entity.
                          </td>
                        </tr>
                      ) : (
                        entities.map((e, index) => {
                          const entityId = String(e.entityId ?? "");
                          const isSelected = entityId === entEditId;
                          const isActive = Boolean(e.isActive);
                          const entityCode = String(e.entityCode ?? "");
                          return (
                            <tr
                              key={entityId || `entity-${index}`}
                              className={`cursor-pointer border-t transition-colors ${
                                isSelected
                                  ? "bg-[#23C4C1]/15 text-teal-900 shadow-[inset_4px_0_0_0_#23C4C1]"
                                  : "hover:bg-gray-50/70"
                              }`}
                              onClick={() =>
                                void entSelect(Number(e.entityId ?? 0))
                              }
                            >
                              <td className="px-3 py-2">
                                {String(e.entityId ?? "-")}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {String(e.entityCode ?? "-")}
                              </td>
                              <td className="px-3 py-2">
                                {String(e.displayName ?? "-")}
                              </td>
                              <td className="px-3 py-2">
                                {String(e.category ?? "-")}
                              </td>
                              <td className="px-3 py-2">
                                {String(e.fieldCount ?? "-")}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant="secondary"
                                  className={
                                    isActive
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-red-50 text-red-700"
                                  }
                                >
                                  {isActive ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  disabled={isActive}
                                  title={
                                    isActive
                                      ? "Chỉ xóa được entity Inactive"
                                      : "Xóa entity"
                                  }
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    openEntityDeleteConfirm(
                                      entityId,
                                      entityCode,
                                    );
                                  }}
                                >
                                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Fields của {selectedEntityName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600 backdrop-blur">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Mã</th>
                        <th className="px-3 py-2">Tên</th>
                        <th className="px-3 py-2">Mô tả</th>
                        <th className="px-3 py-2">Loại</th>
                        <th className="px-3 py-2">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entityFields.length === 0 ? (
                        <tr>
                          <td className="px-3 py-3 text-gray-500" colSpan={6}>
                            Entity này chưa có field.
                          </td>
                        </tr>
                      ) : (
                        entityFields.map((f, index) => {
                          const fieldId = String(f.fieldId ?? "");
                          const isSelected = fieldId === efEditId;
                          return (
                            <tr
                              key={fieldId || `field-${index}`}
                              className={`cursor-pointer border-t transition-colors ${
                                isSelected
                                  ? "bg-[#23C4C1]/15 text-teal-900 shadow-[inset_4px_0_0_0_#23C4C1]"
                                  : "hover:bg-gray-50/70"
                              }`}
                              onClick={() => {
                                setEfEditId(String(f.fieldId ?? ""));
                                setEfEntId(String(f.entityId ?? entEditId));
                                setEfCode(String(f.fieldCode ?? ""));
                                setEfName(String(f.displayName ?? ""));
                                setEfDtype(String(f.dataType ?? "decimal"));
                                setEfAggs(
                                  String(f.allowedAggregations ?? '["none"]'),
                                );
                                setEfDesc(String(f.description ?? ""));
                                setEfIsActive(
                                  Boolean(f.isActive) ? "true" : "false",
                                );
                              }}
                            >
                              <td className="px-3 py-2">
                                {String(f.fieldId ?? "-")}
                              </td>
                              <td className="px-3 py-2 font-mono text-xs">
                                {String(f.fieldCode ?? "-")}
                              </td>
                              <td className="px-3 py-2">
                                {String(f.displayName ?? "-")}
                              </td>
                              <td className="max-w-70 px-3 py-2 text-gray-600">
                                {String(f.description ?? "-")}
                              </td>
                              <td className="px-3 py-2">
                                {String(f.dataType ?? "-")}
                              </td>
                              <td className="px-3 py-2">
                                <Badge
                                  variant="secondary"
                                  className={
                                    Boolean(f.isActive)
                                      ? "bg-emerald-50 text-emerald-700"
                                      : "bg-red-50 text-red-700"
                                  }
                                >
                                  {Boolean(f.isActive) ? "Active" : "Inactive"}
                                </Badge>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <CardTitle>Chỉnh sửa</CardTitle>
                  <p className="text-xs text-gray-500">
                    {hasSelectedEntity
                      ? `Đang chỉnh sửa entity #${entEditId}`
                      : "Tạo mới entity"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEntEditId("");
                    setEntCode("");
                    setEntName("");
                    setEntCat("revenue");
                    setEntDesc("");
                    setEntIsActive("true");
                  }}
                >
                  Tạo mới Entity
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                      Entity ID
                    </label>
                    <input
                      value={entEditId}
                      readOnly
                      placeholder="(auto)"
                      className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Entity Code
                      </label>
                      <input
                        value={entCode}
                        onChange={(e) => setEntCode(e.target.value)}
                        placeholder="orders"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Tên Entity
                      </label>
                      <input
                        value={entName}
                        onChange={(e) => setEntName(e.target.value)}
                        placeholder="Đơn hàng"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Danh mục
                      </label>
                      <select
                        value={entCat}
                        onChange={(e) => setEntCat(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <option>revenue - Doanh thu</option>
                        <option>cost - Chi phí</option>
                        <option>tax - Thuế</option>
                        <option>asset - Tài sản</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Trạng thái
                      </label>
                      <select
                        value={entIsActive}
                        onChange={(e) => setEntIsActive(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="true">Hiệu lực</option>
                        <option value="false">Vô hiệu</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                      Mô tả
                    </label>
                    <textarea
                      value={entDesc}
                      onChange={(e) => setEntDesc(e.target.value)}
                      placeholder="Mô tả ngắn cho entity"
                      rows={2}
                      className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void entCreate()}
                    disabled={!entCode.trim() || !entName.trim()}
                  >
                    Tạo Entity
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void entUpdate()}
                    disabled={!hasSelectedEntity}
                  >
                    Cập nhật Entity
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <CardTitle>Chỉnh sửa</CardTitle>
                  <p className="text-xs text-gray-500">
                    {hasSelectedField
                      ? `Đang chỉnh sửa field #${efEditId}`
                      : "Tạo mới field cho entity đang chọn"}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEfEditId("");
                    setEfEntId(currentFieldEntityId);
                    setEfCode("");
                    setEfName("");
                    setEfDtype("decimal");
                    setEfAggs('["sum","none"]');
                    setEfDesc("");
                    setEfIsActive("true");
                  }}
                  disabled={!currentFieldEntityId}
                >
                  Tạo Field
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Field ID
                      </label>
                      <input
                        value={efEditId}
                        readOnly
                        placeholder="(auto)"
                        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Entity ID
                      </label>
                      <input
                        value={currentFieldEntityId}
                        readOnly
                        placeholder="Chọn entity trước"
                        className="w-full rounded-lg border border-gray-200 bg-gray-100 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Field Code
                      </label>
                      <input
                        value={efCode}
                        onChange={(e) => setEfCode(e.target.value)}
                        placeholder="ABC"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Tên hiển thị
                      </label>
                      <input
                        value={efName}
                        onChange={(e) => setEfName(e.target.value)}
                        placeholder="ABC Field"
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Loại dữ liệu
                      </label>
                      <select
                        value={efDtype}
                        onChange={(e) => setEfDtype(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <option>decimal - Số thập phân</option>
                        <option>string - Chuỗi</option>
                        <option>text - Văn bản</option>
                        <option>date - Ngày tháng</option>
                        <option>long - Số nguyên lớn</option>
                        <option>guid - ID duy nhất</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-gray-600">
                        Trạng thái
                      </label>
                      <select
                        value={efIsActive}
                        onChange={(e) => setEfIsActive(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="true">Hiệu lực</option>
                        <option value="false">Vô hiệu</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-gray-600">
                      Description
                    </label>
                    <textarea
                      value={efDesc}
                      onChange={(e) => setEfDesc(e.target.value)}
                      placeholder="Mô tả ngắn cho field"
                      rows={2}
                      className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void efCreate()}
                    disabled={
                      !currentFieldEntityId || !efCode.trim() || !efName.trim()
                    }
                  >
                    Tạo mới Field
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void efUpdate()}
                    disabled={!hasSelectedField || !currentFieldEntityId}
                  >
                    Cập nhật Field
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : null}

      {activeTab === "compare" ? (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>So sánh</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                value={cmpLoc}
                onChange={(e) => setCmpLoc(e.target.value)}
                placeholder="Location ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={cmpPer}
                onChange={(e) => setCmpPer(e.target.value)}
                placeholder="Period ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={cmpDraft}
                onChange={(e) => setCmpDraft(e.target.value)}
                placeholder="Draft Version ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={cmpActive}
                onChange={(e) => setCmpActive(e.target.value)}
                placeholder="Active Version ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={cmpGrp}
                onChange={(e) => setCmpGrp(e.target.value)}
                placeholder="Group"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={cmpMeth}
                onChange={(e) => setCmpMeth(e.target.value)}
                placeholder="Tax Method"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={cmpRule}
                onChange={(e) => setCmpRule(e.target.value)}
                placeholder="Ruleset ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={cmpBatch}
                onChange={(e) => setCmpBatch(e.target.value)}
                placeholder="Batch Size"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <input
              value={cmpBiz}
              onChange={(e) => setCmpBiz(e.target.value)}
              placeholder="BusinessTypeIds (comma separated GUIDs)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            {businessTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {businessTypes.map((item: AccountingBusinessTypeSummary) => {
                  const selected = cmpBiz
                    .split(",")
                    .map((token) => token.trim())
                    .filter(Boolean)
                    .includes(item.businessTypeId);
                  return (
                    <button
                      key={item.businessTypeId}
                      type="button"
                      onClick={() =>
                        toggleBusinessTypeCsv(
                          cmpBiz,
                          setCmpBiz,
                          item.businessTypeId,
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selected
                          ? "border-[#23C4C1]/40 bg-[#23C4C1]/10 text-[#15918f]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#23C4C1]/30 hover:bg-[#23C4C1]/5"
                      }`}
                    >
                      {item.code} - {item.name}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <Button
              onClick={() => void runCompare()}
              className="gap-2 bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
            >
              <Play className="h-4 w-4" />
              So sánh
            </Button>

            {!compareResult ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                Chạy Compare để xem bảng đối chiếu Active và Draft.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Active Version
                    </h4>

                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full min-w-180 border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#ecfbfa] text-gray-700">
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Chỉ tiêu
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Giá trị
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-200 px-3 py-2">
                              Tổng số dòng
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium">
                              {compareActive.summary?.totalRows ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-200 px-3 py-2">
                              Tổng doanh thu
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium">
                              {compareActive.summary?.totalRevenue == null
                                ? "-"
                                : Number(
                                    compareActive.summary.totalRevenue,
                                  ).toLocaleString("vi-VN")}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-200 px-3 py-2">
                              Tổng chi phí
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium">
                              {compareActive.summary?.totalCost == null
                                ? "-"
                                : Number(
                                    compareActive.summary.totalCost,
                                  ).toLocaleString("vi-VN")}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-200 px-3 py-2">
                              Tổng thuế
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium">
                              {compareActive.summary?.totalTax == null
                                ? "-"
                                : Number(
                                    compareActive.summary.totalTax,
                                  ).toLocaleString("vi-VN")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {compareActive.formulaValues.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full min-w-180 border-collapse text-sm">
                          <thead>
                            <tr className="bg-[#ecfbfa] text-gray-700">
                              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                                Formula
                              </th>
                              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                                Giá trị
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {compareActive.formulaValues.map((formula) => (
                              <tr key={`active-${formula.code}`}>
                                <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                                  {formula.code}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {formula.value == null
                                    ? "-"
                                    : typeof formula.value === "number"
                                      ? formula.value.toLocaleString("vi-VN")
                                      : String(formula.value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Draft Version
                    </h4>

                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full min-w-180 border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#ecfbfa] text-gray-700">
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Chỉ tiêu
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Giá trị
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-200 px-3 py-2">
                              Tổng số dòng
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium">
                              {compareDraft.summary?.totalRows ?? 0}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-200 px-3 py-2">
                              Tổng doanh thu
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium">
                              {compareDraft.summary?.totalRevenue == null
                                ? "-"
                                : Number(
                                    compareDraft.summary.totalRevenue,
                                  ).toLocaleString("vi-VN")}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-200 px-3 py-2">
                              Tổng chi phí
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium">
                              {compareDraft.summary?.totalCost == null
                                ? "-"
                                : Number(
                                    compareDraft.summary.totalCost,
                                  ).toLocaleString("vi-VN")}
                            </td>
                          </tr>
                          <tr>
                            <td className="border border-gray-200 px-3 py-2">
                              Tổng thuế
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-medium">
                              {compareDraft.summary?.totalTax == null
                                ? "-"
                                : Number(
                                    compareDraft.summary.totalTax,
                                  ).toLocaleString("vi-VN")}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {compareDraft.formulaValues.length > 0 ? (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="w-full min-w-180 border-collapse text-sm">
                          <thead>
                            <tr className="bg-[#ecfbfa] text-gray-700">
                              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                                Công thức
                              </th>
                              <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                                Giá trị
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {compareDraft.formulaValues.map((formula) => (
                              <tr key={`draft-${formula.code}`}>
                                <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                                  {formula.code}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {formula.value == null
                                    ? "-"
                                    : typeof formula.value === "number"
                                      ? formula.value.toLocaleString("vi-VN")
                                      : String(formula.value)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Active Rows
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                      <table className="w-full min-w-275 border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#ecfbfa] text-gray-700">
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              STT
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Ngày tháng
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Diễn giải
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Số tiền
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Business Type ID
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {compareActive.rowItems.length === 0 ? (
                            <tr>
                              <td
                                className="border border-gray-200 px-3 py-4 text-center text-gray-500"
                                colSpan={5}
                              >
                                Không có dòng dữ liệu.
                              </td>
                            </tr>
                          ) : (
                            compareActive.rowItems.map((row, index) => (
                              <tr
                                key={`active-row-${String(row.stt ?? index)}-${String(row.businessTypeId ?? "")}`}
                              >
                                <td className="border border-gray-200 px-3 py-2">
                                  {String(row.stt ?? "-")}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {String(row.ngay_thang ?? "-")}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {String(row.dien_giai ?? "-")}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {formatAmountValue(
                                    resolveRowAmountValue(row),
                                  )}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 font-mono text-xs text-gray-600">
                                  {String(row.businessTypeId ?? "-")}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <span className="mr-4">
                        Loaded:{" "}
                        {compareActive.rowsMeta?.loadedCount ??
                          compareActive.rowItems.length}
                      </span>
                      <span className="mr-4">
                        Estimated Total:{" "}
                        {compareActive.rowsMeta?.totalEstimated ??
                          compareActive.rowItems.length}
                      </span>
                      <span>
                        Next Cursor: {compareActive.rowsMeta?.nextCursor || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-800">
                      Draft Rows
                    </h4>
                    <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                      <table className="w-full min-w-275 border-collapse text-sm">
                        <thead>
                          <tr className="bg-[#ecfbfa] text-gray-700">
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              STT
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Ngày tháng
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Diễn giải
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Số tiền
                            </th>
                            <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                              Business Type ID
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {compareDraft.rowItems.length === 0 ? (
                            <tr>
                              <td
                                className="border border-gray-200 px-3 py-4 text-center text-gray-500"
                                colSpan={5}
                              >
                                Không có dòng dữ liệu.
                              </td>
                            </tr>
                          ) : (
                            compareDraft.rowItems.map((row, index) => (
                              <tr
                                key={`draft-row-${String(row.stt ?? index)}-${String(row.businessTypeId ?? "")}`}
                              >
                                <td className="border border-gray-200 px-3 py-2">
                                  {String(row.stt ?? "-")}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {String(row.ngay_thang ?? "-")}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {String(row.dien_giai ?? "-")}
                                </td>
                                <td className="border border-gray-200 px-3 py-2">
                                  {formatAmountValue(
                                    resolveRowAmountValue(row),
                                  )}
                                </td>
                                <td className="border border-gray-200 px-3 py-2 font-mono text-xs text-gray-600">
                                  {String(row.businessTypeId ?? "-")}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                      <span className="mr-4">
                        Loaded:{" "}
                        {compareDraft.rowsMeta?.loadedCount ??
                          compareDraft.rowItems.length}
                      </span>
                      <span className="mr-4">
                        Estimated Total:{" "}
                        {compareDraft.rowsMeta?.totalEstimated ??
                          compareDraft.rowItems.length}
                      </span>
                      <span>
                        Next Cursor: {compareDraft.rowsMeta?.nextCursor || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
                  <h4 className="text-sm font-semibold text-gray-800">Diff</h4>

                  {compareDiff.changedFormulas.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {compareDiff.changedFormulas.map((formulaCode) => (
                        <span
                          key={formulaCode}
                          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700"
                        >
                          {formulaCode}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500">
                      Không có công thức thay đổi.
                    </div>
                  )}

                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full min-w-180 border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#ecfbfa] text-gray-700">
                          <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                            Code
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                            Before
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                            After
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {compareDiff.valueChanges.length === 0 ? (
                          <tr>
                            <td
                              className="border border-gray-200 px-3 py-4 text-center text-gray-500"
                              colSpan={3}
                            >
                              Không có value changes.
                            </td>
                          </tr>
                        ) : (
                          compareDiff.valueChanges.map((item, index) => (
                            <tr key={`${item.code || "diff"}-${index}`}>
                              <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                                {item.code || "-"}
                              </td>
                              <td className="border border-gray-200 px-3 py-2">
                                {item.before == null
                                  ? "-"
                                  : typeof item.before === "number"
                                    ? item.before.toLocaleString("vi-VN")
                                    : String(item.before)}
                              </td>
                              <td className="border border-gray-200 px-3 py-2">
                                {item.after == null
                                  ? "-"
                                  : typeof item.after === "number"
                                    ? item.after.toLocaleString("vi-VN")
                                    : String(item.after)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "preview" ? (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Template Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                value={pvLoc}
                onChange={(e) => setPvLoc(e.target.value)}
                placeholder="Location ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={pvPer}
                onChange={(e) => setPvPer(e.target.value)}
                placeholder="Period ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={pvVer}
                onChange={(e) => setPvVer(e.target.value)}
                placeholder="Template Version ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={pvGrp}
                onChange={(e) => setPvGrp(e.target.value)}
                placeholder="Group"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={pvMeth}
                onChange={(e) => setPvMeth(e.target.value)}
                placeholder="Tax Method"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={pvRule}
                onChange={(e) => setPvRule(e.target.value)}
                placeholder="Ruleset ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={pvBatch}
                onChange={(e) => setPvBatch(e.target.value)}
                placeholder="Batch Size"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <input
              value={pvBiz}
              onChange={(e) => setPvBiz(e.target.value)}
              placeholder="BusinessTypeIds (comma separated GUIDs)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            {businessTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {businessTypes.map((item: AccountingBusinessTypeSummary) => {
                  const selected = pvBiz
                    .split(",")
                    .map((token) => token.trim())
                    .filter(Boolean)
                    .includes(item.businessTypeId);
                  return (
                    <button
                      key={item.businessTypeId}
                      type="button"
                      onClick={() =>
                        toggleBusinessTypeCsv(
                          pvBiz,
                          setPvBiz,
                          item.businessTypeId,
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selected
                          ? "border-[#23C4C1]/40 bg-[#23C4C1]/10 text-[#15918f]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#23C4C1]/30 hover:bg-[#23C4C1]/5"
                      }`}
                    >
                      {item.code} - {item.name}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <Button
              onClick={() => void runPreview()}
              className="gap-2 bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
            >
              <Play className="h-4 w-4" />
              Run Preview
            </Button>

            {!previewResult ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                Chạy Preview để xem dữ liệu dạng sổ.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-800">
                      Mẫu sổ (Preview Data + Full Structure nếu có)
                    </h3>
                    <span className="text-xs text-gray-500">
                      Version: {previewRenderIdentity.templateVersionId || "-"}
                    </span>
                  </div>

                  {previewTemplateRows.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      Preview không có dòng dữ liệu để dựng mẫu sổ.
                    </div>
                  ) : previewRenderableColumns.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                      Không suy luận được cột để dựng mẫu sổ từ preview data.
                    </div>
                  ) : (
                    <>
                      {!previewFullStructure ? (
                        <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          Chưa tải được full structure. Đang dùng auto columns
                          từ preview data để render UI.
                        </div>
                      ) : null}
                      {previewTemplateColumns.length === 0 ? (
                        <div className="mb-3 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-700">
                          Full structure không có field mappings. Đang dùng auto
                          columns từ preview data.
                        </div>
                      ) : null}
                      <BookTemplatePreview
                        templateCode={previewRenderIdentity.templateCode}
                        templateName={previewRenderIdentity.templateName}
                        versionLabel={previewRenderIdentity.versionLabel}
                        columns={previewRenderableColumns}
                        rows={previewTemplateRows}
                        rowDefinitions={previewTemplateRowDefinitions}
                        referenceData={refData}
                        summaryMeta={previewSummaryMeta}
                      />
                    </>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full min-w-180 border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#ecfbfa] text-gray-700">
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Chỉ tiêu
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Giá trị
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2">
                          Tổng số dòng
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {previewSummary?.totalRows ?? 0}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2">
                          Tổng doanh thu
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {previewSummary?.totalRevenue == null
                            ? "-"
                            : Number(
                                previewSummary.totalRevenue,
                              ).toLocaleString("vi-VN")}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2">
                          Tổng chi phí
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {previewSummary?.totalCost == null
                            ? "-"
                            : Number(previewSummary.totalCost).toLocaleString(
                                "vi-VN",
                              )}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2">
                          Tổng thuế
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {previewSummary?.totalTax == null
                            ? "-"
                            : Number(previewSummary.totalTax).toLocaleString(
                                "vi-VN",
                              )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {previewFormulaValues.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                    <table className="w-full min-w-180 border-collapse text-sm">
                      <thead>
                        <tr className="bg-[#ecfbfa] text-gray-700">
                          <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                            Formula
                          </th>
                          <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                            Giá trị
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewFormulaValues.map((formula) => (
                          <tr key={formula.code}>
                            <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                              {formula.code}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {formula.value == null
                                ? "-"
                                : typeof formula.value === "number"
                                  ? formula.value.toLocaleString("vi-VN")
                                  : String(formula.value)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : null}

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full min-w-275 border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#ecfbfa] text-gray-700">
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Line Type
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          STT
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Số hiệu
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Ngày tháng
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Diễn giải
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Business Type ID
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRowItems.length === 0 ? (
                        <tr>
                          <td
                            className="border border-gray-200 px-3 py-4 text-center text-gray-500"
                            colSpan={6}
                          >
                            Không có dòng dữ liệu.
                          </td>
                        </tr>
                      ) : (
                        previewRowItems.map((row, index) => (
                          <tr
                            key={`${String(row.stt ?? index)}-${String(row.businessTypeId ?? "")}`}
                          >
                            <td className="border border-gray-200 px-3 py-2">
                              {String(row.lineType ?? "-")}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {String(row.stt ?? "-")}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {String(row.so_hieu ?? "-")}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {String(row.ngay_thang ?? "-")}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {String(row.dien_giai ?? "-")}
                            </td>
                            <td className="border border-gray-200 px-3 py-2 font-mono text-xs text-gray-600">
                              {String(row.businessTypeId ?? "-")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                  <span className="mr-4">
                    Loaded:{" "}
                    {previewRowsMeta?.loadedCount ?? previewRowItems.length}
                  </span>
                  <span className="mr-4">
                    Estimated Total:{" "}
                    {previewRowsMeta?.totalEstimated ?? previewRowItems.length}
                  </span>
                  <span className="mr-4">
                    Has More: {previewRowsMeta?.hasMore ? "Yes" : "No"}
                  </span>
                  <span>Next Cursor: {previewRowsMeta?.nextCursor || "-"}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "trace" ? (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Truy Vết</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <input
                value={trFId}
                onChange={(e) => setTrFId(e.target.value)}
                placeholder="Formula ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={trLoc}
                onChange={(e) => setTrLoc(e.target.value)}
                placeholder="Location ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={trPer}
                onChange={(e) => setTrPer(e.target.value)}
                placeholder="Period ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={trRule}
                onChange={(e) => setTrRule(e.target.value)}
                placeholder="Ruleset ID"
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <input
              value={trBiz}
              onChange={(e) => setTrBiz(e.target.value)}
              placeholder="BusinessTypeIds (comma separated GUIDs)"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            {businessTypes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {businessTypes.map((item: AccountingBusinessTypeSummary) => {
                  const selected = trBiz
                    .split(",")
                    .map((token) => token.trim())
                    .filter(Boolean)
                    .includes(item.businessTypeId);
                  return (
                    <button
                      key={item.businessTypeId}
                      type="button"
                      onClick={() =>
                        toggleBusinessTypeCsv(
                          trBiz,
                          setTrBiz,
                          item.businessTypeId,
                        )
                      }
                      className={`rounded-full border px-3 py-1 text-xs transition ${
                        selected
                          ? "border-[#23C4C1]/40 bg-[#23C4C1]/10 text-[#15918f]"
                          : "border-gray-200 bg-white text-gray-600 hover:border-[#23C4C1]/30 hover:bg-[#23C4C1]/5"
                      }`}
                    >
                      {item.code} - {item.name}
                    </button>
                  );
                })}
              </div>
            ) : null}
            <Button
              onClick={() => void runTrace()}
              className="gap-2 bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
            >
              <Play className="h-4 w-4" />
              Run Trace
            </Button>

            {!traceResult ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                Chạy Trace để xem các bước tính công thức dạng bảng.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full min-w-180 border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#ecfbfa] text-gray-700">
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Trường
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Giá trị
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2">
                          Formula Code
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                          {traceOverview.formulaCode || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2">
                          Formula Name
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          {traceOverview.formulaName || "-"}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-gray-200 px-3 py-2">
                          Final Value
                        </td>
                        <td className="border border-gray-200 px-3 py-2 font-medium">
                          {traceOverview.finalValue == null
                            ? "-"
                            : typeof traceOverview.finalValue === "number"
                              ? traceOverview.finalValue.toLocaleString("vi-VN")
                              : String(traceOverview.finalValue)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full min-w-275 border-collapse text-sm">
                    <thead>
                      <tr className="bg-[#ecfbfa] text-gray-700">
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Bước
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Số hiệu
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Mô tả
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Giá trị
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Nguồn
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Debug
                        </th>
                        <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                          Node con
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {traceOverview.traceItems.length === 0 ? (
                        <tr>
                          <td
                            className="border border-gray-200 px-3 py-4 text-center text-gray-500"
                            colSpan={7}
                          >
                            Không có trace steps.
                          </td>
                        </tr>
                      ) : (
                        traceOverview.traceItems.map((item, index) => (
                          <tr
                            key={`${item.step || index}-${item.nodeType || "node"}`}
                          >
                            <td className="border border-gray-200 px-3 py-2">
                              {item.step || index + 1}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {item.nodeType || "-"}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {item.description || "-"}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {item.resolvedValue == null
                                ? "-"
                                : typeof item.resolvedValue === "number"
                                  ? item.resolvedValue.toLocaleString("vi-VN")
                                  : String(item.resolvedValue)}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {item.source || "-"}
                            </td>
                            <td className="border border-gray-200 px-3 py-2 text-xs text-gray-600">
                              {item.debug}
                            </td>
                            <td className="border border-gray-200 px-3 py-2">
                              {item.childrenCount}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "reference" ? (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Reference</CardTitle>
            <Button variant="outline" size="sm" onClick={() => void loadRef()}>
              Xem
            </Button>
          </CardHeader>
          <CardContent>
            {referenceRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                Bấm Load để lấy danh sách enum.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full min-w-275 border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#ecfbfa] text-gray-700">
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Enum Group
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Count
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Values Preview
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {referenceRows.map((row) => (
                      <tr key={row.groupName}>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                          {row.groupName}
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          {row.count}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-xs text-gray-700">
                          {/* //i want it down the line for each value */}
                          {row.previewText}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "schema" ? (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Node Schemas</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadSchemas()}
            >
              Xem
            </Button>
          </CardHeader>
          <CardContent>
            {schemaRows.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                Bấm Xem để lấy danh sách node schemas.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full min-w-275 border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#ecfbfa] text-gray-700">
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Loại Node
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Tên
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Danh mục
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Kiểu kết quả
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Inputs
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Fields
                      </th>
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold">
                        Mô tả
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {schemaRows.map((row) => (
                      <tr key={row.nodeType}>
                        <td className="border border-gray-200 px-3 py-2 font-mono text-xs">
                          {row.nodeType}
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          {row.name}
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          {row.category}
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          {row.resultType}
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          {row.inputCount}
                        </td>
                        <td className="border border-gray-200 px-3 py-2">
                          {row.fieldCount}
                        </td>
                        <td className="border border-gray-200 px-3 py-2 text-xs text-gray-700">
                          {row.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </main>
  );
}
