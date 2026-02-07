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
  MoreVertical,
  ArrowLeft,
  Package,
  Upload,
  Pencil,
  Info,
  ScanLine,
  AlertTriangle,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { BarcodeScanModal } from "@/components/BarcodeScanModal";
import {
  useProducts,
  useCreateProduct,
  useUpdateProductStatus,
  useDeleteProduct,
} from "@/hooks/useProducts";
import type { ProductFilters } from "@/lib/types/product";

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
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<"search" | "newProductBarcode">(
    "search",
  );
  const [newProduct, setNewProduct] = useState({
    name: "",
    image: "",
    barcode: "",
    unit: "cái",
    stock: 0,
    costPrice: 0,
    sellPrice: 0,
    isActive: true,
    canSell: true,
    minStock: 10,
    supplier: "",
  });
  const [deleteTarget, setDeleteTarget] = useState<{
    productId: number;
    name: string;
  } | null>(null);

  // Mutations
  const createProductMutation = useCreateProduct();
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();

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
    }),
    [locationId, debouncedSearch],
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

  const lowStockCount = useMemo(
    () =>
      products.filter(
        (product) => product.status === "active" && product.stock <= 10,
      ).length,
    [products],
  );

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
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
              <h1 className="text-2xl font-bold text-gray-800">
                Địa điểm #{locationId}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Quản lý sản phẩm tại địa điểm kinh doanh
              </p>
            </div>
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8 bg-gray-50">
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
              variant="outline"
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Lọc
            </Button>
            <Button
              variant="outline"
              className="border-blue-500 text-blue-600 hover:bg-blue-50"
              onClick={() =>
                router.push(`/dashboard/locations/${locationId}/inventory/new`)
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

        {/* Low Stock Alert */}
        {lowStockCount > 0 && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#BB4D00] shrink-0" />
              <div className="flex-1">
                <span className="text-sm font-medium text-[#7B3306]">
                  {lowStockCount} sản phẩm sắp hết hàng
                </span>
              </div>
            </div>
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
                    Theo dõi kho
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Trạng thái
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    Thao Tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <TableRow
                      key={product.productId}
                      className={`hover:bg-gray-50 ${product.status !== "active" ? "opacity-50 bg-gray-50/50" : ""}`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className="flex flex-col">
                            <span
                              className={`font-medium ${product.status === "active" ? "text-gray-900" : "text-gray-500"}`}
                            >
                              {product.name}
                            </span>
                            {product.status !== "active" && (
                              <span className="text-xs text-gray-500">
                                Đã ẩn
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              product.stock <= 10
                                ? "text-orange-600"
                                : "text-gray-900"
                            }`}
                          >
                            {product.stock}
                          </span>
                          {product.stock <= 10 &&
                            product.status === "active" && (
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
                        {product.price.toLocaleString()}đ
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            product.trackInventory
                              ? "bg-blue-50 text-blue-700"
                              : "bg-gray-100 text-gray-500"
                          }
                        >
                          {product.trackInventory ? "Có" : "Không"}
                        </Badge>
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
                          {product.status === "active"
                            ? "Đang bán"
                            : "Ngừng bán"}
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
                            <DropdownMenuItem
                              onClick={() => {
                                updateStatusMutation.mutate({
                                  productId: product.productId,
                                  data: {
                                    status:
                                      product.status === "active"
                                        ? "inactive"
                                        : "active",
                                  },
                                });
                              }}
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
                              onClick={() =>
                                setDeleteTarget({
                                  productId: product.productId,
                                  name: product.name,
                                })
                              }
                              className="cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              <span>Xóa sản phẩm</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-gray-500"
                    >
                      <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p className="font-medium">Không tìm thấy sản phẩm</p>
                      <p className="text-sm">
                        Thử thay đổi từ khóa hoặc thêm sản phẩm mới
                      </p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Dialog Thêm Sản Phẩm */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold text-gray-900">
              Thêm sản phẩm mới
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Hình ảnh sản phẩm */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">
                Hình ảnh sản phẩm
              </Label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Kéo thả ảnh vào đây</span>
                    </p>
                    <p className="text-xs text-gray-500">
                      hoặc nhấn để chọn ảnh
                    </p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" />
                </label>
              </div>
            </div>

            {/* Thông tin cơ bản */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Thông tin cơ bản
              </h3>

              {/* Tên sản phẩm */}
              <div className="space-y-2">
                <Label htmlFor="productName" className="text-sm text-gray-700">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="productName"
                  placeholder="Nhập tên sản phẩm"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, name: e.target.value })
                  }
                />
              </div>

              {/* Mã vạch */}
              <div className="space-y-2">
                <Label htmlFor="barcode" className="text-sm text-gray-700">
                  Mã vạch <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="barcode"
                    placeholder="Nhập hoặc quét mã vạch"
                    value={newProduct.barcode}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, barcode: e.target.value })
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
                    title="Quét mã sản phẩm"
                  >
                    <ScanLine className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Trạng thái */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Trạng thái
              </h3>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    Kích hoạt
                  </Label>
                  <p className="text-xs text-gray-500">
                    Sản phẩm có thể được bán
                  </p>
                </div>
                <Switch
                  checked={newProduct.isActive}
                  onCheckedChange={(checked) =>
                    setNewProduct({ ...newProduct, isActive: checked })
                  }
                  className="data-[state=checked]:bg-[#23C4C1]"
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    Tồn kho
                  </Label>
                  <p className="text-xs text-gray-500">
                    Quản lí tồn kho sản phẩm này
                  </p>
                </div>
                <Switch
                  checked={newProduct.canSell}
                  onCheckedChange={(checked) =>
                    setNewProduct({ ...newProduct, canSell: checked })
                  }
                  className="data-[state=checked]:bg-[#23C4C1]"
                />
              </div>
            </div>

            {/* Giá & Tồn kho */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Giá & Tồn kho
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice" className="text-sm text-gray-700">
                    Giá vốn
                  </Label>
                  <Input
                    id="costPrice"
                    type="number"
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

                <div className="space-y-2">
                  <Label htmlFor="sellPrice" className="text-sm text-gray-700">
                    Giá bán
                  </Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    placeholder="0"
                    value={newProduct.sellPrice}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        sellPrice: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock" className="text-sm text-gray-700">
                    Số lượng
                  </Label>
                  <Input
                    id="stock"
                    type="number"
                    placeholder="0"
                    value={newProduct.stock}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        stock: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit" className="text-sm text-gray-700">
                    Đơn vị có bán <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="unit"
                    placeholder="cái"
                    value={newProduct.unit}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, unit: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock" className="text-sm text-gray-700">
                  Tồn tối thiểu
                </Label>
                <Input
                  id="minStock"
                  type="number"
                  placeholder="10"
                  value={newProduct.minStock}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      minStock: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* Nhà sản xuất */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Nhà sản xuất
              </h3>

              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm text-gray-700">
                  Thêm nhà cung cấp mới
                </Label>
                <Input
                  id="supplier"
                  placeholder="Tên nhà cung cấp (VD: Anh Tuấn)"
                  value={newProduct.supplier}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, supplier: e.target.value })
                  }
                />
              </div>

              <Button
                variant="outline"
                className="w-full border-gray-300 text-gray-700"
              >
                Thêm nhà cung cấp
              </Button>
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setNewProduct({
                  name: "",
                  image: "",
                  barcode: "",
                  unit: "cái",
                  stock: 0,
                  costPrice: 0,
                  sellPrice: 0,
                  isActive: true,
                  canSell: true,
                  minStock: 10,
                  supplier: "",
                });
              }}
            >
              Quay lại
            </Button>
            <Button
              disabled={createProductMutation.isPending}
              onClick={() => {
                if (!newProduct.name || !newProduct.unit) return;
                createProductMutation.mutate(
                  {
                    locationId: Number(locationId),
                    businessTypeId: "650e8400-e29b-41d4-a716-446655440001",
                    name: newProduct.name,
                    sku: newProduct.barcode,
                    trackInventory: newProduct.canSell,
                    unit: newProduct.unit,
                    costPrice: newProduct.costPrice,
                    stock: newProduct.stock,
                    imageUrl: newProduct.image || undefined,
                    manufacturer: newProduct.supplier || undefined,
                    priceTiers: [
                      {
                        unit: newProduct.unit,
                        quantity: 1,
                        price: newProduct.sellPrice,
                      },
                    ],
                  },
                  {
                    onSuccess: () => {
                      setIsAddDialogOpen(false);
                      setNewProduct({
                        name: "",
                        image: "",
                        barcode: "",
                        unit: "cái",
                        stock: 0,
                        costPrice: 0,
                        sellPrice: 0,
                        isActive: true,
                        canSell: true,
                        minStock: 10,
                        supplier: "",
                      });
                    },
                  },
                );
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

          setNewProduct((prev) => ({ ...prev, barcode: code }));
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
