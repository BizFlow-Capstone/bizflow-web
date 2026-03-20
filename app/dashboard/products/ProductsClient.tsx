"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Search,
  ScanLine,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Product } from "@/lib/types/product";
import {
  useProducts,
  useUpdateProductStatus,
  useDeleteProduct,
  useAdjustProductStock,
} from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import type { ProductFilters } from "@/lib/types/product";
import ProductManagementTable from "@/components/products/ProductManagementTable";
import { BarcodeScanModal } from "@/components/BarcodeScanModal";
import StockAdjustmentDialog from "@/components/products/StockAdjustmentDialog";
import NoLocationScreenSkeleton from "@/components/NoLocationScreenSkeleton";

// --- Main Component ---

export default function ProductsClient() {
  // Location selector
  const { data: locations = [], isLoading: isLoadingLocations } =
    useLocations();
  const { selectedLocationId } = useDashboardLocation();
  const hasLocations = locations.length > 0;

  // Mutations
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();
  const adjustStockMutation = useAdjustProductStock();

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  // Stock adjustment dialog state
  const [stockTarget, setStockTarget] = useState<Product | null>(null);

  // Auto-select a valid location from the current location list.
  const locationId = useMemo(() => {
    if (!hasLocations) return null;

    if (
      selectedLocationId &&
      locations.some((location) => location.id === selectedLocationId)
    ) {
      return selectedLocationId;
    }

    if (locations.length > 0) return locations[0].id;
    return null;
  }, [selectedLocationId, locations, hasLocations]);

  // Filter & search state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 15;

  // Debounce search to avoid sending a request on each keystroke
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setPageNumber(1);
  }, [debouncedSearchQuery]);

  // Build filters
  const filters: ProductFilters = useMemo(
    () => ({
      locationId: locationId ?? 0,
      ...(debouncedSearchQuery && { search: debouncedSearchQuery }),
      ...(statusFilter !== "all" && { status: statusFilter }),
      pageNumber,
      pageSize,
    }),
    [locationId, debouncedSearchQuery, statusFilter, pageNumber],
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
        title="Sản phẩm"
        description="Đang chờ bạn tạo địa điểm hoặc nhận lời mời trước khi tải dữ liệu."
      />
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
              placeholder="Tìm theo tên sản phẩm hoặc mã SKU..."
              className="pl-10 pr-12 border-0 rounded-none focus:border-0 focus:ring-0 shadow-none bg-transparent"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
              onClick={() => setScanOpen(true)}
              title="Quét mã vạch để tìm kiếm"
            >
              <ScanLine className="w-5 h-5 text-gray-500" />
            </button>
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
              products={products}
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
              onDelete={(product) => setDeleteTarget(product)}
              onAdjustStock={(product) => setStockTarget(product)}
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

        <BarcodeScanModal
          open={scanOpen}
          onOpenChange={setScanOpen}
          title="Quét mã vạch sản phẩm"
          description="Quét xong sẽ tự điền vào ô tìm kiếm để tìm theo SKU."
          onScanned={(code) => {
            setSearchQuery(code);
            setPageNumber(1);
          }}
        />

        {/* Stock Adjustment Dialog */}
        <StockAdjustmentDialog
          product={stockTarget}
          open={!!stockTarget}
          onOpenChange={(open) => {
            if (!open) setStockTarget(null);
          }}
          isPending={adjustStockMutation.isPending}
          onConfirm={(productId, data) => {
            adjustStockMutation.mutate(
              { productId, data },
              { onSuccess: () => setStockTarget(null) },
            );
          }}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog
          open={!!deleteTarget}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
              <AlertDialogDescription>
                Bạn có chắc muốn xóa sản phẩm{" "}
                <span className="font-semibold">{deleteTarget?.name}</span>?
                Hành động này không thể hoàn tác.
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
      </main>
    </div>
  );
}
