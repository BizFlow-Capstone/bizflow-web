"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Boxes,
  Database,
  FileJson,
  FunctionSquare,
  GitBranch,
  Play,
  Plug,
  Rows,
  Scale,
  TreePine,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  activateTemplateVersion,
  cloneFormula,
  cloneTemplateVersion,
  createFieldMapping,
  createMappableEntity,
  createMappableField,
  createRowDefinition,
  deactivateTemplateVersion,
  deleteFieldMapping,
  deleteRowDefinition,
  deleteTemplateVersion,
  getAccountingOverview,
  getAccountingReference,
  getFormulaDetail,
  getFormulaNodeSchemas,
  getMappableEntities,
  getMappableEntityDetail,
  getRowDefinitions,
  getTemplateVersionDetail,
  getTemplateVersionFormulas,
  getTemplateVersionFullStructure,
  runAccountingCompare,
  runAccountingTrace,
  updateFieldMappingForTesting,
  updateFormulaTesting,
  updateMappableEntity,
  updateMappableField,
  updateRowDefinition,
  updateTemplateVersion,
} from "@/lib/admin-accounting-api";
import type {
  AccountingBusinessTypeSummary,
  AccountingFormulaSummary,
  AccountingOverviewResponse,
  AccountingTemplateSummary,
} from "@/lib/types/adminAccounting";
import JsonTree from "./components/JsonTree";
import VersionFlowTab from "./components/VersionFlowTab";
import FormulaTab from "./components/FormulaTab";
import MappingTab from "./components/MappingTab";
import type { MappingFormState } from "./components/types";

type AccountingTabKey =
  | "overview"
  | "version"
  | "formulas"
  | "mappings"
  | "rowdefs"
  | "entities"
  | "reference"
  | "compare"
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

const tabs: Array<{
  key: AccountingTabKey;
  label: string;
  icon: React.ReactNode;
  group: "core" | "support";
}> = [
  {
    key: "overview",
    label: "Overview",
    icon: <Boxes className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "version",
    label: "Template Versions",
    icon: <GitBranch className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "formulas",
    label: "Formulas",
    icon: <FunctionSquare className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "mappings",
    label: "Field Mappings",
    icon: <Plug className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "rowdefs",
    label: "Row Definitions",
    icon: <Rows className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "entities",
    label: "Entities & Fields",
    icon: <Database className="h-4 w-4" />,
    group: "core",
  },
  {
    key: "compare",
    label: "Compare (A/B)",
    icon: <Scale className="h-4 w-4" />,
    group: "support",
  },
  {
    key: "trace",
    label: "Trace Logic",
    icon: <TreePine className="h-4 w-4" />,
    group: "support",
  },
  {
    key: "reference",
    label: "Enums Reference",
    icon: <BookOpen className="h-4 w-4" />,
    group: "support",
  },
  {
    key: "schema",
    label: "Node Schemas",
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

function toNum(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
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

function isAccountingTabKey(value: string | null): value is AccountingTabKey {
  return Boolean(value) && tabs.some((tab) => tab.key === value);
}

export default function AdminAccountingClient() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [overview, setOverview] = useState<AccountingOverviewResponse | null>(
    null,
  );
  const [error, setError] = useState("");
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
  const [fmJsonView, setFmJsonView] = useState<unknown>(null);

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
  const [rowDefs, setRowDefs] = useState<Array<Record<string, unknown>>>([]);
  const [rowForm, setRowForm] = useState<RowFormState>(emptyRowForm);

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
  const [efEditId, setEfEditId] = useState("");
  const [efEntId, setEfEntId] = useState("");
  const [efCode, setEfCode] = useState("");
  const [efName, setEfName] = useState("");
  const [efDtype, setEfDtype] = useState("decimal");
  const [efAggs, setEfAggs] = useState('["sum","none"]');
  const [efDesc, setEfDesc] = useState("");

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

  const versionIsActiveMap = useMemo(() => {
    const map = new Map<number, boolean>();
    templates.forEach((template: AccountingTemplateSummary) => {
      template.versions.forEach((version) => {
        map.set(version.templateVersionId, Boolean(version.isActive));
      });
    });
    return map;
  }, [templates]);

  const coreTabs = useMemo(
    () => tabs.filter((tab) => tab.group === "core"),
    [],
  );
  const supportTabs = useMemo(
    () => tabs.filter((tab) => tab.group === "support"),
    [],
  );
  const searchParamsString = searchParams.toString();
  const tabParam = searchParams.get("tab");
  const activeTab: AccountingTabKey = isAccountingTabKey(tabParam)
    ? tabParam
    : "overview";
  const deepLinkState = useMemo(() => {
    if (isAccountingTabKey(tabParam)) {
      return {
        confirmed: true,
        message: `Deep-link query applied: tab=${tabParam}`,
      };
    }

    if (tabParam) {
      return {
        confirmed: false,
        message: `Ignored invalid deep-link query: tab=${tabParam}`,
      };
    }

    return { confirmed: false, message: "" };
  }, [tabParam]);

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

  const formulaOptions = useMemo(() => {
    return formulas.map((f: AccountingFormulaSummary) => ({
      value: String(f.formulaId),
      label: `${f.formulaId} - ${f.code}`,
    }));
  }, [formulas]);

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
      setTvLabel(String(d.versionLabel ?? ""));
      setTvEffective(String(d.effectiveFrom ?? ""));
      setTvNotes(String(d.changeNotes ?? ""));
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
      setTvResult({ message: "Deleted" });
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
      const expr = String(d.expressionJson ?? "{}");
      setFmExprJson(expr);
      try {
        setFmJsonView(JSON.parse(expr));
      } catch {
        setFmJsonView(expr);
      }
      log(`Loaded formula ${id}`, "ok");
    });
  };

  const fmFormat = () => {
    try {
      const parsed = JSON.parse(fmExprJson);
      setFmExprJson(JSON.stringify(parsed, null, 2));
      setFmJsonView(parsed);
      log("Formatted formula JSON", "ok");
    } catch (err) {
      log(err instanceof Error ? err.message : "JSON không hợp lệ", "error");
    }
  };

  const fmValidate = () => {
    try {
      JSON.parse(fmExprJson);
      log("JSON hợp lệ", "ok");
    } catch (err) {
      log(err instanceof Error ? err.message : "JSON không hợp lệ", "error");
    }
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

  const fmClone = async () => {
    const id = toNum(fmId);
    if (!id) return;
    await runSafe(async () => {
      const payload: Record<string, string> = {};
      if (fmCloneCode.trim()) payload.newCode = fmCloneCode;
      if (fmCloneSuffix.trim()) payload.nameSuffix = fmCloneSuffix;
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

  const fldLoad = async () => {
    const versionId = toNum(fldVer);
    if (!versionId) return;
    await runSafe(async () => {
      const [d, formulasForVersion, activeEntities, reference] =
        await Promise.all([
          getTemplateVersionDetail(versionId),
          getTemplateVersionFormulas(versionId),
          getMappableEntities(true),
          getAccountingReference(),
        ]);

      setFieldMappings(asArray(d.fieldMappings));

      setMappingFormulaOptions(
        formulasForVersion.map((formula) => {
          const formulaId = String(formula.formulaId ?? "");
          const formulaCode = String(formula.code ?? "");
          const formulaName = String(formula.name ?? "");
          return {
            value: formulaId,
            label:
              `${formulaId} - ${formulaCode} ${formulaName ? `(${formulaName})` : ""}`.trim(),
          };
        }),
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
  };

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
    const versionId = ensureDraftVersion(fldVer, "field mapping create");
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
    const versionId = ensureDraftVersion(fldVer, "field mapping update");
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

  const fldDelete = async () => {
    const versionId = ensureDraftVersion(fldVer, "field mapping delete");
    if (!versionId) return;
    const mappingId = toNum(mappingForm.mappingId);
    if (!mappingId) return;
    await runSafe(async () => {
      await deleteFieldMapping(mappingId);
      setMappingForm(emptyMappingForm);
      log(`Deleted mapping ${mappingId}`, "ok");
      await fldLoad();
    });
  };

  const rdLoad = async () => {
    const versionId = toNum(rdVer);
    if (!versionId) return;
    await runSafe(async () => {
      const rows = await getRowDefinitions(versionId);
      setRowDefs(asArray(rows));
      log(`Loaded row definitions for v${versionId}`, "ok");
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
      taxType: String(r.taxType ?? ""),
      visibleFieldCodes: String(r.visibleFieldCodes ?? ""),
    });
  };

  const rdCreate = async () => {
    const versionId = ensureDraftVersion(rdVer, "row definition create");
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
      if (rowForm.taxType.trim()) payload.taxType = rowForm.taxType;
      if (rowForm.visibleFieldCodes.trim())
        payload.visibleFieldCodes = rowForm.visibleFieldCodes;
      await createRowDefinition(versionId, payload as never);
      log("Created row definition", "ok");
      await rdLoad();
    });
  };

  const rdUpdate = async () => {
    const versionId = ensureDraftVersion(rdVer, "row definition update");
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
        taxType: rowForm.taxType || null,
        visibleFieldCodes: rowForm.visibleFieldCodes || null,
      });
      log(`Updated row definition ${rowId}`, "ok");
      await rdLoad();
    });
  };

  const rdDelete = async () => {
    const versionId = ensureDraftVersion(rdVer, "row definition delete");
    if (!versionId) return;
    const rowId = toNum(rowForm.rowDefId);
    if (!rowId) return;
    await runSafe(async () => {
      await deleteRowDefinition(rowId);
      setRowForm(emptyRowForm);
      log(`Deleted row definition ${rowId}`, "ok");
      await rdLoad();
    });
  };

  const entLoad = async () => {
    await runSafe(async () => {
      const data = await getMappableEntities();
      setEntities(asArray(data));
      log("Loaded entities", "ok");
    });
  };

  const entSelect = async (entityId: number) => {
    await runSafe(async () => {
      setEfEntId(String(entityId));
      const d = await getMappableEntityDetail(entityId);
      setSelectedEntityName(String(d.entityCode ?? "-"));
      setEntityFields(asArray(d.fields));
      log(`Loaded fields for entity ${entityId}`, "ok");
    });
  };

  const entCreate = async () => {
    await runSafe(async () => {
      const payload: Record<string, unknown> = {
        entityCode: entCode,
        displayName: entName,
        category: entCat,
      };
      if (entDesc.trim()) payload.description = entDesc;
      await createMappableEntity(payload as never);
      log("Created entity", "ok");
      await entLoad();
    });
  };

  const entUpdate = async () => {
    const id = toNum(entEditId);
    if (!id) return;
    await runSafe(async () => {
      const payload: Record<string, unknown> = {};
      if (entName.trim()) payload.displayName = entName;
      if (entDesc.trim()) payload.description = entDesc;
      await updateMappableEntity(id, payload);
      log(`Updated entity ${id}`, "ok");
      await entLoad();
    });
  };

  const efCreate = async () => {
    const entityId = toNum(efEntId);
    if (!entityId) return;
    await runSafe(async () => {
      const payload: Record<string, unknown> = {
        fieldCode: efCode,
        displayName: efName,
        dataType: efDtype,
        allowedAggregations: efAggs,
      };
      if (efDesc.trim()) payload.description = efDesc;
      await createMappableField(entityId, payload as never);
      log("Created field", "ok");
      await entSelect(entityId);
    });
  };

  const efUpdate = async () => {
    const fieldId = toNum(efEditId);
    const entityId = toNum(efEntId);
    if (!fieldId || !entityId) return;
    await runSafe(async () => {
      const payload: Record<string, unknown> = {};
      if (efName.trim()) payload.displayName = efName;
      if (efDesc.trim()) payload.description = efDesc;
      if (efDtype.trim()) payload.dataType = efDtype;
      if (efAggs.trim()) payload.allowedAggregations = efAggs;
      await updateMappableField(fieldId, payload as never);
      log(`Updated field ${fieldId}`, "ok");
      await entSelect(entityId);
    });
  };

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
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          {deepLinkState.message ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
              <Badge
                variant="secondary"
                className={
                  deepLinkState.confirmed
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }
              >
                {deepLinkState.confirmed ? "Deep-link OK" : "Deep-link check"}
              </Badge>
              <span>{deepLinkState.message}</span>
            </div>
          ) : null}
        </div>
      </div>

      {error ? (
        <Card className="border border-red-200 bg-red-50 shadow-sm">
          <CardContent className="flex items-center gap-2 p-4 text-sm text-red-700">
            <AlertCircle className="h-4 w-4" />
            {error}
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardContent className="p-3">
          <nav aria-label="Admin accounting sections" className="space-y-3">
            <section aria-label="Core management" className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Core Management
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

            <section aria-label="Support tools" className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Support Tools
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
          </nav>
        </CardContent>
      </Card>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Templates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(overview?.taxRulesets ?? []).length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {(overview?.taxRulesets ?? []).map((r) => (
                    <span
                      key={r.rulesetId}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#23C4C1]/30 bg-[#23C4C1]/8 px-3 py-1 text-xs font-medium text-[#15918f]"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Áp dụng theo: {r.name}
                      <span className="ml-1 font-mono text-[10px] text-gray-400">
                        ({r.code})
                      </span>
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="max-h-72 overflow-auto rounded-xl border border-gray-200 bg-white">
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
                          <td className="px-3 py-2">{t.name}</td>
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
            <CardHeader>
              <CardTitle>Business Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">Code</th>
                      <th className="px-3 py-2">Tên ngành</th>
                      <th className="px-3 py-2">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {businessTypes.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-gray-500" colSpan={3}>
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
              <CardTitle>Formulas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Mã Công Thức</th>
                      <th className="px-3 py-2">Tên</th>
                      <th className="px-3 py-2">Loại</th>
                      <th className="px-3 py-2">Hoạt động</th>
                      <th className="px-3 py-2"></th>
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
                            Mở <ArrowRight className="h-3 w-3" />
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

      {activeTab === "version" ? (
        <VersionFlowTab
          tvId={tvId}
          tvLabel={tvLabel}
          tvEffective={tvEffective}
          tvNotes={tvNotes}
          tvResult={tvResult}
          versionOptions={versionOptions}
          setTvId={setTvId}
          setTvLabel={setTvLabel}
          setTvEffective={setTvEffective}
          setTvNotes={setTvNotes}
          onDetail={(rawId) => void tvDetail(rawId)}
          onFull={(rawId) => void tvFull(rawId)}
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
          fmJsonView={fmJsonView}
          formulaOptions={formulaOptions}
          setFmId={setFmId}
          setFmName={setFmName}
          setFmDesc={setFmDesc}
          setFmExprJson={setFmExprJson}
          setFmFType={setFmFType}
          setFmIsActive={setFmIsActive}
          setFmCloneCode={setFmCloneCode}
          setFmCloneSuffix={setFmCloneSuffix}
          onDetail={() => void fmDetail()}
          onClone={() => void fmClone()}
          onFormat={fmFormat}
          onValidate={fmValidate}
          onUpdate={() => void fmUpdate()}
        />
      ) : null}

      {activeTab === "mappings" ? (
        <MappingTab
          fldVer={fldVer}
          fieldMappings={fieldMappings}
          mappingForm={mappingForm}
          fieldTypeOptions={mappingFieldTypeOptions}
          sourceTypeOptions={mappingSourceTypeOptions}
          aggregationOptions={mappingAggregationOptions}
          formulaOptions={mappingFormulaOptions}
          entityOptions={mappingEntityOptions}
          entityFieldOptions={mappingEntityFieldOptions}
          setFldVer={setFldVer}
          setMappingForm={setMappingForm}
          onLoad={() => void fldLoad()}
          onPick={fldPick}
          onCreate={() => void fldCreate()}
          onUpdate={() => void fldUpdate()}
          onDelete={() => void fldDelete()}
        />
      ) : null}

      {activeTab === "rowdefs" ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Row Definitions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  value={rdVer}
                  onChange={(e) => setRdVer(e.target.value)}
                  placeholder="Template Version ID"
                  className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <Button
                  size="sm"
                  className="bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                  onClick={() => void rdLoad()}
                >
                  Load
                </Button>
              </div>
              <div className="max-h-130 overflow-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Label</th>
                      <th className="px-3 py-2">Position</th>
                      <th className="px-3 py-2">Sort</th>
                      <th className="px-3 py-2">Formula</th>
                      <th className="px-3 py-2">Tax</th>
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
                          {String(r.formulaId ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(r.taxType ?? "-")}
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
              <CardTitle>Row Editor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <input
                value={rowForm.rowDefId}
                readOnly
                placeholder="ID"
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              />
              <input
                value={rowForm.rowLabel}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, rowLabel: e.target.value }))
                }
                placeholder="Row Label"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <select
                value={rowForm.rowType}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, rowType: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option>data_placeholder</option>
                <option>industry_header</option>
                <option>subtotal</option>
                <option>tax_line</option>
                <option>grand_total</option>
                <option>section_header</option>
                <option>balance_row</option>
                <option>opening_balance</option>
                <option>closing_balance</option>
              </select>
              <select
                value={rowForm.position}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, position: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option>per_group</option>
                <option>end_of_book</option>
                <option>per_section</option>
              </select>
              <input
                value={rowForm.sortOrder}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, sortOrder: e.target.value }))
                }
                placeholder="Sort"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <input
                value={rowForm.formulaId}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, formulaId: e.target.value }))
                }
                placeholder="Formula ID"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <select
                value={rowForm.sectionType}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, sectionType: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Section Type</option>
                <option>industry_group</option>
                <option>revenue_section</option>
                <option>cost_section</option>
                <option>tax_section</option>
                <option>summary_section</option>
              </select>
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
              <input
                value={rowForm.groupByField}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, groupByField: e.target.value }))
                }
                placeholder="GroupBy Field"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <select
                value={rowForm.taxType}
                onChange={(e) =>
                  setRowForm((p) => ({ ...p, taxType: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              >
                <option value="">Tax Type</option>
                <option>vat</option>
                <option>pit</option>
              </select>
              <input
                value={rowForm.visibleFieldCodes}
                onChange={(e) =>
                  setRowForm((p) => ({
                    ...p,
                    visibleFieldCodes: e.target.value,
                  }))
                }
                placeholder="Visible Fields JSON"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  size="sm"
                  className="bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                  onClick={() => void rdCreate()}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void rdUpdate()}
                >
                  Update
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="col-span-2"
                  onClick={() => void rdDelete()}
                >
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {activeTab === "entities" ? (
        <div className="space-y-6">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => void entLoad()}>
              Load Entities
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Entities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-sm">
                    <tbody>
                      {entities.map((e, index) => (
                        <tr
                          key={String(e.entityId ?? `entity-${index}`)}
                          className="cursor-pointer border-t hover:bg-gray-50/70"
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
                            {Boolean(e.isActive) ? "Yes" : "No"}
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
                <CardTitle>Fields of {selectedEntityName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 overflow-auto rounded-xl border border-gray-200 bg-white">
                  <table className="w-full text-sm">
                    <tbody>
                      {entityFields.map((f, index) => (
                        <tr
                          key={String(f.fieldId ?? `field-${index}`)}
                          className="cursor-pointer border-t hover:bg-gray-50/70"
                          onClick={() => {
                            setEfEditId(String(f.fieldId ?? ""));
                            setEfEntId(String(f.entityId ?? ""));
                            setEfCode(String(f.fieldCode ?? ""));
                            setEfName(String(f.displayName ?? ""));
                            setEfDtype(String(f.dataType ?? "decimal"));
                            setEfAggs(String(f.allowedAggregations ?? ""));
                            setEfDesc(String(f.description ?? ""));
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
                          <td className="px-3 py-2">
                            {String(f.dataType ?? "-")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Entity Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  value={entEditId}
                  onChange={(e) => setEntEditId(e.target.value)}
                  placeholder="Entity ID"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={entCode}
                  onChange={(e) => setEntCode(e.target.value)}
                  placeholder="Entity Code"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={entName}
                  onChange={(e) => setEntName(e.target.value)}
                  placeholder="Display Name"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <select
                  value={entCat}
                  onChange={(e) => setEntCat(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option>revenue</option>
                  <option>cost</option>
                  <option>tax</option>
                  <option>asset</option>
                </select>
                <input
                  value={entDesc}
                  onChange={(e) => setEntDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void entCreate()}
                  >
                    Create
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void entUpdate()}
                  >
                    Update
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Field Editor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <input
                  value={efEditId}
                  onChange={(e) => setEfEditId(e.target.value)}
                  placeholder="Field ID"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={efEntId}
                  onChange={(e) => setEfEntId(e.target.value)}
                  placeholder="Entity ID"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={efCode}
                  onChange={(e) => setEfCode(e.target.value)}
                  placeholder="Field Code"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={efName}
                  onChange={(e) => setEfName(e.target.value)}
                  placeholder="Display Name"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <select
                  value={efDtype}
                  onChange={(e) => setEfDtype(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <option>decimal</option>
                  <option>string</option>
                  <option>date</option>
                  <option>long</option>
                  <option>guid</option>
                </select>
                <input
                  value={efAggs}
                  onChange={(e) => setEfAggs(e.target.value)}
                  placeholder="Allowed Aggregations JSON"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  value={efDesc}
                  onChange={(e) => setEfDesc(e.target.value)}
                  placeholder="Description"
                  className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    className="bg-[#23C4C1] text-white hover:bg-[#1ea8a6]"
                    onClick={() => void efCreate()}
                  >
                    Create Field
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => void efUpdate()}
                  >
                    Update Field
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
            <CardTitle>Compare Engine</CardTitle>
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
              Run Compare
            </Button>
            <div className="max-h-80 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-700">
              <JsonTree
                value={compareResult ?? { note: "Run compare to view output" }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "trace" ? (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Logic Trace</CardTitle>
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
            <div className="max-h-80 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-700">
              <JsonTree
                value={traceResult ?? { note: "Run trace to view execution" }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {activeTab === "reference" ? (
        <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Enums Reference</CardTitle>
            <Button variant="outline" size="sm" onClick={() => void loadRef()}>
              Load
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-130 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-700">
              <JsonTree
                value={
                  Object.keys(refData).length ? refData : { note: "Click Load" }
                }
              />
            </div>
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
              Load
            </Button>
          </CardHeader>
          <CardContent>
            <div className="max-h-130 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-700">
              <JsonTree
                value={schemas.length ? schemas : { note: "Click Load" }}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>API Console</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-52 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-700">
            {logs.length === 0 ? (
              <p className="text-gray-400">No logs yet.</p>
            ) : null}
            {logs.map((entry) => (
              <div
                key={entry.id}
                className={
                  entry.type === "error"
                    ? "text-rose-600"
                    : entry.type === "ok"
                      ? "text-emerald-700"
                      : "text-sky-700"
                }
              >
                {entry.message}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
