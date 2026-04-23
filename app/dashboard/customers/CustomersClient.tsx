"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  RefreshCw,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Calendar,
  Banknote,
  Phone,
  MapPin,
  Eye,
  Pencil,
  Trash2,
  ClipboardList,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Filter,
  X,
  UserCheck,
  BadgeDollarSign,
  FileText,
  CircleHelp,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  useAllDebtors,
  useDebtSummary,
  useDeleteDebtor,
  useUpdateDebtorStatus,
} from "@/hooks/useDebtors";
import { useLocations } from "@/hooks/useLocations";
import NoLocationScreenSkeleton from "@/components/NoLocationScreenSkeleton";
import { useLocationRole } from "@/hooks/useLocationRole";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import type {
  DebtorFilters,
  DebtorRecord,
  BalanceStatus,
} from "@/lib/types/debtor";
import { getBalanceStatus } from "@/lib/types/debtor";
import { formatVnd as formatCurrency } from "@/lib/format";

// --- Helpers ---

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(dateStr));
}

function getBalanceBadge(balance: number) {
  const status = getBalanceStatus(balance);
  switch (status) {
    case "DEBT":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-700 border-red-200"
        >
          <TrendingDown className="w-3 h-3 mr-1" />
          Đang nợ
        </Badge>
      );
    case "CREDIT":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200"
        >
          <TrendingUp className="w-3 h-3 mr-1" />
          Có dư
        </Badge>
      );
    case "CLEARED":
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-600 border-gray-200"
        >
          <UserCheck className="w-3 h-3 mr-1" />
          Hết nợ
        </Badge>
      );
  }
}

function getCreditLimitLabel(limit?: number): string {
  if (limit === undefined || limit === null) return "Không giới hạn";
  return formatCurrency(limit);
}

// --- Main Component ---

export default function CustomersClient() {
  const router = useRouter();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceFilter, setBalanceFilter] = useState<BalanceStatus | "ALL">(
    "ALL",
  );
  const [sortBy, setSortBy] = useState<"name" | "balance" | "createdAt">(
    "name",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [activityFilter, setActivityFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const [selectedLocationIds, setSelectedLocationIds] = useState<number[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;

  // Expanded card
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<DebtorRecord | null>(null);
  const [deleteForce, setDeleteForce] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const { data: locations = [], isLoading: isLoadingLocations } =
    useLocations();
  const hasLocations = locations.length > 0;
  const { isOwner } = useLocationRole();

  // Backend currently supports only location/search/activity filters.
  const queryFilters: DebtorFilters = useMemo(
    () => ({
      ...(activityFilter === "ACTIVE" && { isActive: true }),
      ...(activityFilter === "INACTIVE" && { isActive: false }),
      ...(selectedLocationIds.length > 0 && {
        businessLocationIds: selectedLocationIds,
      }),
      search: searchQuery || undefined,
    }),
    [activityFilter, selectedLocationIds, searchQuery],
  );

  const hasActiveFilters =
    balanceFilter !== "ALL" ||
    activityFilter !== "ALL" ||
    selectedLocationIds.length > 0 ||
    sortBy !== "name" ||
    sortDir !== "asc";

  const clearFilters = () => {
    setBalanceFilter("ALL");
    setActivityFilter("ALL");
    setSelectedLocationIds([]);
    setSortBy("name");
    setSortDir("asc");
    setPageNumber(1);
  };

  const toggleLocation = (locationId: number, checked: boolean) => {
    setSelectedLocationIds((current) => {
      if (checked) {
        if (current.includes(locationId)) return current;
        return [...current, locationId];
      }
      return current.filter((id) => id !== locationId);
    });
    setPageNumber(1);
  };

  // Data
  const {
    data: allDebtorData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useAllDebtors(queryFilters, hasLocations);
  const { data: summary } = useDebtSummary(hasLocations);
  const deleteMutation = useDeleteDebtor();
  const statusMutation = useUpdateDebtorStatus();

  const debtors = useMemo(() => allDebtorData?.items ?? [], [allDebtorData]);

  // Client-side balance filter because backend does not support debt/credit/cleared buckets.
  const filteredDebtors = useMemo(() => {
    if (balanceFilter === "ALL") return debtors;
    return debtors.filter(
      (d) => getBalanceStatus(d.currentBalance) === balanceFilter,
    );
  }, [debtors, balanceFilter]);

  const sortedDebtors = useMemo(() => {
    const items = [...filteredDebtors];
    const factor = sortDir === "asc" ? 1 : -1;

    items.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name, "vi") * factor;
      }

      if (sortBy === "balance") {
        return (a.currentBalance - b.currentBalance) * factor;
      }

      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return ((aTime || 0) - (bTime || 0)) * factor;
    });

    return items;
  }, [filteredDebtors, sortBy, sortDir]);

  const displayedDebtors = useMemo(() => {
    const start = (pageNumber - 1) * pageSize;
    return sortedDebtors.slice(start, start + pageSize);
  }, [sortedDebtors, pageNumber]);

  const totalCount = sortedDebtors.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const hasPreviousPage = pageNumber > 1;
  const hasNextPage = pageNumber < totalPages;

  useEffect(() => {
    const maxPage = Math.max(totalPages, 1);
    if (pageNumber > maxPage) {
      setPageNumber(maxPage);
    }
  }, [totalPages, pageNumber]);

  // Handle delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync({
        debtorId: deleteTarget.debtorId,
        options: { force: deleteForce },
      });
      setDeleteTarget(null);
      setDeleteForce(false);
    } catch {
      // Error handled by mutation
    }
  };

  const handleToggleDebtorStatus = async (debtor: DebtorRecord) => {
    setStatusUpdatingId(debtor.debtorId);
    try {
      await statusMutation.mutateAsync({
        debtorId: debtor.debtorId,
        data: { isActive: !debtor.isActive },
      });
    } finally {
      setStatusUpdatingId(null);
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
        title="Khách hàng thân thiết"
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
                <p className="text-sm text-gray-500">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary?.totalDebtors ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#23C4C1]/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#23C4C1]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Đang nợ</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {summary?.debtorsWithDebt ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Tổng nợ phải thu</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {summary
                    ? new Intl.NumberFormat("vi-VN", {
                        notation: "compact",
                        compactDisplay: "short",
                      }).format(summary.totalOutstandingDebt)
                    : "0"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                <BadgeDollarSign className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Có dư (credit)</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {summary?.debtorsWithCredit ?? 0}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              Danh sách khách hàng
            </h2>
            <p className="text-gray-600">
              Tìm kiếm, thêm mới và theo dõi công nợ khách hàng.
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
            <Link href="/dashboard/customers/create">
              {isOwner && (
                <Button className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white shadow-lg shadow-[#23C4C1]/20 transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm khách hàng
                </Button>
              )}
            </Link>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 flex items-start gap-2.5">
          <CircleHelp className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Ghi chú: Khách hàng <strong>Đang hoạt động</strong> sẽ xuất hiện khi
            nhân viên tạo đơn ghi nợ. Nếu chuyển sang <strong>Tạm ngưng</strong>
            , khách hàng sẽ bị ẩn khỏi danh sách chọn khi tạo đơn.
          </p>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
          <div className="p-1 flex flex-col sm:flex-row gap-2">
            {/* Balance Status Tabs */}
            <div className="flex p-1 bg-gray-100/50 rounded-lg sm:w-auto w-full overflow-x-auto">
              {(
                [
                  { key: "ALL", label: "Tất cả" },
                  { key: "DEBT", label: "Đang nợ" },
                  { key: "CREDIT", label: "Có dư" },
                  { key: "CLEARED", label: "Hết nợ" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setBalanceFilter(tab.key);
                    setPageNumber(1);
                  }}
                  className={`shrink-0 px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                    balanceFilter === tab.key
                      ? tab.key === "DEBT"
                        ? "bg-white text-red-700 shadow-sm"
                        : tab.key === "CREDIT"
                          ? "bg-white text-green-700 shadow-sm"
                          : tab.key === "CLEARED"
                            ? "bg-white text-gray-700 shadow-sm"
                            : "bg-white text-[#23C4C1] shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search + Filter Toggle */}
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 flex items-center relative">
                <Search className="w-4 h-4 absolute left-4 text-gray-400 z-10 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Tìm theo tên, SĐT, địa chỉ..."
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
                Sắp xếp
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-red-500" />
                )}
              </Button>
            </div>
          </div>

          {/* Expanded Sort Panel */}
          {showFilters && (
            <div className="border-t border-gray-100 px-4 py-3 flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Địa điểm kinh doanh
                </label>
                <div className="w-72 max-h-36 overflow-auto rounded-md border border-gray-200 px-3 py-2 space-y-2 bg-white">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <Checkbox
                      checked={selectedLocationIds.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLocationIds([]);
                          setPageNumber(1);
                        }
                      }}
                    />
                    Tất cả địa điểm
                  </label>
                  {(locations ?? []).map((loc) => (
                    <label
                      key={loc.id}
                      className="flex items-center gap-2 text-sm text-gray-700"
                    >
                      <Checkbox
                        checked={selectedLocationIds.includes(loc.id)}
                        onCheckedChange={(checked) =>
                          toggleLocation(loc.id, checked === true)
                        }
                      />
                      {loc.name}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Trạng thái sử dụng
                </label>
                <Select
                  value={activityFilter}
                  onValueChange={(val) => {
                    setActivityFilter(val as "ALL" | "ACTIVE" | "INACTIVE");
                    setPageNumber(1);
                  }}
                >
                  <SelectTrigger className="w-48 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tất cả</SelectItem>
                    <SelectItem value="ACTIVE">Đang hoạt động</SelectItem>
                    <SelectItem value="INACTIVE">Tạm ngưng</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Sắp xếp theo
                </label>
                <Select
                  value={sortBy}
                  onValueChange={(val) => {
                    setSortBy(val as "name" | "balance" | "createdAt");
                    setPageNumber(1);
                  }}
                >
                  <SelectTrigger className="w-40 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Tên</SelectItem>
                    <SelectItem value="balance">Số dư</SelectItem>
                    <SelectItem value="createdAt">Ngày tạo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500">
                  Thứ tự
                </label>
                <Select
                  value={sortDir}
                  onValueChange={(val) => {
                    setSortDir(val as "asc" | "desc");
                    setPageNumber(1);
                  }}
                >
                  <SelectTrigger className="w-36 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Tăng dần</SelectItem>
                    <SelectItem value="desc">Giảm dần</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
                  onClick={clearFilters}
                >
                  <X className="w-3.5 h-3.5" />
                  Đặt lại
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-red-300">
            <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {error instanceof Error ? error.message : "Không thể tải dữ liệu"}
            </h3>
            <Button
              onClick={() => refetch()}
              className="mt-4 bg-[#23C4C1] hover:bg-[#1da8a5]"
              disabled={isRefetching}
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Customer Cards */}
        {!isLoading && !error && displayedDebtors.length > 0 && (
          <div className="space-y-3">
            {displayedDebtors.map((debtor) => {
              const isExpanded = expandedId === debtor.debtorId;
              const balanceStatus = getBalanceStatus(debtor.currentBalance);
              return (
                <div
                  key={debtor.debtorId}
                  className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Collapsed Row */}
                  <button
                    type="button"
                    className="w-full text-left px-5 py-3.5 flex items-center gap-0"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : debtor.debtorId)
                    }
                  >
                    {/* Avatar */}
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 mr-3 ${
                        balanceStatus === "DEBT"
                          ? "bg-red-500"
                          : balanceStatus === "CREDIT"
                            ? "bg-green-500"
                            : "bg-gray-400"
                      }`}
                    >
                      {debtor.name.charAt(0)}
                    </div>

                    {/* Name */}
                    <span className="w-44 shrink-0 text-sm font-semibold text-gray-800 truncate">
                      {debtor.name}
                    </span>

                    {/* Active status */}
                    <span className="w-28 shrink-0">
                      {debtor.isActive ? (
                        <Badge
                          variant="outline"
                          className="bg-emerald-50 text-emerald-700 border-emerald-200"
                        >
                          Đang hoạt động
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="bg-gray-100 text-gray-600 border-gray-300"
                        >
                          Tạm ngưng
                        </Badge>
                      )}
                    </span>

                    {/* Balance Badge */}
                    <span className="w-28 shrink-0">
                      {getBalanceBadge(debtor.currentBalance)}
                    </span>

                    {/* Phone */}
                    <span className="w-32 shrink-0 text-sm text-gray-500 flex items-center gap-1.5">
                      {debtor.phone ? (
                        <>
                          <Phone className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{debtor.phone}</span>
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </span>

                    {/* Balance amount */}
                    <span className="flex-1 min-w-0" />
                    <span
                      className={`w-36 shrink-0 text-right text-sm font-bold pr-4 ${
                        balanceStatus === "DEBT"
                          ? "text-red-600"
                          : balanceStatus === "CREDIT"
                            ? "text-green-600"
                            : "text-gray-500"
                      }`}
                    >
                      {balanceStatus === "DEBT"
                        ? `-${formatCurrency(debtor.outstandingDebt)}`
                        : formatCurrency(debtor.currentBalance)}
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
                      <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-8">
                        {/* Phone */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Phone className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              Số điện thoại
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {debtor.phone || "Chưa có"}
                            </p>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Địa chỉ</p>
                            <p className="text-sm font-medium text-gray-800">
                              {debtor.address || "Chưa có"}
                            </p>
                          </div>
                        </div>

                        {/* Location */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <MapPin className="w-4 h-4 text-[#23C4C1]" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              Địa điểm kinh doanh
                            </p>
                            <p className="text-sm font-medium text-[#23C4C1]">
                              {debtor.businessLocationName}
                            </p>
                          </div>
                        </div>

                        {/* Credit Limit */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <BadgeDollarSign className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">Giới hạn nợ</p>
                            <p className="text-sm font-medium text-gray-800">
                              {getCreditLimitLabel(debtor.creditLimit)}
                            </p>
                          </div>
                        </div>

                        {/* Last order */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Calendar className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              Mua gần nhất
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {formatDate(debtor.lastOrderDate)}
                            </p>
                          </div>
                        </div>

                        {/* Last payment */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            <Banknote className="w-4 h-4 text-gray-500" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              Trả nợ gần nhất
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {formatDate(debtor.lastPaymentDate)}
                            </p>
                          </div>
                        </div>

                        {/* Usage status */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                            {debtor.isActive ? (
                              <ToggleRight className="w-4 h-4 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">
                              Dùng khi tạo đơn ghi nợ
                            </p>
                            <p className="text-sm font-medium text-gray-800">
                              {debtor.isActive
                                ? "Đang hoạt động (nhân viên nhìn thấy)"
                                : "Tạm ngưng (nhân viên không nhìn thấy)"}
                            </p>
                          </div>
                        </div>

                        {/* Notes */}
                        {debtor.notes && (
                          <div className="flex items-start gap-3 sm:col-span-2 lg:col-span-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                              <FileText className="w-4 h-4 text-gray-500" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-400">Ghi chú</p>
                              <p className="text-sm text-gray-700">
                                {debtor.notes}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Balance summary */}
                      <div className="mx-5 mb-4 bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Số dư hiện tại
                        </span>
                        <span
                          className={`text-base font-bold ${
                            balanceStatus === "DEBT"
                              ? "text-red-600"
                              : balanceStatus === "CREDIT"
                                ? "text-green-600"
                                : "text-gray-600"
                          }`}
                        >
                          {balanceStatus === "DEBT"
                            ? `Nợ ${formatCurrency(debtor.outstandingDebt)}`
                            : balanceStatus === "CREDIT"
                              ? `Dư ${formatCurrency(debtor.currentBalance)}`
                              : "0 ₫"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="px-5 pb-4 space-y-2">
                        <Button
                          className="w-full bg-[#23C4C1] hover:bg-[#1da8a5] text-white gap-2 h-11"
                          onClick={() =>
                            router.push(
                              `/dashboard/customers/${debtor.debtorId}`,
                            )
                          }
                        >
                          <Eye className="w-4 h-4" />
                          Xem Chi Tiết
                        </Button>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <Button
                            variant="outline"
                            className="gap-1.5 h-10 text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() =>
                              router.push(
                                `/dashboard/customers/${debtor.debtorId}/payment`,
                              )
                            }
                          >
                            <Banknote className="w-4 h-4" />
                            Điều chỉnh
                          </Button>
                          <Button
                            variant="outline"
                            className="gap-1.5 h-10"
                            onClick={() =>
                              router.push(
                                `/dashboard/customers/${debtor.debtorId}`,
                              )
                            }
                          >
                            <FileText className="w-4 h-4" />
                            Lịch sử
                          </Button>
                          {isOwner && (
                            <>
                              <Button
                                variant="outline"
                                className="gap-1.5 h-10"
                                onClick={() =>
                                  router.push(
                                    `/dashboard/customers/${debtor.debtorId}/edit`,
                                  )
                                }
                              >
                                <Pencil className="w-4 h-4" />
                                Chỉnh sửa
                              </Button>
                              <Button
                                variant="outline"
                                className="gap-1.5 h-10"
                                disabled={
                                  statusMutation.isPending &&
                                  statusUpdatingId === debtor.debtorId
                                }
                                onClick={() => handleToggleDebtorStatus(debtor)}
                              >
                                {statusMutation.isPending &&
                                statusUpdatingId === debtor.debtorId ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : debtor.isActive ? (
                                  <ToggleLeft className="w-4 h-4" />
                                ) : (
                                  <ToggleRight className="w-4 h-4" />
                                )}
                                {debtor.isActive ? "Tạm ngưng" : "Kích hoạt"}
                              </Button>
                              <Button
                                variant="outline"
                                className="gap-1.5 h-10 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setDeleteTarget(debtor)}
                              >
                                <Trash2 className="w-4 h-4" />
                                Xóa
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-600">
                  Trang {pageNumber} / {totalPages} — Tổng {totalCount} khách
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasPreviousPage}
                    onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasNextPage}
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

        {/* Empty */}
        {!isLoading && !error && displayedDebtors.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {debtors.length === 0
                ? "Chưa có khách hàng nào"
                : "Không tìm thấy kết quả"}
            </h3>
            <p className="text-gray-600 mt-1">
              {debtors.length === 0
                ? "Bắt đầu bằng cách thêm khách hàng thân thiết."
                : "Thử thay đổi từ khóa hoặc bộ lọc."}
            </p>
            {debtors.length === 0 && isOwner && (
              <Link href="/dashboard/customers/create">
                <Button className="mt-4 bg-[#23C4C1] hover:bg-[#1da8a5]">
                  <Plus className="w-4 h-4 mr-2" />
                  Thêm khách hàng
                </Button>
              </Link>
            )}
          </div>
        )}
      </main>

      {/* Delete Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteForce(false);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa <strong>{deleteTarget?.name}</strong> khỏi danh sách khách
              hàng thân thiết?
              {deleteTarget && deleteTarget.currentBalance < 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠ Khách hàng này đang nợ{" "}
                  {formatCurrency(deleteTarget.outstandingDebt)}. Bật &quot;Xóa
                  cưỡng bức&quot; nếu vẫn muốn xóa.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-gray-200 px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Xóa cưỡng bức</p>
              <p className="text-xs text-gray-500">
                Dùng khi khách còn nợ nhưng vẫn cần xóa hồ sơ.
              </p>
            </div>
            <Switch checked={deleteForce} onCheckedChange={setDeleteForce} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
