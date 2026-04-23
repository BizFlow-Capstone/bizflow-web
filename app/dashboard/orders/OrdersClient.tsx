"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Sun,
  Bell,
  Settings,
  Plus,
  Search,
  Loader2,
  RefreshCw,
  ShoppingCart,
  Eye,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ClipboardList,
  Calendar,
  Banknote,
  CreditCard,
  Landmark,
  UserCheck,
  Mic,
  CircleDollarSign,
  XCircle,
  Clock,
  PackageCheck,
  Filter,
  Pencil,
  X,
  Archive,
  MapPin,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useOrders,
  useAllOrders,
  useCancelOrder,
  useConfirmOrder,
  useCompleteOrder,
} from "@/hooks/useOrders";
import { useLocations } from "@/hooks/useLocations";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import NoLocationScreenSkeleton from "@/components/NoLocationScreenSkeleton";
import type {
  OrderFilters,
  OrderStatus,
  OrderRecord,
  PaymentType,
  PaymentStatus,
  DraftOrder,
} from "@/lib/types/order";
import {
  getDraftOrders,
  deleteDraftOrder,
  getDraftOrderCount,
} from "@/lib/draftOrderStorage";
import { useLocationRole } from "@/hooks/useLocationRole";
import { formatVnd as formatCurrency } from "@/lib/format";

// --- Helpers ---

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getStatusBadge(status: OrderStatus) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200"
        >
          <Clock className="w-3 h-3 mr-1" />
          Chờ xử lý
        </Badge>
      );
    case "completed":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <PackageCheck className="w-3 h-3 mr-1" />
          Hoàn thành
        </Badge>
      );
    case "cancelled":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Đã hủy
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function getPaymentTypeBadge(paymentType: PaymentType) {
  switch (paymentType) {
    case "cash":
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          <Banknote className="w-3 h-3 mr-1" />
          Tiền mặt
        </Badge>
      );
    case "bank":
      return (
        <Badge
          variant="outline"
          className="bg-indigo-50 text-indigo-700 border-indigo-200"
        >
          <Landmark className="w-3 h-3 mr-1" />
          Chuyển khoản
        </Badge>
      );
    case "debt":
      return (
        <Badge
          variant="outline"
          className="bg-orange-50 text-orange-700 border-orange-200"
        >
          <CreditCard className="w-3 h-3 mr-1" />
          Ghi nợ
        </Badge>
      );
    case "mixed":
      return (
        <Badge
          variant="outline"
          className="bg-purple-50 text-purple-700 border-purple-200"
        >
          <CircleDollarSign className="w-3 h-3 mr-1" />
          Hỗn hợp
        </Badge>
      );
    default:
      return <Badge variant="outline">{paymentType}</Badge>;
  }
}

function getPaymentStatusDot(paymentStatus: PaymentStatus) {
  switch (paymentStatus) {
    case "PAID":
      return (
        <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1.5" />
      );
    case "PARTIAL":
      return (
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
      );
    case "UNPAID":
      return (
        <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1.5" />
      );
  }
}

function getPaymentStatusText(paymentStatus: PaymentStatus) {
  switch (paymentStatus) {
    case "PAID":
      return "Đã thanh toán";
    case "PARTIAL":
      return "Thanh toán một phần";
    case "UNPAID":
      return "Chưa thanh toán";
  }
}

// --- Main Component ---

export default function OrdersClient() {
  const router = useRouter();
  const { data: locations = [], isLoading: isLoadingLocations } =
    useLocations();
  const hasLocations = locations.length > 0;
  const { selectedLocationId } = useDashboardLocation();
  const { isOwner } = useLocationRole();

  // Current user's profileId — used to gate per-order employee actions
  const currentProfileId =
    typeof window !== "undefined"
      ? (() => {
          try {
            const raw = window.localStorage.getItem("bizflow_auth_account");
            return raw
              ? ((JSON.parse(raw) as { profileId?: string }).profileId ?? null)
              : null;
          } catch {
            return null;
          }
        })()
      : null;

  // Filter state
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<
    PaymentType | "ALL"
  >("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 10;

  // Draft orders from localStorage
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);
  const [draftCount, setDraftCount] = useState(0);

  const refreshDrafts = useCallback(() => {
    setDraftOrders(getDraftOrders());
    setDraftCount(getDraftOrderCount());
  }, []);

  useEffect(() => {
    refreshDrafts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expanded card
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);

  // Dialog states
  const [cancelTarget, setCancelTarget] = useState<OrderRecord | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<OrderRecord | null>(null);
  const [completeTarget, setCompleteTarget] = useState<OrderRecord | null>(
    null,
  );

  // Build filters
  const filters: OrderFilters = useMemo(() => {
    const normalizedSearchQuery = searchQuery.trim();

    return {
      ...(statusFilter !== "ALL" && { Status: statusFilter }),
      ...(paymentTypeFilter !== "ALL" && { PaymentType: paymentTypeFilter }),
      ...(paymentTypeFilter === "ALL" &&
        normalizedSearchQuery && { SearchQuery: normalizedSearchQuery }),
      ...(fromDate && { FromDate: fromDate }),
      ...(toDate && { ToDate: toDate }),
      ...(selectedLocationId && { BusinessLocationId: selectedLocationId }),
      PageNumber: pageNumber,
      PageSize: pageSize,
    };
  }, [
    statusFilter,
    paymentTypeFilter,
    fromDate,
    toDate,
    searchQuery,
    pageNumber,
    selectedLocationId,
  ]);

  const statsBaseFilters: OrderFilters = useMemo(
    () => ({
      ...(fromDate && { FromDate: fromDate }),
      ...(toDate && { ToDate: toDate }),
      ...(selectedLocationId && { BusinessLocationId: selectedLocationId }),
    }),
    [fromDate, toDate, selectedLocationId],
  );

  const hasActiveFilters = paymentTypeFilter !== "ALL" || fromDate || toDate;

  const clearFilters = () => {
    setPaymentTypeFilter("ALL");
    setFromDate("");
    setToDate("");
    setPageNumber(1);
  };

  // Data fetching
  const {
    data: orderData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useOrders(filters, hasLocations && !!selectedLocationId);

  const { data: allOrdersData } = useAllOrders(
    statsBaseFilters,
    hasLocations && !!selectedLocationId,
  );

  const cancelMutation = useCancelOrder();
  const confirmMutation = useConfirmOrder();
  const completeMutation = useCompleteOrder();

  const orders = useMemo(() => orderData?.items ?? [], [orderData?.items]);
  const totalCount = orderData?.totalCount ?? 0;
  const totalPages = orderData?.totalPages ?? 0;
  const hasPreviousPage = orderData?.hasPreviousPage ?? false;
  const hasNextPage = orderData?.hasNextPage ?? false;

  const allOrders = useMemo(() => allOrdersData?.items ?? [], [allOrdersData]);
  const statsSourceOrders = allOrdersData ? allOrders : orders;
  const paymentFilterSourceOrders = allOrdersData ? allOrders : orders;

  const ordersForStats = useMemo(() => {
    if (paymentTypeFilter === "ALL") {
      return statsSourceOrders;
    }

    return statsSourceOrders.filter((o) => o.paymentType === paymentTypeFilter);
  }, [statsSourceOrders, paymentTypeFilter]);

  const paymentFilteredOrders = useMemo(() => {
    if (paymentTypeFilter === "ALL") {
      return orders;
    }

    return paymentFilterSourceOrders.filter((o) => {
      const statusMatch = statusFilter === "ALL" || o.status === statusFilter;
      return statusMatch && o.paymentType === paymentTypeFilter;
    });
  }, [paymentTypeFilter, orders, paymentFilterSourceOrders, statusFilter]);

  // Search is server-side when no payment type filter is applied.
  const searchedOrders = useMemo(() => {
    if (paymentTypeFilter === "ALL") {
      return orders;
    }

    if (!searchQuery) return paymentFilteredOrders;
    const q = searchQuery.toLowerCase();
    return paymentFilteredOrders.filter(
      (o) =>
        o.orderCode.toLowerCase().includes(q) ||
        o.createdByUserName.toLowerCase().includes(q) ||
        (o.debtorName && o.debtorName.toLowerCase().includes(q)) ||
        (o.note && o.note.toLowerCase().includes(q)),
    );
  }, [paymentTypeFilter, orders, paymentFilteredOrders, searchQuery]);

  const displayedOrders = useMemo(() => {
    if (paymentTypeFilter === "ALL") {
      return searchedOrders;
    }

    const start = (pageNumber - 1) * pageSize;
    return searchedOrders.slice(start, start + pageSize);
  }, [paymentTypeFilter, searchedOrders, pageNumber]);

  const localTotalCount = searchedOrders.length;
  const localTotalPages = Math.ceil(localTotalCount / pageSize);

  const effectiveTotalCount =
    paymentTypeFilter === "ALL" ? totalCount : localTotalCount;
  const effectiveTotalPages =
    paymentTypeFilter === "ALL" ? totalPages : localTotalPages;
  const effectiveHasPreviousPage =
    paymentTypeFilter === "ALL" ? hasPreviousPage : pageNumber > 1;
  const effectiveHasNextPage =
    paymentTypeFilter === "ALL" ? hasNextPage : pageNumber < localTotalPages;

  useEffect(() => {
    const maxPage = Math.max(effectiveTotalPages, 1);
    if (pageNumber > maxPage) {
      setPageNumber(maxPage);
    }
  }, [effectiveTotalPages, pageNumber]);

  // Stats
  const stats = useMemo(
    () => ({
      total: ordersForStats.length,
      pending: ordersForStats.filter((o) => o.status === "pending").length,
      completed: ordersForStats.filter((o) => o.status === "completed").length,
      cancelled: ordersForStats.filter((o) => o.status === "cancelled").length,
    }),
    [ordersForStats],
  );

  // Revenue from completed orders
  const totalRevenue = useMemo(() => {
    return ordersForStats
      .filter((o) => o.status === "completed")
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [ordersForStats]);

  const isNoOrderData =
    paymentTypeFilter === "ALL"
      ? orders.length === 0
      : paymentFilteredOrders.length === 0;

  // Handle cancel
  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync(cancelTarget.orderId);
      setCancelTarget(null);
    } catch (err) {
      console.error("Error cancelling order:", err);
    }
  };

  // Handle confirm draft
  const handleConfirmDraft = async () => {
    if (!confirmTarget) return;
    try {
      await confirmMutation.mutateAsync({
        orderId: confirmTarget.orderId,
        data: {
          paymentType: confirmTarget.paymentType,
          debtorId: confirmTarget.debtorId,
        },
      });
      setConfirmTarget(null);
    } catch (err) {
      console.error("Error confirming order:", err);
    }
  };

  // Handle complete
  const handleComplete = async () => {
    if (!completeTarget) return;
    try {
      await completeMutation.mutateAsync(completeTarget.orderId);
      setCompleteTarget(null);
    } catch (err) {
      console.error("Error completing order:", err);
    }
  };

  if (isLoadingLocations) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
      </div>
    );
  }

  if (!hasLocations) {
    return (
      <NoLocationScreenSkeleton
        title="Đơn hàng"
        description="Đang chờ bạn tạo địa điểm hoặc nhận lời mời trước khi tải dữ liệu."
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8 bg-gray-50">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats.total}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#23C4C1]/10 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-[#23C4C1]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Chờ xử lý</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {stats.pending}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Hoàn thành</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats.completed}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <PackageCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Doanh thu</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {new Intl.NumberFormat("vi-VN", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(totalRevenue)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <CircleDollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              Danh sách đơn hàng
            </h2>
            <p className="text-gray-600">
              Tạo mới, xem chi tiết và quản lý trạng thái đơn hàng.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
            <Link href="/dashboard/orders/create">
              <Button className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white shadow-lg shadow-[#23C4C1]/20 transition-all">
                <Plus className="w-4 h-4 mr-2" />
                Tạo đơn hàng
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="p-1 flex flex-col sm:flex-row gap-2">
            {/* Status Tabs */}
            <div className="flex p-1 bg-gray-100/50 rounded-lg sm:w-auto w-full overflow-x-auto">
              {(
                [
                  { key: "ALL", label: "Tất cả", count: stats.total },
                  { key: "pending", label: "Chờ xử lý", count: stats.pending },
                  {
                    key: "completed",
                    label: "Hoàn thành",
                    count: stats.completed,
                  },
                  { key: "cancelled", label: "Đã hủy", count: stats.cancelled },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setStatusFilter(tab.key);
                    setPageNumber(1);
                  }}
                  className={`shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    statusFilter === tab.key
                      ? tab.key === "pending"
                        ? "bg-white text-blue-700 shadow-sm"
                        : tab.key === "completed"
                          ? "bg-white text-green-700 shadow-sm"
                          : tab.key === "cancelled"
                            ? "bg-white text-red-700 shadow-sm"
                            : "bg-white text-[#23C4C1] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1 text-xs opacity-70 px-1.5 py-0.5 rounded-full ${
                      tab.key === "pending"
                        ? "bg-blue-100 text-blue-700"
                        : tab.key === "completed"
                          ? "bg-green-100 text-green-700"
                          : tab.key === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search + Filter Toggle */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex items-center relative">
                <Search className="w-4 h-4 absolute left-4 text-gray-400 z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Tìm theo mã đơn, khách hàng, ghi chú..."
                  className="pl-10 border-0 rounded-none focus:border-0 focus:ring-0 shadow-none bg-transparent"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPageNumber(1);
                  }}
                />
              </div>
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                className={`shrink-0 gap-1.5 mr-1 ${
                  showFilters
                    ? "bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
                    : ""
                }`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4" />
                Bộ lọc
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Filter Panel */}
          {showFilters && (
            <div className="border-t border-gray-100 px-4 py-3 flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Loại thanh toán
                </label>
                <Select
                  value={paymentTypeFilter}
                  onValueChange={(val) => {
                    setPaymentTypeFilter(val as PaymentType | "ALL");
                    setPageNumber(1);
                  }}
                >
                  <SelectTrigger className="w-45 h-9 text-sm">
                    <SelectValue placeholder="Tất cả" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="cash">
                      <span className="flex items-center gap-1.5">
                        <Banknote className="w-3.5 h-3.5 text-emerald-600" />{" "}
                        Tiền mặt
                      </span>
                    </SelectItem>
                    <SelectItem value="bank">
                      <span className="flex items-center gap-1.5">
                        <Landmark className="w-3.5 h-3.5 text-indigo-600" />{" "}
                        Chuyển khoản
                      </span>
                    </SelectItem>
                    <SelectItem value="debt">
                      <span className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-orange-600" />{" "}
                        Ghi nợ
                      </span>
                    </SelectItem>
                    <SelectItem value="mixed">
                      <span className="flex items-center gap-1.5">
                        <CircleDollarSign className="w-3.5 h-3.5 text-purple-600" />{" "}
                        Hỗn hợp
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Từ ngày
                </label>
                <Input
                  type="date"
                  className="w-40 h-9 text-sm"
                  value={fromDate}
                  onChange={(e) => {
                    setFromDate(e.target.value);
                    setPageNumber(1);
                  }}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Đến ngày
                </label>
                <Input
                  type="date"
                  className="w-40 h-9 text-sm"
                  value={toDate}
                  onChange={(e) => {
                    setToDate(e.target.value);
                    setPageNumber(1);
                  }}
                />
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
                  onClick={clearFilters}
                >
                  <X className="w-3.5 h-3.5" />
                  Xóa bộ lọc
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Draft Orders (localStorage) */}
        {draftCount > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-amber-600" />
                <h3 className="text-sm font-semibold text-amber-800">
                  Đơn treo ({draftCount})
                </h3>
                <span className="text-xs text-amber-600">
                  Lưu trên thiết bị này
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {draftOrders.map((draft) => (
                <div
                  key={draft.draftId}
                  className="bg-white border border-amber-200 rounded-lg p-3 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() =>
                    router.push(`/dashboard/orders/${draft.draftId}/edit`)
                  }
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {draft.items.length} sản phẩm
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {formatCurrency(
                        draft.items.reduce(
                          (sum, i) => sum + i.price * i.quantity,
                          0,
                        ),
                      )}
                      {" · "}
                      {formatDate(draft.updatedAt)}
                    </div>
                    {draft.note && (
                      <div className="text-xs text-amber-700 mt-0.5 truncate">
                        {draft.note}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-amber-600 hover:text-amber-800 hover:bg-amber-100"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/orders/${draft.draftId}/edit`);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDraftOrder(draft.draftId);
                        refreshDrafts();
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-red-300">
            <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
            </h3>
            <Button
              onClick={() => refetch()}
              className="mt-4 bg-[#23C4C1] hover:bg-[#1da8a5]"
              disabled={isRefetching}
            >
              {isRefetching ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tải...
                </>
              ) : (
                "Thử lại"
              )}
            </Button>
          </div>
        )}

        {/* Order Cards */}
        {!isLoading && !error && displayedOrders.length > 0 && (
          <div className="space-y-4">
            {displayedOrders.map((order) => {
              const isExpanded = expandedOrderId === order.orderId;
              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Collapsed Header — always visible */}
                  <button
                    type="button"
                    className="w-full text-left px-5 py-3.5 flex items-center gap-0"
                    onClick={() =>
                      setExpandedOrderId(isExpanded ? null : order.orderId)
                    }
                  >
                    {/* Col 1: order code — fixed */}
                    <span className="w-44 shrink-0 font-mono font-bold text-[#23C4C1] text-sm">
                      {order.orderCode}
                    </span>

                    {/* Col 2: status badge — fixed */}
                    <span className="w-34 shrink-0">
                      {getStatusBadge(order.status)}
                    </span>

                    {/* Col 3: customer — fills remaining */}
                    <span className="flex-1 min-w-0 flex items-center gap-1.5 text-sm text-gray-500">
                      {order.debtorName ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                          <span className="font-medium text-gray-700 truncate">
                            {order.debtorName}
                          </span>
                        </>
                      ) : (
                        <span>Khách lẻ</span>
                      )}
                    </span>

                    {/* Col 4: date — fixed */}
                    <span className="w-36 shrink-0 flex items-center gap-1.5 text-sm text-gray-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {formatDate(order.createdAt)}
                    </span>

                    {/* Col 5: amount — fixed */}
                    <span className="w-32 shrink-0 text-right font-bold text-[#23C4C1] text-sm pr-4">
                      {formatCurrency(order.totalAmount)}
                    </span>

                    {/* Chevron */}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="border-t border-gray-100">
                      {/* Info Grid */}
                      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                        {/* Customer */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <UserCheck className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Khách hàng</p>
                            <p className="text-sm font-medium text-gray-800">
                              {order.debtorName || "Khách lẻ"}
                            </p>
                          </div>
                        </div>

                        {/* Payment type */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Banknote className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Thanh toán</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {getPaymentTypeBadge(order.paymentType)}
                            </div>
                            <span className="text-xs text-gray-500 flex items-center mt-1">
                              {getPaymentStatusDot(order.paymentStatus)}
                              {getPaymentStatusText(order.paymentStatus)}
                            </span>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              Địa điểm kinh doanh
                            </p>
                            <p className="text-sm font-medium text-[#23C4C1]">
                              {order.businessLocationName}
                            </p>
                          </div>
                        </div>

                        {/* Created by */}
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5 ${
                              order.createdByUserName === "AI Assistant"
                                ? "bg-yellow-500"
                                : "bg-[#23C4C1]"
                            }`}
                          >
                            {order.createdByUserName === "AI Assistant"
                              ? "AI"
                              : order.createdByUserName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Người tạo</p>
                            <p className="text-sm font-medium text-gray-800">
                              {order.createdByUserName}
                            </p>
                          </div>
                        </div>

                        {/* Paid */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <CircleDollarSign className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              Đã thanh toán
                            </p>
                            <p
                              className={`text-sm font-semibold ${
                                order.paidAmount >= order.totalAmount
                                  ? "text-green-600"
                                  : order.paidAmount > 0
                                    ? "text-amber-600"
                                    : "text-red-500"
                              }`}
                            >
                              {formatCurrency(order.paidAmount)}
                            </p>
                          </div>
                        </div>

                        {/* Note */}
                        {order.note && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Ghi chú</p>
                              <p className="text-sm text-gray-700">
                                {order.note}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Amount Summary */}
                      <div className="mx-5 mb-4 bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Số tiền cần thanh toán
                        </span>
                        <span className="text-base font-bold text-gray-900">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="px-5 pb-4 space-y-2">
                        {/* Primary: View Detail */}
                        <Button
                          className="w-full bg-[#23C4C1] hover:bg-[#1da8a5] text-white gap-2 h-11"
                          onClick={() =>
                            router.push(`/dashboard/orders/${order.orderId}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                          Xem Chi Tiết
                        </Button>

                        {/* Secondary row */}
                        <div className="grid grid-cols-3 gap-2">
                          {/* Edit / Confirm based on status */}
                          {order.status === "pending" && (
                            <Button
                              variant="outline"
                              className="gap-1.5 h-10"
                              onClick={() =>
                                router.push(
                                  `/dashboard/orders/${order.orderId}/payment`,
                                )
                              }
                            >
                              <Banknote className="w-4 h-4" />
                              Thanh Toán
                            </Button>
                          )}
                          {(order.status === "completed" ||
                            order.status === "cancelled") && (
                            <Button
                              variant="outline"
                              className="gap-1.5 h-10"
                              onClick={() =>
                                router.push(
                                  `/dashboard/orders/${order.orderId}`,
                                )
                              }
                            >
                              <FileText className="w-4 h-4" />
                              Chi Tiết
                            </Button>
                          )}

                          {/* Cancel — owner can cancel any order; employee only their own */}
                          {order.status === "pending" &&
                          (isOwner ||
                            order.createdByUserId === currentProfileId) ? (
                            <Button
                              variant="outline"
                              className="gap-1.5 h-10 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setCancelTarget(order)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Hủy
                            </Button>
                          ) : (
                            <div />
                          )}

                          {/* Status action */}
                          {order.status === "pending" && (
                            <Button
                              className="gap-1.5 h-10 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setCompleteTarget(order)}
                            >
                              <PackageCheck className="w-4 h-4" />
                              Hoàn Thành
                            </Button>
                          )}
                          {order.status === "completed" && (
                            <Button
                              variant="outline"
                              className="gap-1.5 h-10 text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <FileText className="w-4 h-4" />
                              Xuất HĐ
                            </Button>
                          )}
                          {order.status === "cancelled" && <div />}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {effectiveTotalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-600">
                  Trang {pageNumber} / {effectiveTotalPages} — Tổng{" "}
                  {effectiveTotalCount} đơn
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!effectiveHasPreviousPage}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!effectiveHasNextPage}
                    onClick={() => setPageNumber((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && displayedOrders.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {isNoOrderData
                ? "Chưa có đơn hàng nào"
                : "Không tìm thấy kết quả"}
            </h3>
            <p className="text-gray-600 mt-1">
              {isNoOrderData
                ? "Bắt đầu bằng cách tạo đơn hàng mới."
                : "Thử thay đổi từ khóa hoặc bộ lọc trạng thái."}
            </p>
            {isNoOrderData && (
              <Link href="/dashboard/orders/create">
                <Button className="mt-4 bg-[#23C4C1] hover:bg-[#1da8a5]">
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo đơn hàng
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Cancel Order Dialog */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={() => setCancelTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Đơn hàng <strong>{cancelTarget?.orderCode}</strong> sẽ bị hủy.
              {cancelTarget?.status === "pending" && (
                <> Tồn kho sẽ được hoàn lại nếu đã trừ.</>
              )}{" "}
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Hủy đơn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Draft Order Dialog */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={() => setConfirmTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đơn hàng nháp</DialogTitle>
            <DialogDescription>
              Xác nhận đơn <strong>{confirmTarget?.orderCode}</strong> do AI
              tạo? Đơn sẽ chuyển sang trạng thái &quot;Chờ xử lý&quot; và tồn
              kho sẽ được trừ.
            </DialogDescription>
          </DialogHeader>
          {confirmTarget?.note && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
              <strong>Ghi chú AI:</strong> {confirmTarget.note}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Đóng
            </Button>
            <Button
              onClick={handleConfirmDraft}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Order Dialog */}
      <Dialog
        open={!!completeTarget}
        onOpenChange={() => setCompleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành đơn hàng</DialogTitle>
            <DialogDescription>
              Xác nhận hoàn thành đơn{" "}
              <strong>{completeTarget?.orderCode}</strong>? Tổng thanh toán:{" "}
              <strong>
                {completeTarget && formatCurrency(completeTarget.totalAmount)}
              </strong>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteTarget(null)}>
              Đóng
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4 mr-2" />
                  Hoàn thành
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
