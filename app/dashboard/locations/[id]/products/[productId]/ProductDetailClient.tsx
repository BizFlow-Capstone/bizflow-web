"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Pencil,
  Package,
  Loader2,
  Trash2,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  useProducts,
  useProductSaleItems,
  useUpdateProductStatus,
  useDeleteProduct,
} from "@/hooks/useProducts";

function formatVnd(value: number): string {
  return `${value.toLocaleString("vi-VN")}đ`;
}

function BarcodeVisual({ value }: { value: string }) {
  return (
    <div className="w-65 select-none">
      <div className="h-18.5 w-full rounded-md border bg-white p-2">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #111 0 2px, transparent 2px 4px, #111 4px 5px, transparent 5px 7px)",
          }}
        />
      </div>
      <div className="mt-1 text-center font-mono text-[12px] tracking-[0.22em] text-gray-700">
        {value}
      </div>
    </div>
  );
}

/**
 * ProductDetailClient - Client Component for Product Detail
 *
 * Data Flow: UI → TanStack Query Hook → Service → API Route → Backend
 * Uses original UI layout with real API data
 */
export default function ProductDetailClient({
  locationId,
  productId,
}: {
  locationId: string;
  productId: string;
}) {
  const router = useRouter();
  const productIdNum = Number(productId);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Mutations
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();

  // Fetch product from the products list
  const {
    data: productData,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProducts({
    locationId: Number(locationId),
    pageSize: 100,
  });

  // Find current product from the list
  const product = productData?.items.find((p) => p.productId === productIdNum);

  // Fetch sale items for this product
  const { data: saleItemsData, isLoading: isLoadingSaleItems } =
    useProductSaleItems(productIdNum);

  const saleItems = saleItemsData?.saleItems ?? [];

  const isLoading = isLoadingProduct || isLoadingSaleItems;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#23C4C1] mx-auto" />
          <p className="mt-3 text-gray-500">Đang tải thông tin sản phẩm...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="border-b bg-white w-full mx-auto">
          <div className="mx-auto flex w-full items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild>
                <Link
                  href={`/dashboard/locations/${locationId}`}
                  aria-label="Quay lại"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-lg font-semibold text-gray-900">Sản phẩm</h1>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full px-6 py-12 text-center">
          <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-700">
            Không tìm thấy sản phẩm
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Sản phẩm có thể đã bị xóa hoặc không tồn tại.
          </p>
          <Button asChild className="mt-4">
            <Link href={`/dashboard/locations/${locationId}`}>
              Quay lại danh sách
            </Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white w-full mx-auto">
        <div className="mx-auto flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link
                href={`/dashboard/locations/${locationId}`}
                aria-label="Quay lại"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <h1 className="text-lg font-semibold text-gray-900">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={
                product.status === "active"
                  ? "bg-green-50 text-green-700 ring-1 ring-green-600/20"
                  : "bg-gray-100 text-gray-600 ring-1 ring-gray-500/10"
              }
            >
              {product.status === "active" ? "Đang bán" : "Ngừng bán"}
            </Badge>

            <Button
              variant="outline"
              size="sm"
              disabled={updateStatusMutation.isPending}
              onClick={() =>
                updateStatusMutation.mutate({
                  productId: productIdNum,
                  data: {
                    status: product.status === "active" ? "inactive" : "active",
                  },
                })
              }
            >
              {updateStatusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <ToggleRight className="h-4 w-4 mr-1" />
                  {product.status === "active" ? "Ngừng bán" : "Kích hoạt"}
                </>
              )}
            </Button>

            <Button variant="outline" className="gap-2" asChild>
              <Link
                href={`/dashboard/locations/${locationId}/products/new?productId=${encodeURIComponent(
                  product.productId,
                )}`}
              >
                <Pencil className="h-4 w-4" />
                Chỉnh sửa
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Xóa
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full px-6 py-6">
        <div className="rounded-xl border bg-white p-6">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left */}
            <div className="lg:col-span-7">
              <div className="space-y-6">
                <section>
                  <div className="text-sm font-semibold text-gray-900">
                    Chi tiết sản phẩm
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-xs text-gray-500">Tên sản phẩm</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.name}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Mã sản phẩm</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        #{product.productId}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Trạng thái</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.status === "active" ? "Đang bán" : "Ngừng bán"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">
                        Theo dõi tồn kho
                      </div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        {product.trackInventory ? "Có" : "Không"}
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="text-sm font-semibold text-gray-900">
                    Nhà Cung Cấp
                  </div>

                  <div className="mt-4 space-y-4">
                    <div>
                      <div className="text-xs text-gray-500">
                        Tên Người Cung Cấp
                      </div>
                      <div className="mt-1 flex items-start gap-2 text-sm font-medium text-gray-900">
                        <Building2 className="h-4 w-4 text-gray-500 mt-0.5 shrink-0" />
                        <span>Chưa cập nhật</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Người liên hệ</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        —
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Địa chỉ</div>
                      <div className="mt-1 text-sm font-medium text-gray-900">
                        —
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <div className="text-sm font-semibold text-gray-900">
                    Quy đổi đơn vị
                  </div>
                  <div className="mt-4 space-y-3">
                    {saleItems.length > 0 ? (
                      saleItems.map((item) => (
                        <div
                          key={item.saleItemId}
                          className="rounded-lg bg-gray-50 px-4 py-3"
                        >
                          <div className="text-sm font-medium text-gray-900">
                            1 {item.unit} = {item.quantity} đơn vị cơ sở
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            Giá bán:
                          </div>
                          <div className="text-xs font-medium text-gray-900">
                            {formatVnd(item.price)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-500">
                        Chưa có quy đổi đơn vị nào
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Right */}
            <div className="lg:col-span-5">
              <div className="space-y-6">
                <div className="rounded-lg bg-white p-4">
                  <div className="relative mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-lg border bg-gray-50 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>

                  <div className="mt-4 space-y-3 border-t pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="text-gray-600">Tồn kho hiện tại</div>
                      <div className="font-semibold text-gray-900">
                        {product.stock}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm border-b pb-3">
                      <div className="text-gray-600">Theo dõi kho</div>
                      <div className="font-semibold text-gray-900">
                        {product.trackInventory ? "Có" : "Không"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4">
                  <div className="text-sm font-semibold text-gray-900">
                    Giá cả
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Giá bán</div>
                      <div className="font-semibold text-green-600">
                        {formatVnd(product.price)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <BarcodeVisual value={String(product.productId)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa sản phẩm{" "}
              <span className="font-semibold">{product.name}</span>? Hành động
              này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteProductMutation.isPending}
              onClick={() => {
                deleteProductMutation.mutate(productIdNum, {
                  onSuccess: () => {
                    router.push(`/dashboard/locations/${locationId}`);
                  },
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
