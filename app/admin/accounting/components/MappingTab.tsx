import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { MappingFormState } from "./types";

interface MappingTabProps {
  fldVer: string;
  versionOptions: Array<{ value: string; label: string }>;
  fieldMappings: Array<Record<string, unknown>>;
  mappingForm: MappingFormState;
  fieldTypeOptions: Array<{ value: string; label: string }>;
  sourceTypeOptions: Array<{ value: string; label: string }>;
  aggregationOptions: Array<{ value: string; label: string }>;
  formulaOptions: Array<{ value: string; label: string }>;
  entityOptions: Array<{ value: string; label: string }>;
  entityFieldOptions: Array<{ value: string; label: string }>;
  onVersionChange: (value: string) => void;
  setMappingForm: (next: MappingFormState) => void;
  onPick: (mapping: Record<string, unknown>) => void;
  onCreate: () => void;
  onUpdate: () => void;
  onDelete: (mappingId?: string) => void;
}

const primaryBtnClass = "bg-[#23C4C1] text-white hover:bg-[#1ea8a6]";

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

export default function MappingTab(props: MappingTabProps) {
  const [mappingActionMenuId, setMappingActionMenuId] = useState("");
  const isUpdateMode = Boolean(props.mappingForm.mappingId.trim());
  const isFormulaSource =
    props.mappingForm.sourceType.trim().toLowerCase() === "formula";

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Field Mappings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            <select
              value={props.fldVer}
              onChange={(e) => props.onVersionChange(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Chọn Template Version</option>
              {props.versionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">ID</th>
                  <th className="px-3 py-2">Mã</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Loại</th>
                  <th className="px-3 py-2">Nguồn</th>
                  <th className="px-3 py-2">Entity</th>
                  <th className="px-3 py-2">Field</th>
                  <th className="px-3 py-2">Sort</th>
                  <th className="px-3 py-2 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {props.fieldMappings.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-gray-500" colSpan={9}>
                      Chưa có field mapping.
                    </td>
                  </tr>
                ) : (
                  props.fieldMappings.map((m, index) => {
                    const mappingId = String(m.mappingId ?? "");
                    const isSelected =
                      mappingId === props.mappingForm.mappingId;
                    return (
                      <tr
                        key={mappingId || `mapping-${index}`}
                        className={`cursor-pointer border-t transition-colors ${
                          isSelected
                            ? "bg-[#23C4C1]/10"
                            : "hover:bg-[#23C4C1]/5"
                        }`}
                        onClick={() => props.onPick(m)}
                      >
                        <td className="px-3 py-2">
                          {String(m.mappingId ?? "-")}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs">
                          {String(m.fieldCode ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(m.fieldLabel ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(m.fieldType ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(m.sourceType ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(m.sourceEntityId ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(m.sourceFieldId ?? "-")}
                        </td>
                        <td className="px-3 py-2">
                          {String(m.sortOrder ?? "-")}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMappingActionMenuId((prev) =>
                                  prev === mappingId ? "" : mappingId,
                                );
                              }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                              aria-label="Mapping actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                            {mappingActionMenuId === mappingId ? (
                              <div className="absolute right-0 top-9 z-10 w-28 rounded-md border border-gray-200 bg-white p-1 shadow-lg">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    props.onDelete(mappingId);
                                    setMappingActionMenuId("");
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
          <div className="flex items-center justify-between gap-2">
            <CardTitle>Chỉnh sửa</CardTitle>
            <Button
              size="sm"
              variant="link"
              onClick={() => {
                if (isUpdateMode) {
                  props.setMappingForm(emptyMappingForm);
                  setMappingActionMenuId("");
                  return;
                }

                const firstMapping = props.fieldMappings[0];
                if (firstMapping) {
                  props.onPick(firstMapping);
                }
                setMappingActionMenuId("");
              }}
              className=" text-[#23C4C1] hover:text-[#1ea8a6]"
            >
              {isUpdateMode ? "Tạo mới" : "Cập nhật"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              ID
            </label>
            <input
              value={props.mappingForm.mappingId}
              readOnly
              placeholder="ID"
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Mã cột
            </label>
            <input
              value={props.mappingForm.fieldCode}
              onChange={(e) =>
                props.setMappingForm({
                  ...props.mappingForm,
                  fieldCode: e.target.value,
                })
              }
              readOnly={Boolean(props.mappingForm.mappingId)}
              placeholder="Field Code"
              className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm ${
                props.mappingForm.mappingId ? "bg-gray-50" : "bg-white"
              }`}
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Nhãn hiển thị
            </label>
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
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Kiểu dữ liệu
            </label>
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
              <option value="">Chọn kiểu dữ liệu</option>
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
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Nguồn dữ liệu
            </label>
            <select
              value={props.mappingForm.sourceType}
              onChange={(e) => {
                const nextSourceType = e.target.value;
                const isNextFormula =
                  nextSourceType.trim().toLowerCase() === "formula";

                props.setMappingForm({
                  ...props.mappingForm,
                  sourceType: nextSourceType,
                  sourceEntityId: isNextFormula
                    ? ""
                    : props.mappingForm.sourceEntityId,
                  sourceFieldId: isNextFormula
                    ? ""
                    : props.mappingForm.sourceFieldId,
                });
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Chọn nguồn dữ liệu</option>
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
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-gray-600">
                Entity ID
              </label>
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
                disabled={isFormulaSource}
              >
                <option value="">
                  {isFormulaSource
                    ? "formula không dùng entity"
                    : "Chọn entity"}
                </option>
                {props.entityOptions.map((option) => (
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
                value={props.mappingForm.sourceFieldId}
                onChange={(e) =>
                  props.setMappingForm({
                    ...props.mappingForm,
                    sourceFieldId: e.target.value,
                  })
                }
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                disabled={isFormulaSource || !props.mappingForm.sourceEntityId}
              >
                <option value="">
                  {isFormulaSource ? "formula không dùng field" : "Chọn field"}
                </option>
                {props.entityFieldOptions.map((option) => (
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
              value={props.mappingForm.formulaId}
              onChange={(e) =>
                props.setMappingForm({
                  ...props.mappingForm,
                  formulaId: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Chọn formula</option>
              {props.formulaOptions.map((option) => (
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
              value={props.mappingForm.aggregationType}
              onChange={(e) =>
                props.setMappingForm({
                  ...props.mappingForm,
                  aggregationType: e.target.value,
                })
              }
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            >
              <option value="">Chọn kiểu tổng hợp</option>
              {props.aggregationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Công thức tính toán
            </label>
            <input
              value={props.mappingForm.formulaExpression}
              onChange={(e) =>
                props.setMappingForm({
                  ...props.mappingForm,
                  formulaExpression: e.target.value,
                })
              }
              placeholder="Công thức tính toán, dùng khi source type là formula"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Thứ tự sắp xếp
            </label>
            <input
              value={props.mappingForm.sortOrder}
              onChange={(e) => {
                const numericOnly = e.target.value.replace(/\D/g, "");
                props.setMappingForm({
                  ...props.mappingForm,
                  sortOrder: numericOnly,
                });
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Sort"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-600">
              Bắt buộc
            </label>
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
              <option value="false">Không </option>
              <option value="true">Có</option>
            </select>
          </div>
          {!isUpdateMode ? (
            <div className="pt-2">
              <Button
                size="sm"
                className={`w-full ${primaryBtnClass}`}
                onClick={props.onCreate}
              >
                Tạo mới
              </Button>
            </div>
          ) : (
            <div className="pt-2">
              <Button
                size="sm"
                className={`w-full ${primaryBtnClass}`}
                onClick={props.onUpdate}
                disabled={!props.mappingForm.mappingId}
              >
                Cập nhật
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
