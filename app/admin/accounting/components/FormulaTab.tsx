import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CircleHelp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getFormulaNodeSchemas,
  getAccountingOverview,
  runAccountingTrace,
} from "@/lib/admin-accounting-api";
import type {
  AccountingBusinessTypeSummary,
  AccountingTaxRulesetSummary,
} from "@/lib/types/adminAccounting";
import type { AccountingPeriod } from "@/lib/types/accounting";
import type { Location } from "@/lib/types/location";
import { getLocations } from "@/services/locationService";
import { getAccountingPeriods } from "@/services/accountingService";
import { cn } from "@/lib/utils";
import type { AccountingFormulaSummary } from "@/lib/types/adminAccounting";
import type { FormulaOption } from "./types";

type FormulaTokenType = "var" | "num" | "op" | "lpar" | "rpar";

interface FormulaToken {
  id: string;
  type: FormulaTokenType;
  value: string;
  label: string;
}

interface VariableItem {
  code: string;
  label: string;
  group: string;
  dataType: string;
}

interface FormulaNodeFieldSchema {
  fieldName: string;
  fieldType: string;
  required: boolean;
  description?: string;
  allowedValues?: string[];
}

interface FormulaNodeSchema {
  nodeType: string;
  label: string;
  description: string;
  example?: string;
  fields: FormulaNodeFieldSchema[];
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
    computed: "tinh toan",
    constant: "hang so",
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

interface FormulaRecipe {
  id: string;
  title: string;
  summary: string;
  formulaType: string;
  expression: Record<string, unknown>;
}

function formulaTypeToVariableDataType(formulaType: string): string {
  const normalized = formulaType.trim().toLowerCase();
  if (!normalized) return "decimal";
  if (normalized.includes("string") || normalized.includes("text")) {
    return "string";
  }
  if (normalized.includes("int") || normalized.includes("long")) {
    return "integer";
  }
  return "decimal";
}

interface FormulaTabProps {
  mode?: "admin" | "consultant";
  fmId: string;
  fmCode: string;
  fmType: string;
  fmActive: string;
  fmName: string;
  fmDesc: string;
  fmExprJson: string;
  fmFType: string;
  fmIsActive: string;
  fmExplanation: string;
  fmCloneCode: string;
  fmCloneSuffix: string;
  fmResultDataType: string;
  fmRoundingMode: string;
  fmRoundingPrecision: string;
  formulaOptions: FormulaOption[];
  formulaList: AccountingFormulaSummary[];
  setFmId: (value: string) => void;
  setFmCode: (value: string) => void;
  setFmName: (value: string) => void;
  setFmDesc: (value: string) => void;
  setFmExprJson: (value: string) => void;
  setFmFType: (value: string) => void;
  setFmIsActive: (value: string) => void;
  setFmCloneCode: (value: string) => void;
  setFmCloneSuffix: (value: string) => void;
  setFmResultDataType: (value: string) => void;
  setFmRoundingMode: (value: string) => void;
  setFmRoundingPrecision: (value: string) => void;
  onDetail: (rawId?: string) => void;
  onClone: (payload?: { newCode?: string; nameSuffix?: string }) => void;
  onUpdate: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  onCreate: () => void;
}

const primaryBtnClass = "bg-[#2563eb] text-white hover:bg-[#1d4ed8]";

const DB_FORMULA_TYPES = [
  "AGGREGATE",
  "CELL_REF",
  "TAX_RATE",
  "WEIGHTED_AVG",
  "EXTERNAL_LOOKUP",
] as const;

const TAX_TYPE_OPTIONS = [
  { value: "VAT", label: "VAT" },
  { value: "PIT_METHOD_1", label: "PIT_METHOD_1" },
  { value: "PIT_METHOD_2", label: "PIT_METHOD_2" },
] as const;

const TAX_RATE_CONTEXT_OPTIONS = [
  "group_amount",
  "group_cost",
  "group_deduction",
  "total_amount",
];

const TAX_TYPE_ALIAS: Record<string, string> = {
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

function normalizeTaxType(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!normalized) return "";
  return TAX_TYPE_ALIAS[normalized] ?? normalized;
}

function isTaxRelatedFormula(formulaType: string, ...parts: string[]): boolean {
  const haystack = [formulaType, ...parts]
    .join(" ")
    .toLowerCase()
    .replace(/\s+/g, " ");

  return (
    haystack.includes("tax_rate") ||
    haystack.includes("tax") ||
    haystack.includes("vat") ||
    haystack.includes("pit") ||
    haystack.includes("thuế") ||
    haystack.includes("thue")
  );
}

function normalizeFormulaType(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
  if (!normalized || normalized === "NONE") return "";
  if (normalized === "LOOKED_UP" || normalized === "LOOKUP") {
    return "EXTERNAL_LOOKUP";
  }
  return normalized;
}

function formatFormulaTypeLabel(formulaType: string): string {
  const normalized = normalizeFormulaType(formulaType);
  if (normalized === "EXTERNAL_LOOKUP") {
    return "LOOKED_UP (EXTERNAL_LOOKUP)";
  }
  return normalized || formulaType;
}

// ─── Aggregate / Lookup metadata ─────────────────────────────────────────────
const AGGREGATE_FUNS = ["SUM", "COUNT", "AVG"] as const;

type SourceKey = "revenues" | "costs" | "gl_entries" | "stock_movements";
type LookupEntityKey = "IndustryTaxRates" | "AccountingPeriods";

const SOURCES_META: Record<
  SourceKey,
  { label: string; fields: string[]; filterKeys: Record<string, string[]> }
> = {
  revenues: {
    label: "Doanh thu",
    fields: ["Amount", "RevenueDate", "Description"],
    filterKeys: { RevenueType: ["sale", "manual", "adjustment"] },
  },
  costs: {
    label: "Chi phí",
    fields: ["Amount", "CostDate", "Description"],
    filterKeys: { CostType: ["direct", "indirect", "overhead"] },
  },
  gl_entries: {
    label: "Bút toán GL",
    fields: ["DebitAmount", "CreditAmount"],
    filterKeys: { MoneyChannel: ["cash", "bank"] },
  },
  stock_movements: {
    label: "Xuất nhập kho",
    fields: ["QuantityDelta", "TotalValue", "UnitCost"],
    filterKeys: {},
  },
};

const SOURCE_LABELS: Record<SourceKey, string> = {
  revenues: SOURCES_META.revenues.label,
  costs: SOURCES_META.costs.label,
  gl_entries: SOURCES_META.gl_entries.label,
  stock_movements: SOURCES_META.stock_movements.label,
};

const LOOKUP_META: Record<
  LookupEntityKey,
  { label: string; fields: string[]; filterKeys: Record<string, string[]> }
> = {
  IndustryTaxRates: {
    label: "Thuế suất ngành",
    fields: ["TaxRate"],
    filterKeys: {
      TaxType: TAX_TYPE_OPTIONS.map((item) => item.value),
    },
  },
  AccountingPeriods: {
    label: "Kỳ kế toán",
    fields: ["OpeningCashBalance", "OpeningBankBalance"],
    filterKeys: {},
  },
};

// ─── Builder tabs ─────────────────────────────────────────────────────────────
const BUILDER_TABS = [
  {
    key: "AGGREGATE",
    label: "Tổng hợp",
    desc: "SUM / COUNT / AVG từ bảng dữ liệu",
  },
  {
    key: "CELL_REF",
    label: "Biểu thức",
    desc: "Toán tử +  −  ×  ÷ giữa các ref",
  },
  {
    key: "TAX_RATE",
    label: "Thuế suất",
    desc: "Công thức thuế theo từng ngành",
  },
  {
    key: "EXTERNAL_LOOKUP",
    label: "Tra cứu",
    desc: "Tra giá trị từ bảng tham chiếu",
  },
] as const;
type BuilderTabKey = (typeof BUILDER_TABS)[number]["key"] | "NONE";

function formulaTypeToBuilderTab(formulaType: string): BuilderTabKey {
  const normalized = normalizeFormulaType(formulaType);
  if (normalized === "AGGREGATE") return "AGGREGATE";
  if (normalized === "TAX_RATE") return "TAX_RATE";
  if (normalized === "EXTERNAL_LOOKUP") return "EXTERNAL_LOOKUP";
  if (normalized === "CELL_REF" || normalized === "WEIGHTED_AVG") {
    return "CELL_REF";
  }
  return "NONE";
}

// const FORMULA_RECIPES: FormulaRecipe[] = [
//   {
//     id: "sum-revenue",
//     title: "Tổng doanh thu",
//     summary: "SUM Amount từ revenues trong kỳ hiện tại.",
//     formulaType: "AGGREGATE",
//     expression: {
//       aggregate: "SUM",
//       source: "revenues",
//       field: "Amount",
//       periodFilter: "current",
//     },
//   },
//   {
//     id: "profit",
//     title: "Lợi nhuận",
//     summary: "Lấy doanh thu trừ chi phí bằng ref + op.",
//     formulaType: "CELL_REF",
//     expression: {
//       op: "SUBTRACT",
//       left: { ref: "S2C_TOTAL_REVENUE" },
//       right: { ref: "S2C_TOTAL_COST" },
//     },
//   },
//   {
//     id: "pit-basic",
//     title: "PIT cơ bản",
//     summary: "MAX(0, profit) nhân với TaxRate(PIT_M1).",
//     formulaType: "TAX_RATE",
//     expression: {
//       op: "MULTIPLY",
//       left: {
//         fn: "MAX",
//         args: [{ literal: 0 }, { ref: "S2C_PROFIT" }],
//       },
//       right: {
//         lookup: {
//           entity: "IndustryTaxRates",
//           field: "TaxRate",
//           filter: { TaxType: "PIT_METHOD_1" },
//         },
//       },
//     },
//   },
//   {
//     id: "opening-cash",
//     title: "Số dư đầu kỳ",
//     summary: "Lookup OpeningCashBalance từ AccountingPeriods.",
//     formulaType: "EXTERNAL_LOOKUP",
//     expression: {
//       lookup: {
//         entity: "AccountingPeriods",
//         field: "OpeningCashBalance",
//       },
//     },
//   },
//   {
//     id: "foreach-vat",
//     title: "VAT theo ngành",
//     summary: "Foreach theo revenues, apply TaxRate VAT và reduce SUM.",
//     formulaType: "TAX_RATE",
//     expression: {
//       foreach: "industry",
//       apply: {
//         op: "MULTIPLY",
//         left: { context: "group_amount" },
//         right: {
//           lookup: {
//             entity: "IndustryTaxRates",
//             field: "TaxRate",
//             filter: { TaxType: "VAT" },
//           },
//         },
//       },
//       reduce: "SUM",
//     },
//   },
// ];

function tokenId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function collectRefs(node: unknown, bag: Set<string>): void {
  const record = asRecord(node);
  if (!record) return;
  const ref = record.ref;
  if (typeof ref === "string" && ref.trim()) bag.add(ref.trim());

  Object.values(record).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => collectRefs(item, bag));
      return;
    }
    if (value && typeof value === "object") collectRefs(value, bag);
  });
}

function collectNodeTypes(node: unknown, bag: Set<string>): void {
  const record = asRecord(node);
  if (!record) return;

  const supportedNodeKeys = [
    "literal",
    "ref",
    "aggregate",
    "lookup",
    "op",
    "fn",
    "foreach",
    "context",
  ] as const;

  supportedNodeKeys.forEach((key) => {
    if (key in record) bag.add(key);
  });

  Object.values(record).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => collectNodeTypes(item, bag));
      return;
    }
    if (value && typeof value === "object") collectNodeTypes(value, bag);
  });
}

function countAstNodes(node: unknown): number {
  const record = asRecord(node);
  if (!record) return 0;

  let total = 1;
  Object.values(record).forEach((value) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        total += countAstNodes(item);
      });
      return;
    }
    if (value && typeof value === "object") {
      total += countAstNodes(value);
    }
  });
  return total;
}

function parseExpressionJson(text: string): unknown | null {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function formatExpressionJson(text: string): string {
  const parsed = parseExpressionJson(text);
  if (!parsed) return text;
  return JSON.stringify(parsed, null, 2);
}

function detectNodeTypeKey(node: Record<string, unknown>): string | null {
  const candidates = [
    "literal",
    "ref",
    "aggregate",
    "lookup",
    "op",
    "fn",
    "foreach",
    "context",
  ];
  for (const candidate of candidates) {
    if (candidate in node) return candidate;
  }
  return null;
}

function explainExpressionByWords(node: unknown): string {
  const record = asRecord(node);
  if (!record) return "Biểu thức chưa hợp lệ";

  if (typeof record.literal === "number") {
    return `Giá trị cố định ${record.literal.toLocaleString("vi-VN")}`;
  }

  if (typeof record.ref === "string") {
    return `Lấy giá trị từ công thức [${record.ref}]`;
  }

  if (typeof record.aggregate === "string") {
    const source =
      typeof record.source === "string"
        ? (SOURCE_LABELS[record.source as keyof typeof SOURCE_LABELS] ??
          record.source)
        : "nguồn dữ liệu";
    const field = typeof record.field === "string" ? record.field : "trường";
    return `Tổng hợp ${record.aggregate} của ${field} từ ${source}`;
  }

  if (record.lookup && typeof record.lookup === "object") {
    const lookup = asRecord(record.lookup);
    const field = typeof lookup?.field === "string" ? lookup.field : "giá trị";
    const entity =
      typeof lookup?.entity === "string" ? lookup.entity : "bảng tham chiếu";
    return `Tra cứu ${field} từ ${entity}`;
  }

  if (typeof record.op === "string") {
    const opLabel: Record<string, string> = {
      ADD: "cộng",
      SUBTRACT: "trừ",
      MULTIPLY: "nhân",
      DIVIDE: "chia",
    };
    const left = explainExpressionByWords(record.left);
    const right = explainExpressionByWords(record.right);
    return `${left} ${opLabel[record.op] ?? record.op} ${right}`;
  }

  if (typeof record.fn === "string") {
    const args = Array.isArray(record.args)
      ? record.args.map((arg) => explainExpressionByWords(arg)).join(", ")
      : "";
    return `Áp dụng hàm ${record.fn} cho: ${args}`;
  }

  if (typeof record.foreach === "string") {
    const reduce = typeof record.reduce === "string" ? record.reduce : "SUM";
    return `Lặp theo ${record.foreach}, tính biểu thức con rồi gộp bằng ${reduce}`;
  }

  if (typeof record.context === "string") {
    return `Giá trị ngữ cảnh @${record.context}`;
  }

  return "Cấu trúc biểu thức phức tạp";
}

function validateExpressionAgainstSchemas(
  node: unknown,
  schemas: FormulaNodeSchema[],
  path = "root",
): string[] {
  const record = asRecord(node);
  if (!record) return [`${path}: cấu trúc công thức không hợp lệ`];

  const nodeType = detectNodeTypeKey(record);
  if (!nodeType) return [`${path}: không nhận diện được thành phần công thức`];

  const schema = schemas.find((item) => item.nodeType === nodeType);
  const errors: string[] = [];

  if (!schema) {
    errors.push(`${path}: thiếu quy tắc kiểm tra cho thành phần ${nodeType}`);
  } else {
    schema.fields.forEach((field) => {
      if (!field.required) return;
      const keyParts = field.fieldName.split(".");
      let current: unknown = record;
      for (const part of keyParts) {
        const curRecord = asRecord(current);
        current = curRecord ? curRecord[part] : undefined;
      }
      if (
        current === undefined ||
        current === null ||
        (typeof current === "string" && !current.trim())
      ) {
        errors.push(`${path}: thiếu trường bắt buộc ${field.fieldName}`);
      }
    });
  }

  const childCandidates: Array<{ key: string; value: unknown }> = [];
  if (nodeType === "op") {
    if (asRecord(record.left))
      childCandidates.push({ key: "left", value: record.left });
    if (asRecord(record.right))
      childCandidates.push({ key: "right", value: record.right });
  }

  if (nodeType === "fn") {
    if (Array.isArray(record.args)) {
      record.args.forEach((arg, index) => {
        if (asRecord(arg)) {
          childCandidates.push({ key: `args[${index}]`, value: arg });
        }
      });
    }
  }

  if (nodeType === "foreach") {
    if (asRecord(record.apply)) {
      childCandidates.push({ key: "apply", value: record.apply });
    }
  }

  childCandidates.forEach((child) => {
    errors.push(
      ...validateExpressionAgainstSchemas(
        child.value,
        schemas,
        `${path}.${child.key}`,
      ),
    );
  });

  return errors;
}

function normalizeNodeSchema(raw: Record<string, unknown>): FormulaNodeSchema {
  const fields = Array.isArray(raw.fields)
    ? raw.fields
        .map((field) => asRecord(field))
        .filter((field): field is Record<string, unknown> => Boolean(field))
        .map((field) => ({
          fieldName: typeof field.fieldName === "string" ? field.fieldName : "",
          fieldType: typeof field.fieldType === "string" ? field.fieldType : "",
          required: Boolean(field.required),
          description:
            typeof field.description === "string"
              ? field.description
              : undefined,
          allowedValues: Array.isArray(field.allowedValues)
            ? field.allowedValues.filter(
                (value): value is string => typeof value === "string",
              )
            : undefined,
        }))
    : [];

  return {
    nodeType: typeof raw.nodeType === "string" ? raw.nodeType : "unknown",
    label: typeof raw.label === "string" ? raw.label : "Unknown",
    description: typeof raw.description === "string" ? raw.description : "",
    example: typeof raw.example === "string" ? raw.example : undefined,
    fields,
  };
}

function getAstNodeTitle(node: Record<string, unknown>): string {
  if (typeof node.literal === "number") return `literal = ${node.literal}`;
  if (typeof node.ref === "string") return `ref -> ${node.ref}`;
  if (typeof node.aggregate === "string") return `aggregate:${node.aggregate}`;
  if (node.lookup && typeof node.lookup === "object") {
    const lookup = asRecord(node.lookup);
    const entity =
      typeof lookup?.entity === "string" ? lookup.entity : "lookup";
    return `lookup:${entity}`;
  }
  if (typeof node.op === "string") return `op:${node.op}`;
  if (typeof node.fn === "string") return `fn:${node.fn}`;
  if (typeof node.foreach === "string") return `foreach:${node.foreach}`;
  if (typeof node.context === "string") return `context:${node.context}`;
  return "node";
}

function AstNodeOutline({
  node,
  depth = 0,
}: {
  node: unknown;
  depth?: number;
}) {
  const record = asRecord(node);
  if (!record) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 px-3 py-2 text-xs text-gray-500">
        Node không hợp lệ
      </div>
    );
  }

  const childEntries = Object.entries(record).flatMap(([key, value]) => {
    if (!value || typeof value !== "object") return [];
    if (Array.isArray(value)) {
      return value.map((item, index) => ({
        key: `${key}-${index}`,
        label: `${key}[${index}]`,
        value: item,
      }));
    }
    return [{ key, label: key, value }];
  });

  return (
    <div
      className="space-y-2 rounded-xl border border-slate-200 bg-white px-3 py-3"
      style={{ marginLeft: depth === 0 ? 0 : depth * 12 }}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {getAstNodeTitle(record)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {Object.keys(record).join(" · ")}
          </p>
        </div>
        <Badge variant="secondary" className="bg-slate-100 text-slate-700">
          level {depth}
        </Badge>
      </div>

      {childEntries.length > 0 ? (
        <div className="space-y-2 border-l border-slate-200 pl-3">
          {childEntries.map((entry) => (
            <div key={entry.key} className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                {entry.label}
              </p>
              <AstNodeOutline node={entry.value} depth={depth + 1} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function astToTokens(node: unknown, depth = 0): FormulaToken[] | null {
  const record = asRecord(node);
  if (!record) return null;

  if (typeof record.ref === "string") {
    const refCode = record.ref.trim();
    if (!refCode) return null;
    return [{ id: tokenId(), type: "var", value: refCode, label: refCode }];
  }

  const literal = asNumber(record.literal);
  if (literal !== null) {
    return [
      {
        id: tokenId(),
        type: "num",
        value: String(literal),
        label: String(literal),
      },
    ];
  }

  if (
    typeof record.op === "string" &&
    record.left &&
    typeof record.left === "object" &&
    record.right &&
    typeof record.right === "object"
  ) {
    const left = astToTokens(record.left, depth + 1);
    const right = astToTokens(record.right, depth + 1);
    if (!left || !right) return null;

    const opMap: Record<string, string> = {
      ADD: "+",
      SUBTRACT: "-",
      MULTIPLY: "*",
      DIVIDE: "/",
    };
    const sign = opMap[String(record.op).toUpperCase()];
    if (!sign) return null;

    const joined: FormulaToken[] = [
      ...left,
      { id: tokenId(), type: "op", value: sign, label: sign },
      ...right,
    ];

    if (depth === 0) return joined;

    return [
      { id: tokenId(), type: "lpar", value: "(", label: "(" },
      ...joined,
      { id: tokenId(), type: "rpar", value: ")", label: ")" },
    ];
  }

  return null;
}

function tokensToAst(tokens: FormulaToken[]): Record<string, unknown> | null {
  if (!tokens.length) return null;

  const precedence: Record<string, number> = {
    "+": 1,
    "-": 1,
    "*": 2,
    "/": 2,
  };

  const output: FormulaToken[] = [];
  const stack: FormulaToken[] = [];

  for (const token of tokens) {
    if (token.type === "var" || token.type === "num") {
      output.push(token);
      continue;
    }

    if (token.type === "op") {
      while (
        stack.length > 0 &&
        stack[stack.length - 1].type === "op" &&
        precedence[stack[stack.length - 1].value] >= precedence[token.value]
      ) {
        const next = stack.pop();
        if (next) output.push(next);
      }
      stack.push(token);
      continue;
    }

    if (token.type === "lpar") {
      stack.push(token);
      continue;
    }

    if (token.type === "rpar") {
      while (stack.length && stack[stack.length - 1].type !== "lpar") {
        const next = stack.pop();
        if (next) output.push(next);
      }
      if (!stack.length) return null;
      stack.pop();
    }
  }

  while (stack.length) {
    const next = stack.pop();
    if (!next || next.type === "lpar") return null;
    output.push(next);
  }

  const astStack: Array<Record<string, unknown>> = [];
  const opMap: Record<string, string> = {
    "+": "ADD",
    "-": "SUBTRACT",
    "*": "MULTIPLY",
    "/": "DIVIDE",
  };

  for (const token of output) {
    if (token.type === "var") {
      astStack.push({ ref: token.value });
      continue;
    }

    if (token.type === "num") {
      const parsed = Number(token.value);
      if (!Number.isFinite(parsed)) return null;
      astStack.push({ literal: parsed });
      continue;
    }

    if (token.type === "op") {
      const right = astStack.pop();
      const left = astStack.pop();
      if (!left || !right) return null;
      astStack.push({
        op: opMap[token.value],
        left,
        right,
      });
    }
  }

  return astStack.length === 1 ? astStack[0] : null;
}

// ─── FieldHint ──────────────────────────────────────────────────────────────
function FieldHint({ hint }: { hint: string }) {
  const [open, setOpen] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function enter() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setOpen(true);
      timerRef.current = null;
    }, 250);
  }
  function leave() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setOpen(false);
  }

  return (
    <span className="relative ml-1 inline-flex items-center">
      <button
        type="button"
        onMouseEnter={enter}
        onMouseLeave={leave}
        onFocus={enter}
        onBlur={leave}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#15918f] transition hover:scale-105 focus-visible:outline-none"
      >
        <CircleHelp className="h-3.5 w-3.5" />
      </button>
      {open && (
        <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-64 rounded-md bg-white px-3 py-2 text-[11px] leading-relaxed text-gray-700 shadow-lg ring-1 ring-[#23C4C1]/35">
          {hint}
        </div>
      )}
    </span>
  );
}

// ─── AggregateEditor ─────────────────────────────────────────────────────────
function AggregateEditor({
  exprJson,
  setExprJson,
}: {
  exprJson: string;
  setExprJson: (v: string) => void;
}) {
  const parsed = useMemo(() => {
    try {
      return JSON.parse(exprJson) as Record<string, unknown>;
    } catch {
      return {} as Record<string, unknown>;
    }
  }, [exprJson]);

  const aggregateNode =
    typeof parsed.fn === "string" &&
    parsed.fn &&
    Array.isArray(parsed.args) &&
    parsed.args.length > 0 &&
    typeof parsed.args[0] === "object" &&
    parsed.args[0] !== null &&
    !Array.isArray(parsed.args[0])
      ? (parsed.args[0] as Record<string, unknown>)
      : parsed;

  const source =
    typeof aggregateNode.source === "string" &&
    aggregateNode.source in SOURCES_META
      ? (aggregateNode.source as SourceKey)
      : "";
  const field =
    typeof aggregateNode.field === "string" ? aggregateNode.field : "";
  const fn = typeof parsed.fn === "string" ? parsed.fn : "";
  const aggFn =
    typeof aggregateNode.aggregate === "string" ? aggregateNode.aggregate : "";
  const scope =
    typeof aggregateNode.scope === "string" ? aggregateNode.scope : "";
  const period =
    typeof aggregateNode.periodFilter === "string"
      ? aggregateNode.periodFilter
      : "";
  const sign = typeof aggregateNode.sign === "string" ? aggregateNode.sign : "";
  const filter =
    typeof aggregateNode.filter === "object" &&
    aggregateNode.filter &&
    !Array.isArray(aggregateNode.filter)
      ? (aggregateNode.filter as Record<string, string[] | string>)
      : ({} as Record<string, string[] | string>);

  const sourceMeta = source ? SOURCES_META[source] : null;

  function readFilterValues(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
    if (typeof value === "string" && value) {
      return [value];
    }
    return [];
  }

  function serializeFilterValues(
    value: string[],
  ): string | string[] | undefined {
    const normalized = value.filter((item) => item.trim());
    if (normalized.length === 0) return undefined;
    if (normalized.length === 1) return normalized[0];
    return normalized;
  }

  function serializeFilterMap(
    value: Record<string, string[] | string>,
  ): Record<string, string | string[]> | undefined {
    const nextFilter: Record<string, string | string[]> = {};
    Object.entries(value).forEach(([key, item]) => {
      const serialized = Array.isArray(item)
        ? serializeFilterValues(item)
        : typeof item === "string" && item.trim()
          ? item.trim()
          : undefined;
      if (serialized !== undefined) {
        nextFilter[key] = serialized;
      }
    });
    return Object.keys(nextFilter).length ? nextFilter : undefined;
  }

  function buildNextJson(
    updates: Record<string, unknown>,
    nextFn: string,
  ): void {
    const nextAggregate: Record<string, unknown> = {
      ...aggregateNode,
      ...updates,
    };
    if (nextAggregate.filter && typeof nextAggregate.filter === "object") {
      nextAggregate.filter = serializeFilterMap(
        nextAggregate.filter as Record<string, string[] | string>,
      );
    }
    Object.keys(nextAggregate).forEach(
      (key) => nextAggregate[key] === undefined && delete nextAggregate[key],
    );

    if (nextFn) {
      setExprJson(JSON.stringify({ fn: nextFn, args: [nextAggregate] }));
      return;
    }

    setExprJson(JSON.stringify(nextAggregate));
  }

  function patch(updates: Record<string, unknown>) {
    const hasFnUpdate = Object.prototype.hasOwnProperty.call(updates, "fn");
    const nextFn = hasFnUpdate
      ? typeof updates.fn === "string" && updates.fn.trim()
        ? updates.fn.trim()
        : ""
      : fn;
    const nextUpdates = { ...updates };
    delete nextUpdates.fn;
    buildNextJson(nextUpdates, nextFn);
  }

  function patchFilter(key: string, opts: string[]) {
    const nextFilter = { ...filter };
    if (opts.length === 0) delete nextFilter[key];
    else nextFilter[key] = opts;
    patch({ filter: Object.keys(nextFilter).length ? nextFilter : undefined });
  }

  const sel = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
  const lbl = "mb-1 block text-xs font-medium text-gray-600";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={lbl}>
            Nguồn dữ liệu
            <FieldHint hint="Bảng dữ liệu cần tổng hợp: revenues (doanh thu), costs (chi phí), gl_entries (bút toán tiền mặt/ngân hàng), stock_movements (xuất nhập kho)." />
          </label>
          <select
            value={source}
            onChange={(e) => {
              const s = e.target.value as SourceKey | "";
              if (!s) {
                patch({
                  source: undefined,
                  field: undefined,
                  filter: undefined,
                });
                return;
              }
              patch({
                source: s,
                field: undefined,
                filter: undefined,
              });
            }}
            className={sel}
          >
            <option value="">none</option>
            {(
              Object.entries(SOURCES_META) as [
                SourceKey,
                (typeof SOURCES_META)[SourceKey],
              ][]
            ).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} · {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>
            Hàm fn
            <FieldHint hint="Chọn hàm bao ngoài aggregate. Khi có fn, JSON sẽ được bọc theo dạng { fn, args: [ { ...aggregate } ] } để phân biệt rõ lớp xử lý." />
          </label>
          <select
            value={fn}
            onChange={(e) =>
              patch({ fn: e.target.value ? e.target.value : undefined })
            }
            className={sel}
          >
            <option value="">none</option>
            <option value="MAX">MAX</option>
            <option value="MIN">MIN</option>
            <option value="ABS">ABS</option>
          </select>
        </div>

        <div>
          <label className={lbl}>
            Trường dữ liệu
            <FieldHint hint="Cột cần tổng hợp trong bảng nguồn. Ví dụ: Amount (số tiền), QuantityDelta (số lượng thay đổi), DebitAmount / CreditAmount (nợ / có GL)." />
          </label>
          <select
            value={field}
            onChange={(e) =>
              patch({ field: e.target.value ? e.target.value : undefined })
            }
            className={sel}
            disabled={!sourceMeta}
          >
            <option value="">none</option>
            {sourceMeta?.fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>
            Hàm tổng hợp
            <FieldHint hint="SUM: cộng tổng · COUNT: đếm số bản ghi · AVG: trung bình cộng. Kết quả trả về 0 nếu không có dữ liệu." />
          </label>
          <select
            value={aggFn}
            onChange={(e) =>
              patch({
                aggregate: e.target.value ? e.target.value : undefined,
              })
            }
            className={sel}
          >
            <option value="">none</option>
            {AGGREGATE_FUNS.map((fn) => (
              <option key={fn} value={fn}>
                {fn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>
            Phạm vi
            <FieldHint hint="book: lọc theo ngành nghề (business type) của sổ đang tính. location: lấy toàn bộ dữ liệu của địa điểm, không phân biệt ngành." />
          </label>
          <select
            value={scope}
            onChange={(e) =>
              patch({ scope: e.target.value ? e.target.value : undefined })
            }
            className={sel}
          >
            <option value="">none</option>
            <option value="book">book — Theo ngành / sổ</option>
            <option value="location">location — Toàn địa điểm</option>
          </select>
        </div>

        <div>
          <label className={lbl}>
            Lọc theo kỳ
            <FieldHint hint="current: chỉ lấy phát sinh trong kỳ. before: lấy số dư / phát sinh trước kỳ (dùng cho tồn đầu kỳ). none: không lọc theo kỳ." />
          </label>
          <select
            value={period}
            onChange={(e) =>
              patch({
                periodFilter: e.target.value ? e.target.value : undefined,
              })
            }
            className={sel}
          >
            <option value="">none</option>
            <option value="current">Trong kỳ (current)</option>
            <option value="before">Trước kỳ (before)</option>
          </select>
        </div>

        <div>
          <label className={lbl}>
            Dấu số liệu
            <FieldHint hint="all: tất cả bản ghi. positive: chỉ lấy bản ghi có giá trị > 0 (ví dụ: nhập kho). negative: chỉ lấy giá trị < 0 (ví dụ: xuất kho QuantityDelta âm)." />
          </label>
          <select
            value={sign}
            onChange={(e) =>
              patch({
                sign: e.target.value ? e.target.value : undefined,
              })
            }
            className={sel}
          >
            <option value="">none</option>
            <option value="all">Tất cả (all)</option>
            <option value="positive">Chỉ dương (positive)</option>
            <option value="negative">Chỉ âm (negative)</option>
          </select>
        </div>
      </div>

      {sourceMeta
        ? Object.entries(sourceMeta.filterKeys).map(([key, options]) => {
            const selected: string[] = readFilterValues(filter[key]);
            return (
              <div key={key}>
                <label className={lbl}>Lọc: {key}</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {options.map((opt) => {
                    const active = selected.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() =>
                          patchFilter(
                            key,
                            active
                              ? selected.filter((s) => s !== opt)
                              : [...selected, opt],
                          )
                        }
                        className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                          active
                            ? "border-[#2563eb]/40 bg-[#eff6ff] text-[#1d4ed8]"
                            : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        : null}

      <div className="rounded-lg bg-[#0b1324] px-3 py-2.5">
        <p className="mb-1 text-[11px] text-gray-400">Xem trước dữ liệu JSON</p>
        <pre className="overflow-x-auto text-xs text-cyan-300">
          {JSON.stringify(
            (() => {
              try {
                return JSON.parse(exprJson);
              } catch {
                return {};
              }
            })(),
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

// ─── LookupEditor ─────────────────────────────────────────────────────────────
function LookupEditor({
  exprJson,
  setExprJson,
  isCreateMode,
}: {
  exprJson: string;
  setExprJson: (v: string) => void;
  isCreateMode: boolean;
}) {
  const lookupObj = useMemo<Record<string, unknown>>(() => {
    try {
      const p = JSON.parse(exprJson) as Record<string, unknown>;
      if (p.lookup && typeof p.lookup === "object" && !Array.isArray(p.lookup))
        return p.lookup as Record<string, unknown>;
      return {};
    } catch {
      return {};
    }
  }, [exprJson]);

  const entity =
    typeof lookupObj.entity === "string" && lookupObj.entity in LOOKUP_META
      ? (lookupObj.entity as LookupEntityKey)
      : isCreateMode
        ? ""
        : "AccountingPeriods";
  const field =
    typeof lookupObj.field === "string"
      ? lookupObj.field
      : entity
        ? (LOOKUP_META[entity].fields[0] ?? "")
        : "";
  const filter =
    typeof lookupObj.filter === "object" &&
    lookupObj.filter &&
    !Array.isArray(lookupObj.filter)
      ? (lookupObj.filter as Record<string, string>)
      : ({} as Record<string, string>);

  const entityMeta = entity ? LOOKUP_META[entity] : null;

  function patchLookup(updates: Record<string, unknown>) {
    const next: Record<string, unknown> = { ...lookupObj, ...updates };
    Object.keys(next).forEach((k) => next[k] === undefined && delete next[k]);
    if (Object.keys(next).length === 0) {
      setExprJson("{}");
      return;
    }
    setExprJson(JSON.stringify({ lookup: next }));
  }

  const sel = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
  const lbl = "mb-1 block text-xs font-medium text-gray-600";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={lbl}>
            Bảng tra cứu
            <FieldHint hint="IndustryTaxRates: bảng thuế suất theo ngành (VAT, PIT). AccountingPeriods: kỳ kế toán — dùng để lấy số dư đầu kỳ (OpeningCashBalance, OpeningBankBalance)." />
          </label>
          <select
            value={entity}
            onChange={(e) => {
              const ent = e.target.value as LookupEntityKey | "";
              if (!ent) {
                patchLookup({
                  entity: undefined,
                  field: undefined,
                  filter: undefined,
                });
                return;
              }
              patchLookup({
                entity: ent,
                field: undefined,
                filter: undefined,
              });
            }}
            className={sel}
          >
            <option value="">none</option>
            {(
              Object.entries(LOOKUP_META) as [
                LookupEntityKey,
                (typeof LOOKUP_META)[LookupEntityKey],
              ][]
            ).map(([k, v]) => (
              <option key={k} value={k}>
                {v.label} · {k}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>
            Trường dữ liệu
            <FieldHint hint="Cột giá trị cần lấy từ bảng tra cứu. Ví dụ: TaxRate (thuế suất), OpeningCashBalance (tiền mặt đầu kỳ), OpeningBankBalance (tiền gửi đầu kỳ)." />
          </label>
          <select
            value={field}
            onChange={(e) =>
              patchLookup({
                field: e.target.value ? e.target.value : undefined,
              })
            }
            className={sel}
            disabled={!entityMeta}
          >
            <option value="">none</option>
            {entityMeta?.fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {entityMeta
        ? Object.entries(entityMeta.filterKeys).map(([key, options]) => {
            const current =
              typeof filter[key] === "string"
                ? normalizeTaxType(filter[key])
                : "";
            return (
              <div key={key}>
                <label className={lbl}>Lọc: {key}</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() =>
                        patchLookup({
                          filter: {
                            ...filter,
                            [key]:
                              key === "TaxType" ? normalizeTaxType(opt) : opt,
                          },
                        })
                      }
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        current === opt
                          ? "border-[#2563eb]/40 bg-[#eff6ff] text-[#1d4ed8]"
                          : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            );
          })
        : null}

      <div className="rounded-lg bg-[#0b1324] px-3 py-2.5">
        <p className="mb-1 text-[11px] text-gray-400">Xem trước dữ liệu JSON</p>
        <pre className="overflow-x-auto text-xs text-cyan-300">
          {JSON.stringify({ lookup: lookupObj }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

const TAX_RATE_OPERATOR_OPTIONS = [
  { value: "ADD", label: "Cộng" },
  { value: "SUBTRACT", label: "Trừ" },
  { value: "MULTIPLY", label: "Nhân" },
  { value: "DIVIDE", label: "Chia" },
] as const;

const TAX_RATE_OPERATOR_SIGN: Record<string, string> = {
  ADD: "+",
  SUBTRACT: "-",
  MULTIPLY: "*",
  DIVIDE: "/",
};

const MAX0_SUB_REF_LIT_PREFIX = "MAX0_SUB_REF_LIT:";
const MAX0_SUB_REF_LIT_CUSTOM = "__MAX0_SUB_REF_LIT_CUSTOM__";

function buildTaxLookupNode(taxType: string): Record<string, unknown> {
  return {
    lookup: {
      entity: "IndustryTaxRates",
      field: "TaxRate",
      filter: {
        TaxType: normalizeTaxType(taxType) || "VAT",
      },
    },
  };
}

function parseMaxZeroSubtractPreset(
  preset: string,
): { refCode: string; threshold: number } | null {
  if (!preset.startsWith(MAX0_SUB_REF_LIT_PREFIX)) return null;

  const payload = preset.slice(MAX0_SUB_REF_LIT_PREFIX.length);
  const splitIndex = payload.lastIndexOf(":");
  if (splitIndex <= 0) return null;

  const refCode = payload.slice(0, splitIndex).trim();
  const thresholdRaw = payload.slice(splitIndex + 1).trim();
  const threshold = Number(thresholdRaw);

  if (!refCode || !Number.isFinite(threshold)) return null;
  return { refCode, threshold };
}

function buildMaxZeroSubtractPreset(
  refCode: string,
  threshold: number,
): string {
  const safeRefCode = refCode.trim() || "FORMULA_CODE";
  const safeThreshold = Number.isFinite(threshold) ? threshold : 0;
  return `${MAX0_SUB_REF_LIT_PREFIX}${safeRefCode}:${safeThreshold}`;
}

function toTaxRateOperandPreset(node: unknown): string | null {
  const record = asRecord(node);
  if (!record) return null;

  if (typeof record.ref === "string" && record.ref.trim()) {
    return `REF:${record.ref.trim()}`;
  }

  if (typeof record.context === "string" && record.context.trim()) {
    return `CONTEXT:${record.context.trim()}`;
  }

  if (typeof record.literal === "number" && Number.isFinite(record.literal)) {
    return `LITERAL:${record.literal}`;
  }

  const fnName =
    typeof record.fn === "string" ? record.fn.trim().toUpperCase() : "";
  if (
    fnName === "MAX" &&
    Array.isArray(record.args) &&
    record.args.length === 2
  ) {
    const firstArg = asRecord(record.args[0]);
    const secondArg = asRecord(record.args[1]);

    const firstIsZero =
      typeof firstArg?.literal === "number" && Number(firstArg.literal) === 0;
    const secondIsZero =
      typeof secondArg?.literal === "number" && Number(secondArg.literal) === 0;

    if (
      firstIsZero &&
      typeof secondArg?.ref === "string" &&
      secondArg.ref.trim()
    ) {
      return `MAX0_REF:${secondArg.ref.trim()}`;
    }
    if (
      secondIsZero &&
      typeof firstArg?.ref === "string" &&
      firstArg.ref.trim()
    ) {
      return `MAX0_REF:${firstArg.ref.trim()}`;
    }

    const subtractArg = firstIsZero
      ? secondArg
      : secondIsZero
        ? firstArg
        : null;
    const subtractOp =
      typeof subtractArg?.op === "string"
        ? subtractArg.op.trim().toUpperCase()
        : "";
    if (subtractOp === "SUBTRACT") {
      const subtractLeft = asRecord(subtractArg?.left);
      const subtractRight = asRecord(subtractArg?.right);
      const refCode =
        typeof subtractLeft?.ref === "string" ? subtractLeft.ref.trim() : "";
      const threshold = Number(subtractRight?.literal);

      if (refCode && Number.isFinite(threshold)) {
        return `MAX0_SUB_REF_LIT:${refCode}:${threshold}`;
      }
    }
  }

  const lookup = asRecord(record.lookup);
  if (!lookup) return null;

  const entity = String(lookup.entity ?? "")
    .trim()
    .toUpperCase();
  const field = String(lookup.field ?? "")
    .trim()
    .toUpperCase();
  if (entity !== "INDUSTRYTAXRATES" || field !== "TAXRATE") return null;

  const filter = asRecord(lookup.filter);
  const taxType = normalizeTaxType(String(filter?.TaxType ?? "VAT"));
  return `LOOKUP:${taxType || "VAT"}`;
}

function parseTaxRateOperandPreset(preset: string): Record<string, unknown> {
  if (preset.startsWith("LOOKUP:")) {
    return buildTaxLookupNode(preset.slice("LOOKUP:".length));
  }

  if (preset.startsWith("MAX0_REF:")) {
    const refCode = preset.slice("MAX0_REF:".length).trim();
    return {
      fn: "MAX",
      args: [{ literal: 0 }, { ref: refCode }],
    };
  }

  const maxZeroSubtract = parseMaxZeroSubtractPreset(preset);
  if (maxZeroSubtract) {
    return {
      fn: "MAX",
      args: [
        { literal: 0 },
        {
          op: "SUBTRACT",
          left: { ref: maxZeroSubtract.refCode },
          right: { literal: maxZeroSubtract.threshold },
        },
      ],
    };
  }

  if (preset.startsWith("REF:")) {
    return { ref: preset.slice("REF:".length) };
  }

  if (preset.startsWith("CONTEXT:")) {
    return { context: preset.slice("CONTEXT:".length) };
  }

  if (preset.startsWith("LITERAL:")) {
    const parsed = Number(preset.slice("LITERAL:".length));
    return { literal: Number.isFinite(parsed) ? parsed : 0 };
  }

  return { literal: 0 };
}

function TaxRateEditor({
  exprJson,
  setExprJson,
  formulaList,
  isCreateMode,
}: {
  exprJson: string;
  setExprJson: (v: string) => void;
  formulaList: AccountingFormulaSummary[];
  isCreateMode: boolean;
}) {
  const parsedRoot = useMemo(() => {
    const parsed = parseExpressionJson(exprJson);
    return asRecord(parsed) ?? ({} as Record<string, unknown>);
  }, [exprJson]);

  const applyNode = useMemo(() => {
    if ("foreach" in parsedRoot && parsedRoot.apply) {
      return asRecord(parsedRoot.apply) ?? ({} as Record<string, unknown>);
    }
    return parsedRoot;
  }, [parsedRoot]);

  const loopConfig = useMemo(() => {
    return {
      foreach: typeof parsedRoot.foreach === "string" ? parsedRoot.foreach : "",
      source:
        typeof parsedRoot.source === "string" ? parsedRoot.source : "revenues",
      field: typeof parsedRoot.field === "string" ? parsedRoot.field : "Amount",
      groupBy:
        typeof parsedRoot.groupBy === "string"
          ? parsedRoot.groupBy
          : "BusinessTypeId",
      reduce: typeof parsedRoot.reduce === "string" ? parsedRoot.reduce : "SUM",
      costSource:
        typeof parsedRoot.costSource === "string" ? parsedRoot.costSource : "",
      costField:
        typeof parsedRoot.costField === "string" ? parsedRoot.costField : "",
    };
  }, [parsedRoot]);

  const leftFallback = useMemo(
    () => asRecord(applyNode.left) ?? { context: "group_amount" },
    [applyNode.left],
  );

  const rightFallback = useMemo(
    () => asRecord(applyNode.right) ?? buildTaxLookupNode("VAT"),
    [applyNode.right],
  );
  const parsedOp =
    typeof applyNode.op === "string" ? applyNode.op.toUpperCase() : "";
  const defaultOp = TAX_RATE_OPERATOR_SIGN[parsedOp] ? parsedOp : "MULTIPLY";
  const hasTaxRateShape =
    "foreach" in parsedRoot ||
    typeof applyNode.op === "string" ||
    "left" in applyNode ||
    "right" in applyNode;

  const leftPreset = toTaxRateOperandPreset(leftFallback);
  const rightPreset = toTaxRateOperandPreset(rightFallback);

  const referenceFormulas = useMemo(
    () =>
      formulaList.filter(
        (formula) => String(formula.code ?? "").trim().length > 0,
      ),
    [formulaList],
  );

  const externalLookupFormulas = useMemo(
    () =>
      referenceFormulas.filter(
        (formula) =>
          normalizeFormulaType(String(formula.formulaType ?? "")) ===
          "EXTERNAL_LOOKUP",
      ),
    [referenceFormulas],
  );

  const maxZeroRefPresets = useMemo(
    () =>
      referenceFormulas.map((formula) => {
        const code = String(formula.code).trim();
        return {
          value: `MAX0_REF:${code}`,
          label: `MAX(0, ${code}) - ${formula.name}`,
        };
      }),
    [referenceFormulas],
  );

  const supportedValues = useMemo(() => {
    const values = new Set<string>();
    TAX_TYPE_OPTIONS.forEach((item) => values.add(`LOOKUP:${item.value}`));
    TAX_RATE_CONTEXT_OPTIONS.forEach((contextKey) =>
      values.add(`CONTEXT:${contextKey}`),
    );
    ["LITERAL:0", "LITERAL:1"].forEach((item) => values.add(item));
    referenceFormulas.forEach((formula) => {
      values.add(`REF:${String(formula.code).trim()}`);
      values.add(`MAX0_REF:${String(formula.code).trim()}`);
    });
    if (leftPreset?.startsWith(MAX0_SUB_REF_LIT_PREFIX)) values.add(leftPreset);
    if (rightPreset?.startsWith(MAX0_SUB_REF_LIT_PREFIX))
      values.add(rightPreset);
    return values;
  }, [referenceFormulas, leftPreset, rightPreset]);

  const selectedOp = isCreateMode && !hasTaxRateShape ? "" : defaultOp;
  const selectedLeft =
    isCreateMode && !hasTaxRateShape
      ? ""
      : leftPreset && supportedValues.has(leftPreset)
        ? leftPreset
        : "__UNSUPPORTED__";
  const selectedRight =
    isCreateMode && !hasTaxRateShape
      ? ""
      : rightPreset && supportedValues.has(rightPreset)
        ? rightPreset
        : "__UNSUPPORTED__";

  function resolveNodeFromPreset(
    preset: string,
    unsupportedFallback: Record<string, unknown>,
  ): Record<string, unknown> | null {
    if (!preset) return null;
    if (preset === "__UNSUPPORTED__") return unsupportedFallback;
    return parseTaxRateOperandPreset(preset);
  }

  const leftNodeForEditor = useMemo(
    () => resolveNodeFromPreset(selectedLeft, leftFallback),
    [selectedLeft, leftFallback],
  );

  const rightNodeForEditor = useMemo(
    () => resolveNodeFromPreset(selectedRight, rightFallback),
    [selectedRight, rightFallback],
  );

  const leftMaxZeroSubtract = parseMaxZeroSubtractPreset(selectedLeft);
  const rightMaxZeroSubtract = parseMaxZeroSubtractPreset(selectedRight);

  function formatMaxZeroSubtractLabel(preset: string): string {
    const parsed = parseMaxZeroSubtractPreset(preset);
    if (!parsed) return "MAX(0, REF - threshold)";
    return `MAX(0, ${parsed.refCode} - ${parsed.threshold})`;
  }

  function resolveCustomMaxZeroSubtractPreset(
    target: "left" | "right",
    candidatePreset: string,
  ): string {
    if (candidatePreset !== MAX0_SUB_REF_LIT_CUSTOM) return candidatePreset;

    const currentPreset = target === "left" ? selectedLeft : selectedRight;
    const parsedCurrent = parseMaxZeroSubtractPreset(currentPreset);
    const fallbackRefCode =
      String(referenceFormulas[0]?.code ?? "FORMULA_CODE").trim() ||
      "FORMULA_CODE";

    return buildMaxZeroSubtractPreset(
      parsedCurrent?.refCode ?? fallbackRefCode,
      parsedCurrent?.threshold ?? 0,
    );
  }

  function composeTaxRateExpression(
    nextOp: string,
    nextLeft: string,
    nextRight: string,
    nextLoopConfig: Record<string, string>,
  ): Record<string, unknown> {
    const apply: Record<string, unknown> = {};

    if (nextOp) {
      apply.op = nextOp;
    }

    if (nextLeft) {
      apply.left =
        nextLeft === "__UNSUPPORTED__"
          ? leftFallback
          : parseTaxRateOperandPreset(nextLeft);
    }

    if (nextRight) {
      apply.right =
        nextRight === "__UNSUPPORTED__"
          ? rightFallback
          : parseTaxRateOperandPreset(nextRight);
    }

    if (!nextLoopConfig.foreach) {
      return apply;
    }

    const result: Record<string, unknown> = {
      foreach: nextLoopConfig.foreach,
      source: nextLoopConfig.source,
      field: nextLoopConfig.field,
      groupBy: nextLoopConfig.groupBy,
      costSource: nextLoopConfig.costSource,
      costField: nextLoopConfig.costField,
      reduce: nextLoopConfig.reduce,
      apply,
    };

    return result;
  }

  function persistTaxRateExpressionWithNodes(
    nextOp: string,
    nextLeftNode: Record<string, unknown> | null,
    nextRightNode: Record<string, unknown> | null,
    nextLoopConfig: Record<string, string>,
  ) {
    const apply: Record<string, unknown> = {};

    if (nextOp) {
      apply.op = nextOp;
    }

    if (nextLeftNode) {
      apply.left = nextLeftNode;
    }

    if (nextRightNode) {
      apply.right = nextRightNode;
    }

    if (Object.keys(apply).length === 0) {
      setExprJson("{}");
      return;
    }

    if (!nextLoopConfig.foreach) {
      setExprJson(JSON.stringify(apply, null, 2));
      return;
    }

    const root: Record<string, unknown> = {
      foreach: nextLoopConfig.foreach,
      source: nextLoopConfig.source,
      field: nextLoopConfig.field,
      groupBy: nextLoopConfig.groupBy,
      reduce: nextLoopConfig.reduce,
      apply,
    };

    if (nextLoopConfig.costSource) root.costSource = nextLoopConfig.costSource;
    if (nextLoopConfig.costField) root.costField = nextLoopConfig.costField;

    setExprJson(JSON.stringify(root, null, 2));
  }

  function updateLeftNode(nextLeftNode: Record<string, unknown>) {
    const rightNode = resolveNodeFromPreset(selectedRight, rightFallback);
    persistTaxRateExpressionWithNodes(
      selectedOp,
      nextLeftNode,
      rightNode,
      loopConfig,
    );
  }

  function updateRightNode(nextRightNode: Record<string, unknown>) {
    const leftNode = resolveNodeFromPreset(selectedLeft, leftFallback);
    persistTaxRateExpressionWithNodes(
      selectedOp,
      leftNode,
      nextRightNode,
      loopConfig,
    );
  }

  function persistTaxRateExpression(
    nextOp: string,
    nextLeft: string,
    nextRight: string,
    nextLoopConfig: Record<string, string>,
  ) {
    const next = composeTaxRateExpression(
      nextOp,
      nextLeft,
      nextRight,
      nextLoopConfig,
    );
    if (Object.keys(next.apply as Record<string, unknown>).length === 0) {
      setExprJson("{}");
      return;
    }
    setExprJson(JSON.stringify(next, null, 2));
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs text-cyan-900">
        <div className="flex items-start justify-between gap-2">
          <p>
            Chỉnh thuế suất bằng UI: Chọn cấu hình vòng lặp và phép toán. Rê vào
            icon trợ giúp để xem chi tiết.
          </p>
          <FieldHint hint="Lookup thuế suất: trả về tỷ lệ thuế (0.01, 0.03...), chưa phải số tiền. EXTERNAL_LOOKUP: lấy số đầu kỳ hoặc giá trị đã định nghĩa sẵn. MAX(0,...): chặn âm để tránh thuế âm." />
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">
          1. Cấu hình vòng lặp (Loop Configuration)
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Lặp theo (foreach)
            </label>
            <select
              value={loopConfig.foreach}
              onChange={(e) =>
                persistTaxRateExpression(
                  selectedOp,
                  selectedLeft,
                  selectedRight,
                  { ...loopConfig, foreach: e.target.value },
                )
              }
              className={inputClass}
            >
              <option value="">Không lặp (None)</option>
              <option value="industry">industry (Ngành nghề)</option>
              <option value="revenues">revenues (Doanh thu)</option>
              <option value="costs">costs (Chi phí)</option>
            </select>
          </div>

          {loopConfig.foreach ? (
            <>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Nguồn dữ liệu (source)
                </label>
                <select
                  value={loopConfig.source}
                  onChange={(e) =>
                    persistTaxRateExpression(
                      selectedOp,
                      selectedLeft,
                      selectedRight,
                      { ...loopConfig, source: e.target.value },
                    )
                  }
                  className={inputClass}
                >
                  <option value="revenues">revenues (Doanh thu)</option>
                  <option value="costs">costs (Chi phí)</option>
                  <option value="gl_entries">gl_entries (Sổ cái)</option>
                  <option value="stock_movements">stock_movements (Kho)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Trường dữ liệu (field)
                </label>
                <input
                  type="text"
                  value={loopConfig.field}
                  onChange={(e) =>
                    persistTaxRateExpression(
                      selectedOp,
                      selectedLeft,
                      selectedRight,
                      { ...loopConfig, field: e.target.value },
                    )
                  }
                  className={inputClass}
                  placeholder="VD: Amount"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Nhóm theo (groupBy)
                </label>
                <input
                  type="text"
                  value={loopConfig.groupBy}
                  onChange={(e) =>
                    persistTaxRateExpression(
                      selectedOp,
                      selectedLeft,
                      selectedRight,
                      { ...loopConfig, groupBy: e.target.value },
                    )
                  }
                  className={inputClass}
                  placeholder="VD: BusinessTypeId"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Gộp kết quả (reduce)
                </label>
                <select
                  value={loopConfig.reduce}
                  onChange={(e) =>
                    persistTaxRateExpression(
                      selectedOp,
                      selectedLeft,
                      selectedRight,
                      { ...loopConfig, reduce: e.target.value },
                    )
                  }
                  className={inputClass}
                >
                  <option value="SUM">SUM</option>
                  <option value="MAX">MAX</option>
                  <option value="MIN">MIN</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Nguồn chi phí (costSource)
                </label>
                <select
                  value={loopConfig.costSource}
                  onChange={(e) =>
                    persistTaxRateExpression(
                      selectedOp,
                      selectedLeft,
                      selectedRight,
                      { ...loopConfig, costSource: e.target.value },
                    )
                  }
                  className={inputClass}
                >
                  <option value="">(Không dùng)</option>
                  <option value="costs">costs (Chi phí)</option>
                  <option value="stock_movements">stock_movements (Kho)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">
                  Trường chi phí (costField)
                </label>
                <input
                  type="text"
                  value={loopConfig.costField}
                  onChange={(e) =>
                    persistTaxRateExpression(
                      selectedOp,
                      selectedLeft,
                      selectedRight,
                      { ...loopConfig, costField: e.target.value },
                    )
                  }
                  className={inputClass}
                  placeholder="VD: Amount"
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
        <h3 className="text-sm font-semibold text-slate-800">
          2. Tính toán giá trị (Apply Expression)
        </h3>
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">
              Phép toán
            </label>
            <select
              value={selectedOp}
              onChange={(event) => {
                const nextOp = event.target.value;
                persistTaxRateExpression(
                  nextOp,
                  selectedLeft,
                  selectedRight,
                  loopConfig,
                );
              }}
              className={inputClass}
            >
              <option value="">none</option>
              {TAX_RATE_OPERATOR_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} ({TAX_RATE_OPERATOR_SIGN[option.value]})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-1/2">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Vế trái
              </label>
              <select
                value={selectedLeft}
                onChange={(event) => {
                  const nextLeft = resolveCustomMaxZeroSubtractPreset(
                    "left",
                    event.target.value,
                  );
                  persistTaxRateExpression(
                    selectedOp,
                    nextLeft,
                    selectedRight,
                    loopConfig,
                  );
                }}
                className={inputClass}
              >
                <option value="">none</option>
                {selectedLeft === "__UNSUPPORTED__" ? (
                  <option value="__UNSUPPORTED__">
                    Giá trị hiện tại chưa hỗ trợ UI
                  </option>
                ) : null}

                <optgroup label="Lookup thuế suất">
                  {TAX_TYPE_OPTIONS.map((item) => (
                    <option key={item.value} value={`LOOKUP:${item.value}`}>
                      TaxRate {item.label}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Công thức EXTERNAL_LOOKUP">
                  {externalLookupFormulas.length > 0 ? (
                    externalLookupFormulas.map((formula) => {
                      const code = String(formula.code).trim();
                      return (
                        <option
                          key={`ext-${formula.formulaId}`}
                          value={`REF:${code}`}
                        >
                          {code} - {formula.name}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>
                      Chưa có công thức EXTERNAL_LOOKUP
                    </option>
                  )}
                </optgroup>

                <optgroup label="Hàm chuẩn">
                  {maxZeroRefPresets.length > 0 ? (
                    maxZeroRefPresets.map((item) => (
                      <option key={`max-left-${item.value}`} value={item.value}>
                        {item.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Chưa có công thức để tạo MAX(0, REF)
                    </option>
                  )}
                </optgroup>

                <optgroup label="Mẫu linh động">
                  <option value={MAX0_SUB_REF_LIT_CUSTOM}>
                    MAX(0, REF - threshold) (dùng input)
                  </option>
                  {leftMaxZeroSubtract ? (
                    <option value={selectedLeft}>
                      {formatMaxZeroSubtractLabel(selectedLeft)}
                    </option>
                  ) : null}
                </optgroup>

                <optgroup label="Công thức tham chiếu">
                  {referenceFormulas.map((formula) => {
                    const code = String(formula.code).trim();
                    return (
                      <option
                        key={`ref-${formula.formulaId}`}
                        value={`REF:${code}`}
                      >
                        {code} - {formula.name}
                      </option>
                    );
                  })}
                </optgroup>

                <optgroup label="Giá trị cố định">
                  <option value="LITERAL:0">0</option>
                  <option value="LITERAL:1">1</option>
                </optgroup>

                <optgroup label="Biến ngữ cảnh">
                  {TAX_RATE_CONTEXT_OPTIONS.map((contextKey) => (
                    <option key={contextKey} value={`CONTEXT:${contextKey}`}>
                      {contextKey}
                    </option>
                  ))}
                </optgroup>
              </select>

              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="mb-1 text-[11px] font-medium text-slate-600">
                  Cây vế trái: chọn node, dùng + để thêm cùng cấp, ++ để thêm
                  node con, X để xóa.
                </p>
                <VisualNodeEditor
                  title="Root left"
                  node={normalizeFormulaNodeOrFallback(leftNodeForEditor)}
                  formulaList={formulaList}
                  onChange={updateLeftNode}
                  onAddSibling={() =>
                    updateLeftNode({
                      fn: "MAX",
                      args: [
                        normalizeFormulaNodeOrFallback(leftNodeForEditor),
                        { literal: 0 },
                      ],
                    })
                  }
                  onDelete={() => updateLeftNode({ literal: 0 })}
                />
              </div>
            </div>

            <div className="mt-6 flex h-10 w-14 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-lg font-semibold text-slate-600">
              {TAX_RATE_OPERATOR_SIGN[selectedOp] ?? "*"}
            </div>

            <div className="w-1/2">
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Vế phải
              </label>
              <select
                value={selectedRight}
                onChange={(event) => {
                  const nextRight = resolveCustomMaxZeroSubtractPreset(
                    "right",
                    event.target.value,
                  );
                  persistTaxRateExpression(
                    selectedOp,
                    selectedLeft,
                    nextRight,
                    loopConfig,
                  );
                }}
                className={inputClass}
              >
                <option value="">none</option>
                {selectedRight === "__UNSUPPORTED__" ? (
                  <option value="__UNSUPPORTED__">
                    Giá trị hiện tại chưa hỗ trợ UI
                  </option>
                ) : null}

                <optgroup label="Lookup thuế suất">
                  {TAX_TYPE_OPTIONS.map((item) => (
                    <option key={item.value} value={`LOOKUP:${item.value}`}>
                      TaxRate {item.label}
                    </option>
                  ))}
                </optgroup>

                <optgroup label="Công thức EXTERNAL_LOOKUP">
                  {externalLookupFormulas.length > 0 ? (
                    externalLookupFormulas.map((formula) => {
                      const code = String(formula.code).trim();
                      return (
                        <option
                          key={`ext-right-${formula.formulaId}`}
                          value={`REF:${code}`}
                        >
                          {code} - {formula.name}
                        </option>
                      );
                    })
                  ) : (
                    <option value="" disabled>
                      Chưa có công thức EXTERNAL_LOOKUP
                    </option>
                  )}
                </optgroup>

                <optgroup label="Hàm chuẩn">
                  {maxZeroRefPresets.length > 0 ? (
                    maxZeroRefPresets.map((item) => (
                      <option
                        key={`max-right-${item.value}`}
                        value={item.value}
                      >
                        {item.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Chưa có công thức để tạo MAX(0, REF)
                    </option>
                  )}
                </optgroup>

                <optgroup label="Mẫu linh động">
                  <option value={MAX0_SUB_REF_LIT_CUSTOM}>
                    MAX(0, REF - threshold) (dùng input)
                  </option>
                  {rightMaxZeroSubtract ? (
                    <option value={selectedRight}>
                      {formatMaxZeroSubtractLabel(selectedRight)}
                    </option>
                  ) : null}
                </optgroup>

                <optgroup label="Công thức tham chiếu">
                  {referenceFormulas.map((formula) => {
                    const code = String(formula.code).trim();
                    return (
                      <option
                        key={`ref-right-${formula.formulaId}`}
                        value={`REF:${code}`}
                      >
                        {code} - {formula.name}
                      </option>
                    );
                  })}
                </optgroup>

                <optgroup label="Giá trị cố định">
                  <option value="LITERAL:0">0</option>
                  <option value="LITERAL:1">1</option>
                </optgroup>

                <optgroup label="Biến ngữ cảnh">
                  {TAX_RATE_CONTEXT_OPTIONS.map((contextKey) => (
                    <option
                      key={`right-${contextKey}`}
                      value={`CONTEXT:${contextKey}`}
                    >
                      {contextKey}
                    </option>
                  ))}
                </optgroup>
              </select>

              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2">
                <p className="mb-1 text-[11px] font-medium text-slate-600">
                  Cây vế phải: chọn node, dùng + để thêm cùng cấp, ++ để thêm
                  node con, X để xóa.
                </p>
                <VisualNodeEditor
                  title="Root right"
                  node={normalizeFormulaNodeOrFallback(rightNodeForEditor)}
                  formulaList={formulaList}
                  onChange={updateRightNode}
                  onAddSibling={() =>
                    updateRightNode({
                      fn: "MAX",
                      args: [
                        normalizeFormulaNodeOrFallback(rightNodeForEditor),
                        { literal: 0 },
                      ],
                    })
                  }
                  onDelete={() => updateRightNode({ literal: 0 })}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-[#0b1324] px-3 py-2.5">
        <p className="mb-1 text-[11px] text-gray-400">Xem trước dữ liệu JSON</p>
        <pre className="overflow-x-auto text-xs text-cyan-300">
          {JSON.stringify(
            composeTaxRateExpression(
              selectedOp,
              selectedLeft,
              selectedRight,
              loopConfig,
            ),
            null,
            2,
          )}
        </pre>
      </div>
    </div>
  );
}

type VisualNodeType =
  | "literal"
  | "ref"
  | "aggregate"
  | "lookup"
  | "op"
  | "fn"
  | "foreach"
  | "context";

const VISUAL_NODE_TYPES: Array<{ value: VisualNodeType; label: string }> = [
  { value: "literal", label: "Giá trị cố định" },
  { value: "ref", label: "Tham chiếu formula" },
  { value: "aggregate", label: "Tổng hợp dữ liệu" },
  { value: "lookup", label: "Tra cứu bảng phụ" },
  { value: "op", label: "Phép toán 2 vế" },
  { value: "fn", label: "Hàm toán học" },
  { value: "foreach", label: "Lặp theo nhóm" },
  { value: "context", label: "Giá trị runtime" },
];

const VISUAL_NODE_LABELS: Record<VisualNodeType, string> = {
  literal: "Giá trị cố định",
  ref: "Tham chiếu formula",
  aggregate: "Tổng hợp dữ liệu",
  lookup: "Tra cứu bảng phụ",
  op: "Phép toán 2 vế",
  fn: "Hàm toán học",
  foreach: "Lặp theo nhóm",
  context: "Giá trị runtime",
};

const VISUAL_NODE_GUIDE: Record<
  VisualNodeType,
  { purpose: string; whenToUse: string; example: string }
> = {
  literal: {
    purpose: "Nhập một số cố định, không phụ thuộc dữ liệu DB.",
    whenToUse: "Đặt ngưỡng miễn thuế, hệ số %, hoặc giá trị fallback 0.",
    example: "literal = 500000000",
  },
  ref: {
    purpose: "Lấy kết quả từ một formula đã có.",
    whenToUse:
      "Tái sử dụng kết quả trung gian như tổng doanh thu, tổng chi phí.",
    example: 'ref = "S2C_TOTAL_REVENUE"',
  },
  aggregate: {
    purpose: "Tổng hợp dữ liệu thật từ bảng revenues/costs/gl/stock.",
    whenToUse: "Cần SUM/AVG/COUNT từ giao dịch trong kỳ hoặc trước kỳ.",
    example: 'SUM source="revenues" field="Amount"',
  },
  lookup: {
    purpose:
      "Tra một giá trị từ bảng cấu hình như thuế suất hoặc số dư đầu kỳ.",
    whenToUse: "Cần TaxRate VAT/PIT hoặc OpeningCash/OpeningBank.",
    example: 'lookup IndustryTaxRates.TaxRate (TaxType="VAT")',
  },
  op: {
    purpose: "Ghép 2 nhánh bằng ADD/SUBTRACT/MULTIPLY/DIVIDE.",
    whenToUse: "Tính DT - CP, hoặc Thuế = cơ sở tính thuế x thuế suất.",
    example: "MULTIPLY(left, right)",
  },
  fn: {
    purpose: "Dùng hàm MAX/MIN/ABS cho logic bảo vệ số liệu.",
    whenToUse: "Chặn số âm bằng MAX(0, x), hoặc lấy trị tuyệt đối ABS(x).",
    example: "MAX(0, ref)",
  },
  foreach: {
    purpose: "Lặp theo từng nhóm ngành rồi gộp kết quả (SUM/MAX/MIN).",
    whenToUse: "HKD nhiều ngành, mỗi ngành có thuế suất khác nhau.",
    example: "foreach revenues -> apply -> reduce SUM",
  },
  context: {
    purpose: "Đọc biến runtime trong foreach như group_amount/group_cost.",
    whenToUse: "Chỉ dùng bên trong apply của foreach.",
    example: 'context = "group_amount"',
  },
};

const VISUAL_CONTEXT_KEYS = [
  "group_amount",
  "group_cost",
  "group_deduction",
  "total_amount",
  "period_start",
  "period_end",
  "business_type",
];

function detectVisualNodeType(node: Record<string, unknown>): VisualNodeType {
  if ("literal" in node) return "literal";
  if ("ref" in node) return "ref";
  if ("aggregate" in node) return "aggregate";
  if ("lookup" in node) return "lookup";
  if ("op" in node) return "op";
  if ("fn" in node) return "fn";
  if ("foreach" in node) return "foreach";
  if ("context" in node) return "context";
  return "literal";
}

function createDefaultVisualNode(
  type: VisualNodeType,
): Record<string, unknown> {
  switch (type) {
    case "literal":
      return { literal: 0 };
    case "ref":
      return { ref: "" };
    case "aggregate":
      return {
        aggregate: "SUM",
        source: "revenues",
        field: "Amount",
        periodFilter: "current",
      };
    case "lookup":
      return {
        lookup: {
          entity: "IndustryTaxRates",
          field: "TaxRate",
          filter: { TaxType: "VAT" },
        },
      };
    case "op":
      return {
        op: "ADD",
        left: { literal: 0 },
        right: { literal: 0 },
      };
    case "fn":
      return {
        fn: "MAX",
        args: [{ literal: 0 }, { literal: 0 }],
      };
    case "foreach":
      return {
        foreach: "industry",
        source: "revenues",
        field: "Amount",
        groupBy: "BusinessTypeId",
        costSource: "",
        costField: "",
        apply: { context: "group_amount" },
        reduce: "SUM",
      };
    case "context":
      return { context: "group_amount" };
    default:
      return { literal: 0 };
  }
}

function normalizeFormulaNodeOrFallback(
  value: unknown,
): Record<string, unknown> {
  const record = asRecord(value);
  if (!record) return { literal: 0 };
  return record;
}

function appendChildToVisualNode(
  node: Record<string, unknown>,
): Record<string, unknown> {
  const nodeType = detectVisualNodeType(node);

  if (nodeType === "fn") {
    const args = Array.isArray(node.args) ? [...node.args] : [];
    args.push({ literal: 0 });
    return { ...node, args };
  }

  if (nodeType === "op") {
    const left = normalizeFormulaNodeOrFallback(node.left);
    const right = normalizeFormulaNodeOrFallback(node.right);
    return {
      ...node,
      right: {
        fn: "MAX",
        args: [right, { literal: 0 }],
      },
      left,
    };
  }

  if (nodeType === "foreach") {
    const apply = normalizeFormulaNodeOrFallback(node.apply);
    return {
      ...node,
      apply: {
        fn: "MAX",
        args: [apply, { literal: 0 }],
      },
    };
  }

  return {
    fn: "MAX",
    args: [node, { literal: 0 }],
  };
}

function VisualNodeEditor({
  node,
  onChange,
  formulaList,
  title,
  depth = 0,
  onAddSibling,
  onDelete,
  onAddChild,
}: {
  node: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  formulaList: AccountingFormulaSummary[];
  title: string;
  depth?: number;
  onAddSibling?: () => void;
  onDelete?: () => void;
  onAddChild?: () => void;
}) {
  const nodeType = detectVisualNodeType(node);
  const nodeGuide = VISUAL_NODE_GUIDE[nodeType];
  const nodeTypeLabel = VISUAL_NODE_LABELS[nodeType];

  function switchType(nextType: VisualNodeType) {
    onChange(createDefaultVisualNode(nextType));
  }

  const inputClass =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
  const labelClass = "mb-1 block text-xs font-medium text-slate-600";
  const nodeGuideHint =
    `Node hiện tại: ${nodeTypeLabel}. ` +
    `${nodeGuide.purpose} ` +
    `Dùng khi: ${nodeGuide.whenToUse}. ` +
    `Ví dụ: ${nodeGuide.example}.`;

  return (
    <div
      className="space-y-3 rounded-2xl border border-slate-200 bg-white px-3 py-3"
      style={{ marginLeft: depth > 0 ? depth * 10 : 0 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <FieldHint hint={nodeGuideHint} />
        </div>
        <div className="flex items-center gap-1.5">
          <select
            value={nodeType}
            onChange={(e) => switchType(e.target.value as VisualNodeType)}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700"
          >
            {VISUAL_NODE_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {onAddSibling ? (
            <button
              type="button"
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              onClick={onAddSibling}
              title="Thêm node cùng cấp"
            >
              +
            </button>
          ) : null}

          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            onClick={() => {
              if (onAddChild) {
                onAddChild();
                return;
              }
              onChange(appendChildToVisualNode(node));
            }}
            title="Thêm node con"
          >
            ++
          </button>

          {onDelete ? (
            <button
              type="button"
              className="rounded-md border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100"
              onClick={onDelete}
              title="Xóa node"
            >
              X
            </button>
          ) : null}
        </div>
      </div>

      {nodeType === "literal" ? (
        <div>
          <label className={labelClass}>Giá trị số</label>
          <input
            type="number"
            className={inputClass}
            value={typeof node.literal === "number" ? node.literal : 0}
            onChange={(e) => onChange({ literal: Number(e.target.value || 0) })}
          />
        </div>
      ) : null}

      {nodeType === "ref" ? (
        <div>
          <label className={labelClass}>Công thức tham chiếu</label>
          <select
            className={inputClass}
            value={typeof node.ref === "string" ? node.ref : ""}
            onChange={(e) => onChange({ ref: e.target.value })}
          >
            <option value="">Chọn formula</option>
            {formulaList.map((formula) => (
              <option key={formula.formulaId} value={formula.code}>
                {formula.code} - {formula.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {nodeType === "aggregate" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass}>Hàm tổng hợp</label>
            <select
              className={inputClass}
              value={
                typeof node.aggregate === "string" ? node.aggregate : "SUM"
              }
              onChange={(e) => onChange({ ...node, aggregate: e.target.value })}
            >
              <option value="SUM">SUM</option>
              <option value="AVG">AVG</option>
              <option value="COUNT">COUNT</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Nguồn dữ liệu</label>
            <select
              className={inputClass}
              value={typeof node.source === "string" ? node.source : "revenues"}
              onChange={(e) => onChange({ ...node, source: e.target.value })}
            >
              <option value="revenues">revenues</option>
              <option value="costs">costs</option>
              <option value="gl_entries">gl_entries</option>
              <option value="stock_movements">stock_movements</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Trường dữ liệu</label>
            <input
              className={inputClass}
              value={typeof node.field === "string" ? node.field : "Amount"}
              onChange={(e) => onChange({ ...node, field: e.target.value })}
            />
          </div>
          <div>
            <label className={labelClass}>Lọc theo kỳ</label>
            <select
              className={inputClass}
              value={
                typeof node.periodFilter === "string"
                  ? node.periodFilter
                  : "current"
              }
              onChange={(e) =>
                onChange({ ...node, periodFilter: e.target.value })
              }
            >
              <option value="current">current</option>
              <option value="before">before</option>
            </select>
          </div>
        </div>
      ) : null}

      {nodeType === "lookup" ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className={labelClass}>Bảng dữ liệu</label>
            <select
              className={inputClass}
              value={
                typeof asRecord(node.lookup)?.entity === "string"
                  ? (asRecord(node.lookup)?.entity as string)
                  : "IndustryTaxRates"
              }
              onChange={(e) => {
                const lookup = normalizeFormulaNodeOrFallback(node.lookup);
                onChange({
                  lookup: { ...lookup, entity: e.target.value },
                });
              }}
            >
              <option value="IndustryTaxRates">IndustryTaxRates</option>
              <option value="AccountingPeriods">AccountingPeriods</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Trường dữ liệu</label>
            <input
              className={inputClass}
              value={
                typeof asRecord(node.lookup)?.field === "string"
                  ? (asRecord(node.lookup)?.field as string)
                  : "TaxRate"
              }
              onChange={(e) => {
                const lookup = normalizeFormulaNodeOrFallback(node.lookup);
                onChange({
                  lookup: { ...lookup, field: e.target.value },
                });
              }}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>
              TaxType (tương ứng filter.TaxType)
            </label>
            <select
              className={inputClass}
              value={
                typeof asRecord(asRecord(node.lookup)?.filter)?.TaxType ===
                "string"
                  ? normalizeTaxType(
                      String(asRecord(asRecord(node.lookup)?.filter)?.TaxType),
                    )
                  : "VAT"
              }
              onChange={(e) => {
                const lookup = normalizeFormulaNodeOrFallback(node.lookup);
                const filter = normalizeFormulaNodeOrFallback(lookup.filter);
                onChange({
                  lookup: {
                    ...lookup,
                    filter: {
                      ...filter,
                      TaxType: normalizeTaxType(e.target.value),
                    },
                  },
                });
              }}
            >
              {TAX_TYPE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : null}

      {nodeType === "context" ? (
        <div>
          <label className={labelClass}>Biến ngữ cảnh</label>
          <select
            className={inputClass}
            value={
              typeof node.context === "string" ? node.context : "group_amount"
            }
            onChange={(e) => onChange({ context: e.target.value })}
          >
            {VISUAL_CONTEXT_KEYS.map((key) => (
              <option key={key} value={key}>
                {key}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {nodeType === "op" ? (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Phép toán</label>
            <select
              className={inputClass}
              value={typeof node.op === "string" ? node.op : "ADD"}
              onChange={(e) => onChange({ ...node, op: e.target.value })}
            >
              <option value="ADD">ADD</option>
              <option value="SUBTRACT">SUBTRACT</option>
              <option value="MULTIPLY">MULTIPLY</option>
              <option value="DIVIDE">DIVIDE</option>
            </select>
          </div>

          <VisualNodeEditor
            title="Vế trái"
            depth={depth + 1}
            formulaList={formulaList}
            node={normalizeFormulaNodeOrFallback(node.left)}
            onChange={(left) => onChange({ ...node, left })}
          />
          <VisualNodeEditor
            title="Vế phải"
            depth={depth + 1}
            formulaList={formulaList}
            node={normalizeFormulaNodeOrFallback(node.right)}
            onChange={(right) => onChange({ ...node, right })}
          />
        </div>
      ) : null}

      {nodeType === "fn" ? (
        <div className="space-y-3">
          <div>
            <label className={labelClass}>Hàm</label>
            <select
              className={inputClass}
              value={typeof node.fn === "string" ? node.fn : "MAX"}
              onChange={(e) => onChange({ ...node, fn: e.target.value })}
            >
              <option value="MAX">MAX</option>
              <option value="MIN">MIN</option>
              <option value="ABS">ABS</option>
            </select>
          </div>

          {(Array.isArray(node.args) ? node.args : [{ literal: 0 }]).map(
            (arg, index) => (
              <div key={`fn-arg-${index}`} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    Tham số {index + 1}
                  </p>
                  <button
                    type="button"
                    className="text-xs font-medium text-rose-600"
                    onClick={() => {
                      const currentArgs = Array.isArray(node.args)
                        ? [...node.args]
                        : [];
                      currentArgs.splice(index, 1);
                      onChange({ ...node, args: currentArgs });
                    }}
                  >
                    Xóa
                  </button>
                </div>
                <VisualNodeEditor
                  title={`Tham số ${index + 1}`}
                  depth={depth + 1}
                  formulaList={formulaList}
                  node={normalizeFormulaNodeOrFallback(arg)}
                  onAddSibling={() => {
                    const currentArgs = Array.isArray(node.args)
                      ? [...node.args]
                      : [];
                    currentArgs.splice(index + 1, 0, { literal: 0 });
                    onChange({ ...node, args: currentArgs });
                  }}
                  onDelete={() => {
                    const currentArgs = Array.isArray(node.args)
                      ? [...node.args]
                      : [];
                    currentArgs.splice(index, 1);
                    onChange({ ...node, args: currentArgs });
                  }}
                  onChange={(updatedArg) => {
                    const currentArgs = Array.isArray(node.args)
                      ? [...node.args]
                      : [];
                    currentArgs[index] = updatedArg;
                    onChange({ ...node, args: currentArgs });
                  }}
                />
              </div>
            ),
          )}

          <button
            type="button"
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
            onClick={() => {
              const currentArgs = Array.isArray(node.args)
                ? [...node.args]
                : [];
              currentArgs.push({ literal: 0 });
              onChange({ ...node, args: currentArgs });
            }}
          >
            + Thêm tham số
          </button>
        </div>
      ) : null}

      {nodeType === "foreach" ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className={labelClass}>Chế độ lặp</label>
              <select
                className={inputClass}
                value={
                  typeof node.foreach === "string" ? node.foreach : "industry"
                }
                onChange={(e) => onChange({ ...node, foreach: e.target.value })}
              >
                <option value="industry">industry</option>
                <option value="revenues">revenues</option>
                <option value="costs">costs</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nguồn dữ liệu (source)</label>
              <select
                className={inputClass}
                value={
                  typeof node.source === "string" ? node.source : "revenues"
                }
                onChange={(e) => onChange({ ...node, source: e.target.value })}
              >
                <option value="revenues">revenues</option>
                <option value="costs">costs</option>
                <option value="gl_entries">gl_entries</option>
                <option value="stock_movements">stock_movements</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Trường dữ liệu (field)</label>
              <input
                className={inputClass}
                value={typeof node.field === "string" ? node.field : "Amount"}
                onChange={(e) => onChange({ ...node, field: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Nhóm theo (groupBy)</label>
              <input
                className={inputClass}
                value={
                  typeof node.groupBy === "string"
                    ? node.groupBy
                    : "BusinessTypeId"
                }
                onChange={(e) => onChange({ ...node, groupBy: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>Cách gộp kết quả (reduce)</label>
              <select
                className={inputClass}
                value={typeof node.reduce === "string" ? node.reduce : "SUM"}
                onChange={(e) => onChange({ ...node, reduce: e.target.value })}
              >
                <option value="SUM">SUM</option>
                <option value="MAX">MAX</option>
                <option value="MIN">MIN</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Nguồn chi phí (costSource)</label>
              <select
                className={inputClass}
                value={
                  typeof node.costSource === "string" ? node.costSource : ""
                }
                onChange={(e) =>
                  onChange({ ...node, costSource: e.target.value })
                }
              >
                <option value="">(Không dùng)</option>
                <option value="costs">costs</option>
                <option value="stock_movements">stock_movements</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Trường chi phí (costField)</label>
              <input
                className={inputClass}
                value={typeof node.costField === "string" ? node.costField : ""}
                onChange={(e) =>
                  onChange({ ...node, costField: e.target.value })
                }
              />
            </div>
          </div>
          <VisualNodeEditor
            title="Biểu thức áp dụng"
            depth={depth + 1}
            formulaList={formulaList}
            node={normalizeFormulaNodeOrFallback(node.apply)}
            onChange={(apply) => onChange({ ...node, apply })}
          />
        </div>
      ) : null}
    </div>
  );
}

function VisualFormulaComposer({
  exprJson,
  setExprJson,
  formulaList,
}: {
  exprJson: string;
  setExprJson: (v: string) => void;
  formulaList: AccountingFormulaSummary[];
}) {
  const parsed = useMemo(() => parseExpressionJson(exprJson), [exprJson]);
  const rootNode = normalizeFormulaNodeOrFallback(parsed);

  function onRootChange(nextRoot: Record<string, unknown>) {
    setExprJson(JSON.stringify(nextRoot, null, 2));
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
        Chế độ trực quan: chỉnh sửa bằng biểu mẫu, không cần viết JSON.
      </div>

      <VisualNodeEditor
        title="Biểu thức chính"
        node={rootNode}
        onChange={onRootChange}
        formulaList={formulaList}
      />
    </div>
  );
}

export default function FormulaTab(props: FormulaTabProps) {
  const [formulaSearch, setFormulaSearch] = useState("");
  const [variableSearch, setVariableSearch] = useState("");
  const [variableTypeFilter, setVariableTypeFilter] = useState("all");
  const [builderTokens, setBuilderTokens] = useState<FormulaToken[]>([]);
  const [builderError, setBuilderError] = useState("");
  const [builderHint, setBuilderHint] = useState("");
  const [previewInputs, setPreviewInputs] = useState<Record<string, string>>(
    {},
  );
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [cloneDraftCode, setCloneDraftCode] = useState("");
  const [cloneDraftSuffix, setCloneDraftSuffix] = useState(" (draft)");
  const [editingNumTokenId, setEditingNumTokenId] = useState<string | null>(
    null,
  );
  const [editingNumValue, setEditingNumValue] = useState("");
  const [customNumInput, setCustomNumInput] = useState("");
  const [nodeSchemas, setNodeSchemas] = useState<FormulaNodeSchema[]>([]);
  const [nodeSchemaError, setNodeSchemaError] = useState("");
  const [rawJsonDraft, setRawJsonDraft] = useState(() =>
    formatExpressionJson(props.fmExprJson),
  );
  const [jsonDraftError, setJsonDraftError] = useState("");
  const [previewMode, setPreviewMode] = useState<"verbal" | "json">("verbal");
  const [saveValidationError, setSaveValidationError] = useState<string>("");
  // ── Trace Logic state ──
  const [traceBusinessLocationId, setTraceBusinessLocationId] = useState("");
  const [tracePeriodId, setTracePeriodId] = useState("");
  const [traceRulesetId, setTraceRulesetId] = useState("");
  const [traceSelectedBtIds, setTraceSelectedBtIds] = useState<string[]>([]);
  const [traceLoading, setTraceLoading] = useState(false);
  const [traceError, setTraceError] = useState("");
  const [traceResult, setTraceResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [overviewBusinessTypes, setOverviewBusinessTypes] = useState<
    AccountingBusinessTypeSummary[]
  >([]);
  const [overviewRulesets, setOverviewRulesets] = useState<
    AccountingTaxRulesetSummary[]
  >([]);
  const [traceLocations, setTraceLocations] = useState<Location[]>([]);
  const [traceLocationsBusy, setTraceLocationsBusy] = useState(false);
  const [traceLocationsError, setTraceLocationsError] = useState("");
  const [tracePeriods, setTracePeriods] = useState<AccountingPeriod[]>([]);
  const [tracePeriodsBusy, setTracePeriodsBusy] = useState(false);
  const [tracePeriodsError, setTracePeriodsError] = useState("");
  const tokenDragHandledRef = useRef(false);
  const lastSelectedFormulaIdRef = useRef("");
  const traceAutoRunKeyRef = useRef("");

  const isCreateMode = !props.fmId.trim();
  const isFormulaTypeEditable = isCreateMode;
  const isActiveFormula =
    props.fmIsActive === "true" ||
    props.fmActive.trim().toLowerCase() === "active";

  useEffect(() => {
    let isMounted = true;

    void getFormulaNodeSchemas()
      .then((result) => {
        if (!isMounted) return;
        const normalized = result
          .map((item) => asRecord(item))
          .filter((item): item is Record<string, unknown> => Boolean(item))
          .map(normalizeNodeSchema);
        setNodeSchemas(normalized);
        setNodeSchemaError("");
      })
      .catch((error) => {
        if (!isMounted) return;
        setNodeSchemaError(
          error instanceof Error
            ? error.message
            : "Không tải được node schemas",
        );
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Load business types + rulesets for Trace Logic
  useEffect(() => {
    let isMounted = true;
    void getAccountingOverview()
      .then((data) => {
        if (!isMounted) return;
        setOverviewBusinessTypes(data.businessTypes ?? []);
        setOverviewRulesets(data.taxRulesets ?? []);
      })
      .catch(() => {
        /* non-critical */
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    setRawJsonDraft(formatExpressionJson(props.fmExprJson));
    setJsonDraftError("");
    setSaveValidationError("");
  }, [props.fmExprJson, props.fmId]);

  function resetCreateFormulaForm() {
    props.setFmId("");
    props.setFmCode("");
    props.setFmName("");
    props.setFmDesc("");
    props.setFmFType("");
    props.setFmExprJson("{}");
    props.setFmIsActive("false");
    props.setFmResultDataType("");
    props.setFmRoundingMode("");
    props.setFmRoundingPrecision("2");
  }

  function switchFormulaMode() {
    if (!isCreateMode) {
      resetCreateFormulaForm();
      return;
    }

    const restoreId =
      lastSelectedFormulaIdRef.current || props.formulaOptions[0]?.value || "";
    if (!restoreId) return;
    props.setFmId(restoreId);
    props.onDetail(restoreId);
  }

  function openCloneDialog() {
    setCloneDraftCode(props.fmCloneCode);
    setCloneDraftSuffix(props.fmCloneSuffix || " (draft)");
    setCloneDialogOpen(true);
  }

  function cloneWithOptionalPayload(skipInputs: boolean) {
    setCloneDialogOpen(false);
    if (skipInputs) {
      props.onClone();
      return;
    }

    props.setFmCloneCode(cloneDraftCode);
    props.setFmCloneSuffix(cloneDraftSuffix);
    props.onClone({
      newCode: cloneDraftCode,
      nameSuffix: cloneDraftSuffix,
    });
  }

  function handleRunTrace() {
    setTraceLoading(true);
    setTraceError("");
    setTraceResult(null);
    void runAccountingTrace({
      formulaId: Number(props.fmId),
      businessLocationId: Number(traceBusinessLocationId),
      periodId: Number(tracePeriodId),
      rulesetId: Number(traceRulesetId),
      businessTypeIds: traceSelectedBtIds,
    })
      .then((data) => {
        setTraceResult(data);
      })
      .catch((err: unknown) => {
        setTraceError(
          err instanceof Error ? err.message : "Lỗi khi chạy trace",
        );
      })
      .finally(() => setTraceLoading(false));
  }

  useEffect(() => {
    if (props.fmId.trim()) {
      lastSelectedFormulaIdRef.current = props.fmId.trim();
    }
  }, [props.fmId]);

  // Derive active builder tab from formulaType.
  const builderTab: BuilderTabKey = useMemo(() => {
    return formulaTypeToBuilderTab(props.fmFType);
  }, [props.fmFType]);

  const isTraceTaxFormula = useMemo(() => {
    return isTaxRelatedFormula(
      props.fmFType,
      props.fmCode,
      props.fmName,
      props.fmDesc,
      props.fmExplanation,
    );
  }, [
    props.fmCode,
    props.fmDesc,
    props.fmExplanation,
    props.fmFType,
    props.fmName,
  ]);

  useEffect(() => {
    let isMounted = true;
    setTraceLocationsBusy(true);
    setTraceLocationsError("");

    void getLocations()
      .then((response) => {
        if (!isMounted) return;
        const locations = (response.data ?? [])
          .slice()
          .sort((left, right) => left.id - right.id);
        setTraceLocations(locations);
      })
      .catch((error) => {
        if (!isMounted) return;
        setTraceLocations([]);
        setTraceLocationsError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách location.",
        );
      })
      .finally(() => {
        if (isMounted) setTraceLocationsBusy(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isTraceTaxFormula) return;

    setTraceBusinessLocationId((current) => current || "6");
    setTracePeriodId((current) => current || "2");
    setTraceRulesetId((current) => current || "1");
    setTraceSelectedBtIds([]);
    traceAutoRunKeyRef.current = "";
  }, [isTraceTaxFormula, props.fmId]);

  useEffect(() => {
    const locationId = Number(traceBusinessLocationId);
    if (!Number.isFinite(locationId) || locationId <= 0) {
      setTracePeriods([]);
      setTracePeriodsError("");
      setTracePeriodsBusy(false);
      return;
    }

    let isMounted = true;
    setTracePeriodsBusy(true);
    setTracePeriodsError("");

    void getAccountingPeriods(locationId)
      .then((response) => {
        if (!isMounted) return;
        const periods = (response.data ?? []).slice().sort((left, right) => {
          if (left.periodId !== right.periodId) {
            return right.periodId - left.periodId;
          }
          return right.year - left.year;
        });

        setTracePeriods(periods);
        setTracePeriodId((current) => {
          const currentPeriodId = Number(current);
          if (periods.some((period) => period.periodId === currentPeriodId)) {
            return current;
          }

          if (isTraceTaxFormula && locationId === 6) {
            const preferredTaxPeriod = periods.find(
              (period) => period.periodId === 2,
            );
            if (preferredTaxPeriod) {
              return String(preferredTaxPeriod.periodId);
            }
          }

          return String(periods[0]?.periodId ?? "");
        });
      })
      .catch((error) => {
        if (!isMounted) return;
        setTracePeriods([]);
        setTracePeriodsError(
          error instanceof Error
            ? error.message
            : "Không tải được danh sách kỳ kế toán.",
        );
      })
      .finally(() => {
        if (isMounted) setTracePeriodsBusy(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isTraceTaxFormula, traceBusinessLocationId]);

  useEffect(() => {
    if (!isTraceTaxFormula || builderTab !== "TAX_RATE" || !props.fmId.trim()) {
      traceAutoRunKeyRef.current = "";
      return;
    }

    if (
      !traceBusinessLocationId ||
      !tracePeriodId ||
      !traceRulesetId ||
      traceLoading
    ) {
      return;
    }

    const autoRunKey = [
      props.fmId.trim(),
      traceBusinessLocationId,
      tracePeriodId,
      traceRulesetId,
      traceSelectedBtIds.join(","),
    ].join("|");

    if (traceAutoRunKeyRef.current === autoRunKey) return;
    traceAutoRunKeyRef.current = autoRunKey;
    void handleRunTrace();
  }, [
    builderTab,
    isTraceTaxFormula,
    props.fmId,
    traceBusinessLocationId,
    tracePeriodId,
    traceRulesetId,
    traceSelectedBtIds,
    traceLoading,
  ]);

  const traceLocationOptions = useMemo(
    () =>
      traceLocations.map((location) => ({
        value: String(location.id),
        label: `#${location.id} - ${location.name}`,
      })),
    [traceLocations],
  );

  const tracePeriodOptions = useMemo(
    () =>
      tracePeriods.map((period) => {
        const periodLabel =
          period.periodType === "quarter"
            ? `Q${period.quarter ?? "?"} / ${period.year}`
            : period.periodType === "year"
              ? `Năm ${period.year}`
              : `${period.startDate} - ${period.endDate}`;

        return {
          value: String(period.periodId),
          label: `#${period.periodId} - ${periodLabel}`,
        };
      }),
    [tracePeriods],
  );

  const traceRulesetOptions = useMemo(
    () =>
      overviewRulesets.map((ruleset) => ({
        value: String(ruleset.rulesetId),
        label: `${ruleset.code} — ${ruleset.name}`,
      })),
    [overviewRulesets],
  );

  function setBuilderTab(tab: BuilderTabKey) {
    if (tab === "NONE") {
      setBuilderTokens([]);
      setBuilderError("");
      props.setFmFType("");
      props.setFmExprJson("{}");
      return;
    }

    // Khi thay đổi formula type, làm sạch token builder của tab CELL_REF
    if (tab === "CELL_REF" && builderTokens.length === 0) {
      // Nếu chuyển sang CELL_REF và chưa có token, hãy tải token từ expression hiện tại
      const expr = props.fmExprJson.trim();
      if (expr && expr !== "{}") {
        try {
          const parsed = JSON.parse(expr);
          const parsedTokens = astToTokens(parsed);
          if (parsedTokens && parsedTokens.length > 0) {
            setBuilderTokens(parsedTokens);
          }
        } catch {
          setBuilderTokens([]);
        }
      }
    } else if (tab !== "CELL_REF") {
      // Khi chuyển sang loại công thức khác (AGGREGATE, TAX_RATE, LOOKUP), xóa token builder
      setBuilderTokens([]);
      setBuilderError("");
    }
    props.setFmFType(tab);
  }

  const variables = useMemo<VariableItem[]>(() => {
    const map = new Map<string, VariableItem>();

    props.formulaList.forEach((formula) => {
      const code = String(formula.code ?? "").trim();
      if (!code || map.has(code)) return;

      const name = String(formula.name ?? "").trim();
      const formulaType = String(formula.formulaType ?? "").trim();
      map.set(code, {
        code,
        label: name ? `${code} - ${name}` : code,
        group: "Formula",
        dataType: formulaTypeToVariableDataType(formulaType),
      });
    });

    return Array.from(map.values());
  }, [props.formulaList]);

  useEffect(() => {
    const expr = props.fmExprJson.trim();
    if (!expr) {
      setBuilderTokens([]);
      setBuilderError("");
      setBuilderHint("");
      return;
    }

    try {
      const parsed = JSON.parse(expr);
      const parsedTokens = astToTokens(parsed);
      if (parsedTokens && parsedTokens.length > 0) {
        setBuilderTokens(parsedTokens);
        setBuilderError("");
        setBuilderHint("");
        return;
      }

      const refs = new Set<string>();
      collectRefs(parsed, refs);
      if (refs.size > 0) {
        setBuilderTokens(
          Array.from(refs).map((code) => ({
            id: tokenId(),
            type: "var",
            value: code,
            label: code,
          })),
        );
      } else {
        setBuilderTokens([]);
      }

      setBuilderHint(
        "Công thức hiện tại là dạng nâng cao. Nếu kéo-thả/chỉnh sửa ở đây, hệ thống sẽ lưu lại dưới dạng phép tính cơ bản.",
      );
      setBuilderError("");
    } catch {
      setBuilderTokens([]);
      setBuilderError("");
      setBuilderHint("Không đọc được expressionJson hiện tại.");
    }
  }, [props.fmExprJson, props.fmId]);

  const variableTypeCount = useMemo(() => {
    return {
      double: variables.filter((v) => v.dataType === "decimal").length,
      integer: variables.filter((v) => v.dataType === "integer").length,
      string: variables.filter((v) => v.dataType.includes("string")).length,
    };
  }, [variables]);

  const filteredVariables = useMemo(() => {
    const keyword = variableSearch.trim().toLowerCase();
    return variables.filter((variable) => {
      if (variableTypeFilter !== "all") {
        if (
          variableTypeFilter === "double" &&
          variable.dataType !== "decimal"
        ) {
          return false;
        }
        if (
          variableTypeFilter === "integer" &&
          variable.dataType !== "integer"
        ) {
          return false;
        }
        if (
          variableTypeFilter === "string" &&
          !variable.dataType.includes("string")
        ) {
          return false;
        }
      }

      if (!keyword) return true;
      return (
        variable.code.toLowerCase().includes(keyword) ||
        variable.label.toLowerCase().includes(keyword) ||
        variable.group.toLowerCase().includes(keyword)
      );
    });
  }, [variableSearch, variableTypeFilter, variables]);

  const filteredFormulas = useMemo(() => {
    const keyword = formulaSearch.trim().toLowerCase();
    if (!keyword) return props.formulaList;
    return props.formulaList.filter((formula) => {
      return (
        formula.code.toLowerCase().includes(keyword) ||
        formula.name.toLowerCase().includes(keyword) ||
        formula.formulaType.toLowerCase().includes(keyword)
      );
    });
  }, [formulaSearch, props.formulaList]);

  const formulaTypeOptions = useMemo(() => {
    const current = normalizeFormulaType(props.fmFType);
    if (
      !current ||
      DB_FORMULA_TYPES.includes(current as (typeof DB_FORMULA_TYPES)[number])
    ) {
      return DB_FORMULA_TYPES;
    }
    return [current, ...DB_FORMULA_TYPES];
  }, [props.fmFType]);

  const parsedExpression = useMemo(
    () => parseExpressionJson(props.fmExprJson),
    [props.fmExprJson],
  );

  const referencedFormulaCodes = useMemo(() => {
    const refs = new Set<string>();
    collectRefs(parsedExpression, refs);
    return Array.from(refs);
  }, [parsedExpression]);

  const usedNodeTypes = useMemo(() => {
    const nodes = new Set<string>();
    collectNodeTypes(parsedExpression, nodes);
    return Array.from(nodes);
  }, [parsedExpression]);

  const astNodeCount = useMemo(
    () => countAstNodes(parsedExpression),
    [parsedExpression],
  );

  const matchedSchemas = useMemo(() => {
    return nodeSchemas.filter((schema) =>
      usedNodeTypes.includes(schema.nodeType),
    );
  }, [nodeSchemas, usedNodeTypes]);

  const schemaValidationIssues = useMemo(() => {
    if (!parsedExpression || nodeSchemas.length === 0) return [] as string[];
    return validateExpressionAgainstSchemas(parsedExpression, nodeSchemas);
  }, [parsedExpression, nodeSchemas]);

  const verbalExplanation = useMemo(() => {
    return explainExpressionByWords(parsedExpression);
  }, [parsedExpression]);

  const compatibleBuilderMode = useMemo(() => {
    if (!usedNodeTypes.length) return "empty";
    const simpleNodes = new Set(["literal", "ref", "op"]);
    return usedNodeTypes.every((nodeType) => simpleNodes.has(nodeType))
      ? "simple"
      : "advanced";
  }, [usedNodeTypes]);

  const referencedFormulas = useMemo(() => {
    const formulaMap = new Map(
      props.formulaList.map((formula) => [formula.code, formula]),
    );
    return referencedFormulaCodes
      .map((code) => formulaMap.get(code))
      .filter(Boolean);
  }, [props.formulaList, referencedFormulaCodes]);

  function applyRecipe(recipe: FormulaRecipe) {
    props.setFmFType(recipe.formulaType);
    props.setFmExprJson(JSON.stringify(recipe.expression, null, 2));
    if (isCreateMode && !props.fmName.trim()) {
      props.setFmName(recipe.title);
    }
    if (isCreateMode && !props.fmDesc.trim()) {
      props.setFmDesc(recipe.summary);
    }
  }

  function applyJsonDraft() {
    try {
      const parsed = JSON.parse(rawJsonDraft) as unknown;
      const formatted = JSON.stringify(parsed, null, 2);
      props.setFmExprJson(formatted);
      setRawJsonDraft(formatted);
      setJsonDraftError("");
      setSaveValidationError("");
    } catch (error) {
      setJsonDraftError(
        error instanceof Error
          ? error.message
          : "Nội dung công thức không hợp lệ",
      );
    }
  }

  function formatJsonDraft() {
    try {
      const parsed = JSON.parse(rawJsonDraft) as unknown;
      const formatted = JSON.stringify(parsed, null, 2);
      setRawJsonDraft(formatted);
      setJsonDraftError("");
    } catch (error) {
      setJsonDraftError(
        error instanceof Error
          ? error.message
          : "Nội dung công thức không hợp lệ",
      );
    }
  }

  function saveFormulaChanges() {
    if (!parsedExpression) {
      setSaveValidationError(
        "Nội dung công thức không hợp lệ, vui lòng kiểm tra lại.",
      );
      return;
    }

    if (builderError) {
      setSaveValidationError(builderError);
      return;
    }

    if (schemaValidationIssues.length > 0) {
      setSaveValidationError(schemaValidationIssues[0]);
      return;
    }

    setSaveValidationError("");
    if (isCreateMode) {
      props.onCreate();
      return;
    }
    props.onUpdate();
  }

  const tokenExpression = useMemo(() => {
    return builderTokens
      .map((token) => {
        if (token.type === "var") return `[${token.value}]`;
        return token.value;
      })
      .join(" ");
  }, [builderTokens]);

  const variableCodesInBuilder = useMemo(() => {
    return Array.from(
      new Set(
        builderTokens
          .filter((token) => token.type === "var")
          .map((token) => token.value),
      ),
    );
  }, [builderTokens]);

  useEffect(() => {
    setPreviewInputs((prev) => {
      const next: Record<string, string> = {};
      variableCodesInBuilder.forEach((code) => {
        next[code] = prev[code] ?? "0";
      });
      return next;
    });
  }, [variableCodesInBuilder]);

  const previewResult = useMemo(() => {
    // Chỉ tính toán preview khi ở CELL_REF tab
    if (builderTab !== "CELL_REF" || !builderTokens.length) return "—";
    try {
      const ast = tokensToAst(builderTokens);
      if (!ast) return "Lỗi biểu thức";

      function evalAst(node: unknown): number {
        if (!node || typeof node !== "object") return 0;
        const n = node as Record<string, unknown>;
        if (typeof n.literal === "number")
          return Number.isFinite(n.literal) ? n.literal : 0;
        if (typeof n.ref === "string") {
          const raw = previewInputs[n.ref] ?? "0";
          const parsed = Number(raw);
          return Number.isFinite(parsed) ? parsed : 0;
        }
        if (typeof n.op === "string") {
          const left = evalAst(n.left);
          const right = evalAst(n.right);
          if (n.op === "ADD") return left + right;
          if (n.op === "SUBTRACT") return left - right;
          if (n.op === "MULTIPLY") return left * right;
          if (n.op === "DIVIDE") return right !== 0 ? left / right : 0;
          return 0;
        }
        return 0;
      }

      const result = evalAst(ast);
      return Number.isFinite(result)
        ? result.toLocaleString("vi-VN")
        : "Lỗi biểu thức";
    } catch {
      return "Lỗi biểu thức";
    }
  }, [builderTab, builderTokens, previewInputs]);

  function syncTokens(nextTokens: FormulaToken[]) {
    // Guard: do not overwrite an advanced AST (foreach/lookup/fn/context) with
    // a simplified token-based one. The user must use JSON Studio instead.
    if (compatibleBuilderMode === "advanced") return;

    setBuilderTokens(nextTokens);

    if (!nextTokens.length) {
      props.setFmExprJson("{}");
      setBuilderError("");
      return;
    }

    const ast = tokensToAst(nextTokens);
    if (!ast) {
      setBuilderError("Biểu thức không hợp lệ. Kiểm tra toán tử và dấu ngoặc.");
      return;
    }

    props.setFmExprJson(JSON.stringify(ast));
    setBuilderError("");
  }

  function addToken(token: Omit<FormulaToken, "id">) {
    syncTokens([...builderTokens, { ...token, id: tokenId() }]);
  }

  function insertTokenAt(targetIndex: number, token: Omit<FormulaToken, "id">) {
    const next = [...builderTokens];
    const safeIndex = Math.max(0, Math.min(targetIndex, next.length));
    next.splice(safeIndex, 0, { ...token, id: tokenId() });
    syncTokens(next);
  }

  function moveTokenToIndex(tokenIdToMove: string, targetIndex: number) {
    const currentIndex = builderTokens.findIndex(
      (token) => token.id === tokenIdToMove,
    );
    if (currentIndex < 0) return;

    const next = [...builderTokens];
    const [moved] = next.splice(currentIndex, 1);
    if (!moved) return;

    let safeIndex = Math.max(0, Math.min(targetIndex, next.length));
    if (currentIndex < targetIndex) safeIndex -= 1;
    safeIndex = Math.max(0, Math.min(safeIndex, next.length));

    next.splice(safeIndex, 0, moved);
    syncTokens(next);
  }

  function removeTokenById(tokenIdToRemove: string) {
    const next = builderTokens.filter((token) => token.id !== tokenIdToRemove);
    syncTokens(next);
  }

  function onTokenDragStart(
    event: React.DragEvent<HTMLSpanElement>,
    tokenIdToDrag: string,
  ) {
    tokenDragHandledRef.current = false;
    setDraggingTokenId(tokenIdToDrag);
    event.dataTransfer.setData("application/x-formula-token", tokenIdToDrag);
    event.dataTransfer.effectAllowed = "move";
  }

  function onPaletteTokenDragStart(
    event: React.DragEvent<HTMLButtonElement>,
    token: Omit<FormulaToken, "id">,
  ) {
    event.dataTransfer.setData(
      "application/x-formula-palette",
      JSON.stringify(token),
    );
    event.dataTransfer.effectAllowed = "copy";
  }

  function onTokenDragEnd(event: React.DragEvent<HTMLSpanElement>) {
    if (tokenDragHandledRef.current) {
      setDraggingTokenId(null);
      return;
    }

    // Drop outside accepted zones -> remove token from expression.
    if (event.dataTransfer.dropEffect === "none" && draggingTokenId) {
      removeTokenById(draggingTokenId);
    }

    setDraggingTokenId(null);
  }

  function parseDroppedPaletteToken(
    event: React.DragEvent<HTMLElement>,
  ): Omit<FormulaToken, "id"> | null {
    const rawVariable = event.dataTransfer.getData("application/x-formula-var");
    if (rawVariable) {
      try {
        const parsed = JSON.parse(rawVariable) as {
          code: string;
          label: string;
        };
        return { type: "var", value: parsed.code, label: parsed.label };
      } catch {
        return null;
      }
    }

    const rawPalette = event.dataTransfer.getData(
      "application/x-formula-palette",
    );
    if (rawPalette) {
      try {
        const parsed = JSON.parse(rawPalette) as Omit<FormulaToken, "id">;
        if (!parsed || !parsed.type || !parsed.value) return null;
        return parsed;
      } catch {
        return null;
      }
    }

    return null;
  }

  function onBuilderDropAt(
    event: React.DragEvent<HTMLElement>,
    targetIndex: number,
  ) {
    event.preventDefault();

    const draggedTokenId =
      event.dataTransfer.getData("application/x-formula-token") ||
      draggingTokenId;
    if (draggedTokenId) {
      tokenDragHandledRef.current = true;
      moveTokenToIndex(draggedTokenId, targetIndex);
      setDraggingTokenId(null);
      return;
    }

    const droppedToken = parseDroppedPaletteToken(event);
    if (!droppedToken) return;
    insertTokenAt(targetIndex, droppedToken);
  }

  function onDropToBuilderEnd(event: React.DragEvent<HTMLDivElement>) {
    onBuilderDropAt(event, builderTokens.length);
  }

  function startEditNum(token: FormulaToken) {
    setEditingNumTokenId(token.id);
    setEditingNumValue(token.value);
  }

  function commitEditNum() {
    if (!editingNumTokenId) return;
    const trimmed = editingNumValue.trim();
    const parsed = Number(trimmed);
    if (!trimmed || !Number.isFinite(parsed)) {
      setEditingNumTokenId(null);
      return;
    }
    const next = builderTokens.map((t) =>
      t.id === editingNumTokenId
        ? { ...t, value: String(parsed), label: String(parsed) }
        : t,
    );
    syncTokens(next);
    setEditingNumTokenId(null);
  }

  function addCustomNum() {
    const trimmed = customNumInput.trim();
    const parsed = Number(trimmed);
    if (!trimmed || !Number.isFinite(parsed)) return;
    addToken({ type: "num", value: String(parsed), label: String(parsed) });
    setCustomNumInput("");
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <Card className="h-fit self-start rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Thư viện công thức</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              value={formulaSearch}
              onChange={(e) => setFormulaSearch(e.target.value)}
              placeholder="Tìm công thức..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <div className="max-h-128 space-y-2 overflow-y-auto pr-1">
              {filteredFormulas.map((formula) => (
                <button
                  key={formula.formulaId}
                  type="button"
                  onClick={() => {
                    props.setFmId(String(formula.formulaId));
                    props.onDetail(String(formula.formulaId));
                  }}
                  className={`w-full rounded-xl border p-3 text-left transition ${
                    Number(props.fmId) === formula.formulaId
                      ? "border-[#2563eb]/35 bg-[#eff6ff]"
                      : "border-gray-200 hover:border-[#2563eb]/25 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium text-gray-900">{formula.name}</p>
                    <Badge
                      variant="secondary"
                      className={
                        formula.isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }
                    >
                      {formula.isActive ? "Đang áp dụng" : "Nháp"}
                    </Badge>
                  </div>
                  <p className="mt-1 font-mono text-xs text-gray-500">
                    {formula.code}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {formula.formulaType}
                  </p>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Cấu hình công thức</CardTitle>
                <Button
                  size="sm"
                  variant="link"
                  onClick={switchFormulaMode}
                  className="text-[#2563eb] hover:text-[#1d4ed8]"
                >
                  {isCreateMode ? "Về chế độ chỉnh sửa" : "Tạo mới"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    ID công thức
                  </label>
                  <input
                    value={props.fmId}
                    onChange={(e) => props.setFmId(e.target.value)}
                    placeholder="Nhập ID công thức"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Chọn nhanh
                  </label>
                  <select
                    value={props.fmId}
                    onChange={(e) => {
                      const nextId = e.target.value;
                      props.setFmId(nextId);
                      if (nextId) props.onDetail(nextId);
                    }}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Chọn công thức</option>
                    {props.formulaOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Mã công thức
                  </label>
                  <input
                    value={props.fmCode}
                    onChange={(e) => props.setFmCode(e.target.value)}
                    placeholder="TAX_TNCN_01"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Loại công thức
                  </label>
                  <select
                    value={normalizeFormulaType(props.fmFType)}
                    onChange={(e) =>
                      setBuilderTab(formulaTypeToBuilderTab(e.target.value))
                    }
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                    disabled={!isFormulaTypeEditable}
                  >
                    <option value="">none</option>
                    {formulaTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {formatFormulaTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                  {!isFormulaTypeEditable ? (
                    <p className="mt-1 text-[11px] text-amber-700">
                      FormulaType bị khóa sau khi tạo. Clone/Edit không cho đổi.
                    </p>
                  ) : null}
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Tên công thức
                  </label>
                  <input
                    value={props.fmName}
                    onChange={(e) => props.setFmName(e.target.value)}
                    placeholder="Thuế TNCN bậc 1"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Mô tả
                  </label>
                  <textarea
                    value={props.fmDesc}
                    onChange={(e) => props.setFmDesc(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Kiểu dữ liệu kết quả
                  </label>
                  <input
                    value={props.fmResultDataType}
                    onChange={(e) => props.setFmResultDataType(e.target.value)}
                    placeholder="decimal"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Kiểu làm tròn
                  </label>
                  <input
                    value={props.fmRoundingMode}
                    onChange={(e) => props.setFmRoundingMode(e.target.value)}
                    placeholder="HALF_UP"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Số chữ số làm tròn
                  </label>
                  <input
                    value={props.fmRoundingPrecision}
                    onChange={(e) =>
                      props.setFmRoundingPrecision(e.target.value)
                    }
                    placeholder="2"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Trạng thái hiện tại
                  </label>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                    {isCreateMode
                      ? "- - -"
                      : `${props.fmActive} · ${props.fmType}`}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-cyan-100 bg-cyan-50 px-3 py-2 text-sm text-cyan-900">
                {isCreateMode
                  ? "Không có giải thích."
                  : props.fmExplanation || "Không có giải thích."}
              </div>

              {/* <div className="grid gap-3 lg:grid-cols-[1.05fr_1.2fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <GitBranch className="h-4 w-4 text-sky-600" />
                    <p className="text-sm font-semibold">Dependency graph</p>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {referencedFormulas.length > 0 ? (
                      referencedFormulas.map((formula) => (
                        <button
                          key={formula?.formulaId}
                          type="button"
                          onClick={() => {
                            if (!formula) return;
                            props.setFmId(String(formula.formulaId));
                            props.onDetail(String(formula.formulaId));
                          }}
                          className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-medium text-sky-700 hover:border-sky-300 hover:bg-sky-50"
                        >
                          {formula?.code}
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">
                        Formula này không ref đến formula khác.
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Sigma className="h-4 w-4 text-violet-600" />
                    <p className="text-sm font-semibold">
                      Quick starters từ BE guide
                    </p>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {FORMULA_RECIPES.map((recipe) => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => applyRecipe(recipe)}
                        className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
                      >
                        <p className="text-sm font-semibold text-slate-900">
                          {recipe.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {recipe.summary}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </div> */}

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className={primaryBtnClass}
                  onClick={saveFormulaChanges}
                >
                  {isCreateMode ? "Tạo mới" : "Cập nhật"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={openCloneDialog}
                  disabled={isCreateMode}
                >
                  Clone
                </Button>
                {isActiveFormula ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={props.onDeactivate}
                    disabled={isCreateMode}
                  >
                    Ngừng áp dụng
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={props.onActivate}
                    disabled={isCreateMode}
                  >
                    Kích hoạt
                  </Button>
                )}
                {!isCreateMode && !isActiveFormula && props.mode !== "consultant" ? (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                  >
                    Xóa
                  </Button>
                ) : null}
              </div>
              {saveValidationError ? (
                <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {saveValidationError}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Clone công thức</DialogTitle>
              </DialogHeader>

              <div className="space-y-3">
                {/* <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                  <pre className="overflow-x-auto text-xs text-gray-700">
{`{
  "newCode": "string",
  "nameSuffix": "string"
}`}
                  </pre>
                </div> */}

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Mã công thức
                  </label>
                  <input
                    value={cloneDraftCode}
                    onChange={(e) => setCloneDraftCode(e.target.value)}
                    placeholder="TAX_TNCN_01_COPY"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Tên công thức
                  </label>
                  <input
                    value={cloneDraftSuffix}
                    onChange={(e) => setCloneDraftSuffix(e.target.value)}
                    placeholder="Cộng Quý"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => cloneWithOptionalPayload(true)}
                >
                  Bỏ qua
                </Button>
                <Button onClick={() => cloneWithOptionalPayload(false)}>
                  Nhân bản
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle>Xác nhận xóa công thức</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-gray-600">
                Bạn có chắc chắn muốn xóa công thức{" "}
                <span className="font-semibold text-gray-900">
                  {props.fmCode || `#${props.fmId}`}
                </span>{" "}
                không? Chỉ công thức đang inactive mới xóa được.
              </p>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => setDeleteConfirmOpen(false)}
                >
                  Hủy
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    props.onDelete();
                  }}
                >
                  Xóa
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Trình tạo công thức</CardTitle>
                {builderTab === "CELL_REF" && builderTokens.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => syncTokens([])}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Xóa biểu thức
                  </button>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
                {builderTab === "NONE" ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Chọn formulaType để mở trình tạo công thức tương ứng.
                  </div>
                ) : (
                  BUILDER_TABS.filter((tab) => tab.key === builderTab).map(
                    (tab) => (
                      <div
                        key={tab.key}
                        className="rounded-lg border border-[#2563eb]/40 bg-[#eff6ff] px-3 py-1.5 text-left text-[#1d4ed8]"
                      >
                        <span className="block text-xs font-semibold">
                          {tab.label}
                        </span>
                        <span className="block text-[11px] text-[#1d4ed8]/75">
                          {tab.desc}
                        </span>
                      </div>
                    ),
                  )
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {/* <div className="mb-5 grid gap-3 xl:grid-cols-[1.35fr_1fr]">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        Formula node schemas
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Dữ liệu này đọc từ endpoint BE
                        reference/formula-node-schemas.
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-slate-200 text-slate-700"
                    >
                      {nodeSchemas.length} nodes
                    </Badge>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {(matchedSchemas.length > 0
                      ? matchedSchemas
                      : nodeSchemas.slice(0, 4)
                    ).map((schema) => (
                      <div
                        key={schema.nodeType}
                        className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {schema.label}
                            </p>
                            <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">
                              {schema.nodeType}
                            </p>
                          </div>
                          {usedNodeTypes.includes(schema.nodeType) ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          ) : null}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">
                          {schema.description}
                        </p>
                        {schema.fields.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {schema.fields.slice(0, 4).map((field) => (
                              <Badge
                                key={`${schema.nodeType}-${field.fieldName}`}
                                variant="secondary"
                                className="bg-slate-100 text-slate-700"
                              >
                                {field.fieldName}
                              </Badge>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex items-center gap-2">
                    {compatibleBuilderMode === "advanced" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    )}
                    <p className="text-sm font-semibold text-slate-900">
                      Editing strategy
                    </p>
                  </div>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                    <p>
                      {compatibleBuilderMode === "advanced"
                        ? "Formula đang sử dụng node nâng cao như lookup/fn/foreach/context. Drag-drop cơ bản không đủ để bảo toàn logic, vì vậy JSON Studio bên dưới là nơi sửa chính."
                        : "Formula hiện tại có thể được sửa nhanh bằng builder token. Nếu cần node lookup/fn/foreach, dùng recipe hoặc JSON Studio để nâng cấp AST."}
                    </p>
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-500">
                      Guide mới từ BE đã mở rộng phạm vi node thật của engine:
                      literal, ref, aggregate, lookup, op, fn, foreach, context.
                      UI này ưu tiên hiển thị và kiểm tra những node đó thay vì
                      mapping giả lập.
                    </div>
                  </div>
                </div>
              </div> */}

              {/* {editorMode === "visual" ? (
                <div className="space-y-4">
                  <VisualFormulaComposer
                    exprJson={props.fmExprJson}
                    setExprJson={props.setFmExprJson}
                    formulaList={props.formulaList}
                  />

                  <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        Điều admin sẽ thao tác
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-slate-600">
                        <li>1. Chọn loại node bằng dropdown tại mỗi block.</li>
                        <li>2. Điền giá trị bằng input/select để sửa logic.</li>
                        <li>
                          3. Thêm/xóa arg với fn, hoặc sửa left/right với op.
                        </li>
                        <li>4. Bấm Lưu (Create/Update) như bình thường.</li>
                      </ul>
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-sm font-semibold text-slate-900">
                        AST preview (read-only)
                      </p>
                      {parsedExpression ? (
                        <div className="max-h-144 overflow-auto pr-1">
                          <AstNodeOutline node={parsedExpression} />
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-sm text-slate-500">
                          Chưa tạo được AST hợp lệ.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null} */}

              <>
                {/* ── AGGREGATE tab ── */}
                {builderTab === "AGGREGATE" && (
                  <AggregateEditor
                    exprJson={props.fmExprJson}
                    setExprJson={props.setFmExprJson}
                  />
                )}

                {/* ── CELL_REF / WEIGHTED_AVG tab ── */}
                {builderTab === "CELL_REF" && (
                  <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
                    {/* ── Left: expression builder ── */}
                    <div className="space-y-3">
                      {/* Drop zone */}
                      {compatibleBuilderMode === "advanced" ? (
                        <div className="min-h-36 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 p-4 flex flex-col items-center justify-center gap-2 text-center">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          <p className="text-sm font-semibold text-amber-800">
                            Công thức nâng cao — builder bị khóa
                          </p>
                          <p className="text-xs text-amber-600">
                            Formula đang dùng node lookup / fn / foreach /
                            context. Drag-drop cơ bản không bảo toàn được logic
                            đó. Hãy chỉnh sửa qua{" "}
                            <span className="font-medium">JSON Studio</span> bên
                            dưới.
                          </p>
                        </div>
                      ) : (
                        <div
                          onDragOver={(event) => event.preventDefault()}
                          onDrop={onDropToBuilderEnd}
                          className="min-h-36 rounded-xl border-2 border-dashed border-[#2563eb]/30 bg-[#f0f4ff] p-2"
                        >
                          <p className="mb-1.5 text-[11px] text-gray-400">
                            Nhấn biến / toán tử để thêm · Kéo để sắp xếp · Nhấn
                            ✕ để xóa token
                          </p>
                          <div className="flex min-h-20 flex-wrap items-start gap-1.5 rounded-lg bg-[#0b1324] px-3 py-2.5">
                            {builderTokens.length === 0 ? (
                              <span className="text-xs text-gray-500">
                                Biểu thức trống — thêm biến hoặc số từ bên phải
                              </span>
                            ) : (
                              builderTokens.map((token, index) =>
                                token.type === "num" &&
                                editingNumTokenId === token.id ? (
                                  <input
                                    key={token.id}
                                    autoFocus
                                    value={editingNumValue}
                                    onChange={(e) =>
                                      setEditingNumValue(e.target.value)
                                    }
                                    onBlur={commitEditNum}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") commitEditNum();
                                      if (e.key === "Escape")
                                        setEditingNumTokenId(null);
                                    }}
                                    className="w-20 rounded-full bg-violet-900 px-2 py-0.5 text-center font-mono text-xs text-violet-200 outline-none ring-1 ring-violet-400"
                                  />
                                ) : (
                                  <span
                                    key={token.id}
                                    draggable
                                    onDragStart={(event) =>
                                      onTokenDragStart(event, token.id)
                                    }
                                    onDragEnd={onTokenDragEnd}
                                    onDragOver={(event) =>
                                      event.preventDefault()
                                    }
                                    onDrop={(event) => {
                                      const rect =
                                        event.currentTarget.getBoundingClientRect();
                                      const insertAfter =
                                        event.clientX >
                                        rect.left + rect.width / 2;
                                      onBuilderDropAt(
                                        event,
                                        index + (insertAfter ? 1 : 0),
                                      );
                                    }}
                                    onDoubleClick={() =>
                                      token.type === "num" &&
                                      startEditNum(token)
                                    }
                                    className={`inline-flex cursor-grab items-center gap-1 rounded-full px-2 py-0.5 text-xs active:cursor-grabbing ${
                                      token.type === "var"
                                        ? "bg-cyan-900/70 text-cyan-200"
                                        : token.type === "num"
                                          ? "bg-violet-900/70 text-violet-200"
                                          : "bg-slate-800 text-slate-200"
                                    }`}
                                    title={
                                      token.type === "num"
                                        ? "Nhấp đôi để sửa số"
                                        : undefined
                                    }
                                  >
                                    {token.type === "var"
                                      ? `[${token.label}]`
                                      : token.label}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeTokenById(token.id);
                                      }}
                                      className="ml-0.5 rounded-full text-[10px] leading-none opacity-50 hover:opacity-100"
                                      title="Xóa token này"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ),
                              )
                            )}
                          </div>
                        </div>
                      )}

                      {/* Hint / Error */}
                      {builderHint ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                          {builderHint}
                        </div>
                      ) : null}
                      {builderError ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                          {builderError}
                        </div>
                      ) : null}

                      {/* Operator palette */}
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-gray-500">
                          Toán tử
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {["+", "-", "*", "/", "(", ")"].map((sign) => (
                            <button
                              key={sign}
                              type="button"
                              draggable
                              onDragStart={(event) =>
                                onPaletteTokenDragStart(event, {
                                  type:
                                    sign === "("
                                      ? "lpar"
                                      : sign === ")"
                                        ? "rpar"
                                        : "op",
                                  value: sign,
                                  label: sign,
                                })
                              }
                              onClick={() =>
                                addToken({
                                  type:
                                    sign === "("
                                      ? "lpar"
                                      : sign === ")"
                                        ? "rpar"
                                        : "op",
                                  value: sign,
                                  label: sign,
                                })
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:border-[#2563eb]/40 hover:bg-[#eff6ff]"
                            >
                              {sign}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom number input */}
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-gray-500">
                          Thêm số cố định
                        </p>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={customNumInput}
                            onChange={(e) => setCustomNumInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") addCustomNum();
                            }}
                            placeholder="VD: 100000"
                            className="w-36 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
                          />
                          <button
                            type="button"
                            onClick={addCustomNum}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-[#2563eb]/30 hover:bg-[#eff6ff]"
                          >
                            + Thêm
                          </button>
                        </div>
                      </div>

                      {/* Expression string preview */}
                      <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                        <p className="text-[11px] text-gray-400">Biểu thức</p>
                        <p className="mt-0.5 font-mono text-sm text-gray-800">
                          {tokenExpression ? (
                            tokenExpression
                          ) : (
                            <span className="text-xs text-gray-400">
                              (trống)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* ── Right: variable library ── */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">
                        Thư viện biến — nhấn để thêm vào biểu thức
                      </p>
                      <input
                        value={variableSearch}
                        onChange={(e) => setVariableSearch(e.target.value)}
                        placeholder="Tìm biến..."
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      />
                      <div className="flex flex-wrap gap-1.5">
                        {[{ key: "all", label: "Tất cả" }].map((item) => (
                          <button
                            key={item.key}
                            type="button"
                            onClick={() => setVariableTypeFilter(item.key)}
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              variableTypeFilter === item.key
                                ? "border-[#2563eb]/35 bg-[#eff6ff] text-[#1d4ed8]"
                                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-auto rounded-xl border border-gray-100 bg-white p-2">
                        {filteredVariables.length === 0 ? (
                          <p className="p-2 text-xs text-gray-400">
                            Không tìm thấy biến nào.
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {filteredVariables.map((variable) => (
                              <button
                                key={variable.code}
                                type="button"
                                draggable
                                onDragStart={(event) => {
                                  event.dataTransfer.setData(
                                    "application/x-formula-var",
                                    JSON.stringify({
                                      code: variable.code,
                                      label: variable.label,
                                    }),
                                  );
                                }}
                                onClick={() =>
                                  addToken({
                                    type: "var",
                                    value: variable.code,
                                    label: variable.label,
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs text-cyan-800 hover:border-cyan-300 hover:bg-cyan-100"
                                title={`${variable.label} · ${variable.dataType}`}
                              >
                                <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                                {variable.code}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── TAX_RATE tab ── */}
                {builderTab === "TAX_RATE" && (
                  <TaxRateEditor
                    exprJson={props.fmExprJson}
                    setExprJson={props.setFmExprJson}
                    formulaList={props.formulaList}
                    isCreateMode={isCreateMode}
                  />
                )}

                {/* ── EXTERNAL_LOOKUP tab ── */}
                {builderTab === "EXTERNAL_LOOKUP" && (
                  <LookupEditor
                    exprJson={props.fmExprJson}
                    setExprJson={props.setFmExprJson}
                    isCreateMode={isCreateMode}
                  />
                )}

                {/* <div className="mt-6 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                    <div className="rounded-2xl border border-slate-200 bg-[#0b1120] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            Chỉnh sửa công thức nâng cao
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Dùng khi cần chỉnh chi tiết bằng dữ liệu JSON.
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={formatJsonDraft}
                          >
                            Định dạng
                          </Button>
                          <Button
                            size="sm"
                            className={primaryBtnClass}
                            onClick={applyJsonDraft}
                          >
                            Áp dụng
                          </Button>
                        </div>
                      </div>
                      <textarea
                        value={rawJsonDraft}
                        onChange={(event) =>
                          setRawJsonDraft(event.target.value)
                        }
                        rows={18}
                        spellCheck={false}
                        className="mt-4 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-cyan-300 focus:outline-none focus:ring-1 focus:ring-sky-500"
                      />
                      {jsonDraftError ? (
                        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                          {jsonDraftError}
                        </div>
                      ) : null}
                    </div>

                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          Sơ đồ cấu trúc công thức
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Sơ đồ này tự cập nhật từ công thức đang áp dụng.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {usedNodeTypes.length > 0 ? (
                          usedNodeTypes.map((nodeType) => (
                            <Badge
                              key={nodeType}
                              variant="secondary"
                              className="bg-white text-slate-700"
                            >
                              {nodeType}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400">
                            Công thức hiện tại chưa hợp lệ.
                          </span>
                        )}
                      </div>

                      {parsedExpression ? (
                        <div className="max-h-144 overflow-auto pr-1">
                          <AstNodeOutline node={parsedExpression} />
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500">
                          Công thức hiện tại chưa đọc được. Kiểm tra lại cú
                          pháp JSON ở khung bên trái.
                        </div>
                      )}
                    </div>
                  </div> */}
              </>
            </CardContent>
          </Card>

          {/* ── Preview / Logic Trace Card ── */}
          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>
                {builderTab === "CELL_REF"
                  ? "Xem thử kết quả"
                  : builderTab === "NONE"
                    ? "Xem thử kết quả"
                    : "Logic Trace"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {builderTab === "NONE" ? (
                <p className="text-sm text-gray-500">
                  Chọn formulaType trước để sử dụng trình tạo công thức và xem
                  thử.
                </p>
              ) : builderTab === "CELL_REF" ? (
                <>
                  {variableCodesInBuilder.length ? (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {variableCodesInBuilder.map((code) => (
                        <div
                          key={code}
                          className="rounded-lg border border-sky-100 bg-sky-50 p-3"
                        >
                          <p className="text-sm font-medium text-sky-800">
                            {code}
                          </p>
                          <input
                            value={previewInputs[code] ?? "0"}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^-?\d*\.?\d*$/.test(val)) {
                                setPreviewInputs((prev) => ({
                                  ...prev,
                                  [code]: val,
                                }));
                              }
                            }}
                            inputMode="decimal"
                            className="mt-2 w-full rounded-lg border border-sky-100 bg-white px-3 py-2 font-mono text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      Chưa có biến trong biểu thức.
                    </p>
                  )}
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                    Kết quả xem thử:{" "}
                    <span className="font-semibold">{previewResult}</span>
                  </div>
                </>
              ) : (
                /* ── Logic Trace Form ── */
                <div className="space-y-4">
                  {/* Row 1: ID inputs */}
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Business Location
                      </label>
                      <select
                        value={traceBusinessLocationId}
                        onChange={(e) =>
                          setTraceBusinessLocationId(e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        disabled={traceLocationsBusy}
                      >
                        <option value="">-- Chọn location --</option>
                        {traceBusinessLocationId &&
                        !traceLocationOptions.some(
                          (option) => option.value === traceBusinessLocationId,
                        ) ? (
                          <option value={traceBusinessLocationId}>
                            #{traceBusinessLocationId} - Mặc định / custom
                          </option>
                        ) : null}
                        {traceLocationOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {traceLocationsError ? (
                        <p className="mt-1 text-[11px] text-amber-600">
                          {traceLocationsError}
                        </p>
                      ) : traceLocationsBusy ? (
                        <p className="mt-1 text-[11px] text-gray-400">
                          Đang tải danh sách location...
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Period ID
                      </label>
                      <select
                        value={tracePeriodId}
                        onChange={(e) => setTracePeriodId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                        disabled={tracePeriodsBusy || !traceBusinessLocationId}
                      >
                        <option value="">-- Chọn period --</option>
                        {tracePeriodId &&
                        !tracePeriodOptions.some(
                          (option) => option.value === tracePeriodId,
                        ) ? (
                          <option value={tracePeriodId}>
                            #{tracePeriodId} - Mặc định / custom
                          </option>
                        ) : null}
                        {tracePeriodOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      {tracePeriodsError ? (
                        <p className="mt-1 text-[11px] text-amber-600">
                          {tracePeriodsError}
                        </p>
                      ) : tracePeriodsBusy ? (
                        <p className="mt-1 text-[11px] text-gray-400">
                          Đang tải danh sách kỳ kế toán...
                        </p>
                      ) : null}
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Ruleset
                      </label>
                      <select
                        value={traceRulesetId}
                        onChange={(e) => setTraceRulesetId(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">-- Chọn ruleset --</option>
                        {traceRulesetId &&
                        !traceRulesetOptions.some(
                          (option) => option.value === traceRulesetId,
                        ) ? (
                          <option value={traceRulesetId}>
                            #{traceRulesetId} - Mặc định / custom
                          </option>
                        ) : null}
                        {traceRulesetOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        Formula ID
                      </label>
                      <input
                        type="text"
                        value={props.fmId || "(chưa chọn)"}
                        readOnly
                        className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Business Type chips */}
                  <div>
                    <p className="mb-2 text-xs font-medium text-gray-500">
                      Business Types (chọn để lọc)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {overviewBusinessTypes.map((bt) => (
                        <button
                          key={bt.businessTypeId}
                          type="button"
                          onClick={() =>
                            setTraceSelectedBtIds((prev) =>
                              prev.includes(bt.businessTypeId)
                                ? prev.filter((x) => x !== bt.businessTypeId)
                                : [...prev, bt.businessTypeId],
                            )
                          }
                          className={cn(
                            "rounded-full border px-3 py-1 text-xs font-medium transition",
                            traceSelectedBtIds.includes(bt.businessTypeId)
                              ? "border-teal-500 bg-teal-500 text-white"
                              : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50",
                          )}
                        >
                          {bt.code} — {bt.name}
                        </button>
                      ))}
                      {overviewBusinessTypes.length === 0 && (
                        <p className="text-xs text-gray-400">
                          Đang tải business types…
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Run Trace button */}
                  <button
                    type="button"
                    disabled={
                      traceLoading ||
                      !props.fmId ||
                      !traceBusinessLocationId ||
                      !tracePeriodId ||
                      !traceRulesetId
                    }
                    onClick={() => {
                      setTraceLoading(true);
                      setTraceError("");
                      setTraceResult(null);
                      void runAccountingTrace({
                        formulaId: Number(props.fmId),
                        businessLocationId: Number(traceBusinessLocationId),
                        periodId: Number(tracePeriodId),
                        rulesetId: Number(traceRulesetId),
                        businessTypeIds: traceSelectedBtIds,
                      })
                        .then((data) => {
                          setTraceResult(data);
                        })
                        .catch((err: unknown) => {
                          setTraceError(
                            err instanceof Error
                              ? err.message
                              : "Lỗi khi chạy trace",
                          );
                        })
                        .finally(() => setTraceLoading(false));
                    }}
                    className="flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Run Trace
                  </button>

                  {/* Error */}
                  {traceError && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {traceError}
                    </div>
                  )}

                  {/* Result */}
                  {traceResult &&
                    (() => {
                      const r = traceResult as Record<string, unknown>;
                      const steps = Array.isArray(r.traceSteps)
                        ? (r.traceSteps as Record<string, unknown>[])
                        : Array.isArray(r.steps)
                          ? (r.steps as Record<string, unknown>[])
                          : [];
                      const finalValue =
                        r.finalValue ?? r.resolvedValue ?? r.result ?? "—";
                      const traceNodes = Array.isArray(r.trace)
                        ? (r.trace as TraceNode[])
                        : [];
                      const finalValueDisplay =
                        typeof finalValue === "number"
                          ? finalValue.toLocaleString("vi-VN")
                          : String(finalValue);
                      return (
                        <>
                          {/* Summary */}
                          <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="w-full text-sm">
                              <thead className="bg-teal-50">
                                <tr>
                                  <th className="border-b px-4 py-2 text-left font-medium text-gray-700">
                                    Trường
                                  </th>
                                  <th className="border-b px-4 py-2 text-left font-medium text-gray-700">
                                    Giá trị
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-2 text-gray-500">
                                    Formula Code
                                  </td>
                                  <td className="px-4 py-2 font-medium">
                                    {String(r.formulaCode ?? props.fmCode)}
                                  </td>
                                </tr>
                                <tr className="border-b border-gray-100">
                                  <td className="px-4 py-2 text-gray-500">
                                    Formula Name
                                  </td>
                                  <td className="px-4 py-2 font-medium">
                                    {String(r.formulaName ?? props.fmName)}
                                  </td>
                                </tr>
                                <tr>
                                  <td className="px-4 py-2 text-gray-500">
                                    Final Value
                                  </td>
                                  <td className="px-4 py-2 font-mono font-semibold text-teal-700">
                                    {finalValueDisplay}
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>

                          {traceNodes.length > 0 && (
                            <div className="rounded-lg border bg-white p-2 max-h-96 overflow-auto">
                              {traceNodes.map((node) => (
                                <TraceNodeRow
                                  key={node.step}
                                  node={node}
                                  depth={0}
                                />
                              ))}
                            </div>
                          )}

                          {/* Trace steps table (fallback) */}
                          {traceNodes.length === 0 && steps.length > 0 && (
                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                              <table className="w-full text-sm">
                                <thead className="bg-teal-50">
                                  <tr>
                                    {[
                                      "Step",
                                      "Node Type",
                                      "Description",
                                      "Resolved Value",
                                      "Source",
                                      "Debug",
                                      "Children",
                                    ].map((h) => (
                                      <th
                                        key={h}
                                        className="border-b px-3 py-2 text-left font-medium text-gray-700 whitespace-nowrap"
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {steps.map((row, i) => (
                                    <tr
                                      key={i}
                                      className="border-b border-gray-100 hover:bg-gray-50"
                                    >
                                      <td className="px-3 py-2 text-gray-600">
                                        {String(row.step ?? i + 1)}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {String(
                                          row.nodeType ?? row.node_type ?? "—",
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {String(row.description ?? "—")}
                                      </td>
                                      <td className="px-3 py-2 font-mono text-teal-700">
                                        {String(
                                          row.resolvedValue ??
                                            row.resolved_value ??
                                            "—",
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {String(row.source ?? "—")}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {String(row.debug ?? "-")}
                                      </td>
                                      <td className="px-3 py-2 text-gray-600">
                                        {String(
                                          row.children ?? row.childCount ?? 0,
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </>
                      );
                    })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
