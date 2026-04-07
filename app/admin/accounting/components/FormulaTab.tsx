import { useEffect, useMemo, useRef, useState } from "react";
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
                  ? "Không có giải thích từ backend."
                  : props.fmExplanation || "Không có giải thích từ backend."}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className={primaryBtnClass}
                  onClick={isCreateMode ? props.onCreate : props.onUpdate}
                >
                  {isCreateMode ? "Tạo mới" : "Update"}
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
            <CardHeader>
              <CardTitle>Formula Builder (Kéo thả biến)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDropToBuilderEnd}
                className="min-h-24 rounded-xl border border-dashed border-[#2563eb]/35 bg-[#eff6ff] p-3"
              >
                <p className="mb-2 text-xs text-gray-500">
                  Kéo biến hoặc dấu toán tử vào đây. Kéo token trong input để
                  đổi thứ tự trước/sau nhau.
                </p>
                <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg bg-[#0b1324] px-3 py-2 text-sm text-cyan-300">
                  {builderTokens.length === 0 ? (
                    <span className="text-xs text-gray-400">
                      Biểu thức trống
                    </span>
                  ) : (
                    builderTokens.map((token, index) => (
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
                          const targetIndex = index + (insertAfter ? 1 : 0);
                          onBuilderDropAt(event, targetIndex);
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs ${
                          token.type === "var"
                            ? "bg-cyan-900/70 text-cyan-200"
                            : token.type === "num"
                              ? "bg-violet-900/70 text-violet-200"
                              : "bg-slate-800 text-slate-200"
                        } cursor-grab active:cursor-grabbing`}
                      >
                        {token.type === "var"
                          ? `[${token.label}]`
                          : token.label}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const draggedTokenId =
                    event.dataTransfer.getData("application/x-formula-token") ||
                    draggingTokenId;
                  if (!draggedTokenId) return;
                  tokenDragHandledRef.current = true;
                  removeTokenById(draggedTokenId);
                  setDraggingTokenId(null);
                }}
                className={`rounded-lg border border-dashed px-3 py-2 text-xs transition ${
                  draggingTokenId
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                {draggingTokenId
                  ? "Thả token ra đây để bỏ khỏi công thức"
                  : "Kéo token ra khỏi input và thả vào đây để bỏ khỏi công thức"}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {["+", "-", "*", "/", "(", ")"].map((sign) => (
                  <button
                    key={sign}
                    type="button"
                    draggable
                    onDragStart={(event) =>
                      onPaletteTokenDragStart(event, {
                        type:
                          sign === "(" ? "lpar" : sign === ")" ? "rpar" : "op",
                        value: sign,
                        label: sign,
                      })
                    }
                    onClick={() =>
                      addToken({
                        type:
                          sign === "(" ? "lpar" : sign === ")" ? "rpar" : "op",
                        value: sign,
                        label: sign,
                      })
                    }
                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-[#2563eb]/30 hover:bg-[#eff6ff]"
                  >
                    {sign}
                  </button>
                ))}
                <button
                  type="button"
                  draggable
                  onDragStart={(event) =>
                    onPaletteTokenDragStart(event, {
                      type: "num",
                      value: "0",
                      label: "0",
                    })
                  }
                  onClick={() =>
                    addToken({ type: "num", value: "0", label: "0" })
                  }
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-[#2563eb]/30 hover:bg-[#eff6ff]"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => syncTokens([])}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100"
                >
                  Xóa biểu thức
                </button>
              </div>

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

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <p className="text-xs font-medium text-gray-600">
                  Expression generated
                </p>
                <p className="mt-1 font-mono text-xs text-gray-700">
                  {tokenExpression || "(trống)"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Thư viện biến</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <input
                value={variableSearch}
                onChange={(e) => setVariableSearch(e.target.value)}
                placeholder="Tìm biến..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />

              <div className="flex flex-wrap gap-2">
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
                    className={`rounded-full border px-3 py-1 text-xs font-medium ${
                      variableTypeFilter === item.key
                        ? "border-[#2563eb]/35 bg-[#eff6ff] text-[#1d4ed8]"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="max-h-60 overflow-auto rounded-xl border border-gray-200 bg-white p-2">
                <div className="flex flex-wrap gap-2">
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
                      className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-xs text-cyan-800 hover:border-cyan-300"
                      title={`${variable.group} · ${variable.code}`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                      {variable.label}
                    </button>
                  ))}
                </div>
              </div>
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
