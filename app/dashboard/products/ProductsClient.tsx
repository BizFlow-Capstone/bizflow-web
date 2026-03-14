"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Loader2,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useProducts,
  useUpdateProductStatus,
  useDeleteProduct,
} from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import type { ProductFilters } from "@/lib/types/product";
import ProductManagementTable from "@/components/products/ProductManagementTable";

// --- Main Component ---

export default function ProductsClient() {
  // Location selector
  const { data: locations = [], isLoading: isLoadingLocations } =
    useLocations();
  const { selectedLocationId } = useDashboardLocation();

  // Mutations
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();

  // Auto-select first location
  const locationId = useMemo(() => {
    if (selectedLocationId) return selectedLocationId;
    if (locations.length > 0) return locations[0].id;
    return null;
  }, [selectedLocationId, locations]);

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 15;

  // Build filters
  const filters: ProductFilters = useMemo(
    () => ({
      locationId: locationId ?? 0,
      ...(statusFilter !== "all" && { status: statusFilter }),
      pageNumber,
      pageSize,
    }),
    [locationId, statusFilter, pageNumber],
  );

  // Data fetching
  const {
    data: productData,
    isLoading,
    isRefetching,
    error,
    refetch,
  } = useProducts(filters);

  const products = useMemo(() => productData?.items ?? [], [productData]);
  const totalCount = productData?.totalCount ?? 0;
  const totalPages = productData?.totalPages ?? 0;
  const hasPreviousPage = productData?.hasPreviousPage ?? false;
  const hasNextPage = productData?.hasNextPage ?? false;

  // Client-side search
  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const q = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.productName?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.manufacturer?.toLowerCase().includes(q),
    );
  }, [products, searchQuery]);

  // No location selected
  if (!isLoadingLocations && locations.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Chưa có địa điểm kinh doanh
          </h3>
          <p className="text-gray-500 mt-1">
            Vui lòng tạo địa điểm kinh doanh trước khi quản lý sản phẩm.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 pt-6 flex justify-end">
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isRefetching}
          className="gap-2 bg-white"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Làm mới
        </Button>
      </div>

      <main className="flex-1 p-8 bg-gray-50">
        {/* Filters & Search */}
        <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-2">
          <div className="flex p-1 bg-gray-100/50 rounded-lg sm:w-auto w-full">
            {(
              [
                { key: "all", label: "Tất cả" },
                { key: "active", label: "Đang bán" },
                { key: "inactive", label: "Ngừng bán" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPageNumber(1);
                }}
                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  statusFilter === tab.key
                    ? "bg-white text-[#23C4C1] shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 flex items-center relative">
            <Search className="w-4 h-4 absolute left-4 text-gray-400 z-10 pointer-events-none" />
            <Input
              type="text"
              placeholder="Tìm theo tên, SKU, nhà sản xuất..."
              className="pl-10 border-0 rounded-none focus:border-0 focus:ring-0 shadow-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
            <span className="ml-3 text-gray-600">Đang tải sản phẩm...</span>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-red-300">
            <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {error instanceof Error
                ? error.message
                : "Không thể tải sản phẩm"}
            </h3>
            <Button
              onClick={() => refetch()}
              className="mt-4 bg-[#23C4C1] hover:bg-[#1da8a5]"
            >
              Thử lại
            </Button>
          </div>
        )}

        {/* Product Table */}
        {!isLoading && !error && (
          <>
            <ProductManagementTable
              products={filteredProducts}
              locationId={locationId ?? 0}
              statusUpdating={updateStatusMutation.isPending}
              deleteUpdating={deleteProductMutation.isPending}
              emptyTitle={
                products.length === 0
                  ? "Chưa có sản phẩm nào"
                  : "Không tìm thấy kết quả"
              }
              emptyDescription={
                products.length === 0
                  ? "Thêm sản phẩm từ trang chi tiết địa điểm kinh doanh."
                  : "Thử tìm kiếm với từ khóa khác."
              }
              onToggleStatus={(product) => {
                updateStatusMutation.mutate({
                  productId: product.productId,
                  data: {
                    status: product.status === "active" ? "inactive" : "active",
                  },
                });
              }}
              onDelete={(product) => {
                const confirmed = window.confirm(
                  `Bạn có chắc muốn xóa sản phẩm \"${product.name}\"?`,
                );
                if (!confirmed) return;

                deleteProductMutation.mutate(product.productId);
              }}
            />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-x border-b border-gray-200 rounded-b-lg bg-white">
                <p className="text-sm text-gray-600">
                  Trang {pageNumber} / {totalPages} — Tổng {totalCount} sản phẩm
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
          </>
        )}
      </main>
    </div>
  );
}
