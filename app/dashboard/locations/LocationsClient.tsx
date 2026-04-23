"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  User,
  Users,
  Plus,
  Search,
  Phone,
  Building2,
  LayoutGrid,
  ListFilter,
  Loader2,
  RefreshCw,
  Pencil,
  X,
  ChevronDown,
  Trash2,
  AlertTriangle,
  MoreVertical,
  Info,
  Eye,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Location, NewLocationForm } from "@/lib/types/location";
import { useAssignableEmployees } from "@/hooks/useEmployees";
import {
  useLocations,
  useCreateLocation,
  useUpdateLocationStatus,
  useUpdateLocation,
  useDeleteLocation,
  useAssignLocationEmployees,
  useLocationEmployees,
  useLocationDetail,
} from "@/hooks/useLocations";
import { toast } from "sonner";

const roleBadgeClassNames = {
  owned: "bg-[#23C4C1]/10 text-[#0c7f7d] border-[#23C4C1]/20",
  managed: "bg-amber-50 text-amber-700 border-amber-200",
} as const;

function getLocationAccessType(location: Location): "owned" | "managed" {
  return location.isOwner === true || location.accessType === "owned"
    ? "owned"
    : "managed";
}

// Status Badge Component
const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset ${
      isActive
        ? "bg-green-50 text-green-700 ring-green-600/20"
        : "bg-gray-50 text-gray-600 ring-gray-500/10"
    }`}
  >
    <span
      className={`w-1.5 h-1.5 rounded-full mr-1.5 ${isActive ? "bg-green-600" : "bg-gray-500"}`}
    ></span>
    {isActive ? "Đang hoạt động" : "Đã đóng"}
  </span>
);

/**
 * LocationsClient - Client Component for Location Management
 *
 * Data Flow:
 * UI Component → TanStack Query Hook → Service → API Route → Backend
 *
 * Features:
 * - Automatic caching with TanStack Query
 * - Optimistic updates for toggle operations
 * - Automatic cache invalidation after mutations
 * - Loading and error states handled by Query
 */
export default function LocationsClient() {
  const searchParams = useSearchParams();
  // UI State (client-only)
  const [activeTab, setActiveTab] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState<NewLocationForm>({
    name: "",
    address: "",
    district: "",
    city: "",
    phone: "",
    taxCode: "",
    employeeIds: [],
  });

  // Edit dialog state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);

  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState<Location | null>(
    null,
  );

  // Detail dialog state
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [detailLocation, setDetailLocation] = useState<Location | null>(null);

  // TanStack Query hooks for data fetching
  const {
    data: locations = [],
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useLocations();

  // Mutation hooks
  const createMutation = useCreateLocation();
  const updateStatusMutation = useUpdateLocationStatus();
  const updateMutation = useUpdateLocation();
  const deleteMutation = useDeleteLocation();
  const assignEmployeesMutation = useAssignLocationEmployees();

  // Fetch employees for dropdown
  const { data: employees = [], isLoading: isLoadingEmployees } =
    useAssignableEmployees();

  // Fetch location detail dialog data from /api/location/{id}
  const {
    data: detailLocationData,
    isLoading: isLoadingDetailData,
    error: detailError,
  } = useLocationDetail(
    detailLocation?.id ?? 0,
    isDetailDialogOpen && !!detailLocation,
  );

  // Fetch employees for edit dialog
  const { data: editEmployeesData, isLoading: isLoadingEditEmployees } =
    useLocationEmployees(
      editingLocation?.id ?? 0,
      isEditDialogOpen && !!editingLocation,
    );

  // Employee dropdown state
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);
  const [isEditEmployeeDropdownOpen, setIsEditEmployeeDropdownOpen] =
    useState(false);
  const [editingEmployeeIds, setEditingEmployeeIds] = useState<string[]>([]);

  useEffect(() => {
    if (searchParams.get("openCreate") === "1") {
      setIsDialogOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isEditDialogOpen || !editingLocation) return;
    const nextEmployeeIds = (editEmployeesData ?? []).map((emp) => emp.userId);
    setEditingEmployeeIds((prev) => {
      if (
        prev.length === nextEmployeeIds.length &&
        prev.every((id, index) => id === nextEmployeeIds[index])
      ) {
        return prev;
      }
      return nextEmployeeIds;
    });
  }, [isEditDialogOpen, editingLocation, editEmployeesData]);

  // Filtered locations based on tab and search
  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      const matchesTab =
        activeTab === "ALL"
          ? true
          : activeTab === "ACTIVE"
            ? loc.isActive
            : !loc.isActive;

      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        loc.name.toLowerCase().includes(searchLower) ||
        loc.address.toLowerCase().includes(searchLower) ||
        (loc.district ?? "").toLowerCase().includes(searchLower) ||
        (loc.city ?? "").toLowerCase().includes(searchLower);

      return matchesTab && matchesSearch;
    });
  }, [locations, activeTab, searchQuery]);

  const ownedLocations = useMemo(
    () =>
      filteredLocations.filter((loc) => getLocationAccessType(loc) === "owned"),
    [filteredLocations],
  );

  const managedLocations = useMemo(
    () =>
      filteredLocations.filter(
        (loc) => getLocationAccessType(loc) === "managed",
      ),
    [filteredLocations],
  );

  // Any authenticated user can create their own location.
  // The new location is always associated with the logged-in user via Bearer token —
  // it has nothing to do with which existing locations the user manages.
  const hasOwnerPermission = true;

  // Stats calculation
  const stats = useMemo(
    () => ({
      total: locations.length,
      active: locations.filter((l) => l.isActive).length,
      inactive: locations.filter((l) => !l.isActive).length,
      owned: locations.filter((l) => getLocationAccessType(l) === "owned")
        .length,
      managed: locations.filter((l) => getLocationAccessType(l) === "managed")
        .length,
    }),
    [locations],
  );

  const renderLocationCard = (location: Location) => {
    const accessType = getLocationAccessType(location);
    const isOwnedLocation = accessType === "owned";

    return (
      <Card
        key={location.id}
        className={`group relative overflow-hidden transition-all duration-300 border-gray-200 hover:border-[#23C4C1] hover:shadow-lg hover:shadow-[#23C4C1]/10 ${
          !location.isActive ? "bg-gray-50/50" : "bg-white"
        }`}
      >
        <div
          className={`h-1 w-full absolute top-0 left-0 ${location.isActive ? "bg-[#23C4C1]" : "bg-gray-300"}`}
        ></div>

        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 gap-3">
            <div className="min-w-0">
              <h3
                className={`text-lg font-bold truncate ${location.isActive ? "text-gray-800" : "text-gray-500"}`}
              >
                {location.name}
              </h3>
              <div className="mt-2 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
                    isOwnedLocation
                      ? roleBadgeClassNames.owned
                      : roleBadgeClassNames.managed
                  }`}
                >
                  {isOwnedLocation
                    ? "Địa điểm của bạn"
                    : "Địa điểm được thuê quản lý"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Switch
                checked={location.isActive}
                onCheckedChange={(checked) =>
                  handleStatusToggle(
                    location.id,
                    checked,
                    location.isActive,
                    location.isOwner === true,
                  )
                }
                disabled={
                  updateStatusMutation.isPending || location.isOwner !== true
                }
                className="scale-150 data-[state=checked]:bg-[#23C4C1]"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    onClick={() => handleDetailClick(location)}
                    className="cursor-pointer"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    <span>Xem chi tiết</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleEditClick(location)}
                    className="cursor-pointer"
                    disabled={location.isOwner !== true}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    <span>
                      {location.isOwner
                        ? "Sửa thông tin"
                        : "Sửa thông tin (chỉ chủ sở hữu)"}
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteClick(location)}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                    disabled={
                      deleteMutation.isPending || location.isOwner !== true
                    }
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    <span>
                      {location.isOwner
                        ? "Xóa địa điểm"
                        : "Xóa địa điểm (chỉ chủ sở hữu)"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="mb-4">
            <StatusBadge isActive={location.isActive} />
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300">
              <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
              <span className="text-gray-600 leading-snug">
                {location.address}, {location.district ?? "-"},{" "}
                {location.city ?? "-"}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300 delay-75">
              <User className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-600 font-medium">
                {location.ownerName}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300 delay-100">
              <Phone className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-gray-600">{location.phone}</span>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <Link
              href={`/dashboard/locations/${location.id}`}
              className="flex items-center justify-between text-sm font-medium text-[#23C4C1] hover:text-[#1da8a5] transition-colors"
            >
              <span>Chi tiết</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLocationSection = ({
    title,
    description,
    locations: sectionLocations,
    emptyMessage,
  }: {
    title: string;
    description: string;
    locations: Location[];
    emptyMessage: string;
  }) => (
    <section className="space-y-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
        <span className="text-sm font-medium text-gray-500">
          {sectionLocations.length} địa điểm
        </span>
      </div>

      {sectionLocations.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sectionLocations.map(renderLocationCard)}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-10 text-center text-sm text-gray-500">
          {emptyMessage}
        </div>
      )}
    </section>
  );

  // Handle status toggle with optimistic update
  const handleStatusToggle = (
    id: number,
    nextIsActive: boolean,
    currentIsActive: boolean,
    canManage: boolean,
  ) => {
    if (nextIsActive === currentIsActive) {
      return;
    }
    if (!canManage) {
      toast.error("Bạn không có quyền đổi trạng thái địa điểm này");
      return;
    }
    updateStatusMutation.mutate({ id, isActive: nextIsActive });
  };

  // Handle create new location
  const handleCreateLocation = async () => {
    if (!hasOwnerPermission) {
      toast.error("Bạn không có quyền tạo địa điểm kinh doanh");
      return;
    }

    try {
      const result = await createMutation.mutateAsync(newLocation);
      if (result.success) {
        setIsDialogOpen(false);
        setNewLocation({
          name: "",
          address: "",
          district: "",
          city: "",
          phone: "",
          taxCode: "",
          employeeIds: [],
        });
        toast.success("Đã tạo địa điểm kinh doanh mới");
      } else {
        toast.error(result.message || "Không thể tạo địa điểm mới");
      }
    } catch (err) {
      console.error("Error creating location:", err);
      toast.error("Đã xảy ra lỗi khi tạo địa điểm mới");
    }
  };

  // Handle edit location
  const handleEditClick = (location: Location) => {
    if (!location.isOwner) {
      toast.error("Bạn không có quyền sửa địa điểm này");
      return;
    }
    setEditingLocation(location);
    setIsEditDialogOpen(true);
  };

  // Handle update location
  const handleUpdateLocation = async () => {
    if (!editingLocation) return;

    try {
      const updateResult = await updateMutation.mutateAsync({
        id: editingLocation.id,
        data: {
          name: editingLocation.name,
          address: editingLocation.address,
          district: editingLocation.district,
          city: editingLocation.city,
          phone: editingLocation.phone,
          taxCode: editingLocation.taxCode ?? "",
        },
      });

      if (!updateResult.success) {
        toast.error(updateResult.message || "Không thể cập nhật địa điểm");
        return;
      }

      const assignResult = await assignEmployeesMutation.mutateAsync({
        locationId: editingLocation.id,
        employeeIds: editingEmployeeIds,
      });

      if (assignResult.success) {
        setIsEditDialogOpen(false);
        setEditingLocation(null);
        setIsEditEmployeeDropdownOpen(false);
        setEditingEmployeeIds([]);
        toast.success("Đã cập nhật địa điểm kinh doanh");
      } else {
        toast.error(
          assignResult.message || "Không thể cập nhật nhân viên phụ trách",
        );
      }
    } catch (err) {
      console.error("Error updating location:", err);
      toast.error("Đã xảy ra lỗi khi cập nhật địa điểm");
    }
  };

  // Handle delete location
  const handleDeleteClick = (location: Location) => {
    if (!location.isOwner) {
      toast.error("Bạn không có quyền xóa địa điểm này");
      return;
    }
    setDeletingLocation(location);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingLocation) return;

    try {
      await deleteMutation.mutateAsync(deletingLocation.id);
      setIsDeleteDialogOpen(false);
      setDeletingLocation(null);
      toast.success("Đã xóa địa điểm kinh doanh");
    } catch (err) {
      console.error("Error deleting location:", err);
      toast.error("Đã xảy ra lỗi khi xóa địa điểm");
    }
  };

  // Handle detail dialog
  const handleDetailClick = (location: Location) => {
    setDetailLocation(location);
    setIsDetailDialogOpen(true);
  };

  return (
    <div className="flex-1 flex flex-col">
      <main className="flex-1 p-8 bg-gray-50">
        {/* Top Control Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">
              Danh sách kho hàng
            </h2>
            <p className="text-gray-600">
              Quản lý trạng thái và thông tin các điểm kinh doanh.
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {stats.owned} địa điểm của bạn, {stats.managed} địa điểm được
              người khác giao quản lý.
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
            <Button
              onClick={() => setIsDialogOpen(true)}
              disabled={!hasOwnerPermission}
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white shadow-lg shadow-[#23C4C1]/20 transition-all"
              title={
                hasOwnerPermission
                  ? undefined
                  : "Chỉ chủ sở hữu mới có quyền tạo địa điểm"
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Tạo kho mới
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-2">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-100/50 rounded-lg sm:w-auto w-full">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "ALL"
                  ? "bg-white text-[#23C4C1] shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Tất cả{" "}
              <span className="ml-1 text-xs opacity-70 bg-gray-200 px-1.5 py-0.5 rounded-full text-gray-700">
                {stats.total}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("ACTIVE")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "ACTIVE"
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Hoạt động{" "}
              <span className="ml-1 text-xs opacity-70 bg-green-100 px-1.5 py-0.5 rounded-full text-green-700">
                {stats.active}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("INACTIVE")}
              className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === "INACTIVE"
                  ? "bg-white text-gray-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Đã đóng{" "}
              <span className="ml-1 text-xs opacity-70 bg-gray-200 px-1.5 py-0.5 rounded-full text-gray-700">
                {stats.inactive}
              </span>
            </button>
          </div>

          {/* Search Input */}
          <div className="flex-1 flex items-center relative">
            <Search className="w-4 h-4 absolute left-4 text-gray-400 z-10 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc địa chỉ..."
              className="pl-10 border-0 rounded-none focus:border-0 focus:ring-0 shadow-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="hidden sm:flex items-center gap-1 border-l border-gray-200 pl-2">
            <Button variant="ghost" size="icon" className="text-gray-400">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-gray-400">
              <ListFilter className="w-4 h-4" />
            </Button>
          </div>
        </div>

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
              <Building2 className="w-8 h-8 text-red-400" />
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

        {/* Grid Content */}
        {!isLoading && !error && filteredLocations.length > 0 && (
          <div className="space-y-8">
            {renderLocationSection({
              title: "Địa điểm của chính bạn",
              description: "Các location bạn tạo và có toàn quyền quản lý.",
              locations: ownedLocations,
              emptyMessage:
                searchQuery || activeTab !== "ALL"
                  ? "Không có địa điểm sở hữu nào khớp bộ lọc hiện tại."
                  : "Bạn chưa tạo địa điểm nào.",
            })}

            {renderLocationSection({
              title: "Địa điểm được người khác thuê quản lý",
              description:
                "Các location bạn đang làm việc với vai trò nhân viên hoặc người quản lý được phân công.",
              locations: managedLocations,
              emptyMessage:
                searchQuery || activeTab !== "ALL"
                  ? "Không có địa điểm được thuê quản lý nào khớp bộ lọc hiện tại."
                  : "Bạn chưa được gán quản lý địa điểm nào từ chủ sở hữu khác.",
            })}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredLocations.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {locations.length === 0
                ? "Chưa có địa điểm nào"
                : "Không tìm thấy kết quả"}
            </h3>
            <p className="text-gray-600">
              {locations.length === 0
                ? "Bắt đầu bằng cách tạo địa điểm kinh doanh mới."
                : "Thử thay đổi từ khóa hoặc bộ lọc trạng thái."}
            </p>
            {locations.length === 0 && (
              <Button
                onClick={() => setIsDialogOpen(true)}
                disabled={!hasOwnerPermission}
                className="mt-4 bg-[#23C4C1] hover:bg-[#1da8a5]"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo kho mới
              </Button>
            )}
          </div>
        )}
      </main>

      {/* Create Location Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-125 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Tạo Địa điểm kinh doanh Mới
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Nhập thông tin chi tiết cho địa điểm kinh doanh mới
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
            {/* Name */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium text-gray-700"
              >
                Tên Địa điểm kinh doanh <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                placeholder="VD: Kho Quận 9"
                value={newLocation.name}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, name: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label
                htmlFor="address"
                className="text-sm font-medium text-gray-700"
              >
                Địa Chỉ <span className="text-red-500">*</span>
              </Label>
              <Input
                id="address"
                placeholder="VD: 123 Nguyễn Huệ"
                value={newLocation.address}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, address: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* District */}
            <div className="space-y-2">
              <Label
                htmlFor="district"
                className="text-sm font-medium text-gray-700"
              >
                Quận/Huyện <span className="text-red-500">*</span>
              </Label>
              <Input
                id="district"
                placeholder="VD: Quận 1"
                value={newLocation.district}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, district: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label
                htmlFor="city"
                className="text-sm font-medium text-gray-700"
              >
                Thành phố <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                placeholder="VD: TP. Hồ Chí Minh"
                value={newLocation.city}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, city: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-gray-700"
              >
                Số điện thoại <span className="text-red-500">*</span>
              </Label>
              <Input
                id="phone"
                placeholder="VD: 0901234567"
                value={newLocation.phone}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, phone: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Tax Code */}
            <div className="space-y-2">
              <Label
                htmlFor="taxCode"
                className="text-sm font-medium text-gray-700"
              >
                Mã số thuế
              </Label>
              <Input
                id="taxCode"
                placeholder="VD: 0123456789"
                value={newLocation.taxCode}
                onChange={(e) =>
                  setNewLocation({ ...newLocation, taxCode: e.target.value })
                }
                className="w-full"
              />
            </div>

            {/* Employee Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Nhân viên phụ trách
                </div>
              </Label>

              {/* Selected employees chips */}
              {newLocation.employeeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {newLocation.employeeIds.map((empId) => {
                    const emp = employees.find((e) => e.userId === empId);
                    return (
                      <span
                        key={empId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-[#23C4C1]/10 text-[#23C4C1] rounded-md text-sm"
                      >
                        {emp?.userName || empId}
                        <button
                          type="button"
                          onClick={() =>
                            setNewLocation({
                              ...newLocation,
                              employeeIds: newLocation.employeeIds.filter(
                                (id) => id !== empId,
                              ),
                            })
                          }
                          className="hover:bg-[#23C4C1]/20 rounded p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Dropdown trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)
                  }
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent"
                >
                  <span className="text-sm text-gray-500">
                    {isLoadingEmployees
                      ? "Đang tải..."
                      : newLocation.employeeIds.length > 0
                        ? `Đã chọn ${newLocation.employeeIds.length} nhân viên`
                        : "Chọn nhân viên..."}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isEmployeeDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown menu */}
                {isEmployeeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {isLoadingEmployees ? (
                      <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang tải danh sách nhân viên...
                      </div>
                    ) : employees.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Không có nhân viên nào
                      </div>
                    ) : (
                      employees.map((emp) => (
                        <label
                          key={emp.userId}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <Checkbox
                            checked={newLocation.employeeIds.includes(
                              emp.userId,
                            )}
                            onCheckedChange={(
                              checked: boolean | "indeterminate",
                            ) => {
                              if (checked === true) {
                                setNewLocation({
                                  ...newLocation,
                                  employeeIds: [
                                    ...newLocation.employeeIds,
                                    emp.userId,
                                  ],
                                });
                              } else {
                                setNewLocation({
                                  ...newLocation,
                                  employeeIds: newLocation.employeeIds.filter(
                                    (id) => id !== emp.userId,
                                  ),
                                });
                              }
                            }}
                          />
                          <span className="text-sm text-gray-700">
                            {emp.userName}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setNewLocation({
                  name: "",
                  address: "",
                  district: "",
                  city: "",
                  phone: "",
                  taxCode: "",
                  employeeIds: [],
                });
              }}
              className="mr-2"
              disabled={createMutation.isPending}
            >
              Quay lại
            </Button>
            <Button
              type="submit"
              onClick={handleCreateLocation}
              disabled={
                createMutation.isPending ||
                !newLocation.name ||
                !newLocation.address ||
                !newLocation.district ||
                !newLocation.city ||
                !newLocation.phone
              }
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Thêm Địa điểm kinh doanh"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Location Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-125 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Chỉnh sửa Địa điểm kinh doanh
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Cập nhật thông tin chi tiết cho địa điểm kinh doanh
            </DialogDescription>
          </DialogHeader>

          {editingLocation && (
            <>
              <div className="px-6 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
                {/* Name */}
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-name"
                    className="text-sm font-medium text-gray-700"
                  >
                    Tên Địa điểm kinh doanh{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="VD: Kho Quận 9"
                    value={editingLocation.name}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        name: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-address"
                    className="text-sm font-medium text-gray-700"
                  >
                    Địa Chỉ <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-address"
                    placeholder="VD: 123 Nguyễn Huệ"
                    value={editingLocation.address}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        address: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                {/* District */}
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-district"
                    className="text-sm font-medium text-gray-700"
                  >
                    Quận/Huyện <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-district"
                    placeholder="VD: Quận 1"
                    value={editingLocation.district}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        district: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-city"
                    className="text-sm font-medium text-gray-700"
                  >
                    Thành phố <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-city"
                    placeholder="VD: TP. Hồ Chí Minh"
                    value={editingLocation.city}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        city: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-phone"
                    className="text-sm font-medium text-gray-700"
                  >
                    Số điện thoại <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-phone"
                    placeholder="VD: 0901234567"
                    value={editingLocation.phone}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        phone: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                {/* Tax Code */}
                <div className="space-y-2">
                  <Label
                    htmlFor="edit-taxCode"
                    className="text-sm font-medium text-gray-700"
                  >
                    Mã số thuế
                  </Label>
                  <Input
                    id="edit-taxCode"
                    placeholder="VD: 0312345678"
                    value={editingLocation.taxCode ?? ""}
                    onChange={(e) =>
                      setEditingLocation({
                        ...editingLocation,
                        taxCode: e.target.value,
                      })
                    }
                    className="w-full"
                  />
                </div>

                {/* Employee Selection */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Nhân viên phụ trách
                    </div>
                  </Label>

                  {editingEmployeeIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {editingEmployeeIds.map((empId) => {
                        const emp = employees.find((e) => e.userId === empId);
                        return (
                          <span
                            key={empId}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-[#23C4C1]/10 text-[#23C4C1] rounded-md text-sm"
                          >
                            {emp?.userName || empId}
                            <button
                              type="button"
                              onClick={() =>
                                setEditingEmployeeIds(
                                  editingEmployeeIds.filter(
                                    (id) => id !== empId,
                                  ),
                                )
                              }
                              className="hover:bg-[#23C4C1]/20 rounded p-0.5"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setIsEditEmployeeDropdownOpen(
                          !isEditEmployeeDropdownOpen,
                        )
                      }
                      className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#23C4C1] focus:border-transparent"
                    >
                      <span className="text-sm text-gray-500">
                        {isLoadingEditEmployees || isLoadingEmployees
                          ? "Đang tải..."
                          : editingEmployeeIds.length > 0
                            ? `Đã chọn ${editingEmployeeIds.length} nhân viên`
                            : "Chọn nhân viên..."}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform ${
                          isEditEmployeeDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isEditEmployeeDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {isLoadingEditEmployees || isLoadingEmployees ? (
                          <div className="px-3 py-2 text-sm text-gray-500 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Đang tải danh sách nhân viên...
                          </div>
                        ) : employees.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            Không có nhân viên nào
                          </div>
                        ) : (
                          employees.map((emp) => (
                            <label
                              key={emp.userId}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                            >
                              <Checkbox
                                checked={editingEmployeeIds.includes(
                                  emp.userId,
                                )}
                                onCheckedChange={(
                                  checked: boolean | "indeterminate",
                                ) => {
                                  if (checked === true) {
                                    setEditingEmployeeIds([
                                      ...editingEmployeeIds,
                                      emp.userId,
                                    ]);
                                  } else {
                                    setEditingEmployeeIds(
                                      editingEmployeeIds.filter(
                                        (id) => id !== emp.userId,
                                      ),
                                    );
                                  }
                                }}
                              />
                              <span className="text-sm text-gray-700">
                                {emp.userName}
                              </span>
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingLocation(null);
                    setIsEditEmployeeDropdownOpen(false);
                    setEditingEmployeeIds([]);
                  }}
                  className="mr-2"
                  disabled={
                    updateMutation.isPending ||
                    assignEmployeesMutation.isPending
                  }
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  onClick={handleUpdateLocation}
                  disabled={
                    updateMutation.isPending ||
                    assignEmployeesMutation.isPending ||
                    !editingLocation.name ||
                    !editingLocation.address ||
                    !editingLocation.district ||
                    !editingLocation.city ||
                    !editingLocation.phone
                  }
                  className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
                >
                  {updateMutation.isPending ||
                  assignEmployeesMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : (
                    "Lưu thay đổi"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-105">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Xác nhận xóa địa điểm
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Bạn có chắc chắn muốn xóa địa điểm{" "}
              <span className="font-semibold text-gray-900">
                {deletingLocation?.name}
              </span>
              ? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setDeletingLocation(null);
              }}
              className="mr-2"
              disabled={deleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                "Xóa địa điểm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Location Dialog */}
      <Dialog
        open={isDetailDialogOpen}
        onOpenChange={(open) => {
          setIsDetailDialogOpen(open);
          if (!open) setDetailLocation(null);
        }}
      >
        <DialogContent className="sm:max-w-140 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#23C4C1]" />
              {detailLocation?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Thông tin chi tiết địa điểm kinh doanh
            </DialogDescription>
          </DialogHeader>

          {detailLocation && (
            <div className="px-6 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
              {/* Status */}
              <div className="flex items-center gap-2">
                <StatusBadge
                  isActive={
                    detailLocationData?.isActive ?? detailLocation.isActive
                  }
                />
              </div>

              {/* Location Info */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#23C4C1]" />
                  Thông tin địa điểm
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs">Địa chỉ</span>
                      <p className="text-gray-700">
                        {detailLocationData?.address ?? detailLocation.address},{" "}
                        {detailLocationData?.district ??
                          detailLocation.district ??
                          "-"}
                        ,{" "}
                        {detailLocationData?.city ?? detailLocation.city ?? "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs">
                        Số điện thoại
                      </span>
                      <p className="text-gray-700">
                        {detailLocationData?.phone ??
                          detailLocation.phone ??
                          "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs">Mã số thuế</span>
                      <p className="text-gray-700">
                        {detailLocationData?.taxCode?.trim() || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-400 shrink-0" />
                    <div>
                      <span className="text-gray-500 text-xs">Chủ sở hữu</span>
                      <p className="text-gray-700 font-medium">
                        {detailLocationData?.ownerName ??
                          detailLocation.ownerName}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employees List */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#23C4C1]" />
                  Nhân viên (
                  {isLoadingDetailData
                    ? "..."
                    : (detailLocationData?.employees?.length ?? 0)}
                  )
                </h4>

                {isLoadingDetailData ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-[#23C4C1]" />
                    <span className="ml-2 text-sm text-gray-500">
                      Đang tải danh sách nhân viên...
                    </span>
                  </div>
                ) : detailError ? (
                  <div className="bg-red-50 rounded-lg p-4 text-sm text-red-600">
                    Không thể tải chi tiết nhân viên của địa điểm.
                  </div>
                ) : (detailLocationData?.employees?.length ?? 0) === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-6 text-center">
                    <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">
                      Chưa có nhân viên nào được gán cho địa điểm này
                    </p>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg divide-y divide-gray-200">
                    {detailLocationData?.employees?.map((emp, index) => (
                      <div
                        key={emp.userId || `${emp.userName}-${index}`}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#23C4C1]/10 flex items-center justify-center text-[#23C4C1] text-xs font-bold shrink-0">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {emp.userName}
                          </p>
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {emp.phone || "Chưa cập nhật"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => {
                setIsDetailDialogOpen(false);
                setDetailLocation(null);
              }}
            >
              Đóng
            </Button>
            <Link href={`/dashboard/locations/${detailLocation?.id}`}>
              <Button className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white gap-2">
                Quản lý sản phẩm
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
