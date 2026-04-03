export interface MappingFormState {
  mappingId: string;
  fieldCode: string;
  fieldLabel: string;
  fieldType: string;
  sourceType: string;
  sourceEntityId: string;
  sourceFieldId: string;
  filterJson: string;
  aggregationType: string;
  formulaId: string;
  formulaExpression: string;
  sortOrder: string;
  isRequired: string;
}

export interface VersionOption {
  label: string;
  value: string;
}

export interface FormulaOption {
  label: string;
  value: string;
}
