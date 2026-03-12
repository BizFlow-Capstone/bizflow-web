"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  UserPlus,
  Phone,
  MapPin,
  BadgeDollarSign,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateDebtor } from "@/hooks/useDebtors";
import { useLocations } from "@/hooks/useLocations";
import type { CreateDebtorRequest } from "@/lib/types/debtor";

export default function CreateCustomerClient() {
  const router = useRouter();
  const createMutation = useCreateDebtor();
  const { data: locations } = useLocations();

  const [form, setForm] = useState<CreateDebtorRequest>({
    businessLocationId: 0,
    name: "",
    phone: "",
    address: "",
    creditLimit: undefined,
    notes: "",
  });

  const [hasCreditLimit, setHasCreditLimit] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) errs.name = "Vui lòng nhập tên khách hàng.";
    if (!form.businessLocationId)
      errs.businessLocationId = "Vui lòng chọn địa điểm kinh doanh.";
    if (
      hasCreditLimit &&
      (form.creditLimit === undefined || form.creditLimit <= 0)
    )
      errs.creditLimit = "Giới hạn nợ phải lớn hơn 0.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: CreateDebtorRequest = {
      ...form,
      name: form.name.trim(),
      phone: form.phone?.trim() || undefined,
      address: form.address?.trim() || undefined,
      creditLimit: hasCreditLimit ? form.creditLimit : undefined,
      notes: form.notes?.trim() || undefined,
    };

    try {
      const result = await createMutation.mutateAsync(payload);
      router.push(`/dashboard/customers/${result.data.debtorId}`);
    } catch {
      // handled by mutation
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/customers")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Thêm Khách Hàng Thân Thiết
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Tạo hồ sơ khách hàng mới để theo dõi công nợ
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 bg-gray-50 flex justify-center">
        <div className="w-full max-w-xl space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#23C4C1]" />
              Thông tin cơ bản
            </h2>

            {/* Name */}
            <div className="space-y-1.5">
              <Label htmlFor="name">
                Tên khách hàng <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="VD: Anh Ba, Chị Lan, Công ty ABC..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className={errors.name ? "border-red-400" : ""}
              />
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label htmlFor="phone">
                <Phone className="w-3.5 h-3.5 inline mr-1" />
                Số điện thoại
              </Label>
              <Input
                id="phone"
                placeholder="VD: 0901234567"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <Label htmlFor="address">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                Địa chỉ
              </Label>
              <Input
                id="address"
                placeholder="VD: 123 Nguyễn Văn Linh, Q.7"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
            </div>

            {/* Business Location */}
            <div className="space-y-1.5">
              <Label>
                Địa điểm kinh doanh <span className="text-red-500">*</span>
              </Label>
              <Select
                value={
                  form.businessLocationId ? String(form.businessLocationId) : ""
                }
                onValueChange={(val) =>
                  setForm({ ...form, businessLocationId: Number(val) })
                }
              >
                <SelectTrigger
                  className={errors.businessLocationId ? "border-red-400" : ""}
                >
                  <SelectValue placeholder="Chọn địa điểm..." />
                </SelectTrigger>
                <SelectContent>
                  {(locations ?? []).map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>
                      {loc.name}
                    </SelectItem>
                  ))}
                  {/* Fallback for when locations service has no data */}
                  {(!locations || locations.length === 0) && (
                    <>
                      <SelectItem value="1">Chi nhánh Quận 1</SelectItem>
                      <SelectItem value="2">Chi nhánh Quận 7</SelectItem>
                      <SelectItem value="3">Chi nhánh Bình Thạnh</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
              {errors.businessLocationId && (
                <p className="text-xs text-red-500">
                  {errors.businessLocationId}
                </p>
              )}
            </div>
          </div>

          {/* Credit Limit */}
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
                  placeholder="VD: 5000000"
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

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#23C4C1]" />
              Ghi chú
            </h2>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#23C4C1]/30 focus:border-[#23C4C1]"
              rows={3}
              placeholder="Thêm ghi chú về khách hàng (tuỳ chọn)..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/customers")}
            >
              Huỷ
            </Button>
            <Button
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white min-w-36"
              disabled={createMutation.isPending}
              onClick={handleSubmit}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Thêm khách hàng
                </>
              )}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
