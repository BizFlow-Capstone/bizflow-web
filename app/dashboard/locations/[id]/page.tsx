"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
  EyeOff,
  Eye,
  Info,
  ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { BarcodeScanModal } from "@/components/BarcodeScanModal";

interface Product {
  id: number;
  name: string;
  image: string;
  barcode: string;
  unit: string;
  stock: number;
  costPrice: number;
  sellPrice: number;
  isActive: boolean;
}

export default function LocationDetailPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
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

  // Mock data - trong thực tế sẽ fetch từ API
  const location = {
    id: 1,
    name: "ĐBKD Quận 1",
    address: "123 Nguyễn Huệ, Quận 1, TP.HCM",
    manager: "Lê Văn A",
  };

  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Nước khoáng Lavie",
      image:
        "https://lavievietnam.vn/wp-content/uploads/2018/04/lavie-350ml.jpg",
      barcode: "8934588020016",
      unit: "lon",
      stock: 240,
      costPrice: 8000,
      sellPrice: 10000,
      isActive: true,
    },
    {
      id: 2,
      name: "Coca Cola",
      image:
        "https://www.coca-cola.com/content/dam/onexp/vn/vi/brands/coca-cola/vn-coca-cola.png",
      barcode: "8934588020023",
      unit: "lon",
      stock: 180,
      costPrice: 9500,
      sellPrice: 12000,
      isActive: true,
    },
  ]);

  const toggleProductActive = (id: number) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, isActive: !product.isActive }
          : product,
      ),
    );
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery),
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
                {location.name}
              </h1>
              <p className="text-sm text-gray-600 mt-1">{location.address}</p>
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
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  {location.manager}
                </div>
                <div className="text-xs text-gray-600">Chủ Kho</div>
              </div>
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
            >
              <Upload className="w-4 h-4 mr-2" />
              Nhập Kho
            </Button>
            <Button
              onClick={() =>
                router.push(`/dashboard/locations/${location.id}/products/new`)
              }
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm sản phẩm
            </Button>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold text-gray-700">
                  Sản phẩm
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Mã vạch
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Đơn vị
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Tồn kho
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Giá Vốn
                </TableHead>
                <TableHead className="font-semibold text-gray-700">
                  Giá bán
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
                    key={product.id}
                    className={`hover:bg-gray-50 ${!product.isActive ? "opacity-50 bg-gray-50/50" : ""}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex items-center justify-center relative">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex flex-col">
                          <span
                            className={`font-medium ${product.isActive ? "text-gray-900" : "text-gray-500"}`}
                          >
                            {product.name}
                          </span>
                          {!product.isActive && (
                            <span className="text-xs text-gray-500">Đã ẩn</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {product.barcode}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {product.unit}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium ${
                          product.stock < 100
                            ? "text-red-600"
                            : product.stock < 200
                              ? "text-orange-600"
                              : "text-gray-900"
                        }`}
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-900">
                      {product.costPrice.toLocaleString()}đ
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">
                      {product.sellPrice.toLocaleString()}đ
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
                                `/dashboard/locations/${location.id}/products/${product.id}`,
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
                                `/dashboard/locations/${location.id}/products/new?productId=${product.id}`,
                              );
                            }}
                            className="cursor-pointer"
                          >
                            <Pencil className="w-4 h-4 mr-2" />
                            <span>Sửa sản phẩm</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleProductActive(product.id)}
                            className={`cursor-pointer ${
                              product.isActive
                                ? "text-red-600 focus:text-red-600 focus:bg-red-50"
                                : "text-green-600 focus:text-green-600 focus:bg-green-50"
                            }`}
                          >
                            {product.isActive ? (
                              <>
                                <EyeOff className="w-4 h-4 mr-2" />
                                <span>Vô hiệu hóa</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-4 h-4 mr-2" />
                                <span>Hiển thị lại</span>
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
              onClick={() => {
                // Handle add product
                const newId = products.length + 1;
                setProducts([
                  ...products,
                  {
                    id: newId,
                    name: newProduct.name,
                    image:
                      newProduct.image || "https://via.placeholder.com/150",
                    barcode: newProduct.barcode,
                    unit: newProduct.unit,
                    stock: newProduct.stock,
                    costPrice: newProduct.costPrice,
                    sellPrice: newProduct.sellPrice,
                    isActive: newProduct.isActive,
                  },
                ]);
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
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
            >
              Thêm sản phẩm
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
    </div>
  );
}
