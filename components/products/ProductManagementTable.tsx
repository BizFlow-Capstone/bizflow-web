"use client";

import { useState, Fragment } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Info,
  MoreVertical,
  Package,
  Pencil,
  Warehouse,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Product } from "@/lib/types/product";
import SaleItemPricePanel from "@/components/products/SaleItemPricePanel";

type ProductManagementTableProps = {
  products: Product[];
  locationId: string | number;
  onToggleStatus: (product: Product) => void;
  onDelete: (product: Product) => void;
  onAdjustStock?: (product: Product) => void;
  statusUpdating?: boolean;
  deleteUpdating?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
};

export default function ProductManagementTable({
  products,
  locationId,
  onToggleStatus,
  onDelete,
  onAdjustStock,
  statusUpdating = false,
  deleteUpdating = false,
  emptyTitle = "Không tìm thấy sản phẩm",
  emptyDescription = "Thử thay đổi từ khóa hoặc thêm sản phẩm mới",
}: ProductManagementTableProps) {
  const router = useRouter();
  const [expandedProductId, setExpandedProductId] = useState<number | null>(
    null,
  );

  function toggleExpand(productId: number) {
    setExpandedProductId((prev) => (prev === productId ? null : productId));
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="font-semibold text-gray-700">
              Sản phẩm
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Tồn kho
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Giá bán
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Trạng thái
            </TableHead>
            <TableHead className="font-semibold text-gray-700">
              Thao tác
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length > 0 ? (
            products.map((product) => (
              <Fragment key={product.productId}>
                <TableRow
                  className={`hover:bg-gray-50 ${product.status !== "active" ? "opacity-50 bg-gray-50/50" : ""}`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleExpand(product.productId)}
                        className="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Xem bảng giá bán"
                      >
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            expandedProductId === product.productId
                              ? "rotate-180 text-indigo-500"
                              : ""
                          }`}
                        />
                      </button>
                      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`font-medium ${product.status === "active" ? "text-gray-900" : "text-gray-500"}`}
                        >
                          {product.productName || product.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          SKU: {product.sku || "—"}
                        </span>
                        {product.status !== "active" && (
                          <span className="text-xs text-gray-500">Đã ẩn</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-medium ${product.stock <= 10 ? "text-orange-600" : "text-gray-900"}`}
                      >
                        {product.stock}
                      </span>
                      {product.stock <= 10 && product.status === "active" && (
                        <Badge
                          variant="secondary"
                          className="bg-orange-100 text-[#BB4D00] hover:bg-orange-100 text-xs"
                        >
                          Sắp hết
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-gray-900">
                    {(product.sellingPrice || product.price).toLocaleString()}đ
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(
                              `/dashboard/locations/${locationId}/products/${product.productId}`,
                            );
                          }}
                          className="cursor-pointer"
                        >
                          <Info className="w-4 h-4 mr-2" />
                          <span>Xem chi tiết</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            router.push(
                              `/dashboard/locations/${locationId}/products/new?productId=${product.productId}`,
                            );
                          }}
                          className="cursor-pointer"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          <span>Sửa sản phẩm</span>
                        </DropdownMenuItem>
                        {onAdjustStock && (
                          <DropdownMenuItem
                            onClick={() => onAdjustStock(product)}
                            className="cursor-pointer"
                          >
                            <Warehouse className="w-4 h-4 mr-2" />
                            <span>Điều chỉnh tồn kho</span>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          disabled={statusUpdating}
                          onClick={() => onToggleStatus(product)}
                          className="cursor-pointer"
                        >
                          {product.status === "active" ? (
                            <>
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              <span>Ngừng bán</span>
                            </>
                          ) : (
                            <>
                              <Package className="w-4 h-4 mr-2" />
                              <span>Kích hoạt lại</span>
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={deleteUpdating}
                          onClick={() => onDelete(product)}
                          className="cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <AlertTriangle className="w-4 h-4 mr-2" />
                          <span>Xóa sản phẩm</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                {expandedProductId === product.productId && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-0">
                      <SaleItemPricePanel productId={product.productId} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-12 text-gray-500"
              >
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium">{emptyTitle}</p>
                <p className="text-sm">{emptyDescription}</p>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
