export interface AccountingVersionSummary {
  templateVersionId: number;
  versionLabel: string;
  isActive: boolean;
  mappingCount: number;
  effectiveFrom: string;
}

export interface AccountingTemplateSummary {
  templateId: number;
  templateCode: string;
  name: string;
  isActive: boolean;
  versions: AccountingVersionSummary[];
}

export interface AccountingTaxRulesetSummary {
  rulesetId: number;
  code: string;
  name: string;
  isActive: boolean;
  groupRuleCount: number;
  industryRateCount: number;
}

export interface AccountingFormulaSummary {
  formulaId: number;
  code: string;
  name: string;
  formulaType: string;
  isActive: boolean;
}

export interface AccountingBusinessTypeSummary {
  businessTypeId: string;
  code: string;
  name: string;
}

export interface AccountingOverviewResponse {
  templates: AccountingTemplateSummary[];
  taxRulesets: AccountingTaxRulesetSummary[];
  formulas: AccountingFormulaSummary[];
  businessTypes: AccountingBusinessTypeSummary[];
}

export interface AccountingTemplateColumnSummary {
  fieldCode: string;
  label: string;
  fieldType?: string;
  exportColumn?: string;
}

export interface AccountingTemplateFullStructureResponse {
  templateVersionId: number;
  templateCode: string;
  templateName: string;
  versionLabel: string;
  isActive: boolean;
  fieldMappings: Array<Record<string, unknown>>;
  rowDefinitions: Array<Record<string, unknown>>;
  renderPreview: string;
}

export type AccountingBookRow = Record<string, unknown>;
