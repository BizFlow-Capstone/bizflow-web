import { useEffect, useMemo, useRef, useState } from "react";
import { CircleHelp } from "lucide-react";
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

function formulaTypeToVariableDataType(formulaType: string): string {
  const normalized = formulaType.trim().toLowerCase();
  if (!normalized) return "double";
  if (normalized.includes("string") || normalized.includes("text")) {
    return "string";
  }
  if (normalized.includes("int") || normalized.includes("long")) {
    return "integer";
  }
  return "double";
}

interface FormulaTabProps {
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

const LOOKUP_META: Record<
  LookupEntityKey,
  { label: string; fields: string[]; filterKeys: Record<string, string[]> }
> = {
  IndustryTaxRates: {
    label: "Thuế suất ngành",
    fields: ["TaxRate"],
    filterKeys: {
      TaxType: [
        "VAT",
        "PIT_M1",
        "PIT_M2",
        "PIT_M3",
        "PIT_M4",
        "PIT_M5",
        "PIT_M6",
        "PIT_M7",
      ],
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
    label: "Aggregate",
    desc: "SUM / COUNT / AVG từ bảng dữ liệu",
  },
  {
    key: "CELL_REF",
    label: "Expression",
    desc: "Toán tử +  −  ×  ÷ giữa các ref",
  },
  {
    key: "TAX_RATE",
    label: "Tax Rate",
    desc: "Công thức thuế / apply per-industry",
  },
  {
    key: "EXTERNAL_LOOKUP",
    label: "Lookup",
    desc: "Tra giá trị từ bảng tham chiếu",
  },
] as const;
type BuilderTabKey = (typeof BUILDER_TABS)[number]["key"];

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

  const source = (
    typeof parsed.source === "string" ? parsed.source : "revenues"
  ) as SourceKey;
  const field = typeof parsed.field === "string" ? parsed.field : "Amount";
  const aggFn = typeof parsed.aggregate === "string" ? parsed.aggregate : "SUM";
  const scope = typeof parsed.scope === "string" ? parsed.scope : "book";
  const period =
    typeof parsed.periodFilter === "string" ? parsed.periodFilter : "none";
  const sign = typeof parsed.sign === "string" ? parsed.sign : "all";
  const filter =
    typeof parsed.filter === "object" &&
    parsed.filter &&
    !Array.isArray(parsed.filter)
      ? (parsed.filter as Record<string, string[]>)
      : ({} as Record<string, string[]>);

  const sourceMeta = SOURCES_META[source] ?? SOURCES_META["revenues"];

  function patch(updates: Record<string, unknown>) {
    const next: Record<string, unknown> = { ...parsed, ...updates };
    Object.keys(next).forEach((k) => next[k] === undefined && delete next[k]);
    setExprJson(JSON.stringify(next));
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
            Nguồn dữ liệu (source)
            <FieldHint hint="Bảng dữ liệu cần tổng hợp: revenues (doanh thu), costs (chi phí), gl_entries (bút toán tiền mặt/ngân hàng), stock_movements (xuất nhập kho)." />
          </label>
          <select
            value={source}
            onChange={(e) => {
              const s = e.target.value as SourceKey;
              patch({
                source: s,
                field: SOURCES_META[s]?.fields[0] ?? "Amount",
                filter: undefined,
              });
            }}
            className={sel}
          >
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
            Trường (field)
            <FieldHint hint="Cột cần tổng hợp trong bảng nguồn. Ví dụ: Amount (số tiền), QuantityDelta (số lượng thay đổi), DebitAmount / CreditAmount (nợ / có GL)." />
          </label>
          <select
            value={field}
            onChange={(e) => patch({ field: e.target.value })}
            className={sel}
          >
            {sourceMeta.fields.map((f) => (
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
            onChange={(e) => patch({ aggregate: e.target.value })}
            className={sel}
          >
            {AGGREGATE_FUNS.map((fn) => (
              <option key={fn} value={fn}>
                {fn}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={lbl}>
            Scope
            <FieldHint hint="book: lọc theo ngành nghề (business type) của sổ đang tính. location: lấy toàn bộ dữ liệu của địa điểm, không phân biệt ngành." />
          </label>
          <select
            value={scope}
            onChange={(e) => patch({ scope: e.target.value })}
            className={sel}
          >
            <option value="book">book — Theo ngành / sổ</option>
            <option value="location">location — Toàn địa điểm</option>
          </select>
        </div>

        <div>
          <label className={lbl}>
            Period filter
            <FieldHint hint="current: chỉ lấy phát sinh trong kỳ. before: lấy số dư / phát sinh trước kỳ (dùng cho tồn đầu kỳ). none: không lọc theo kỳ." />
          </label>
          <select
            value={period}
            onChange={(e) =>
              patch({
                periodFilter:
                  e.target.value === "none" ? undefined : e.target.value,
              })
            }
            className={sel}
          >
            <option value="current">current — Trong kỳ</option>
            <option value="before">before — Trước kỳ (đầu kỳ)</option>
            <option value="none">none — Không lọc kỳ</option>
          </select>
        </div>

        <div>
          <label className={lbl}>
            Dấu (sign)
            <FieldHint hint="all: tất cả bản ghi. positive: chỉ lấy bản ghi có giá trị > 0 (ví dụ: nhập kho). negative: chỉ lấy giá trị < 0 (ví dụ: xuất kho QuantityDelta âm)." />
          </label>
          <select
            value={sign}
            onChange={(e) =>
              patch({
                sign: e.target.value === "all" ? undefined : e.target.value,
              })
            }
            className={sel}
          >
            <option value="all">all — Tất cả</option>
            <option value="positive">positive — Chỉ dương (&gt; 0)</option>
            <option value="negative">negative — Chỉ âm (&lt; 0)</option>
          </select>
        </div>
      </div>

      {Object.entries(sourceMeta.filterKeys).map(([key, options]) => {
        const selected: string[] = Array.isArray(filter[key])
          ? filter[key]
          : [];
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
      })}

      <div className="rounded-lg bg-[#0b1324] px-3 py-2.5">
        <p className="mb-1 text-[11px] text-gray-400">JSON preview</p>
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
}: {
  exprJson: string;
  setExprJson: (v: string) => void;
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

  const entity = (
    typeof lookupObj.entity === "string"
      ? lookupObj.entity
      : "AccountingPeriods"
  ) as LookupEntityKey;
  const field = typeof lookupObj.field === "string" ? lookupObj.field : "";
  const filter =
    typeof lookupObj.filter === "object" &&
    lookupObj.filter &&
    !Array.isArray(lookupObj.filter)
      ? (lookupObj.filter as Record<string, string>)
      : ({} as Record<string, string>);

  const entityMeta = LOOKUP_META[entity] ?? LOOKUP_META["AccountingPeriods"];

  function patchLookup(updates: Record<string, unknown>) {
    const next: Record<string, unknown> = { ...lookupObj, ...updates };
    Object.keys(next).forEach((k) => next[k] === undefined && delete next[k]);
    setExprJson(JSON.stringify({ lookup: next }));
  }

  const sel = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm";
  const lbl = "mb-1 block text-xs font-medium text-gray-600";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={lbl}>
            Bảng tra cứu (entity)
            <FieldHint hint="IndustryTaxRates: bảng thuế suất theo ngành (VAT, PIT). AccountingPeriods: kỳ kế toán — dùng để lấy số dư đầu kỳ (OpeningCashBalance, OpeningBankBalance)." />
          </label>
          <select
            value={entity}
            onChange={(e) => {
              const ent = e.target.value as LookupEntityKey;
              patchLookup({
                entity: ent,
                field: LOOKUP_META[ent]?.fields[0] ?? "",
                filter: undefined,
              });
            }}
            className={sel}
          >
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
            Trường (field)
            <FieldHint hint="Cột giá trị cần lấy từ bảng tra cứu. Ví dụ: TaxRate (thuế suất), OpeningCashBalance (tiền mặt đầu kỳ), OpeningBankBalance (tiền gửi đầu kỳ)." />
          </label>
          <select
            value={field}
            onChange={(e) => patchLookup({ field: e.target.value })}
            className={sel}
          >
            {entityMeta.fields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
      </div>

      {Object.entries(entityMeta.filterKeys).map(([key, options]) => {
        const current = typeof filter[key] === "string" ? filter[key] : "";
        return (
          <div key={key}>
            <label className={lbl}>Lọc: {key}</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    patchLookup({ filter: { ...filter, [key]: opt } })
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
      })}

      <div className="rounded-lg bg-[#0b1324] px-3 py-2.5">
        <p className="mb-1 text-[11px] text-gray-400">JSON preview</p>
        <pre className="overflow-x-auto text-xs text-cyan-300">
          {JSON.stringify({ lookup: lookupObj }, null, 2)}
        </pre>
      </div>
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
  const [cloneDraftCode, setCloneDraftCode] = useState("");
  const [cloneDraftSuffix, setCloneDraftSuffix] = useState(" (draft)");
  const [editingNumTokenId, setEditingNumTokenId] = useState<string | null>(
    null,
  );
  const [editingNumValue, setEditingNumValue] = useState("");
  const [customNumInput, setCustomNumInput] = useState("");
  // Tab override: tracks which formula ID was active when user manually clicked a tab
  const [tabOverride, setTabOverride] = useState<{
    fmId: string;
    tab: BuilderTabKey;
  } | null>(null);
  const tokenDragHandledRef = useRef(false);
  const lastSelectedFormulaIdRef = useRef("");

  const isCreateMode = !props.fmId.trim();
  const isActiveFormula =
    props.fmIsActive === "true" ||
    props.fmActive.trim().toLowerCase() === "active";

  function resetCreateFormulaForm() {
    props.setFmId("");
    props.setFmCode("");
    props.setFmName("");
    props.setFmDesc("");
    props.setFmFType("");
    props.setFmExprJson("{}");
    props.setFmIsActive("false");
    props.setFmResultDataType("decimal");
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

  useEffect(() => {
    if (props.fmId.trim()) {
      lastSelectedFormulaIdRef.current = props.fmId.trim();
    }
  }, [props.fmId]);

  // Derive active builder tab: auto from fmFType, overridable per formula selection
  const builderTab: BuilderTabKey = useMemo(() => {
    const t = props.fmFType.trim().toUpperCase();
    const auto: BuilderTabKey =
      t === "AGGREGATE"
        ? "AGGREGATE"
        : t === "TAX_RATE"
          ? "TAX_RATE"
          : t === "EXTERNAL_LOOKUP"
            ? "EXTERNAL_LOOKUP"
            : "CELL_REF";
    // Use manual override only if it's scoped to the same formula
    if (tabOverride && tabOverride.fmId === props.fmId) return tabOverride.tab;
    return auto;
  }, [props.fmFType, props.fmId, tabOverride]);

  function setBuilderTab(tab: BuilderTabKey) {
    setTabOverride({ fmId: props.fmId, tab });
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
        "Biểu thức hiện tại là AST nâng cao. Nếu kéo-thả/chỉnh sửa ở đây, hệ thống sẽ lưu lại dưới dạng toán tử cơ bản.",
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
      double: variables.filter((v) => v.dataType.includes("decimal")).length,
      integer: variables.filter((v) => v.dataType.includes("int")).length,
      string: variables.filter((v) => v.dataType.includes("string")).length,
    };
  }, [variables]);

  const filteredVariables = useMemo(() => {
    const keyword = variableSearch.trim().toLowerCase();
    return variables.filter((variable) => {
      if (variableTypeFilter !== "all") {
        if (
          variableTypeFilter === "double" &&
          !variable.dataType.includes("decimal")
        ) {
          return false;
        }
        if (
          variableTypeFilter === "integer" &&
          !variable.dataType.includes("int")
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
    const current = props.fmFType.trim();
    if (
      !current ||
      DB_FORMULA_TYPES.includes(current as (typeof DB_FORMULA_TYPES)[number])
    ) {
      return DB_FORMULA_TYPES;
    }
    return [current, ...DB_FORMULA_TYPES];
  }, [props.fmFType]);

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
    if (!builderTokens.length) return "—";
    try {
      const expression = builderTokens
        .map((token) => {
          if (token.type === "var") {
            const raw = previewInputs[token.value] ?? "0";
            const parsed = Number(raw);
            return Number.isFinite(parsed) ? String(parsed) : "0";
          }
          if (token.type === "num") {
            const parsed = Number(token.value);
            return Number.isFinite(parsed) ? String(parsed) : "0";
          }
          return token.value;
        })
        .join(" ");
      // eslint-disable-next-line no-new-func
      const result = Function(`return (${expression});`)();
      return Number.isFinite(Number(result))
        ? Number(result).toLocaleString("vi-VN")
        : String(result);
    } catch {
      return "Lỗi biểu thức";
    }
  }, [builderTokens, previewInputs]);

  function syncTokens(nextTokens: FormulaToken[]) {
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
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-gray-900">
              {props.formulaList.length}
            </p>
            <p className="text-xs text-gray-500">Tổng công thức</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-emerald-600">
              {props.formulaList.filter((item) => item.isActive).length}
            </p>
            <p className="text-xs text-gray-500">Đang hoạt động</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-sky-600">
              {variableTypeCount.double}
            </p>
            <p className="text-xs text-gray-500">Biến Double</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-violet-600">
              {variableTypeCount.integer}
            </p>
            <p className="text-xs text-gray-500">Biến Integer</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-4">
            <p className="text-2xl font-semibold text-amber-600">
              {variableTypeCount.string}
            </p>
            <p className="text-xs text-gray-500">Biến String</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Formula Library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <input
              value={formulaSearch}
              onChange={(e) => setFormulaSearch(e.target.value)}
              placeholder="Tìm công thức..."
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <div className="max-h-1/3 space-y-2 overflow-auto pr-1">
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
                      {formula.isActive ? "Active" : "Draft"}
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
                  {isCreateMode ? "Update" : "Tạo mới"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Formula ID
                  </label>
                  <input
                    value={props.fmId}
                    onChange={(e) => props.setFmId(e.target.value)}
                    placeholder="Nhập formulaId"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">
                    Quick lookup
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
                    value={props.fmFType}
                    onChange={(e) => props.setFmFType(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                  >
                    <option value="">Chọn FormulaType</option>
                    {formulaTypeOptions.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
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
                    Result data type
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
                    Rounding mode
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
                    Rounding precision
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

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className={primaryBtnClass}
                  onClick={isCreateMode ? props.onCreate : props.onUpdate}
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
                    Deactivate
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={props.onActivate}
                    disabled={isCreateMode}
                  >
                    Activate
                  </Button>
                )}
              </div>
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
                    Mã Công Thức
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
                    Tên Công Thức
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
                  Clone
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between gap-2">
                <CardTitle>Formula Builder</CardTitle>
                {builderTab === "CELL_REF" && builderTokens.length > 0 && (
                  <button
                    type="button"
                    onClick={() => syncTokens([])}
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
                  >
                    Xóa biểu thức
                  </button>
                )}
              </div>

              {/* Tab bar */}
              <div className="mt-3 flex flex-wrap gap-1.5 border-b border-gray-100 pb-3">
                {BUILDER_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setBuilderTab(tab.key)}
                    className={`rounded-lg border px-3 py-1.5 text-left transition-colors ${
                      builderTab === tab.key
                        ? "border-[#2563eb]/40 bg-[#eff6ff] text-[#1d4ed8]"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-xs font-semibold">
                      {tab.label}
                    </span>
                    <span className="block text-[11px] text-gray-400">
                      {tab.desc}
                    </span>
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="pt-4">
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
                    <div
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={onDropToBuilderEnd}
                      className="min-h-36 rounded-xl border-2 border-dashed border-[#2563eb]/30 bg-[#f0f4ff] p-2"
                    >
                      <p className="mb-1.5 text-[11px] text-gray-400">
                        Nhấn biến / toán tử để thêm · Kéo để sắp xếp · Nhấn ✕ để
                        xóa token
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
                                onDragOver={(event) => event.preventDefault()}
                                onDrop={(event) => {
                                  const rect =
                                    event.currentTarget.getBoundingClientRect();
                                  const insertAfter =
                                    event.clientX > rect.left + rect.width / 2;
                                  onBuilderDropAt(
                                    event,
                                    index + (insertAfter ? 1 : 0),
                                  );
                                }}
                                onDoubleClick={() =>
                                  token.type === "num" && startEditNum(token)
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
                          <span className="text-xs text-gray-400">(trống)</span>
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
                      {[
                        { key: "all", label: "Tất cả" },
                        { key: "double", label: "Double" },
                        { key: "integer", label: "Integer" },
                        { key: "string", label: "String" },
                      ].map((item) => (
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
                <div className="space-y-3">
                  <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    Công thức TAX_RATE thường dùng cấu trúc phức tạp (op + fn +
                    lookup) hoặc pattern{" "}
                    <code className="rounded bg-amber-100 px-1">apply</code> cho
                    per-industry. Chỉnh sửa trực tiếp JSON bên dưới.
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-600">
                      ExpressionJson (JSON)
                    </label>
                    <textarea
                      value={(() => {
                        try {
                          return JSON.stringify(
                            JSON.parse(props.fmExprJson),
                            null,
                            2,
                          );
                        } catch {
                          return props.fmExprJson;
                        }
                      })()}
                      onChange={(e) => {
                        try {
                          JSON.parse(e.target.value);
                          props.setFmExprJson(e.target.value);
                        } catch {
                          props.setFmExprJson(e.target.value);
                        }
                      }}
                      rows={16}
                      spellCheck={false}
                      className="w-full rounded-lg border border-gray-200 bg-[#0b1324] px-3 py-2.5 font-mono text-xs text-cyan-300 focus:outline-none focus:ring-1 focus:ring-[#2563eb]/40"
                    />
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Ví dụ:{" "}
                    <code className="rounded bg-gray-100 px-1">
                      {`{"op":"MULTIPLY","left":{"ref":"S2A_QUARTERLY_TOTAL"},"right":{"lookup":{"entity":"IndustryTaxRates","field":"TaxRate","filter":{"TaxType":"VAT"}}}}`}
                    </code>
                  </p>
                </div>
              )}

              {/* ── EXTERNAL_LOOKUP tab ── */}
              {builderTab === "EXTERNAL_LOOKUP" && (
                <LookupEditor
                  exprJson={props.fmExprJson}
                  setExprJson={props.setFmExprJson}
                />
              )}
            </CardContent>
          </Card>
          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Preview Calculation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg bg-[#0b1324] px-3 py-2 font-mono text-sm text-cyan-300">
                {tokenExpression || "(chưa có biểu thức)"}
              </div>

              {variableCodesInBuilder.length ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {variableCodesInBuilder.map((code) => (
                    <div
                      key={code}
                      className="rounded-lg border border-sky-100 bg-sky-50 p-3"
                    >
                      <p className="text-sm font-medium text-sky-800">{code}</p>
                      <input
                        value={previewInputs[code] ?? "0"}
                        onChange={(e) =>
                          setPreviewInputs((prev) => ({
                            ...prev,
                            [code]: e.target.value,
                          }))
                        }
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
                Kết quả preview:{" "}
                <span className="font-semibold">{previewResult}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
