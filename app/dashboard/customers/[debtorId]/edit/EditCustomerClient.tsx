"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Phone,
  MapPin,
  BadgeDollarSign,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDebtorDetail, useUpdateDebtor } from "@/hooks/useDebtors";
import type { UpdateDebtorRequest } from "@/lib/types/debtor";

export default function EditCustomerClient() {
  const params = useParams();
  const router = useRouter();
  const debtorId = Number(params.debtorId);

  const { data: debtor, isLoading, error } = useDebtorDetail(debtorId);
  const updateMutation = useUpdateDebtor();

  const [form, setForm] = useState<UpdateDebtorRequest>({
    name: "",
    phone: "",
    address: "",
    creditLimit: undefined,
    notes: "",
  });
  const [hasCreditLimit, setHasCreditLimit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!debtor) return;
    setForm({
      name: debtor.name,
      phone: debtor.phone || "",
      address: debtor.address || "",
      creditLimit: debtor.creditLimit,
      notes: debtor.notes || "",
    });
    setHasCreditLimit(
      debtor.creditLimit !== undefined && debtor.creditLimit !== null,
    );
  }, [debtor]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!form.name?.trim()) {
      errs.name = "Vui lòng nhập tên khách hàng.";
    }

    if (hasCreditLimit && (!form.creditLimit || form.creditLimit <= 0)) {
      errs.creditLimit = "Giới hạn nợ phải lớn hơn 0.";
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: UpdateDebtorRequest = {
      name: form.name?.trim(),
      phone: form.phone?.trim() || undefined,
      address: form.address?.trim() || undefined,
      creditLimit: hasCreditLimit ? form.creditLimit : undefined,
      notes: form.notes?.trim() || undefined,
    };

    try {
      await updateMutation.mutateAsync({ debtorId, data: payload });
      router.push(`/dashboard/customers/${debtorId}`);
    } catch {
      // handled by mutation
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">
          Đang tải dữ liệu khách hàng...
        </span>
      </div>
    );
  }

  if (error || !debtor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-1">
          Không tìm thấy khách hàng
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Khách hàng này không tồn tại hoặc đã bị xóa.
        </p>
        <Button
          onClick={() => router.push("/dashboard/customers")}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 pt-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/customers/${debtorId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50 flex justify-center">
        <div className="w-full max-w-xl space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-[#23C4C1]" />
              Chỉnh sửa thông tin cơ bản
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="name">
                Tên khách hàng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={form.name || ""}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={errors.name ? "border-red-400" : ""}
                placeholder="VD: Anh Ba, Chị Lan, Công ty ABC..."
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Số điện thoại
              </Label>
              <Input
                id="phone"
                value={form.phone || ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="VD: 0901234567"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Địa chỉ
              </Label>
              <Input
                id="address"
                value={form.address || ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="VD: 123 Nguyễn Văn Linh, Q.7"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <BadgeDollarSign className="w-4 h-4 text-[#23C4C1]" />
              Giới hạn nợ
            </h2>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Đặt giới hạn nợ
                </p>
                <p className="text-xs text-gray-400">
                  Nếu tắt, khách hàng được nợ không giới hạn.
                </p>
              </div>
              <Switch
                checked={hasCreditLimit}
                onCheckedChange={setHasCreditLimit}
              />
            </div>

            {hasCreditLimit && (
              <div className="space-y-1.5">
                <Label htmlFor="creditLimit">Giới hạn (VND)</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  min={0}
                  value={form.creditLimit ?? ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      creditLimit: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className={errors.creditLimit ? "border-red-400" : ""}
                />
                {errors.creditLimit && (
                  <p className="text-xs text-red-500">{errors.creditLimit}</p>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#23C4C1]" />
              Ghi chú
            </h2>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#23C4C1]/30 focus:border-[#23C4C1]"
              rows={3}
              placeholder="Thêm ghi chú về khách hàng (tuỳ chọn)..."
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push(`/dashboard/customers/${debtorId}`)}
            >
              Huỷ
            </Button>
            <Button
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white min-w-36"
              disabled={updateMutation.isPending}
              onClick={handleSubmit}
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Pencil className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
