import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MappingFormState } from "./types";

interface MappingTabProps {
  fldVer: string;
  fieldMappings: Array<Record<string, unknown>>;
  mappingForm: MappingFormState;
  fieldTypeOptions: Array<{ value: string; label: string }>;
  sourceTypeOptions: Array<{ value: string; label: string }>;
  aggregationOptions: Array<{ value: string; label: string }>;
  formulaOptions: Array<{ value: string; label: string }>;
  entityOptions: Array<{ value: string; label: string }>;
  entityFieldOptions: Array<{ value: string; label: string }>;
  setFldVer: (value: string) => void;
  setMappingForm: (next: MappingFormState) => void;
  onLoad: () => void;
  onPick: (mapping: Record<string, unknown>) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: () => void;
}

const primaryBtnClass = "bg-[#23C4C1] text-white hover:bg-[#1ea8a6]";

export default function MappingTab(props: MappingTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Field Mappings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              value={props.fldVer}
              onChange={(e) => props.setFldVer(e.target.value)}
              placeholder="Template Version ID"
              className="w-40 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
            <Button
              size="sm"
              className={primaryBtnClass}
              onClick={props.onLoad}
            >
              Load
            </Button>
          </div>
          <div className="max-h-130 overflow-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Code</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2">Sort</th>
                </tr>
              </thead>
              <tbody>
                {props.fieldMappings.map((m, index) => (
                  <tr
                    key={String(m.mappingId ?? `mapping-${index}`)}
                    className="cursor-pointer border-t hover:bg-[#23C4C1]/10"
                    onClick={() => props.onPick(m)}
                  >
                    <td className="px-3 py-2">{String(m.mappingId ?? "-")}</td>
                    <td className="px-3 py-2 font-mono text-xs">
                      {String(m.fieldCode ?? "-")}
                    </td>
                    <td className="px-3 py-2">{String(m.fieldLabel ?? "-")}</td>
                    <td className="px-3 py-2">{String(m.fieldType ?? "-")}</td>
                    <td className="px-3 py-2">{String(m.sourceType ?? "-")}</td>
                    <td className="px-3 py-2">
                      {String(m.sourceEntityId ?? "-")}
                    </td>
                    <td className="px-3 py-2">
                      {String(m.sourceFieldId ?? "-")}
                    </td>
                    <td className="px-3 py-2">{String(m.sortOrder ?? "-")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Mapping Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <input
            value={props.mappingForm.mappingId}
            readOnly
            placeholder="ID"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
          />
          <input
            value={props.mappingForm.fieldCode}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                fieldCode: e.target.value,
              })
            }
            placeholder="Field Code"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <input
            value={props.mappingForm.fieldLabel}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                fieldLabel: e.target.value,
              })
            }
            placeholder="Field Label"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <select
            value={props.mappingForm.fieldType}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                fieldType: e.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {props.fieldTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {!props.fieldTypeOptions.some(
              (option) => option.value === props.mappingForm.fieldType,
            ) && props.mappingForm.fieldType ? (
              <option value={props.mappingForm.fieldType}>
                {props.mappingForm.fieldType}
              </option>
            ) : null}
          </select>
          <select
            value={props.mappingForm.sourceType}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                sourceType: e.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            {props.sourceTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {!props.sourceTypeOptions.some(
              (option) => option.value === props.mappingForm.sourceType,
            ) && props.mappingForm.sourceType ? (
              <option value={props.mappingForm.sourceType}>
                {props.mappingForm.sourceType}
              </option>
            ) : null}
          </select>
          <select
            value={props.mappingForm.sourceEntityId}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                sourceEntityId: e.target.value,
                sourceFieldId: "",
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Source Entity</option>
            {props.entityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={props.mappingForm.sourceFieldId}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                sourceFieldId: e.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            disabled={!props.mappingForm.sourceEntityId}
          >
            <option value="">Source Field</option>
            {props.entityFieldOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={props.mappingForm.filterJson}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                filterJson: e.target.value,
              })
            }
            placeholder="Filter JSON"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <select
            value={props.mappingForm.aggregationType}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                aggregationType: e.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Aggregation</option>
            {props.aggregationOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={props.mappingForm.formulaId}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                formulaId: e.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Formula</option>
            {props.formulaOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <input
            value={props.mappingForm.formulaExpression}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                formulaExpression: e.target.value,
              })
            }
            placeholder="Formula Expression"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <input
            value={props.mappingForm.sortOrder}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                sortOrder: e.target.value,
              })
            }
            placeholder="Sort"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <select
            value={props.mappingForm.isRequired}
            onChange={(e) =>
              props.setMappingForm({
                ...props.mappingForm,
                isRequired: e.target.value,
              })
            }
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="false">Required: No</option>
            <option value="true">Required: Yes</option>
          </select>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button
              size="sm"
              className={primaryBtnClass}
              onClick={props.onCreate}
            >
              Create
            </Button>
            <Button size="sm" variant="secondary" onClick={props.onUpdate}>
              Update
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="col-span-2"
              onClick={props.onDelete}
            >
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
