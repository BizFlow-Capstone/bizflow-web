import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import JsonTree from "./JsonTree";
import type { FormulaOption } from "./types";

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
  fmJsonView: unknown;
  formulaOptions: FormulaOption[];
  setFmId: (value: string) => void;
  setFmName: (value: string) => void;
  setFmDesc: (value: string) => void;
  setFmExprJson: (value: string) => void;
  setFmFType: (value: string) => void;
  setFmIsActive: (value: string) => void;
  setFmCloneCode: (value: string) => void;
  setFmCloneSuffix: (value: string) => void;
  onDetail: () => void;
  onClone: () => void;
  onFormat: () => void;
  onValidate: () => void;
  onUpdate: () => void;
}

const primaryBtnClass = "bg-[#23C4C1] text-white hover:bg-[#1ea8a6]";

export default function FormulaTab(props: FormulaTabProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
      <Card className="xl:col-span-1 rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Formula Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            value={props.fmId}
            onChange={(e) => props.setFmId(e.target.value)}
            placeholder="Formula ID"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <select
            value={props.fmId}
            onChange={(e) => props.setFmId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Quick Lookup</option>
            {props.formulaOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={props.onDetail}>
              Load Details
            </Button>
            <Button size="sm" variant="outline" onClick={props.onClone}>
              Clone as New
            </Button>
          </div>
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
            <div>
              Code: <span className="font-mono">{props.fmCode}</span>
            </div>
            <div>Type: {props.fmType}</div>
            <div>Status: {props.fmActive}</div>
          </div>
          <input
            value={props.fmName}
            onChange={(e) => props.setFmName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <input
            value={props.fmDesc}
            onChange={(e) => props.setFmDesc(e.target.value)}
            placeholder="Description"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <select
            value={props.fmFType}
            onChange={(e) => props.setFmFType(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Formula Type</option>
            <option value="aggregation">aggregation</option>
            <option value="cell_ref">cell_ref</option>
            <option value="tax_rate">tax_rate</option>
            <option value="lookup">lookup</option>
            <option value="composite">composite</option>
            <option value="threshold">threshold</option>
          </select>
          <select
            value={props.fmIsActive}
            onChange={(e) => props.setFmIsActive(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          >
            <option value="">Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <input
            value={props.fmCloneCode}
            onChange={(e) => props.setFmCloneCode(e.target.value)}
            placeholder="Clone code"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
          <input
            value={props.fmCloneSuffix}
            onChange={(e) => props.setFmCloneSuffix(e.target.value)}
            placeholder="Name suffix"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
          />
        </CardContent>
      </Card>

      <Card className="xl:col-span-2 rounded-xl border border-gray-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Expression JSON</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded border border-[#23C4C1]/30 bg-[#23C4C1]/10 p-3 text-sm text-teal-900">
            {props.fmExplanation}
          </div>
          <textarea
            value={props.fmExprJson}
            onChange={(e) => props.setFmExprJson(e.target.value)}
            rows={14}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={props.onFormat}>
              Format JSON
            </Button>
            <Button size="sm" variant="outline" onClick={props.onValidate}>
              Validate JSON
            </Button>
            <Button
              size="sm"
              className={primaryBtnClass}
              onClick={props.onUpdate}
            >
              Save Formula Tree
            </Button>
          </div>
          <div className="max-h-64 overflow-auto rounded-xl border border-gray-200 bg-gray-50 p-4 font-mono text-xs text-gray-700">
            <JsonTree
              value={
                props.fmJsonView ?? { note: "Load a formula to visualize" }
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
