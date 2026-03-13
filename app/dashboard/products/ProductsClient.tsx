"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import {
  Search,
  Loader2,
  RefreshCw,
  Package,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import type { ProductFilters } from "@/lib/types/product";

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// --- Main Component ---

export default function ProductsClient() {
  // Location selector
  const { data: locations = [], isLoading: isLoadingLocations } =
    useLocations();
  const { selectedLocationId } = useDashboardLocation();

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
      PageNumber: pageNumber,
      PageSize: pageSize,
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
        {!isLoading && !error && filteredProducts.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-700 w-16">
                    Ảnh
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Sản phẩm
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    SKU
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Đơn vị
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Giá bán
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-right">
                    Giá vốn
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">
                    Tồn kho
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700 text-center">
                    Trạng thái
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow
                    key={product.productId}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <TableCell>
                      {product.imageUrl ? (
                        <Image
                          src={product.imageUrl}
                          alt={product.productName || product.name}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {product.productName || product.name}
                        </p>
                        {product.manufacturer && (
                          <p className="text-xs text-gray-500">
                            {product.manufacturer}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 font-mono">
                      {product.sku || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {product.unit || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold text-gray-800">
                      {formatCurrency(product.sellingPrice || product.price)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-gray-600">
                      {product.costPrice
                        ? formatCurrency(product.costPrice)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {product.trackInventory ? (
                        <Badge
                          variant="outline"
                          className={
                            product.stock <= 0
                              ? "bg-red-50 text-red-700 border-red-200"
                              : product.stock <= 10
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                          }
                        >
                          {product.stock}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={
                          product.status === "active"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }
                      >
                        {product.status === "active" ? "Đang bán" : "Ngừng bán"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
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
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {products.length === 0
                ? "Chưa có sản phẩm nào"
                : "Không tìm thấy kết quả"}
            </h3>
            <p className="text-gray-500 mt-1">
              {products.length === 0
                ? "Thêm sản phẩm từ trang chi tiết địa điểm kinh doanh."
                : "Thử tìm kiếm với từ khóa khác."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
