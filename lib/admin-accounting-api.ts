import { authFetch } from "@/lib/auth/tokenManager";
import type { AccountingOverviewResponse } from "@/lib/types/adminAccounting";

type ApiEnvelope<T> = {
  success: boolean;
  messageCode?: string;
  message?: string;
  data: T;
};

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080"
).replace(/\/$/, "");

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers ?? {});
  headers.set("Content-Type", "application/json");

  const res = await authFetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const body = (await res.json()) as ApiEnvelope<T>;

  if (!res.ok || !body.success) {
    throw new Error(body.message || `Request failed (${res.status})`);
  }

  return body.data;
}

export async function getAccountingOverview(): Promise<AccountingOverviewResponse> {
  return request<AccountingOverviewResponse>("/api/admin/accounting/overview");
}

export interface TemplateVersionPatchRequest {
  versionLabel?: string;
  effectiveFrom?: string;
  changeNotes?: string;
}

export interface CreateTemplateRequest {
  templateCode: string;
  name: string;
  description?: string;
  applicableGroups: number[];
  applicableMethods?: string[];
  dataSourceType:
    | "revenues"
    | "revenue_cost"
    | "gl_entries"
    | "stock_movements";
  initialVersionLabel?: string;
}

export interface CreateTemplateVersionRequest {
  versionLabel: string;
  effectiveFrom?: string;
  changeNotes?: string;
}

export interface FormulaPatchRequest {
  name?: string;
  description?: string;
  formulaType?: string;
  expressionJson?: string;
  isActive?: boolean;
}

export interface FormulaCloneRequest {
  newCode?: string;
  nameSuffix?: string;
}

export interface FormulaCreateRequest {
  code: string;
  name: string;
  description?: string;
  formulaType: string;
  expressionJson: string;
  resultDataType?: string;
  roundingMode?: string;
  roundingPrecision?: number;
}

export interface FieldMappingCreateRequest {
  fieldCode: string;
  fieldLabel?: string;
  fieldType: string;
  sourceType: string;
  sourceEntityId?: number;
  sourceFieldId?: number;
  filterJson?: string;
  aggregationType?: string;
  formulaId?: number;
  formulaExpression?: string;
  sortOrder: number;
  isRequired: boolean;
}

export interface FieldMappingPatchRequest {
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
}

export interface RowDefinitionCreateRequest {
  rowType: string;
  rowLabel: string | null;
  position: string;
  sortOrder: number;
  sectionType?: string;
  sectionFilterValue?: string;
  groupByField?: string;
  formulaId?: number;
  taxType?: string;
  visibleFieldCodes?: string;
}

export interface RowDefinitionPatchRequest {
  rowType: string;
  rowLabel: string | null;
  position: string;
  sortOrder: number;
  sectionType: string | null;
  sectionFilterValue: string | null;
  groupByField: string | null;
  formulaId: number | null;
  taxType: string | null;
  visibleFieldCodes: string | null;
}

export interface TraceRequest {
  formulaId: number;
  businessLocationId: number;
  periodId: number;
  rulesetId: number;
  businessTypeIds: string[];
}

export interface CompareRequest {
  businessLocationId: number;
  periodId: number;
  draftVersionId: number;
  activeVersionId: number | null;
  groupNumber: number;
  taxMethod: string;
  rulesetId: number;
  batchSize: number;
  businessTypeIds: string[];
}

export interface PreviewRequest {
  businessLocationId: number;
  periodId: number;
  templateVersionId: number;
  groupNumber: number;
  taxMethod: string;
  rulesetId: number;
  businessTypeIds: string[];
  batchSize: number;
}

export interface MappableEntityCreateRequest {
  entityCode: string;
  displayName: string;
  category: string;
  description?: string;
}

export interface MappableEntityPatchRequest {
  entityCode?: string;
  displayName?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface MappableFieldCreateRequest {
  fieldCode: string;
  displayName: string;
  dataType: string;
  allowedAggregations: string;
  description?: string;
}

export interface MappableFieldPatchRequest {
  fieldCode?: string;
  displayName?: string;
  description?: string;
  dataType?: string;
  allowedAggregations?: string;
  isActive?: boolean;
}

export interface BusinessTypeTaxRateDto {
  rateId: number;
  taxType: string;
  taxRate: number;
  description?: string;
}

export interface BusinessTypeWithRatesDto {
  businessTypeId: string;
  code: string;
  name: string;
  description?: string;
  status: string;
  taxRates: BusinessTypeTaxRateDto[];
}

export interface BusinessTypeMetadataPatchRequest {
  name: string;
  description: string;
  status: string;
}

export interface BusinessTypeRateReplaceItem {
  taxType: string;
  taxRate: number;
  description?: string;
}

export interface BusinessTypeTaxRatesReplaceRequest {
  rates: BusinessTypeRateReplaceItem[];
}

export async function getTemplateVersionDetail(
  templateVersionId: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/template-versions/${templateVersionId}`,
  );
}

export async function createTemplate(
  payload: CreateTemplateRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>("/api/admin/accounting/templates", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createTemplateVersion(
  templateId: number,
  payload: CreateTemplateVersionRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/templates/${templateId}/versions`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export async function getTemplateVersionFullStructure(
  templateVersionId: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/template-versions/${templateVersionId}/full-structure`,
  );
}

export async function getTemplateVersionFormulas(
  templateVersionId: number,
): Promise<Record<string, unknown>[]> {
  return request<Record<string, unknown>[]>(
    `/api/admin/accounting/template-versions/${templateVersionId}/formulas`,
  );
}

export async function cloneTemplateVersion(
  templateVersionId: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/template-versions/${templateVersionId}/clone`,
    { method: "POST" },
  );
}

export async function updateTemplateVersion(
  templateVersionId: number,
  payload: TemplateVersionPatchRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/template-versions/${templateVersionId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function activateTemplateVersion(
  templateVersionId: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/template-versions/${templateVersionId}/activate`,
    { method: "POST" },
  );
}

export async function deactivateTemplateVersion(
  templateVersionId: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/template-versions/${templateVersionId}/deactivate`,
    { method: "POST" },
  );
}

export async function deleteTemplateVersion(
  templateVersionId: number,
): Promise<void> {
  await request<unknown>(
    `/api/admin/accounting/template-versions/${templateVersionId}`,
    {
      method: "DELETE",
    },
  );
}

export async function getFormulaDetail(
  formulaId: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/formulas/${formulaId}`,
  );
}

export async function updateFormulaTesting(
  formulaId: number,
  payload: FormulaPatchRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/formulas/${formulaId}/testing`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function cloneFormula(
  formulaId: number,
  payload: FormulaCloneRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/formulas/${formulaId}/clone`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function createFormula(
  payload: FormulaCreateRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>("/api/admin/accounting/formulas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function createFieldMapping(
  templateVersionId: number,
  payload: FieldMappingCreateRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/template-versions/${templateVersionId}/field-mappings`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function updateFieldMappingForTesting(
  mappingId: number,
  payload: FieldMappingPatchRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/field-mappings/${mappingId}/testing`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function updateFieldMapping(
  mappingId: number,
  payload: FieldMappingPatchRequest,
): Promise<Record<string, unknown>> {
  return updateFieldMappingForTesting(mappingId, payload);
}

export async function deleteFieldMapping(mappingId: number): Promise<void> {
  await request<unknown>(`/api/admin/accounting/field-mappings/${mappingId}`, {
    method: "DELETE",
  });
}

export async function getRowDefinitions(
  templateVersionId: number,
): Promise<Record<string, unknown>[]> {
  return request<Record<string, unknown>[]>(
    `/api/admin/accounting/template-versions/${templateVersionId}/row-definitions`,
  );
}

export async function createRowDefinition(
  templateVersionId: number,
  payload: RowDefinitionCreateRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/template-versions/${templateVersionId}/row-definitions`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function updateRowDefinition(
  rowDefId: number,
  payload: RowDefinitionPatchRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/row-definitions/${rowDefId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function deleteRowDefinition(rowDefId: number): Promise<void> {
  await request<unknown>(`/api/admin/accounting/row-definitions/${rowDefId}`, {
    method: "DELETE",
  });
}

export async function getMappableEntities(
  activeOnly = false,
): Promise<Record<string, unknown>[]> {
  const params = activeOnly ? "?active=true" : "";
  return request<Record<string, unknown>[]>(
    `/api/admin/accounting/mappable-entities${params}`,
  );
}

export async function getBusinessTypesWithRates(
  rulesetId: number,
): Promise<BusinessTypeWithRatesDto[]> {
  return request<BusinessTypeWithRatesDto[]>(
    `/api/admin/accounting/business-types?rulesetId=${rulesetId}`,
  );
}

export async function updateBusinessTypeMetadata(
  businessTypeId: string,
  payload: BusinessTypeMetadataPatchRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/business-types/${businessTypeId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function replaceBusinessTypeTaxRates(
  rulesetId: number,
  businessTypeId: string,
  payload: BusinessTypeTaxRatesReplaceRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/rulesets/${rulesetId}/business-types/${businessTypeId}/tax-rates`,
    { method: "PUT", body: JSON.stringify(payload) },
  );
}

export async function getMappableEntityDetail(
  entityId: number,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/mappable-entities/${entityId}`,
  );
}

export async function createMappableEntity(
  payload: MappableEntityCreateRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    "/api/admin/accounting/mappable-entities",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function updateMappableEntity(
  entityId: number,
  payload: MappableEntityPatchRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/mappable-entities/${entityId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function createMappableField(
  entityId: number,
  payload: MappableFieldCreateRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/mappable-entities/${entityId}/fields`,
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function updateMappableField(
  fieldId: number,
  payload: MappableFieldPatchRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    `/api/admin/accounting/mappable-fields/${fieldId}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export async function getAccountingReference(): Promise<
  Record<string, unknown>
> {
  return request<Record<string, unknown>>("/api/admin/accounting/reference");
}

export async function getFormulaNodeSchemas(): Promise<
  Record<string, unknown>[]
> {
  return request<Record<string, unknown>[]>(
    "/api/admin/accounting/reference/formula-node-schemas",
  );
}

export async function runAccountingCompare(
  payload: CompareRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    "/api/admin/accounting/testing/compare",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function runAccountingTrace(
  payload: TraceRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    "/api/admin/accounting/testing/trace",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export async function runAccountingPreview(
  payload: PreviewRequest,
): Promise<Record<string, unknown>> {
  return request<Record<string, unknown>>(
    "/api/admin/accounting/testing/preview",
    { method: "POST", body: JSON.stringify(payload) },
  );
}
