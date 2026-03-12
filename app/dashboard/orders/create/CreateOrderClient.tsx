"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  ChevronDown,
  Upload,
  Mic,
  FileAudio,
  PenLine,
  Pause,
  Save,
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
import type { PaymentType } from "@/lib/types/order";
import { saveDraftOrder } from "@/lib/draftOrderStorage";

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

// --- Create method type ---

type CreateMethod = "upload" | "voice" | "manual";

// --- Mock AI transcription results ---

const MOCK_AI_RESULTS: CartItem[] = [
  {
    productId: 1,
    name: "Xi măng Hà Tiên PCB40",
    unit: "Bao (50kg)",
    price: 95000,
    quantity: 30,
    stock: 450,
    trackInventory: true,
  },
  {
    productId: 3,
    name: "Sắt thép Pomina D10",
    unit: "Cây (11.7m)",
    price: 150000,
    quantity: 10,
    stock: 120,
    trackInventory: true,
  },
];

// --- Waveform bars component ---

const WAVE_HEIGHTS = Array.from({ length: 40 }, () => Math.random() * 80 + 20);

function WaveformBars({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-center justify-center gap-0.75 h-16 py-2">
      {WAVE_HEIGHTS.map((h, i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-150 ${
            isActive ? "bg-[#23C4C1]" : "bg-gray-300"
          }`}
          style={{
            height: isActive ? `${h}%` : `${Math.sin(i * 0.3) * 30 + 30}%`,
            animationDelay: `${i * 30}ms`,
          }}
        />
      ))}
    </div>
  );
}

// --- AI Result Panel ---

function AIResultPanel({
  transcribedText,
  aiCartItems,
  formatCurrency,
  onConfirm,
  onRetry,
}: {
  transcribedText: string;
  aiCartItems: CartItem[];
  formatCurrency: (amount: number) => string;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  const total = aiCartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-medium text-blue-800 mb-1">
          AI đã nhận diện:
        </p>
        <p className="text-sm text-blue-700">&ldquo;{transcribedText}&rdquo;</p>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p className="font-semibold text-gray-800">
            Sản phẩm AI đề xuất ({aiCartItems.length} sản phẩm)
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {aiCartItems.map((item) => (
            <div
              key={item.productId}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.quantity} {item.unit} × {formatCurrency(item.price)}
                </p>
              </div>
              <span className="font-semibold text-gray-800 text-sm">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between items-center">
          <span className="font-semibold text-gray-700">Tổng cộng</span>
          <span className="text-lg font-bold text-[#23C4C1]">
            {formatCurrency(total)}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onRetry}>
          Thử lại
        </Button>
        <Button
          className="flex-1 bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
          onClick={onConfirm}
        >
          Xác nhận & Thêm vào giỏ
        </Button>
      </div>
    </div>
  );
}

// --- Main Component ---

export default function CreateOrderClient() {
  const router = useRouter();

  // Accordion state
  const [activeMethod, setActiveMethod] = useState<CreateMethod | null>(null);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribedText, setTranscribedText] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI result state
  const [aiCartItems, setAiCartItems] = useState<CartItem[]>([]);
  const [showAiResult, setShowAiResult] = useState(false);

  // Product search (manual)
  const [productSearch, setProductSearch] = useState("");

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);

  // Payment
  const [paymentType, setPaymentType] = useState<PaymentType>("cash");
  const [selectedDebtorId, setSelectedDebtorId] = useState<string>("");
  const [note, setNote] = useState("");

  // Mixed payment amounts
  const [cashAmount, setCashAmount] = useState("");
  const [bankAmount, setBankAmount] = useState("");

  // Submitting
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle accordion section
  const toggleMethod = (method: CreateMethod) => {
    setActiveMethod((prev) => (prev === method ? null : method));
  };

  // --- Voice Recording ---

  const startRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
    setTranscribedText("");
    setShowAiResult(false);
    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsTranscribing(true);
    setTimeout(() => {
      setTranscribedText(
        "Cho anh 30 bao xi măng Hà Tiên với 10 cây sắt Pomina D10, tính tiền mặt nhé.",
      );
      setIsTranscribing(false);
    }, 1500);
  };

  const handleCreateFromVoice = () => {
    setAiCartItems(MOCK_AI_RESULTS);
    setShowAiResult(true);
  };

  const confirmAiItems = () => {
    setCart(aiCartItems);
    setShowAiResult(false);
    setActiveMethod(null);
  };

  // --- File Upload ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
  };

  const processUploadedFile = () => {
    if (!uploadedFile) return;
    setIsProcessingFile(true);
    setTimeout(() => {
      setTranscribedText(
        "Cho anh 30 bao xi măng Hà Tiên với 10 cây sắt Pomina D10, tính tiền mặt nhé.",
      );
      setAiCartItems(MOCK_AI_RESULTS);
      setShowAiResult(true);
      setIsProcessingFile(false);
    }, 2000);
  };

  // Timer Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Format recording time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Filtered products (manual mode)
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

  // Submit
  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    router.push("/dashboard/orders");
  };

  // Save draft ("treo đơn")
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
        debtorId: debtor?.debtorId,
        debtorName: debtor?.name,
        note,
      },
    );
    router.push("/dashboard/orders");
  };

  const hasStockWarning = cart.some(
    (item) => item.trackInventory && item.quantity > item.stock,
  );

  const isDebtPayment = paymentType === "debt" || paymentType === "mixed";

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/orders")}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Tạo Đơn Hàng Mới
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Chọn phương thức tạo đơn: Giọng nói AI hoặc Nhập thủ công
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 p-8 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Create Methods + Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Method 1: Upload Audio */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleMethod("upload")}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${
                  activeMethod === "upload"
                    ? "bg-[#23C4C1]/5 border-b border-gray-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activeMethod === "upload"
                        ? "bg-[#23C4C1]/10"
                        : "bg-gray-100"
                    }`}
                  >
                    <Upload
                      className={`w-5 h-5 ${
                        activeMethod === "upload"
                          ? "text-[#23C4C1]"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p
                      className={`font-semibold ${
                        activeMethod === "upload"
                          ? "text-[#23C4C1]"
                          : "text-gray-800"
                      }`}
                    >
                      Tải Lên File Âm Thanh
                    </p>
                    <p className="text-sm text-gray-500">
                      Tải lên file ghi âm để AI xử lý tự động
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    activeMethod === "upload" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {activeMethod === "upload" && (
                <div className="p-6 space-y-4">
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#23C4C1] hover:bg-[#23C4C1]/5 transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    {uploadedFile ? (
                      <div className="space-y-2">
                        <FileAudio className="w-10 h-10 mx-auto text-[#23C4C1]" />
                        <p className="font-medium text-gray-800">
                          {uploadedFile.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-10 h-10 mx-auto text-gray-400" />
                        <p className="font-medium text-gray-600">
                          Nhấn để chọn file âm thanh
                        </p>
                        <p className="text-sm text-gray-400">
                          Hỗ trợ MP3, WAV, M4A, OGG (tối đa 25MB)
                        </p>
                      </div>
                    )}
                  </div>

                  {uploadedFile && !showAiResult && (
                    <Button
                      onClick={processUploadedFile}
                      disabled={isProcessingFile}
                      className="w-full bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
                    >
                      {isProcessingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Đang xử lý âm thanh...
                        </>
                      ) : (
                        <>
                          <FileAudio className="w-4 h-4 mr-2" />
                          Xử lý file âm thanh
                        </>
                      )}
                    </Button>
                  )}

                  {showAiResult && activeMethod === "upload" && (
                    <AIResultPanel
                      transcribedText={transcribedText}
                      aiCartItems={aiCartItems}
                      formatCurrency={formatCurrency}
                      onConfirm={confirmAiItems}
                      onRetry={() => {
                        setShowAiResult(false);
                        setUploadedFile(null);
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Method 2: Voice Recording */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleMethod("voice")}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${
                  activeMethod === "voice"
                    ? "bg-[#23C4C1]/5 border-b border-gray-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activeMethod === "voice"
                        ? "bg-[#23C4C1]/10"
                        : "bg-gray-100"
                    }`}
                  >
                    <Mic
                      className={`w-5 h-5 ${
                        activeMethod === "voice"
                          ? "text-[#23C4C1]"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p
                      className={`font-semibold ${
                        activeMethod === "voice"
                          ? "text-[#23C4C1]"
                          : "text-gray-800"
                      }`}
                    >
                      Tạo Đơn Hàng Bằng Giọng Nói
                    </p>
                    <p className="text-sm text-gray-500">
                      Nói trực tiếp để AI tạo đơn hàng tự động
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    activeMethod === "voice" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {activeMethod === "voice" && (
                <div className="p-6 space-y-6">
                  {/* Waveform Visualization */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <WaveformBars isActive={isRecording} />
                    <div className="text-center mt-2">
                      <span
                        className={`text-2xl font-mono font-bold ${
                          isRecording ? "text-[#23C4C1]" : "text-gray-400"
                        }`}
                      >
                        {formatTime(recordingTime)}
                      </span>
                    </div>
                  </div>

                  {/* Recording Controls */}
                  <div className="flex items-center justify-center gap-4">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        className="w-16 h-16 rounded-full bg-[#23C4C1] hover:bg-[#1da8a5] text-white flex items-center justify-center shadow-lg shadow-[#23C4C1]/30 transition-all hover:scale-105"
                      >
                        <Mic className="w-7 h-7" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={stopRecording}
                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all animate-pulse"
                      >
                        <Pause className="w-7 h-7" />
                      </button>
                    )}
                  </div>

                  <p className="text-center text-sm text-gray-500">
                    {isRecording
                      ? "Đang ghi âm... Nhấn nút để dừng"
                      : "Nhấn nút microphone để bắt đầu ghi âm"}
                  </p>

                  {/* Transcribing */}
                  {isTranscribing && (
                    <div className="flex items-center justify-center gap-2 py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-[#23C4C1]" />
                      <span className="text-gray-600">
                        Đang chuyển đổi giọng nói...
                      </span>
                    </div>
                  )}

                  {/* Transcription Result */}
                  {transcribedText &&
                    !isRecording &&
                    !isTranscribing &&
                    !showAiResult && (
                      <div className="space-y-3">
                        <Label className="text-sm font-medium text-gray-700">
                          Nội dung đã nhận diện
                        </Label>
                        <div className="bg-white border border-gray-200 rounded-xl p-4">
                          <p className="text-gray-800 leading-relaxed">
                            &ldquo;{transcribedText}&rdquo;
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setTranscribedText("");
                              setRecordingTime(0);
                            }}
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            Ghi Lại
                          </Button>
                          <Button
                            className="flex-1 bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
                            onClick={handleCreateFromVoice}
                          >
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            Tạo Đơn Hàng
                          </Button>
                        </div>
                      </div>
                    )}

                  {showAiResult && activeMethod === "voice" && (
                    <AIResultPanel
                      transcribedText={transcribedText}
                      aiCartItems={aiCartItems}
                      formatCurrency={formatCurrency}
                      onConfirm={confirmAiItems}
                      onRetry={() => {
                        setShowAiResult(false);
                        setTranscribedText("");
                        setRecordingTime(0);
                      }}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Method 3: Manual Entry */}
            <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => toggleMethod("manual")}
                className={`w-full flex items-center justify-between px-6 py-4 transition-colors ${
                  activeMethod === "manual"
                    ? "bg-[#23C4C1]/5 border-b border-gray-200"
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activeMethod === "manual"
                        ? "bg-[#23C4C1]/10"
                        : "bg-gray-100"
                    }`}
                  >
                    <PenLine
                      className={`w-5 h-5 ${
                        activeMethod === "manual"
                          ? "text-[#23C4C1]"
                          : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div className="text-left">
                    <p
                      className={`font-semibold ${
                        activeMethod === "manual"
                          ? "text-[#23C4C1]"
                          : "text-gray-800"
                      }`}
                    >
                      Nhập Thủ Công
                    </p>
                    <p className="text-sm text-gray-500">
                      Tìm kiếm và thêm sản phẩm trực tiếp vào giỏ hàng
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                    activeMethod === "manual" ? "rotate-180" : ""
                  }`}
                />
              </button>
              {activeMethod === "manual" && (
                <div className="p-6 space-y-4">
                  <div className="relative">
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
                                      isLowStock
                                        ? "text-red-500 font-medium"
                                        : ""
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
                </div>
              )}
            </div>

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
                  <p className="text-xs text-amber-600 mt-1">
                    Đơn hàng vẫn có thể được tạo.
                  </p>
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
                    <p className="text-sm">Chưa có sản phẩm nào</p>
                    <p className="text-xs mt-1">
                      Chọn phương thức tạo đơn ở bên trái
                    </p>
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
                  <Button
                    onClick={handleSubmit}
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
                        Đang tạo đơn...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Tạo đơn hàng — {formatCurrency(cartTotal)}
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={handleSaveDraft}
                    disabled={cart.length === 0}
                    className="w-full h-10"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Treo đơn (Lưu nháp)
                  </Button>
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
