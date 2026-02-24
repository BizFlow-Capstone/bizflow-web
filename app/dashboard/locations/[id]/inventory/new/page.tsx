"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Package,
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Trash2,
  Building2,
  MapPin,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LowStockProduct {
  id: number;
  name: string;
  supplier: string;
  supplierContact: string;
  supplierAddress: string;
  currentStock: number;
  minStock: number;
  unit: string;
}

interface SelectedProduct {
  id: number;
  name: string;
  supplier: string;
  supplierContact: string;
  supplierAddress: string;
  currentStock: number;
  quantity: number;
  unitPrice: number;
  unit: string;
}

export default function NewInventoryPage() {
  const router = useRouter();
  const params = useParams<{ id?: string | string[] }>();
  const searchParams = useSearchParams();
  const locationId = Array.isArray(params?.id)
    ? params?.id[0]
    : (params?.id ?? "unknown");
  const draftStorageKey = `bizflow:inventoryDraft:${locationId}`;

  const [orderType, setOrderType] = useState<"invoice" | "no-invoice">(
    "invoice",
  );
  const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(
    [],
  );
  const [notes, setNotes] = useState("");
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSuppliers, setExpandedSuppliers] = useState<string[]>([]);
  const [hasVAT, setHasVAT] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const isDraftMode = searchParams.get("draft") === "1";
    if (!isDraftMode) return;

    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        orderType?: "invoice" | "no-invoice";
        selectedProducts?: SelectedProduct[];
        notes?: string;
        hasVAT?: boolean;
      };

      if (parsed.orderType) setOrderType(parsed.orderType);
      if (Array.isArray(parsed.selectedProducts))
        setSelectedProducts(parsed.selectedProducts);
      if (typeof parsed.notes === "string") setNotes(parsed.notes);
      if (typeof parsed.hasVAT === "boolean") setHasVAT(parsed.hasVAT);
      setCurrentStep(1);
    } catch {
      // ignore malformed draft
    }
  }, [draftStorageKey, searchParams]);

  const handleSaveDraft = () => {
    try {
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          orderType,
          selectedProducts,
          notes,
          hasVAT,
          savedAt: new Date().toISOString(),
        }),
      );
    } catch {
      // ignore storage errors
    }

    if (locationId !== "unknown") {
      router.push(`/dashboard/locations/${locationId}`);
    } else {
      router.back();
    }
  };

  const handleConfirm = () => {
    setCurrentStep(2);
  };

  const handleReceiveGoods = () => {
    setCurrentStep(3);
  };

  // Mock data - sản phẩm sắp hết
  const lowStockProducts: LowStockProduct[] = [
    {
      id: 1,
      name: "Mì tôm Hảo Hảo",
      supplier: "Acecook Việt Nam",
      supplierContact: "Chị Lan",
      supplierAddress: "140 Đường số 8, KCN Tân Tạo, Bình Tân, TP.HCM",
      currentStock: 15,
      minStock: 50,
      unit: "gói",
    },
  ];

  // Mock data - tất cả sản phẩm có thể chọn
  const allProducts: LowStockProduct[] = [
    {
      id: 1,
      name: "Mì tôm Hảo Hảo",
      supplier: "Acecook Việt Nam",
      supplierContact: "Chị Lan",
      supplierAddress: "140 Đường số 8, KCN Tân Tạo, Bình Tân, TP.HCM",
      currentStock: 15,
      minStock: 50,
      unit: "gói",
    },
    {
      id: 2,
      name: "Nước khoáng Lavie",
      supplier: "Lavie Việt Nam",
      supplierContact: "Anh Tuấn",
      supplierAddress: "123 Nguyễn Văn Linh, Quận 7, TP.HCM",
      currentStock: 50,
      minStock: 100,
      unit: "chai",
    },
  ];

  const filteredProducts = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !selectedProducts.some((sp) => sp.id === p.id),
  );

  const handleAddProduct = (product: LowStockProduct) => {
    const newProduct: SelectedProduct = {
      id: product.id,
      name: product.name,
      supplier: product.supplier,
      supplierContact: product.supplierContact,
      supplierAddress: product.supplierAddress,
      currentStock: product.currentStock,
      quantity: 100,
      unitPrice: 2500,
      unit: product.unit,
    };
    setSelectedProducts([...selectedProducts, newProduct]);

    // Auto expand supplier
    if (!expandedSuppliers.includes(product.supplier)) {
      setExpandedSuppliers([...expandedSuppliers, product.supplier]);
    }
  };

  const handleRemoveProduct = (id: number) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== id));
  };

  const updateProduct = (
    id: number,
    field: keyof SelectedProduct,
    value: number,
  ) => {
    setSelectedProducts(
      selectedProducts.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    );
  };

  const toggleSupplier = (supplier: string) => {
    if (expandedSuppliers.includes(supplier)) {
      setExpandedSuppliers(expandedSuppliers.filter((s) => s !== supplier));
    } else {
      setExpandedSuppliers([...expandedSuppliers, supplier]);
    }
  };

  // Group products by supplier
  const groupedProducts = selectedProducts.reduce(
    (acc, product) => {
      if (!acc[product.supplier]) {
        acc[product.supplier] = {
          supplier: product.supplier,
          contact: product.supplierContact,
          address: product.supplierAddress,
          products: [],
        };
      }
      acc[product.supplier].products.push(product);
      return acc;
    },
    {} as Record<
      string,
      {
        supplier: string;
        contact: string;
        address: string;
        products: SelectedProduct[];
      }
    >,
  );

  // Calculate totals
  const totalCost = selectedProducts.reduce(
    (sum, p) => sum + p.quantity * p.unitPrice,
    0,
  );
  const uniqueSuppliers = new Set(selectedProducts.map((p) => p.supplier)).size;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="flex items-center gap-4 px-6 py-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Tạo phiếu nhập kho
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={`h-2 w-2 rounded-full ${
                  currentStep === 1
                    ? "bg-yellow-500"
                    : currentStep === 2
                      ? "bg-blue-500"
                      : "bg-green-500"
                }`}
              />
              <span className="text-sm text-gray-500">
                {currentStep === 1
                  ? "Bản nhập - Chưa liên hệ"
                  : currentStep === 2
                    ? "Đã Liên Hệ - Chờ Hàng Về"
                    : "Đã nhập"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Stepper */}
      <div className="bg-white border-b px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center">
            {/* Step 1 - Nhập */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  currentStep >= 1
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {currentStep > 1 ? (
                  <svg
                    className="h-7 w-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                ) : (
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`mt-2 text-sm ${
                  currentStep >= 1
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Nhập
              </span>
            </div>

            {/* Connector Line 1 */}
            <div
              className={`h-0.5 flex-1 mx-2 ${
                currentStep >= 2 ? "bg-blue-500" : "bg-gray-300"
              }`}
            />

            {/* Step 2 - Đã liên hệ */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  currentStep >= 2
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {currentStep > 2 ? (
                  <svg
                    className="h-7 w-7"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                ) : (
                  <svg
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                )}
              </div>
              <span
                className={`mt-2 text-sm ${
                  currentStep >= 2
                    ? "font-medium text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Đã liên hệ
              </span>
            </div>

            {/* Connector Line 2 */}
            <div
              className={`h-0.5 flex-1 mx-2 ${
                currentStep >= 3 ? "bg-green-500" : "bg-gray-300"
              }`}
            />

            {/* Step 3 - Đã nhập */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-full ${
                  currentStep >= 3
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                <svg
                  className="h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span
                className={`mt-2 text-sm ${
                  currentStep >= 3
                    ? "font-medium text-green-600"
                    : "text-gray-500"
                }`}
              >
                Đã nhập
              </span>
            </div>
          </div>
        </div>
      </div>

      <main className="px-6 py-6">
        <div className="flex gap-6">
          {/* Left Column */}
          <div className="flex-1">
            {/* Order Type */}
            <div className="mb-6">
              <label className="mb-3 block text-sm font-medium text-gray-700">
                Loại đơn nhập hàng
              </label>
              <div className="flex gap-3">
                <button
                  onClick={() => setOrderType("invoice")}
                  className={`flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-colors ${
                    orderType === "invoice"
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Có hóa đơn
                </button>
                <button
                  onClick={() => setOrderType("no-invoice")}
                  className={`flex-1 rounded-lg border-2 py-3 text-sm font-medium transition-colors ${
                    orderType === "no-invoice"
                      ? "border-blue-500 bg-blue-50 text-blue-600"
                      : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Không hóa đơn
                </button>
              </div>
            </div>

            {/* Low Stock Alert - chỉ hiện khi chưa có sản phẩm nào */}
            {selectedProducts.length === 0 && lowStockProducts.length > 0 && (
              <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-orange-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="font-semibold text-orange-700">
                    Gợi ý sản phẩm sắp hết hàng
                  </span>
                </div>
                <p className="mb-4 text-sm text-orange-600">
                  Các sản phẩm sau đang dưới mức tồn kho tối thiểu
                </p>

                <div className="space-y-2">
                  {lowStockProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.supplier} • Tồn: {product.currentStock} / Tối
                          thiểu: {product.minStock}
                        </div>
                      </div>
                      <button
                        className="flex h-8 w-8 items-center justify-center rounded text-blue-600 hover:bg-blue-50"
                        onClick={() => handleAddProduct(product)}
                        disabled={selectedProducts.some(
                          (p) => p.id === product.id,
                        )}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Product List Header */}
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Danh sách sản phẩm
              </label>
              <button
                className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                onClick={() => setIsProductDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Thêm
              </button>
            </div>

            {/* Product List */}
            {selectedProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-white py-16">
                <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Chưa có sản phẩm nào</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.values(groupedProducts).map((group) => (
                  <div
                    key={group.supplier}
                    className="rounded-lg border border-gray-200 bg-white"
                  >
                    {/* Supplier Header */}
                    <div
                      className="flex cursor-pointer items-center justify-between px-4 py-3"
                      onClick={() => toggleSupplier(group.supplier)}
                    >
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-gray-500" />
                        <span className="font-medium text-gray-900">
                          {group.supplier}
                        </span>
                        <button className="text-sm text-blue-600 hover:underline">
                          Thay Đổi
                        </button>
                      </div>
                      {expandedSuppliers.includes(group.supplier) ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </div>

                    {expandedSuppliers.includes(group.supplier) && (
                      <>
                        {/* Supplier Info */}
                        <div className="border-t border-gray-100 px-4 py-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{group.contact}</span>
                            <span className="mx-2">•</span>
                            <MapPin className="h-4 w-4" />
                            <span>{group.address}</span>
                          </div>
                        </div>

                        {/* Products */}
                        {group.products.map((product) => (
                          <div
                            key={product.id}
                            className="border-t border-gray-100 px-4 py-4"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {product.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  Tồn hiện tại: {product.currentStock}{" "}
                                  {product.unit}
                                </div>
                              </div>
                              <button
                                className="text-red-500 hover:text-red-600"
                                onClick={() => handleRemoveProduct(product.id)}
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">
                                  Số lượng đặt
                                </label>
                                <Input
                                  type="number"
                                  value={product.quantity}
                                  onChange={(e) =>
                                    updateProduct(
                                      product.id,
                                      "quantity",
                                      Number(e.target.value),
                                    )
                                  }
                                  className="h-10"
                                  min="1"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs text-gray-500">
                                  Đơn vị
                                </label>
                                <Input
                                  type="text"
                                  value={product.unit}
                                  className="h-10 bg-gray-50"
                                  readOnly
                                />
                              </div>
                            </div>

                            <div className="mt-3">
                              <label className="mb-1 block text-xs text-gray-500">
                                Giá nhập (đ)
                              </label>
                              <Input
                                type="number"
                                value={product.unitPrice}
                                onChange={(e) =>
                                  updateProduct(
                                    product.id,
                                    "unitPrice",
                                    Number(e.target.value),
                                  )
                                }
                                className="h-10 w-48"
                                min="0"
                              />
                            </div>

                            <div className="mt-3 flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Thành tiền:
                              </span>
                              <span className="font-semibold text-gray-900">
                                {(
                                  product.quantity * product.unitPrice
                                ).toLocaleString("vi-VN")}
                                đ
                              </span>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="mt-6">
              <label className="mb-2 block text-base font-medium text-gray-900">
                Ghi chú
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Nhập ghi chú về đơn hàng..."
                className="min-h-[100px] w-full rounded-lg border border-gray-300 px-4 py-3 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Right Column - Summary (chỉ hiện khi có sản phẩm) */}
          {selectedProducts.length > 0 && (
            <div className="w-80 shrink-0">
              <div className="sticky top-6 rounded-lg border border-gray-200 bg-white p-5">
                <h3 className="mb-4 font-semibold text-gray-900">Tổng quan</h3>

                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Số nhà cung cấp:</span>
                    <span className="font-medium text-gray-900">
                      {uniqueSuppliers}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Số sản phẩm:</span>
                    <span className="font-medium text-gray-900">
                      {selectedProducts.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Loại đơn:</span>
                    <span className="font-medium text-gray-900">
                      {orderType === "invoice" ? "Có hóa đơn" : "Không hóa đơn"}
                    </span>
                  </div>
                </div>

                <div className="my-4 border-t border-gray-200" />

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Tổng chi phí:</span>
                  <span className="text-lg font-semibold text-blue-600">
                    {totalCost.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="vat"
                    checked={hasVAT}
                    onChange={(e) => setHasVAT(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="vat" className="text-sm text-gray-600">
                    Có hóa đơn VAT
                  </label>
                </div>

                <div className="mt-6 space-y-3">
                  {currentStep === 1 ? (
                    <>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => router.back()}
                        >
                          Hủy
                        </Button>
                        <Button
                          variant="outline"
                          className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                          onClick={handleSaveDraft}
                        >
                          Lưu Nháp
                        </Button>
                      </div>
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={handleConfirm}
                        disabled={selectedProducts.length === 0}
                      >
                        Xác Nhận
                      </Button>
                    </>
                  ) : currentStep === 2 ? (
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                      onClick={handleReceiveGoods}
                    >
                      <Package className="h-5 w-5" />
                      Nhập hàng vào kho
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Selection Dialog */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn sản phẩm</DialogTitle>
          </DialogHeader>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {product.name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {product.supplier} • Tồn: {product.currentStock}{" "}
                      {product.unit}
                    </div>
                  </div>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded text-blue-600 hover:bg-blue-50"
                    onClick={() => {
                      handleAddProduct(product);
                      setIsProductDialogOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-gray-500">
                Không tìm thấy sản phẩm
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
