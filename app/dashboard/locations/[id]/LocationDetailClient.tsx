"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sun,
  Bell,
  Settings,
  Search,
  Plus,
  Filter,
  ArrowLeft,
  Package,
  Upload,
  ScanLine,
  AlertTriangle,
  FileText,
  Loader2,
  MapPin,
  Phone,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarcodeScanModal } from "@/components/BarcodeScanModal";
import {
  useProducts,
  useCreateProduct,
  useUpdateProductStatus,
  useDeleteProduct,
} from "@/hooks/useProducts";
import ProductManagementTable from "@/components/products/ProductManagementTable";
import { useBusinessTypes } from "@/hooks/useBusinessTypes";
import type { ProductFilters } from "@/lib/types/product";
import { useLocationDetail } from "@/hooks/useLocations";

/**
 * LocationDetailClient - Client Component for Location Detail
 *
 * Data Flow: UI → TanStack Query Hook → Service → API Route → Backend
 * Uses original UI layout with real API data
 */
export default function LocationDetailClient({
  locationId,
}: {
  locationId: string;
}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterMinPrice, setFilterMinPrice] = useState<string>("");
  const [filterMaxPrice, setFilterMaxPrice] = useState<string>("");
  const [filterBusinessTypeIds, setFilterBusinessTypeIds] = useState<string[]>(
    [],
  );
  const [filterStatus, setFilterStatus] = useState<string>("");

  // Applied filters (only apply when user clicks "Áp dụng")
  const [appliedFilters, setAppliedFilters] = useState<{
    minCostPrice?: number;
    maxCostPrice?: number;
    businessTypeIds?: string[];
    status?: string;
  }>({});

  // Fetch location detail
  const { data: location, isLoading: isLocationLoading } = useLocationDetail(
    Number(locationId),
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<"search" | "newProductBarcode">(
    "search",
  );
  const EMPTY_NEW_PRODUCT = {
    name: "",
    sku: "",
    businessTypeId: "",
    unit: "cái",
    stock: 0,
    costPrice: 0,
    trackInventory: true,
    manufacturer: "",
    priceTiers: [{ unit: "cái", quantity: 1, price: 0 }],
  };
  const [newProduct, setNewProduct] = useState(EMPTY_NEW_PRODUCT);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    productId: number;
    name: string;
  } | null>(null);

  // Mutations
  const createProductMutation = useCreateProduct();
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();

  // Fetch business types for filter tags
  const { data: businessTypes = [] } = useBusinessTypes();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build filters for TanStack Query
  const filters: ProductFilters = useMemo(
    () => ({
      locationId: Number(locationId),
      name: debouncedSearch || undefined,
      minCostPrice: appliedFilters.minCostPrice,
      maxCostPrice: appliedFilters.maxCostPrice,
      businessTypeIds:
        appliedFilters.businessTypeIds &&
        appliedFilters.businessTypeIds.length > 0
          ? appliedFilters.businessTypeIds
          : undefined,
      status: appliedFilters.status || undefined,
    }),
    [locationId, debouncedSearch, appliedFilters],
  );

  // Fetch products from API via TanStack Query
  const { data: productData, isLoading, error } = useProducts(filters);

  const products = useMemo(
    () => productData?.items ?? [],
    [productData?.items],
  );

  const [draftCount, setDraftCount] = useState(0);

  useEffect(() => {
    const key = `bizflow:inventoryDraft:${locationId}`;

    const refresh = () => {
      try {
        const raw = window.localStorage.getItem(key);
        setDraftCount(raw ? 1 : 0);
      } catch {
        setDraftCount(0);
      }
    };

    refresh();

    const onStorage = (event: StorageEvent) => {
      if (event.key === key) refresh();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", refresh);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", refresh);
    };
  }, [locationId]);

  // Client-side filter (instant search before debounce hits API)
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) || String(p.productId).includes(q),
    );
  }, [products, searchQuery]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (appliedFilters.minCostPrice !== undefined) count++;
    if (appliedFilters.maxCostPrice !== undefined) count++;
    if (
      appliedFilters.businessTypeIds &&
      appliedFilters.businessTypeIds.length > 0
    )
      count++;
    if (appliedFilters.status) count++;
    return count;
  }, [appliedFilters]);

  // Toggle a business type in the multi-select array
  const toggleBusinessType = (id: string) => {
    setFilterBusinessTypeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  // Apply preset price range
  const applyPricePreset = (min: string, max: string) => {
    setFilterMinPrice(min);
    setFilterMaxPrice(max);
  };

  // Apply filters
  const handleApplyFilters = () => {
    setAppliedFilters({
      minCostPrice: filterMinPrice ? Number(filterMinPrice) : undefined,
      maxCostPrice: filterMaxPrice ? Number(filterMaxPrice) : undefined,
      businessTypeIds:
        filterBusinessTypeIds.length > 0 ? filterBusinessTypeIds : undefined,
      status: filterStatus || undefined,
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterMinPrice("");
    setFilterMaxPrice("");
    setFilterBusinessTypeIds([]);
    setFilterStatus("");
    setAppliedFilters({});
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="text-gray-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {isLocationLoading
                  ? `Địa điểm #${locationId}`
                  : location?.name || `Địa điểm #${locationId}`}
              </p>
              <p className="text-sm text-gray-600">
                Quản lý sản phẩm tại địa điểm kinh doanh
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">
        {/* Location Info Card */}

        {/* Search and Actions Bar */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <Input
                type="text"
                placeholder="Tìm kiếm sản phẩm hoặc quét mã vạch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-12"
              />

              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                onClick={() => {
                  setScanTarget("search");
                  setScanOpen(true);
                }}
                title="Quét mã để tìm kiếm"
              >
                <ScanLine className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Action Buttons */}
            <Button
              variant={isFilterOpen ? "default" : "outline"}
              className={
                isFilterOpen
                  ? "bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter className="w-4 h-4 mr-2" />
              Lọc
              {activeFilterCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-white text-[#23C4C1]">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              onClick={() =>
                router.push(
                  `/dashboard/imports/create?locationId=${locationId}`,
                )
              }
            >
              <Upload className="w-4 h-4 mr-2" />
              Nhập Kho
            </Button>
            <Button
              onClick={() =>
                router.push(`/dashboard/locations/${locationId}/products/new`)
              }
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {isFilterOpen && (
          <div className="bg-white rounded-xl border border-gray-100 shadow-md shadow-gray-200/50 p-6 mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#23C4C1]" />
                Bộ lọc nâng cao
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 px-2 text-xs font-medium transition-colors"
                title="Xóa toàn bộ bộ lọc"
              >
                Làm mới
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Option 1: Price Range */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                  Khoảng giá vốn
                </Label>

                {/* Preset chips */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { label: "Dưới 50k", min: "0", max: "49999" },
                    { label: "50k – 100k", min: "50000", max: "100000" },
                    { label: "100k – 500k", min: "100000", max: "500000" },
                    { label: "Trên 500k", min: "500000", max: "" },
                  ].map((preset) => {
                    const isActive =
                      filterMinPrice === preset.min &&
                      filterMaxPrice === preset.max;
                    return (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          isActive
                            ? applyPricePreset("", "")
                            : applyPricePreset(preset.min, preset.max)
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-all duration-150 active:scale-95 ${
                          isActive
                            ? "bg-[#23C4C1] text-white border-[#23C4C1] shadow-sm"
                            : "bg-white text-gray-500 border-gray-200 hover:border-[#23C4C1]/60 hover:text-[#23C4C1]"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                {/* Custom range */}
                <div className="flex items-center gap-2 bg-gray-50/50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">
                      ₫
                    </span>
                    <Input
                      type="number"
                      placeholder="Từ"
                      min={0}
                      value={filterMinPrice}
                      onChange={(e) => setFilterMinPrice(e.target.value)}
                      className="pl-7 h-9 text-sm bg-white border-gray-200 focus-visible:ring-[#23C4C1]/20 focus-visible:border-[#23C4C1] transition-all text-right pr-2"
                    />
                  </div>
                  <span className="text-gray-300 text-sm font-light">—</span>
                  <div className="flex-1 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium pointer-events-none">
                      ₫
                    </span>
                    <Input
                      type="number"
                      placeholder="Đến"
                      min={0}
                      value={filterMaxPrice}
                      onChange={(e) => setFilterMaxPrice(e.target.value)}
                      className="pl-7 h-9 text-sm bg-white border-gray-200 focus-visible:ring-[#23C4C1]/20 focus-visible:border-[#23C4C1] transition-all text-right pr-2"
                    />
                  </div>
                </div>

                {filterMinPrice &&
                  filterMaxPrice &&
                  Number(filterMinPrice) > Number(filterMaxPrice) && (
                    <p className="text-[10px] text-red-500 font-medium flex items-center gap-1 animate-pulse">
                      <AlertTriangle className="w-3 h-3" />
                      Giá tối thiểu không được lớn hơn tối đa
                    </p>
                  )}
              </div>

              {/* Option 2: Business Type Tags - multi-select */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    Loại hình kinh doanh
                  </Label>
                  {filterBusinessTypeIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterBusinessTypeIds([])}
                      className="text-[10px] text-gray-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
                    >
                      <X className="w-2.5 h-2.5" /> Bỏ chọn
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 p-3 bg-gray-50/50 rounded-lg border border-gray-100 min-h-[82px] content-start">
                  {businessTypes.map((bt) => {
                    const isSelected = filterBusinessTypeIds.includes(
                      bt.businessTypeId,
                    );
                    return (
                      <button
                        key={bt.businessTypeId}
                        type="button"
                        onClick={() => toggleBusinessType(bt.businessTypeId)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all duration-200 active:scale-95 flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-[#23C4C1] text-white border-[#23C4C1] shadow-sm shadow-[#23C4C1]/30"
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#23C4C1]/50 hover:bg-[#23C4C1]/5"
                        }`}
                      >
                        {isSelected && (
                          <span className="inline-block w-3.5 h-3.5 rounded-full bg-white/30 flex items-center justify-center">
                            ✓
                          </span>
                        )}
                        {bt.name}
                      </button>
                    );
                  })}
                </div>
                {filterBusinessTypeIds.length > 0 && (
                  <p className="text-[10px] text-[#23C4C1] font-medium">
                    Đã chọn {filterBusinessTypeIds.length} loại hình
                  </p>
                )}
              </div>

              {/* Option 3: Status Filter */}
              <div className="space-y-3">
                <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                  Trạng thái
                </Label>
                <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200/50 relative">
                  {[
                    { value: "", label: "Tất cả" },
                    { value: "active", label: "Đang bán" },
                    { value: "inactive", label: "Ngừng bán" },
                  ].map((opt) => {
                    const isActive = filterStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFilterStatus(opt.value)}
                        className={`flex-1 py-2 text-xs font-medium rounded-md transition-all duration-200 relative z-10 ${
                          isActive
                            ? "text-[#23C4C1] bg-white shadow-sm ring-1 ring-gray-200"
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Filter Actions */}
            <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsFilterOpen(false);
                  /* Optional: revert changes if cancel */
                }}
                className="text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-gray-800 px-5"
              >
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={handleApplyFilters}
                disabled={
                  !!(
                    filterMinPrice &&
                    filterMaxPrice &&
                    Number(filterMinPrice) > Number(filterMaxPrice)
                  )
                }
                className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white px-8 shadow-md shadow-[#23C4C1]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Áp dụng bộ lọc
              </Button>
            </div>
          </div>
        )}

        {/* Active Filters Summary - Chips */}
        {activeFilterCount > 0 && !isFilterOpen && (
          <div className="flex items-center gap-2 mb-6 flex-wrap animate-in fade-in duration-300 pl-1">
            <span className="text-xs font-medium text-gray-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Đang áp dụng:
            </span>

            {appliedFilters.minCostPrice !== undefined && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-1 px-2.5 font-normal flex items-center gap-1.5 shadow-sm"
              >
                <span>
                  Giá từ:{" "}
                  <span className="font-semibold">
                    {appliedFilters.minCostPrice.toLocaleString()}đ
                  </span>
                </span>
                <button
                  onClick={() => {
                    setFilterMinPrice("");
                    setAppliedFilters((prev) => ({
                      ...prev,
                      minCostPrice: undefined,
                    }));
                  }}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {appliedFilters.maxCostPrice !== undefined && (
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 text-xs py-1 px-2.5 font-normal flex items-center gap-1.5 shadow-sm"
              >
                <span>
                  Giá đến:{" "}
                  <span className="font-semibold">
                    {appliedFilters.maxCostPrice.toLocaleString()}đ
                  </span>
                </span>
                <button
                  onClick={() => {
                    setFilterMaxPrice("");
                    setAppliedFilters((prev) => ({
                      ...prev,
                      maxCostPrice: undefined,
                    }));
                  }}
                  className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            {appliedFilters.businessTypeIds &&
              appliedFilters.businessTypeIds.length > 0 && (
                <Badge
                  variant="outline"
                  className="bg-purple-50 text-purple-700 border-purple-200 text-xs py-1 px-2.5 font-normal flex items-center gap-1.5 shadow-sm"
                >
                  <span>
                    Loại:{" "}
                    <span className="font-semibold">
                      {appliedFilters.businessTypeIds
                        .map(
                          (id) =>
                            businessTypes.find((bt) => bt.businessTypeId === id)
                              ?.name,
                        )
                        .filter(Boolean)
                        .join(", ")}
                    </span>
                  </span>
                  <button
                    onClick={() => {
                      setFilterBusinessTypeIds([]);
                      setAppliedFilters((prev) => ({
                        ...prev,
                        businessTypeIds: undefined,
                      }));
                    }}
                    className="hover:bg-purple-100 rounded-full p-0.5 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              )}

            {appliedFilters.status && (
              <Badge
                variant="outline"
                className="bg-green-50 text-green-700 border-green-200 text-xs py-1 px-2.5 font-normal flex items-center gap-1.5 shadow-sm"
              >
                <span>
                  Trạng thái:{" "}
                  <span className="font-semibold">
                    {appliedFilters.status === "active"
                      ? "Đang bán"
                      : "Ngừng bán"}
                  </span>
                </span>
                <button
                  onClick={() => {
                    setFilterStatus("");
                    setAppliedFilters((prev) => ({
                      ...prev,
                      status: undefined,
                    }));
                  }}
                  className="hover:bg-green-100 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleResetFilters();
                setIsFilterOpen(false);
              }}
              className="h-6 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 ml-2 px-2"
            >
              Xóa tất cả
            </Button>
          </div>
        )}

        {/* Draft Import Note Alert */}
        {draftCount > 0 && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600 shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-blue-900">
                  1 phiếu nhập kho nháp
                </span>
                <button
                  className="ml-2 text-sm text-blue-700 hover:text-blue-900 underline font-normal"
                  onClick={() =>
                    router.push(
                      `/dashboard/locations/${locationId}/inventory/new?draft=1`,
                    )
                  }
                >
                  Xem và chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="bg-white rounded-lg border border-gray-200 py-20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
            <span className="ml-3 text-gray-500">Đang tải sản phẩm...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
              <span className="text-sm font-medium text-red-800">
                Không thể tải danh sách sản phẩm. Vui lòng thử lại.
              </span>
            </div>
          </div>
        )}

        {/* Products Table */}
        {!isLoading && (
          <ProductManagementTable
            products={filteredProducts}
            locationId={locationId}
            statusUpdating={updateStatusMutation.isPending}
            deleteUpdating={deleteProductMutation.isPending}
            onToggleStatus={(product) => {
              updateStatusMutation.mutate({
                productId: product.productId,
                data: {
                  status: product.status === "active" ? "inactive" : "active",
                },
              });
            }}
            onDelete={(product) =>
              setDeleteTarget({
                productId: product.productId,
                name: product.productName || product.name,
              })
            }
          />
        )}
      </main>

      {/* Dialog Thêm Sản Phẩm */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) {
            setNewProduct(EMPTY_NEW_PRODUCT);
            setCreateError(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-[#23C4C1]" />
              Thêm sản phẩm mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Error */}
            {createError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            {/* Tên sản phẩm */}
            <div className="space-y-1.5">
              <Label
                htmlFor="np-name"
                className="text-sm font-medium text-gray-700"
              >
                Tên sản phẩm <span className="text-red-500">*</span>
              </Label>
              <Input
                id="np-name"
                placeholder="VD: Nước suối Lavie 500ml"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
            </div>

            {/* SKU / Mã vạch */}
            <div className="space-y-1.5">
              <Label
                htmlFor="np-sku"
                className="text-sm font-medium text-gray-700"
              >
                SKU / Mã vạch
              </Label>
              <div className="relative">
                <Input
                  id="np-sku"
                  placeholder="Nhập hoặc quét mã vạch"
                  value={newProduct.sku}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, sku: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                  onClick={() => {
                    setScanTarget("newProductBarcode");
                    setScanOpen(true);
                  }}
                  title="Quét mã vạch"
                >
                  <ScanLine className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Loại hình kinh doanh */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-gray-700">
                Loại hình kinh doanh <span className="text-red-500">*</span>
              </Label>
              <Select
                value={newProduct.businessTypeId}
                onValueChange={(val) =>
                  setNewProduct({ ...newProduct, businessTypeId: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn loại hình kinh doanh" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map((bt) => (
                    <SelectItem
                      key={bt.businessTypeId}
                      value={bt.businessTypeId}
                    >
                      {bt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Đơn vị & Số lượng */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label
                  htmlFor="np-unit"
                  className="text-sm font-medium text-gray-700"
                >
                  Đơn vị <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="np-unit"
                  placeholder="cái"
                  value={newProduct.unit}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, unit: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="np-stock"
                  className={`text-sm font-medium ${newProduct.trackInventory ? "text-gray-700" : "text-gray-400"}`}
                >
                  Số lượng ban đầu
                </Label>
                <Input
                  id="np-stock"
                  type="number"
                  min={0}
                  placeholder={newProduct.trackInventory ? "0" : "—"}
                  value={newProduct.stock}
                  disabled={!newProduct.trackInventory}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock: Number(e.target.value),
                    })
                  }
                  className={
                    !newProduct.trackInventory
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  }
                />
                {!newProduct.trackInventory && (
                  <p className="text-xs text-gray-400">
                    Sản phẩm này không theo dõi số lượng.
                  </p>
                )}
              </div>
            </div>

            {/* Giá vốn */}
            <div className="space-y-1.5">
              <Label
                htmlFor="np-cost"
                className="text-sm font-medium text-gray-700"
              >
                Giá vốn (₫)
              </Label>
              <Input
                id="np-cost"
                type="number"
                min={0}
                placeholder="0"
                value={newProduct.costPrice}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    costPrice: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* Bảng giá bán (PriceTiers) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Bảng giá bán <span className="text-red-500">*</span>
                </Label>
                <button
                  type="button"
                  className="text-xs text-[#23C4C1] hover:text-[#1da8a5] font-medium"
                  onClick={() =>
                    setNewProduct({
                      ...newProduct,
                      priceTiers: [
                        ...newProduct.priceTiers,
                        { unit: newProduct.unit, quantity: 1, price: 0 },
                      ],
                    })
                  }
                >
                  + Thêm giá bán
                </button>
              </div>
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">
                        Đơn vị
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">
                        SL tối thiểu
                      </th>
                      <th className="text-left py-2 px-3 font-medium text-gray-600 text-xs">
                        Giá (₫)
                      </th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {newProduct.priceTiers.map((tier, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 px-2">
                          <Input
                            placeholder={newProduct.unit || "cái"}
                            className="h-8 text-sm"
                            value={tier.unit}
                            onChange={(e) => {
                              const updated = [...newProduct.priceTiers];
                              updated[idx] = {
                                ...updated[idx],
                                unit: e.target.value,
                              };
                              setNewProduct({
                                ...newProduct,
                                priceTiers: updated,
                              });
                            }}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <Input
                            type="number"
                            min={1}
                            className="h-8 text-sm"
                            value={tier.quantity}
                            onChange={(e) => {
                              const updated = [...newProduct.priceTiers];
                              updated[idx] = {
                                ...updated[idx],
                                quantity: Number(e.target.value),
                              };
                              setNewProduct({
                                ...newProduct,
                                priceTiers: updated,
                              });
                            }}
                          />
                        </td>
                        <td className="py-1.5 px-2">
                          <Input
                            type="number"
                            min={0}
                            className="h-8 text-sm"
                            value={tier.price}
                            onChange={(e) => {
                              const updated = [...newProduct.priceTiers];
                              updated[idx] = {
                                ...updated[idx],
                                price: Number(e.target.value),
                              };
                              setNewProduct({
                                ...newProduct,
                                priceTiers: updated,
                              });
                            }}
                          />
                        </td>
                        <td className="py-1.5 px-1 text-center">
                          {newProduct.priceTiers.length > 1 && (
                            <button
                              type="button"
                              className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500"
                              onClick={() => {
                                const updated = newProduct.priceTiers.filter(
                                  (_, i) => i !== idx,
                                );
                                setNewProduct({
                                  ...newProduct,
                                  priceTiers: updated,
                                });
                              }}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Nhà sản xuất */}
            <div className="space-y-1.5">
              <Label
                htmlFor="np-manufacturer"
                className="text-sm font-medium text-gray-700"
              >
                Nhà sản xuất / Thương hiệu
              </Label>
              <Input
                id="np-manufacturer"
                placeholder="VD: Nestlé, Vinamilk..."
                value={newProduct.manufacturer}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, manufacturer: e.target.value })
                }
              />
            </div>

            {/* Theo dõi số lượng */}
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  Theo dõi số lượng
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Bật cho hàng hóa có thể đếm số lượng. Tắt cho F&B/dịch vụ.
                </p>
              </div>
              <Switch
                checked={newProduct.trackInventory}
                onCheckedChange={(checked) =>
                  setNewProduct({
                    ...newProduct,
                    trackInventory: checked,
                    stock: checked ? newProduct.stock : 0,
                  })
                }
                className="data-[state=checked]:bg-[#23C4C1]"
              />
            </div>
          </div>

          <DialogFooter className="border-t pt-4 gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewProduct(EMPTY_NEW_PRODUCT);
                setCreateError(null);
              }}
              disabled={createProductMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              disabled={
                createProductMutation.isPending ||
                !newProduct.name.trim() ||
                !newProduct.unit.trim() ||
                !newProduct.businessTypeId ||
                newProduct.priceTiers.length === 0 ||
                newProduct.priceTiers.every((t) => t.price <= 0)
              }
              onClick={async () => {
                setCreateError(null);
                try {
                  const normalizedBaseUnit = newProduct.unit
                    .trim()
                    .toLowerCase();
                  const normalizedPriceTiers = newProduct.priceTiers
                    .map((t) => ({
                      unit: t.unit.trim(),
                      quantity: t.quantity,
                      price: t.price,
                    }))
                    .filter(
                      (t) =>
                        t.unit.length > 0 &&
                        t.price > 0 &&
                        t.unit.toLowerCase() !== normalizedBaseUnit,
                    );

                  const baseTier = newProduct.priceTiers.find(
                    (t) =>
                      t.price > 0 &&
                      t.quantity === 1 &&
                      t.unit.trim().toLowerCase() === normalizedBaseUnit,
                  );

                  const result = await createProductMutation.mutateAsync({
                    locationId: Number(locationId),
                    businessTypeId: newProduct.businessTypeId,
                    name: newProduct.name.trim(),
                    sku: newProduct.sku.trim() || undefined,
                    trackInventory: newProduct.trackInventory,
                    unit: newProduct.unit.trim(),
                    sellingPrice:
                      baseTier?.price ||
                      newProduct.priceTiers.find((t) => t.price > 0)?.price ||
                      0,
                    costPrice: newProduct.costPrice,
                    stock: newProduct.trackInventory ? newProduct.stock : 0,
                    manufacturer: newProduct.manufacturer.trim() || undefined,
                    priceTiers: normalizedPriceTiers,
                  });
                  if (result.success) {
                    setIsAddDialogOpen(false);
                    setNewProduct(EMPTY_NEW_PRODUCT);
                  } else {
                    setCreateError(result.message || "Không thể tạo sản phẩm");
                  }
                } catch (err) {
                  setCreateError(
                    err instanceof Error
                      ? err.message
                      : "Đã xảy ra lỗi khi tạo sản phẩm",
                  );
                }
              }}
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
            >
              {createProductMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Thêm sản phẩm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BarcodeScanModal
        open={scanOpen}
        onOpenChange={setScanOpen}
        title="Quét mã vạch"
        description="Quét xong sẽ tự điền vào ô đang chọn."
        onScanned={(code) => {
          if (scanTarget === "search") {
            setSearchQuery(code);
            return;
          }
          setNewProduct((prev) => ({ ...prev, sku: code }));
        }}
      />

      {/* Alert Dialog xác nhận xóa */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa sản phẩm{" "}
              <span className="font-semibold">{deleteTarget?.name}</span>? Hành
              động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteProductMutation.isPending}
              onClick={() => {
                if (!deleteTarget) return;
                deleteProductMutation.mutate(deleteTarget.productId, {
                  onSuccess: () => setDeleteTarget(null),
                });
              }}
            >
              {deleteProductMutation.isPending ? "Đang xóa..." : "Xóa"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
