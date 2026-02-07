"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Sun,
  Bell,
  Settings,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type { Location, NewLocationForm } from "@/lib/types/location";
import { useEmployees } from "@/hooks/useEmployees";
import {
  useLocations,
  useCreateLocation,
  useUpdateLocationStatus,
  useUpdateLocation,
} from "@/hooks/useLocations";

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

  // Fetch employees for dropdown
  const { data: employees = [], isLoading: isLoadingEmployees } =
    useEmployees();

  // Employee dropdown state
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false);

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
        loc.district.toLowerCase().includes(searchLower) ||
        loc.city.toLowerCase().includes(searchLower);

      return matchesTab && matchesSearch;
    });
  }, [locations, activeTab, searchQuery]);

  // Stats calculation
  const stats = useMemo(
    () => ({
      total: locations.length,
      active: locations.filter((l) => l.isActive).length,
      inactive: locations.filter((l) => !l.isActive).length,
    }),
    [locations],
  );

  // Handle status toggle with optimistic update
  const handleStatusToggle = (id: number, isActive: boolean) => {
    updateStatusMutation.mutate({ id, isActive });
  };

  // Handle create new location
  const handleCreateLocation = async () => {
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
      } else {
        alert(result.message || "Không thể tạo địa điểm mới");
      }
    } catch (err) {
      console.error("Error creating location:", err);
      alert("Đã xảy ra lỗi khi tạo địa điểm mới");
    }
  };

  // Handle edit location
  const handleEditClick = (location: Location) => {
    setEditingLocation(location);
    setIsEditDialogOpen(true);
  };

  // Handle update location
  const handleUpdateLocation = async () => {
    if (!editingLocation) return;

    try {
      const result = await updateMutation.mutateAsync({
        id: editingLocation.id,
        data: {
          name: editingLocation.name,
          address: editingLocation.address,
          district: editingLocation.district,
          city: editingLocation.city,
          phone: editingLocation.phone,
          taxCode: "",
        },
      });
      if (result.success) {
        setIsEditDialogOpen(false);
        setEditingLocation(null);
      } else {
        alert(result.message || "Không thể cập nhật địa điểm");
      }
    } catch (err) {
      console.error("Error updating location:", err);
      alert("Đã xảy ra lỗi khi cập nhật địa điểm");
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Quản lý Địa Điểm Kinh Doanh
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Quản lý trạng thái và thông tin các điểm kinh doanh của bạn
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon">
              <Sun className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="w-5 h-5 text-gray-600" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="w-5 h-5 text-gray-600" />
            </Button>
            <div className="flex items-center gap-3 ml-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" />
                <AvatarFallback className="bg-blue-600 text-white">
                  LV
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Lê Văn A
                </div>
                <div className="text-xs text-gray-600">Chủ Kho</div>
              </div>
            </div>
          </div>
        </div>
      </header>

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
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white shadow-lg shadow-[#23C4C1]/20 transition-all"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <Card
                key={location.id}
                className={`group relative overflow-hidden transition-all duration-300 border-gray-200 hover:border-[#23C4C1] hover:shadow-lg hover:shadow-[#23C4C1]/10 ${
                  !location.isActive ? "bg-gray-50/50" : "bg-white"
                }`}
              >
                {/* Decorative top bar */}
                <div
                  className={`h-1 w-full absolute top-0 left-0 ${location.isActive ? "bg-[#23C4C1]" : "bg-gray-300"}`}
                ></div>

                <CardContent className="p-6">
                  {/* Header: Name & Switch */}
                  <div className="flex items-center justify-between mb-4">
                    <h3
                      className={`text-lg font-bold ${location.isActive ? "text-gray-800" : "text-gray-500"}`}
                    >
                      {location.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={location.isActive}
                        onCheckedChange={(checked) =>
                          handleStatusToggle(location.id, checked)
                        }
                        disabled={updateStatusMutation.isPending}
                        className="scale-150 data-[state=checked]:bg-[#23C4C1]"
                      />
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <StatusBadge isActive={location.isActive} />
                  </div>

                  {/* Info List */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3 text-sm group-hover:translate-x-1 transition-transform duration-300">
                      <MapPin className="w-4 h-4 mt-0.5 text-gray-400 shrink-0" />
                      <span className="text-gray-600 leading-snug">
                        {location.address}, {location.district}, {location.city}
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

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(location)}
                      className="text-gray-600 hover:text-[#23C4C1] hover:border-[#23C4C1]"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Sửa
                    </Button>
                    <Link href={`/dashboard/locations/${location.id}`}>
                      <Button
                        variant="link"
                        className="text-[#23C4C1] hover:text-[#1da8a5] font-semibold p-0 h-auto"
                      >
                        Chi tiết &rarr;
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
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
        <DialogContent className="sm:max-w-[500px] p-0">
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
        <DialogContent className="sm:max-w-[500px] p-0">
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
              </div>

              <DialogFooter className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditDialogOpen(false);
                    setEditingLocation(null);
                  }}
                  className="mr-2"
                  disabled={updateMutation.isPending}
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  onClick={handleUpdateLocation}
                  disabled={
                    updateMutation.isPending ||
                    !editingLocation.name ||
                    !editingLocation.address ||
                    !editingLocation.district ||
                    !editingLocation.city ||
                    !editingLocation.phone
                  }
                  className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
                >
                  {updateMutation.isPending ? (
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
    </div>
  );
}
