import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useBusinessTypes } from "@/hooks/useBusinessTypes";
import {
  useAccountingTemplates,
  useCreateAccountingBook,
} from "@/hooks/useAccounting";

// Types for props
interface BookCreateFormProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
  locationId: number;
}

export default function BookCreateForm({
  open,
  onClose,
  onCreated,
  locationId,
}: BookCreateFormProps) {
  const { data: businessTypes } = useBusinessTypes();
  const { data: templates } = useAccountingTemplates();
  const createBookMutation = useCreateAccountingBook(locationId);

  // State
  const [selectedBusinessType, setSelectedBusinessType] = useState<string>("");
  const [selectedTaxMethod, setSelectedTaxMethod] = useState<string>("");
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [error, setError] = useState<string>("");

  // Find business type info
  const businessTypeInfo = useMemo(() => {
    return businessTypes?.find(
      (b) => b.businessTypeId === selectedBusinessType,
    );
  }, [businessTypes, selectedBusinessType]);

  // Gợi ý tax methods: luôn cho phép chọn cả 3, không disable gì (vì không có dữ liệu mapping)
  const suggestedTaxMethods: string[] = ["method_1", "method_2", "exempt"];

  // Gợi ý template: không block, chỉ highlight nếu applicableMethods có taxMethod
  const suggestedTemplates = useMemo(() => {
    if (!templates || !selectedTaxMethod) return [];
    return templates
      .filter((tpl) => tpl.applicableMethods?.includes(selectedTaxMethod))
      .map((tpl) => tpl.templateCode);
  }, [templates, selectedTaxMethod]);

  // Khi chọn nhóm ngành, reset tax method và templates (tránh setState trong effect)
  const handleBusinessTypeChange = (val: string) => {
    setSelectedBusinessType(val);
    setSelectedTaxMethod("");
    setSelectedTemplates([]);
  };

  // Khi chọn tax method, reset templates
  const handleTaxMethodChange = (val: string) => {
    setSelectedTaxMethod(val);
    setSelectedTemplates([]);
  };

  // Xử lý submit
  const handleSubmit = async () => {
    setError("");
    if (
      !selectedBusinessType ||
      !selectedTaxMethod ||
      selectedTemplates.length === 0
    ) {
      setError("Vui lòng chọn đầy đủ thông tin.");
      return;
    }
    try {
      await createBookMutation.mutateAsync({
        businessTypeId: selectedBusinessType,
        taxMethod: selectedTaxMethod,
        templateCodes: selectedTemplates,
      });
      if (onCreated) onCreated();
      onClose();
    } catch (e) {
      setError((e as Error).message || "Không thể tạo sổ kế toán.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo sổ kế toán mới</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Chọn nhóm ngành */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Nhóm ngành
            </label>
            <Select
              value={selectedBusinessType}
              onValueChange={handleBusinessTypeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn nhóm ngành" />
              </SelectTrigger>
              <SelectContent>
                {businessTypes?.map((b) => (
                  <SelectItem key={b.businessTypeId} value={b.businessTypeId}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {businessTypeInfo && (
              <div className="mt-2 text-xs text-gray-500">
                <div>
                  <b>Giải thích:</b> {businessTypeInfo.description}
                </div>
              </div>
            )}
          </div>

          {/* Chọn cách tính thuế */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Cách tính thuế
            </label>
            <div className="flex gap-3">
              {suggestedTaxMethods.map((method) => (
                <Button
                  key={method}
                  variant={selectedTaxMethod === method ? "default" : "outline"}
                  onClick={() => handleTaxMethodChange(method)}
                >
                  {method === "method_1"
                    ? "Cách 1"
                    : method === "method_2"
                      ? "Cách 2"
                      : "Miễn thuế"}
                  <Badge className="ml-2 bg-blue-100 text-blue-700">
                    Gợi ý
                  </Badge>
                </Button>
              ))}
            </div>
          </div>

          {/* Chọn mẫu sổ */}
          <div>
            <label className="block text-xs font-semibold mb-1">
              Chọn mẫu sổ (có thể chọn nhiều)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {templates?.map((tpl) => {
                const suggested = suggestedTemplates.includes(tpl.templateCode);
                return (
                  <label
                    key={tpl.templateCode}
                    className={`flex items-center gap-2 border rounded px-2 py-1 cursor-pointer ${suggested ? "border-blue-400" : "border-gray-200"}`}
                  >
                    <Checkbox
                      checked={selectedTemplates.includes(tpl.templateCode)}
                      onCheckedChange={(checked) => {
                        setSelectedTemplates((prev) =>
                          checked
                            ? [...prev, tpl.templateCode]
                            : prev.filter((c) => c !== tpl.templateCode),
                        );
                      }}
                    />
                    <span>{tpl.name}</span>
                    {suggested && (
                      <Badge className="ml-1 bg-blue-100 text-blue-700">
                        Gợi ý
                      </Badge>
                    )}
                  </label>
                );
              })}
            </div>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createBookMutation.isPending}
          >
            {createBookMutation.isPending ? "Đang tạo..." : "Tạo sổ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
