"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Banknote,
  Landmark,
  CreditCard,
  CircleDollarSign,
  Loader2,
  Package,
  AlertTriangle,
  Save,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PaymentType, DraftOrder } from "@/lib/types/order";
import {
  getDraftOrder,
  saveDraftOrder,
  deleteDraftOrder,
} from "@/lib/draftOrderStorage";

// --- Mock Product Catalog ---

interface MockProduct {
  productId: number;
  name: string;
  sku: string;
  baseUnit: string;
  price: number;
  stock: number;
  trackInventory: boolean;
  category: string;
}

interface MockDebtor {
  debtorId: number;
  name: string;
  phone?: string;
  currentBalance: number;
  creditLimit?: number;
}

const MOCK_PRODUCTS: MockProduct[] = [
  {
    productId: 1,
    name: "Xi măng Hà Tiên PCB40",
    sku: "XM-HT-PCB40",
    baseUnit: "Bao (50kg)",
    price: 95000,
    stock: 450,
    trackInventory: true,
    category: "VLXD",
  },
  {
    productId: 2,
    name: "Xi măng INSEE",
    sku: "XM-INSEE",
    baseUnit: "Bao (50kg)",
    price: 98000,
    stock: 200,
    trackInventory: true,
    category: "VLXD",
  },
  {
    productId: 3,
    name: "Sắt thép Pomina D10",
    sku: "ST-POM-D10",
    baseUnit: "Cây (11.7m)",
    price: 150000,
    stock: 120,
    trackInventory: true,
    category: "VLXD",
  },
  {
    productId: 4,
    name: "Sắt thép Pomina D12",
    sku: "ST-POM-D12",
    baseUnit: "Cây (11.7m)",
    price: 210000,
    stock: 80,
    trackInventory: true,
    category: "VLXD",
  },
  {
    productId: 5,
    name: "Dịch vụ cắt sắt",
    sku: "DV-CATSAT",
    baseUnit: "Lần",
    price: 300000,
    stock: 0,
    trackInventory: false,
    category: "Dịch vụ",
  },
  {
    productId: 6,
    name: "Cát xây dựng",
    sku: "CAT-XD",
    baseUnit: "Khối (m³)",
    price: 350000,
    stock: 50,
    trackInventory: true,
    category: "VLXD",
  },
  {
    productId: 7,
    name: "Gạch ống 4 lỗ",
    sku: "GACH-4L",
    baseUnit: "Viên",
    price: 1200,
    stock: 10000,
    trackInventory: true,
    category: "VLXD",
  },
  {
    productId: 8,
    name: "Tôn lạnh 0.45mm",
    sku: "TON-045",
    baseUnit: "Tấm (1.2m)",
    price: 125000,
    stock: 300,
    trackInventory: true,
    category: "VLXD",
  },
  {
    productId: 9,
    name: "Sơn Dulux nội thất 5L",
    sku: "SON-DLX-5L",
    baseUnit: "Thùng (5L)",
    price: 680000,
    stock: 25,
    trackInventory: true,
    category: "Sơn",
  },
  {
    productId: 10,
    name: "Ống nước PVC D21",
    sku: "ONG-PVC-21",
    baseUnit: "Cây (4m)",
    price: 28000,
    stock: 500,
    trackInventory: true,
    category: "Ống nước",
  },
];

const MOCK_DEBTORS: MockDebtor[] = [
  {
    debtorId: 5,
    name: "Anh Ba",
    phone: "0912345678",
    currentBalance: -4200000,
    creditLimit: 20000000,
  },
  {
    debtorId: 8,
    name: "Chú Năm",
    phone: "0987654321",
    currentBalance: -1500000,
    creditLimit: 10000000,
  },
  {
    debtorId: 12,
    name: "Cô Bảy",
    phone: "0909123456",
    currentBalance: 0,
    creditLimit: 15000000,
  },
  {
    debtorId: 15,
    name: "Anh Tư",
    phone: "0933456789",
    currentBalance: -8000000,
    creditLimit: 10000000,
  },
];

// --- Cart Item ---

interface CartItem {
  productId: number;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  stock: number;
  trackInventory: boolean;
}

// --- Main Component ---

export default function EditOrderClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  // Whether this is a localStorage draft
  const isDraftOrder = orderId.startsWith("draft-");

  // Load draft data synchronously to avoid effect cascading renders
  const initialDraft = useMemo(() => {
    if (!isDraftOrder) return null;
    return getDraftOrder(orderId);
  }, [orderId, isDraftOrder]);

  // Loading state
  const [isLoading] = useState(false);
  const [draftData] = useState<DraftOrder | null>(initialDraft);
  const [notFound] = useState(!isDraftOrder || !initialDraft);

  // Product search
  const [productSearch, setProductSearch] = useState("");

  // Cart
  const [cart, setCart] = useState<CartItem[]>(initialDraft?.items ?? []);

  // Payment
  const [paymentType, setPaymentType] = useState<PaymentType>(
    initialDraft?.paymentType ?? "cash",
  );
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>(
    initialDraft?.debtorId ? String(initialDraft.debtorId) : "",
  );
  const [note, setNote] = useState(initialDraft?.note ?? "");

  // Mixed payment amounts
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered products
  const searchResults = useMemo(() => {
    if (!productSearch) return MOCK_PRODUCTS;
    const q = productSearch.toLowerCase();
    return MOCK_PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }, [productSearch]);

  // Cart totals
  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart],
  );

  const cartItemCount = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart],
  );

  // Debt amount
  const debtAmount = useMemo(() => {
    if (paymentType !== "mixed") return 0;
    const cash = Number(cashAmount) || 0;
    const bank = Number(bankAmount) || 0;
    return Math.max(0, cartTotal - cash - bank);
  }, [paymentType, cashAmount, bankAmount, cartTotal]);

  // Selected debtor
  const selectedDebtor = useMemo(
    () => MOCK_DEBTORS.find((d) => d.debtorId === Number(selectedDebtorId)),
    [selectedDebtorId],
  );

  // Cart operations
  const addToCart = useCallback((product: MockProduct) => {
    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === product.productId,
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          name: product.name,
          unit: product.baseUnit,
          price: product.price,
          quantity: 1,
          stock: product.stock,
          trackInventory: product.trackInventory,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const setQuantity = useCallback((productId: number, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: qty } : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  // Save draft (update localStorage)
  const handleSaveDraft = () => {
    if (cart.length === 0) return;
    const debtor = selectedDebtor;
    saveDraftOrder(
      cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        unit: item.unit,
        price: item.price,
        quantity: item.quantity,
        stock: item.stock,
        trackInventory: item.trackInventory,
      })),
      paymentType,
      {
        draftId: isDraftOrder ? orderId : undefined,
        debtorId: debtor?.debtorId,
        debtorName: debtor?.name,
        note,
      },
    );
    router.push("/dashboard/orders");
  };

  // Submit order (remove from localStorage, create real order)
  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Remove draft from localStorage
    if (isDraftOrder) {
      deleteDraftOrder(orderId);
    }

    setIsSubmitting(false);
    router.push("/dashboard/orders");
  };

  // Delete draft
  const handleDeleteDraft = () => {
    if (isDraftOrder) {
      deleteDraftOrder(orderId);
    }
    router.push("/dashboard/orders");
  };

  const hasStockWarning = cart.some(
    (item) => item.trackInventory && item.quantity > item.stock,
  );

  const isDebtPayment = paymentType === "debt" || paymentType === "mixed";

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">Đang tải đơn hàng...</span>
      </div>
    );
  }

  // Not found
  if (notFound) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          Không tìm thấy đơn hàng
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Đơn hàng có thể đã được xóa hoặc không tồn tại.
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard/orders")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard/orders")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            {isDraftOrder && (
              <Badge
                variant="outline"
                className="bg-yellow-50 text-yellow-700 border-yellow-200"
              >
                Đơn treo (Nháp)
              </Badge>
            )}
          </div>
          {isDraftOrder && (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={handleDeleteDraft}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa đơn treo
            </Button>
          )}
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-5 h-5 text-[#23C4C1]" />
                  Chọn sản phẩm
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Tìm sản phẩm theo tên, mã SKU, danh mục..."
                    className="pl-10"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {searchResults.map((product) => {
                    const cartItem = cart.find(
                      (c) => c.productId === product.productId,
                    );
                    const isLowStock =
                      product.trackInventory && product.stock < 10;

                    return (
                      <div
                        key={product.productId}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                          cartItem
                            ? "border-[#23C4C1] bg-[#23C4C1]/5"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 truncate">
                              {product.name}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs shrink-0"
                            >
                              {product.category}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span className="font-mono">{product.sku}</span>
                            <span>·</span>
                            <span>{product.baseUnit}</span>
                            {product.trackInventory && (
                              <>
                                <span>·</span>
                                <span
                                  className={
                                    isLowStock ? "text-red-500 font-medium" : ""
                                  }
                                >
                                  Tồn: {product.stock}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 ml-4">
                          <span className="font-semibold text-gray-800 whitespace-nowrap">
                            {formatCurrency(product.price)}
                          </span>
                          {cartItem ? (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateQuantity(product.productId, -1)
                                }
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={cartItem.quantity}
                                onChange={(e) =>
                                  setQuantity(
                                    product.productId,
                                    parseInt(e.target.value) || 0,
                                  )
                                }
                                className="w-16 h-8 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  updateQuantity(product.productId, 1)
                                }
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => addToCart(product)}
                              className="text-[#23C4C1] border-[#23C4C1] hover:bg-[#23C4C1]/10"
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Thêm
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {searchResults.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>Không tìm thấy sản phẩm nào</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stock Warnings */}
            {hasStockWarning && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">
                    Cảnh báo tồn kho không đủ
                  </p>
                  <ul className="mt-1 text-sm text-amber-700 space-y-0.5">
                    {cart
                      .filter(
                        (item) =>
                          item.trackInventory && item.quantity > item.stock,
                      )
                      .map((item) => (
                        <li key={item.productId}>
                          <strong>{item.name}</strong>: yêu cầu {item.quantity}{" "}
                          {item.unit}, tồn kho chỉ còn {item.stock}
                        </li>
                      ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Right: Cart & Payment */}
          <div className="space-y-6">
            {/* Cart Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-[#23C4C1]" />
                  Giỏ hàng
                  {cartItemCount > 0 && (
                    <Badge className="bg-[#23C4C1] text-white ml-auto">
                      {cartItemCount} sản phẩm
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-2" />
                    <p className="text-sm">Giỏ hàng trống</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-start justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.quantity} × {formatCurrency(item.price)}
                          </p>
                          {item.trackInventory &&
                            item.quantity > item.stock && (
                              <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" />
                                Vượt tồn kho
                              </p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="font-semibold text-sm text-gray-800 whitespace-nowrap">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => removeFromCart(item.productId)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-700">
                          Tổng cộng
                        </span>
                        <span className="text-xl font-bold text-[#23C4C1]">
                          {formatCurrency(cartTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      {
                        key: "cash",
                        label: "Tiền mặt",
                        icon: Banknote,
                        color: "emerald",
                      },
                      {
                        key: "bank",
                        label: "Chuyển khoản",
                        icon: Landmark,
                        color: "indigo",
                      },
                      {
                        key: "debt",
                        label: "Ghi nợ",
                        icon: CreditCard,
                        color: "orange",
                      },
                      {
                        key: "mixed",
                        label: "Hỗn hợp",
                        icon: CircleDollarSign,
                        color: "purple",
                      },
                    ] as const
                  ).map((method) => {
                    const Icon = method.icon;
                    const isSelected = paymentType === method.key;
                    return (
                      <button
                        key={method.key}
                        type="button"
                        onClick={() => setPaymentType(method.key)}
                        className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                          isSelected
                            ? `border-${method.color}-400 bg-${method.color}-50 text-${method.color}-700`
                            : "border-gray-200 text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="text-sm font-medium">
                          {method.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {isDebtPayment && (
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Khách ghi nợ
                    </Label>
                    <Select
                      value={selectedDebtorId}
                      onValueChange={setSelectedDebtorId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn khách hàng nợ..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MOCK_DEBTORS.map((debtor) => (
                          <SelectItem
                            key={debtor.debtorId}
                            value={String(debtor.debtorId)}
                          >
                            <div className="flex items-center justify-between w-full gap-2">
                              <span>{debtor.name}</span>
                              <span className="text-xs text-gray-500">
                                Nợ:{" "}
                                {formatCurrency(
                                  Math.abs(debtor.currentBalance),
                                )}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {selectedDebtor && selectedDebtor.creditLimit && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                        <div className="flex justify-between">
                          <span>Nợ hiện tại:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(
                              Math.abs(selectedDebtor.currentBalance),
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span>Hạn mức nợ:</span>
                          <span className="font-medium">
                            {formatCurrency(selectedDebtor.creditLimit)}
                          </span>
                        </div>
                        {Math.abs(selectedDebtor.currentBalance) + cartTotal >
                          selectedDebtor.creditLimit && (
                          <div className="mt-1.5 p-1.5 bg-amber-50 rounded text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Sẽ vượt hạn mức nợ
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {paymentType === "mixed" && (
                  <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">
                        Tiền mặt
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={cashAmount}
                        onChange={(e) => setCashAmount(e.target.value)}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-gray-600 mb-1 block">
                        Chuyển khoản
                      </Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={bankAmount}
                        onChange={(e) => setBankAmount(e.target.value)}
                        className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </div>
                    {debtAmount > 0 && (
                      <div className="flex justify-between text-sm font-medium text-orange-600 pt-2 border-t border-gray-200">
                        <span>Ghi nợ:</span>
                        <span>{formatCurrency(debtAmount)}</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Ghi chú
                  </Label>
                  <textarea
                    placeholder="Ghi chú đơn hàng (tùy chọn)..."
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#23C4C1] focus:ring-2 focus:ring-[#23C4C1]/20 hover:border-gray-400 transition-colors resize-none"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Submit — create real order */}
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={
                      cart.length === 0 ||
                      isSubmitting ||
                      (isDebtPayment && !selectedDebtorId)
                    }
                    className="w-full bg-[#23C4C1] hover:bg-[#1da8a5] text-white shadow-lg shadow-[#23C4C1]/20 h-12 text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang xác nhận...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        Xác nhận đơn hàng — {formatCurrency(cartTotal)}
                      </>
                    )}
                  </Button>

                  {/* Save draft */}
                  {isDraftOrder && (
                    <Button
                      variant="outline"
                      onClick={handleSaveDraft}
                      disabled={cart.length === 0}
                      className="w-full h-10"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi (giữ treo)
                    </Button>
                  )}
                </div>

                {isDebtPayment && !selectedDebtorId && (
                  <p className="text-xs text-red-500 text-center">
                    Vui lòng chọn khách hàng ghi nợ
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
