"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  Search,
  Loader2,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  CalendarDays,
  Infinity as InfinityIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  useAdminFeatures,
  useAdminSubscriptionPlans,
  useAdminSubscriptionPlan,
  useCreatePlan,
  useUpdatePlan,
  useDeletePlan,
  usePatchPlanStatus,
} from "@/hooks/useAdminSubscriptions";
import type {
  SubscriptionPlan,
  SubscriptionPlanDetail,
  Feature,
  CreatePlanRequest,
  CreatePlanFeatureRequest,
} from "@/lib/types/adminSubscription";

// -- Helpers -----------------------------------------------------------------

function formatVND(value: number) {
  return value.toLocaleString("vi-VN") + "đ";
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toInputDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 16);
}

// -- Plan Form Dialog --------------------------------------------------------

interface PlanFormData {
  name: string;
  description: string;
  durationDays: number;
  basePrice: number;
  hasDiscount: boolean;
  discountedPrice: number | null;
  discountStart: string;
  discountEnd: string;
  selectedFeatures: CreatePlanFeatureRequest[];
}

const EMPTY_FORM: PlanFormData = {
  name: "",
  description: "",
  durationDays: 30,
  basePrice: 0,
  hasDiscount: false,
  discountedPrice: null,
  discountStart: "",
  discountEnd: "",
  selectedFeatures: [],
};

function planToFormData(plan: SubscriptionPlanDetail): PlanFormData {
  const price = plan.currentPrice;
  const hasDiscount = price?.discountedPrice != null;
  return {
    name: plan.name,
    description: plan.description,
    durationDays: plan.durationDays,
    basePrice: price?.basePrice ?? 0,
    hasDiscount,
    discountedPrice: price?.discountedPrice ?? null,
    discountStart: toInputDate(price?.discountStart ?? null),
    discountEnd: toInputDate(price?.discountEnd ?? null),
    selectedFeatures: plan.features.map((f) => ({
      featureId: f.featureId,
      usageLimit: f.usageLimit,
    })),
  };
}

function formDataToRequest(form: PlanFormData): CreatePlanRequest {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    durationDays: form.durationDays,
    price: {
      basePrice: form.basePrice,
      discountedPrice: form.hasDiscount ? form.discountedPrice : null,
      discountStart:
        form.hasDiscount && form.discountStart
          ? new Date(form.discountStart).toISOString()
          : null,
      discountEnd:
        form.hasDiscount && form.discountEnd
          ? new Date(form.discountEnd).toISOString()
          : null,
    },
    features: form.selectedFeatures,
  };
}

function PlanFormDialog({
  open,
  onOpenChange,
  editingPlan,
  isLoadingDetail,
  features,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingPlan: SubscriptionPlanDetail | null;
  isLoadingDetail: boolean;
  features: Feature[];
  onSubmit: (data: CreatePlanRequest) => void;
  isSubmitting: boolean;
}) {
  const [form, setForm] = useState<PlanFormData>(() =>
    editingPlan ? planToFormData(editingPlan) : EMPTY_FORM,
  );

  const isEdit = editingPlan != null;

  const toggleFeature = (featureId: number, checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      selectedFeatures: checked
        ? [...prev.selectedFeatures, { featureId, usageLimit: -1 }]
        : prev.selectedFeatures.filter((f) => f.featureId !== featureId),
    }));
  };

  const setFeatureLimit = (featureId: number, value: number) => {
    setForm((prev) => ({
      ...prev,
      selectedFeatures: prev.selectedFeatures.map((f) =>
        f.featureId === featureId ? { ...f, usageLimit: value } : f,
      ),
    }));
  };

  const canSubmit =
    form.name.trim() !== "" &&
    form.durationDays > 0 &&
    form.basePrice >= 0 &&
    form.selectedFeatures.length > 0 &&
    (!form.hasDiscount ||
      (form.discountedPrice != null &&
        form.discountedPrice >= 0 &&
        form.discountStart !== "" &&
        form.discountEnd !== ""));

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit(formDataToRequest(form));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {isLoadingDetail ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {isEdit ? "Chỉnh Sửa Gói Đăng Ký" : "Tạo Gói Đăng Ký Mới"}
              </DialogTitle>
              <DialogDescription>
                {isEdit
                  ? "Cập nhật thông tin gói đăng ký. Thay đổi sẽ tạo mức giá mới."
                  : "Gói mới sẽ có trạng thái Không hoạt động. Dùng nút kích hoạt sau khi kiểm tra."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Tên gói *</Label>
                  <Input
                    id="plan-name"
                    placeholder="VD: Gói Pro"
                    value={form.name}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan-duration">Thời hạn (ngày) *</Label>
                  <Input
                    id="plan-duration"
                    type="number"
                    min={1}
                    placeholder="30"
                    value={form.durationDays || ""}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        durationDays: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plan-desc">Mô tả</Label>
                <Textarea
                  id="plan-desc"
                  rows={2}
                  placeholder="Mô tả ngắn gọn về gói..."
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Giá cả</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="base-price">Giá gốc (VND) *</Label>
                    <Input
                      id="base-price"
                      type="number"
                      min={0}
                      placeholder="500000"
                      value={form.basePrice || ""}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          basePrice: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="has-discount"
                        checked={form.hasDiscount}
                        onCheckedChange={(checked) =>
                          setForm((p) => ({
                            ...p,
                            hasDiscount: checked,
                            ...(!checked && {
                              discountedPrice: null,
                              discountStart: "",
                              discountEnd: "",
                            }),
                          }))
                        }
                      />
                      <Label htmlFor="has-discount" className="text-sm">
                        Có giảm giá
                      </Label>
                    </div>
                  </div>
                </div>

                {form.hasDiscount && (
                  <div className="grid grid-cols-3 gap-4 p-3 bg-amber-50/60 rounded-lg border border-amber-100">
                    <div className="space-y-2">
                      <Label htmlFor="discount-price" className="text-xs">
                        Giá sau giảm (VND)
                      </Label>
                      <Input
                        id="discount-price"
                        type="number"
                        min={0}
                        placeholder="399000"
                        value={form.discountedPrice ?? ""}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            discountedPrice: parseInt(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount-start" className="text-xs">
                        Bắt đầu giảm giá
                      </Label>
                      <Input
                        id="discount-start"
                        type="datetime-local"
                        value={form.discountStart}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            discountStart: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="discount-end" className="text-xs">
                        Kết thúc giảm giá
                      </Label>
                      <Input
                        id="discount-end"
                        type="datetime-local"
                        value={form.discountEnd}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            discountEnd: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  Tính năng *{" "}
                  <span className="font-normal text-gray-400">
                    (chọn ít nhất 1)
                  </span>
                </h4>
                <div className="border rounded-lg divide-y max-h-56 overflow-y-auto">
                  {features.map((feat) => {
                    const selected = form.selectedFeatures.find(
                      (f) => f.featureId === feat.featureId,
                    );
                    const isChecked = !!selected;
                    const isUnlimited = selected?.usageLimit === -1;

                    return (
                      <div
                        key={feat.featureId}
                        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50/50"
                      >
                        <Checkbox
                          id={`feat-${feat.featureId}`}
                          checked={isChecked}
                          onCheckedChange={(checked) =>
                            toggleFeature(feat.featureId, !!checked)
                          }
                        />
                        <label
                          htmlFor={`feat-${feat.featureId}`}
                          className="flex-1 text-sm cursor-pointer"
                        >
                          <span className="font-medium text-gray-800">
                            {feat.name}
                          </span>
                          <span className="text-gray-400 ml-1.5 text-xs">
                            ({feat.featureCode})
                          </span>
                        </label>

                        {isChecked && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                isUnlimited
                                  ? "bg-teal-50 border-teal-200 text-teal-700"
                                  : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
                              }`}
                              onClick={() =>
                                setFeatureLimit(
                                  feat.featureId,
                                  isUnlimited ? 100 : -1,
                                )
                              }
                            >
                              <InfinityIcon className="w-3 h-3 inline mr-0.5" />
                              Unlimited
                            </button>
                            {!isUnlimited && (
                              <Input
                                type="number"
                                min={0}
                                className="w-20 h-7 text-xs"
                                placeholder="Giới hạn"
                                value={selected.usageLimit}
                                onChange={(e) =>
                                  setFeatureLimit(
                                    feat.featureId,
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Hủy
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="gap-1.5"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isEdit ? "Cập Nhật" : "Tạo Gói"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// -- Delete Confirmation Dialog -----------------------------------------------

function DeleteConfirmDialog({
  open,
  onOpenChange,
  plan,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: SubscriptionPlan | null;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  if (!plan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Xóa Gói Đăng Ký
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc muốn xóa gói{" "}
            <strong className="text-gray-800">{plan.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-2 text-sm text-gray-600">
          <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
            Nếu gói đã đồng bộ Stripe, thao tác sẽ <strong>vô hiệu hoá</strong>{" "}
            (soft-delete). Nếu chưa, gói sẽ bị <strong>xóa vĩnh viễn</strong>.
          </p>
          <p>
            Nếu có người dùng đang sử dụng gói này, hệ thống sẽ từ chối xóa.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            className="gap-1.5"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Xác Nhận Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// -- Main Page ----------------------------------------------------------------

export default function AdminSubscriptionsClient() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [formOpen, setFormOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState<SubscriptionPlan | null>(
    null,
  );

  const { data: plans, isLoading, error } = useAdminSubscriptionPlans();
  const { data: features = [] } = useAdminFeatures();
  const { data: editingPlanDetail, isFetching: isFetchingDetail } =
    useAdminSubscriptionPlan(editingPlanId);
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();
  const deleteMutation = useDeletePlan();
  const statusMutation = usePatchPlanStatus();

  const filteredPlans = useMemo(() => {
    if (!plans) return [];
    return plans.filter((p) => {
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === "ACTIVE" && !p.isActive) return false;
      if (statusFilter === "INACTIVE" && p.isActive) return false;
      return true;
    });
  }, [plans, search, statusFilter]);

  const activePlans = plans?.filter((p) => p.isActive).length ?? 0;
  const inactivePlans = plans?.filter((p) => !p.isActive).length ?? 0;

  // -- Handlers ---------------------------------------------------------------

  const handleCreate = () => {
    setEditingPlanId(null);
    setFormOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlanId(plan.subscriptionPlanId);
    setFormOpen(true);
  };

  const handleFormSubmit = (data: CreatePlanRequest) => {
    if (editingPlanId) {
      updateMutation.mutate(
        { id: editingPlanId, payload: data },
        {
          onSuccess: () => {
            toast.success("Cập nhật gói thành công");
            setFormOpen(false);
            setEditingPlanId(null);
          },
          onError: (err) => {
            toast.error(err.message || "Cập nhật thất bại");
          },
        },
      );
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          toast.success(
            "Tạo gói thành công. Gói đang ở trạng thái Không hoạt động.",
          );
          setFormOpen(false);
          setEditingPlanId(null);
        },
        onError: (err) => {
          toast.error(err.message || "Tạo gói thất bại");
        },
      });
    }
  };

  const handleDeleteClick = (plan: SubscriptionPlan) => {
    setDeletingPlan(plan);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deletingPlan) return;
    deleteMutation.mutate(deletingPlan.subscriptionPlanId, {
      onSuccess: () => {
        toast.success("Xóa gói thành công");
        setDeleteOpen(false);
        setDeletingPlan(null);
      },
      onError: (err) => {
        toast.error(
          err.message ||
            "Xóa thất bại. Có thể đang có người dùng sử dụng gói này.",
        );
      },
    });
  };

  const handleToggleStatus = (plan: SubscriptionPlan) => {
    const newStatus = !plan.isActive;
    statusMutation.mutate(
      { id: plan.subscriptionPlanId, payload: { isActive: newStatus } },
      {
        onSuccess: () => {
          toast.success(
            newStatus
              ? `Đã kích hoạt gói "${plan.name}"`
              : `Đã tắt gói "${plan.name}"`,
          );
        },
        onError: (err) => {
          toast.error(err.message || "Cập nhật trạng thái thất bại");
        },
      },
    );
  };

  // -- Loading / Error states -------------------------------------------------

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">Không thể tải dữ liệu</p>
          <p className="text-sm text-gray-500 mt-1">
            {error.message || "Vui lòng thử lại sau."}
          </p>
        </CardContent>
      </Card>
    );
  }

  // -- Render -----------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gói Đăng Ký</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các gói subscription và pricing trên nền tảng.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-1.5">
          <Plus className="w-4 h-4" />
          Tạo Gói Mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Tổng gói",
            value: plans?.length ?? 0,
            sub: "subscription plans",
            color: "text-blue-600",
          },
          {
            label: "Đang hoạt động",
            value: activePlans,
            sub: "visible cho người dùng",
            color: "text-emerald-600",
          },
          {
            label: "Không hoạt động",
            value: inactivePlans,
            sub: "chưa kích hoạt / đã tắt",
            color: "text-gray-500",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Tìm theo tên hoặc mô tả..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {(
                [
                  { key: "ALL", label: "Tất cả" },
                  { key: "ACTIVE", label: "Hoạt động" },
                  {
                    key: "INACTIVE",
                    label: "Không hoạt động",
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    statusFilter === tab.key
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Danh Sách Gói ({filteredPlans.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPlans.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {search || statusFilter !== "ALL"
                  ? "Không tìm thấy gói phù hợp"
                  : "Chưa có gói đăng ký nào"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gói</TableHead>
                  <TableHead>Thời hạn</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Tính năng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => {
                  const effectivePrice = plan.basePrice ?? 0;

                  return (
                    <TableRow key={plan.subscriptionPlanId}>
                      <TableCell>
                        <div className="max-w-55">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {plan.name}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-gray-600">
                          <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                          {plan.durationDays} ngày
                        </span>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatVND(effectivePrice)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <span className="text-xs text-gray-400">—</span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            plan.isActive
                              ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-100"
                          }
                        >
                          {plan.isActive ? "Hoạt động" : "Không hoạt động"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-gray-500">
                        {formatDateTime(plan.createdAt)}
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <span className="sr-only">Mở menu</span>
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <circle cx="10" cy="4" r="2" />
                                <circle cx="10" cy="10" r="2" />
                                <circle cx="10" cy="16" r="2" />
                              </svg>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => handleEdit(plan)}
                            >
                              <Pencil className="w-4 h-4" />
                              Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2"
                              onClick={() => handleToggleStatus(plan)}
                              disabled={statusMutation.isPending}
                            >
                              {plan.isActive ? (
                                <>
                                  <ToggleLeft className="w-4 h-4" />
                                  Tắt hoạt động
                                </>
                              ) : (
                                <>
                                  <ToggleRight className="w-4 h-4" />
                                  Kích hoạt
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="gap-2 text-red-600 focus:text-red-600"
                              onClick={() => handleDeleteClick(plan)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Xóa gói
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Form Dialog */}
      <PlanFormDialog
        key={editingPlanId ? `edit-${editingPlanId}` : "create"}
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingPlanId(null);
        }}
        editingPlan={editingPlanDetail ?? null}
        isLoadingDetail={isFetchingDetail && editingPlanId != null}
        features={features}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        plan={deletingPlan}
        onConfirm={handleDeleteConfirm}
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
}
