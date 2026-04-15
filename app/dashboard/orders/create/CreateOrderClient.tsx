"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { formatVnd as formatCurrency } from "@/lib/format";
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
import { useCreateDebtor, useDebtors } from "@/hooks/useDebtors";
import { useCreateOrder } from "@/hooks/useOrders";
import { useCreateAIDraftOrder } from "@/hooks/useOrders";
import type { PaymentType } from "@/lib/types/order";
import type { AIDraftOrderItem } from "@/lib/types/order";
import type { CreateOrderRequest } from "@/lib/types/order";
import type { DebtorFilters, DebtorRecord } from "@/lib/types/debtor";
import { saveDraftOrder } from "@/lib/draftOrderStorage";
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

import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import { useQuickSearchProducts } from "@/hooks/useProducts";
import type { QuickSearchProduct, SaleItem } from "@/lib/types/product";

// --- Cart Item ---

interface CartItem {
  productId: number;
  saleItemId: number;
  name: string;
  unit: string;
  price: number;
  discount: number;
  quantity: number;
  stock: number;
  trackInventory: boolean;
}

// --- Create method type ---

type CreateMethod = "upload" | "voice" | "manual";

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
  aiItems,
  confidence,
  formatCurrency,
  onConfirm,
  onRetry,
}: {
  transcribedText: string;
  aiItems: AIDraftOrderItem[];
  confidence?: string | number | null;
  formatCurrency: (amount: number) => string;
  onConfirm: () => void;
  onRetry: () => void;
}) {
  const confidenceMeta = useMemo(() => {
    if (confidence === null || confidence === undefined || confidence === "") {
      return null;
    }

    if (typeof confidence === "number") {
      const normalized = confidence > 1 ? confidence / 100 : confidence;
      if (normalized >= 0.8) {
        return {
          level: "high",
          label: `Độ tin cậy cao (${Math.round(normalized * 100)}%)`,
          className:
            "bg-emerald-100 text-emerald-700 border border-emerald-300 ring-1 ring-emerald-200",
        };
      }

      if (normalized >= 0.5) {
        return {
          level: "medium",
          label: `Độ tin cậy trung bình (${Math.round(normalized * 100)}%)`,
          className:
            "bg-amber-100 text-amber-700 border border-amber-300 ring-1 ring-amber-200",
        };
      }

      return {
        level: "low",
        label: `Độ tin cậy thấp (${Math.round(normalized * 100)}%)`,
        className:
          "bg-rose-100 text-rose-700 border border-rose-300 ring-1 ring-rose-200",
      };
    }

    const normalized = String(confidence).trim().toLowerCase();
    if (normalized === "high") {
      return {
        level: "high",
        label: "Độ tin cậy cao",
        className:
          "bg-emerald-100 text-emerald-700 border border-emerald-300 ring-1 ring-emerald-200",
      };
    }

    if (normalized === "medium") {
      return {
        level: "medium",
        label: "Độ tin cậy trung bình",
        className:
          "bg-amber-100 text-amber-700 border border-amber-300 ring-1 ring-amber-200",
      };
    }

    if (normalized === "low") {
      return {
        level: "low",
        label: "Độ tin cậy thấp",
        className:
          "bg-rose-100 text-rose-700 border border-rose-300 ring-1 ring-rose-200",
      };
    }

    return {
      level: "custom",
      label: `Độ tin cậy: ${String(confidence)}`,
      className: "bg-slate-100 text-slate-700 border border-slate-300",
    };
  }, [confidence]);

  const matchedCount = aiItems.filter(
    (item) =>
      item.matched &&
      !!item.saleItemId &&
      !!item.productId &&
      item.unitPrice !== null,
  ).length;

  const unresolvedCount = aiItems.length - matchedCount;

  const total = aiItems.reduce(
    (sum, item) =>
      sum +
      (item.lineTotal ?? (item.unitPrice ?? 0) * Math.max(0, item.quantity)),
    0,
  );

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between gap-3 mb-1">
          <p className="text-sm font-medium text-blue-800">AI đã nhận diện:</p>
          {confidenceMeta ? (
            <Badge
              className={`text-xs font-semibold ${confidenceMeta.className}`}
            >
              {confidenceMeta.label}
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-blue-700">&ldquo;{transcribedText}&rdquo;</p>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <p className="font-semibold text-gray-800">
            Sản phẩm AI đề xuất ({aiItems.length} sản phẩm)
          </p>
          {unresolvedCount > 0 ? (
            <p className="text-xs text-amber-600 mt-1">
              {unresolvedCount} sản phẩm chưa match, bạn cần thêm thủ công ở
              phần Nhập Thủ Công.
            </p>
          ) : null}
        </div>
        <div className="divide-y divide-gray-100">
          {aiItems.map((item, index) => (
            <div
              key={`${item.productName}-${index}`}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">
                  {item.productName}
                </p>
                <p className="text-xs text-gray-500">
                  {item.quantity} {item.unit}
                  {item.unitPrice !== null
                    ? ` × ${formatCurrency(item.unitPrice)}`
                    : " · Chưa có giá"}
                </p>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-800 text-sm">
                  {item.lineTotal !== null || item.unitPrice !== null
                    ? formatCurrency(
                        item.lineTotal ?? item.quantity * (item.unitPrice ?? 0),
                      )
                    : "Chưa xác định"}
                </span>
                {!item.matched ? (
                  <p className="text-[11px] text-amber-600">Chưa match</p>
                ) : null}
              </div>
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
          disabled={matchedCount === 0}
        >
          Xác nhận & Thêm {matchedCount} SP vào giỏ
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordedFile, setRecordedFile] = useState<File | null>(null);

  // Upload states
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI result state
  const [aiDraftItems, setAiDraftItems] = useState<AIDraftOrderItem[]>([]);
  const [aiConfidence, setAiConfidence] = useState<string | number | null>(
    null,
  );
  const [aiDetectedCustomerName, setAiDetectedCustomerName] = useState("");
  const [aiMappedDebtorName, setAiMappedDebtorName] = useState<string | null>(
    null,
  );
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
  const [submitError, setSubmitError] = useState("");
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [showLowStockDialog, setShowLowStockDialog] = useState(false);
  const [pendingOrderPayload, setPendingOrderPayload] =
    useState<CreateOrderRequest | null>(null);
  const [confirmationWarnings, setConfirmationWarnings] = useState<string[]>(
    [],
  );

  const createOrderMutation = useCreateOrder();
  const createAIDraftMutation = useCreateAIDraftOrder();
  const createDebtorMutation = useCreateDebtor();

  const { selectedLocationId } = useDashboardLocation();

  const debtorFilters: DebtorFilters = useMemo(
    () => ({
      isActive: true,
      page: 1,
      pageSize: 200,
    }),
    [],
  );
  const { data: debtorPage, isLoading: isLoadingDebtors } =
    useDebtors(debtorFilters);
  const debtorOptions = useMemo<DebtorRecord[]>(
    () => debtorPage?.items ?? [],
    [debtorPage?.items],
  );
  const [createdDebtorOverride, setCreatedDebtorOverride] =
    useState<DebtorRecord | null>(null);

  const availableDebtorOptions = useMemo(() => {
    if (!createdDebtorOverride) return debtorOptions;
    if (
      debtorOptions.some((d) => d.debtorId === createdDebtorOverride.debtorId)
    ) {
      return debtorOptions;
    }
    return [createdDebtorOverride, ...debtorOptions];
  }, [createdDebtorOverride, debtorOptions]);

  useEffect(() => {
    if (!selectedDebtorId || isLoadingDebtors) return;
    const exists = availableDebtorOptions.some(
      (debtor) => debtor.debtorId === Number(selectedDebtorId),
    );
    if (!exists) {
      setSelectedDebtorId("");
    }
  }, [selectedDebtorId, availableDebtorOptions, isLoadingDebtors]);

  const normalizeName = useCallback((value: string) => {
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }, []);

  useEffect(() => {
    if (!aiDetectedCustomerName || availableDebtorOptions.length === 0) {
      return;
    }

    if (selectedDebtorId) {
      return;
    }

    const target = normalizeName(aiDetectedCustomerName);
    if (!target) return;

    const exact = availableDebtorOptions.find(
      (debtor) => normalizeName(debtor.name) === target,
    );
    const partial =
      exact ||
      availableDebtorOptions.find((debtor) => {
        const debtorName = normalizeName(debtor.name);
        return debtorName.includes(target) || target.includes(debtorName);
      });

    const matchedDebtor = exact || partial;
    if (!matchedDebtor) {
      setAiMappedDebtorName(null);
      return;
    }

    setSelectedDebtorId(String(matchedDebtor.debtorId));
    setAiMappedDebtorName(matchedDebtor.name);
  }, [
    aiDetectedCustomerName,
    availableDebtorOptions,
    normalizeName,
    selectedDebtorId,
    setSelectedDebtorId,
  ]);

  const handleCreateDebtorFromAIName = useCallback(async () => {
    const debtorName = aiDetectedCustomerName.trim();
    if (!debtorName) {
      setSubmitError("Không có tên khách để tạo công nợ.");
      return;
    }

    if (!selectedLocationId || selectedLocationId <= 0) {
      setSubmitError("Vui lòng chọn địa điểm trước khi tạo khách nợ.");
      return;
    }

    setSubmitError("");

    try {
      const result = await createDebtorMutation.mutateAsync({
        businessLocationId: selectedLocationId,
        name: debtorName,
      });

      setCreatedDebtorOverride(result.data);
      setSelectedDebtorId(String(result.data.debtorId));
      setAiMappedDebtorName(result.data.name);
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Không thể tạo khách nợ từ tên AI.",
      );
    }
  }, [
    aiDetectedCustomerName,
    createDebtorMutation,
    selectedLocationId,
    setSelectedDebtorId,
  ]);

  // Toggle accordion section
  const toggleMethod = (method: CreateMethod) => {
    setActiveMethod((prev) => (prev === method ? null : method));
  };

  const resetAIResult = useCallback(() => {
    setTranscribedText("");
    setAiDraftItems([]);
    setAiConfidence(null);
    setAiDetectedCustomerName("");
    setAiMappedDebtorName(null);
    setCreatedDebtorOverride(null);
    setShowAiResult(false);
  }, []);

  const mergeCartItems = useCallback(
    (existing: CartItem[], incoming: CartItem[]) => {
      const merged = [...existing];
      incoming.forEach((item) => {
        const targetIndex = merged.findIndex(
          (entry) => entry.saleItemId === item.saleItemId,
        );

        if (targetIndex < 0) {
          merged.push(item);
          return;
        }

        merged[targetIndex] = {
          ...merged[targetIndex],
          quantity: merged[targetIndex].quantity + item.quantity,
        };
      });
      return merged;
    },
    [],
  );

  const createDraftFromAudio = useCallback(
    async (audioFile: File) => {
      if (!selectedLocationId || selectedLocationId <= 0) {
        setSubmitError("Vui lòng chọn địa điểm trước khi tạo đơn bằng AI.");
        return;
      }

      setSubmitError("");
      setIsTranscribing(true);

      try {
        const result = await createAIDraftMutation.mutateAsync({
          locationId: selectedLocationId,
          audioFile,
        });

        const detectedCustomerName =
          (result.items || [])
            .map((item) => item.customerName?.trim())
            .find((name) => !!name) || "";

        setTranscribedText(result.rawTranscript || "");
        setAiDraftItems(result.items || []);
        setAiConfidence(result.confidence ?? null);
        setAiDetectedCustomerName(detectedCustomerName);
        setAiMappedDebtorName(null);
        setShowAiResult(true);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Không thể tạo draft order từ âm thanh.",
        );
      } finally {
        setIsTranscribing(false);
      }
    },
    [createAIDraftMutation, selectedLocationId],
  );

  // --- Voice Recording ---

  const startRecording = async () => {
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setSubmitError("Thiết bị không hỗ trợ ghi âm trực tiếp.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = mimeType.includes("wav")
          ? "wav"
          : mimeType.includes("mp4")
            ? "m4a"
            : "webm";
        const file = new File(
          [blob],
          `voice-order-${Date.now()}.${extension}`,
          { type: mimeType },
        );

        setRecordedFile(file);
        void createDraftFromAudio(file);

        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
          mediaStreamRef.current = null;
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;

      setRecordingTime(0);
      setIsRecording(true);
      resetAIResult();
      setSubmitError("");

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch {
      setSubmitError(
        "Không thể truy cập microphone. Vui lòng cấp quyền ghi âm.",
      );
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  };

  const handleCreateFromVoice = async () => {
    if (!recordedFile) {
      setSubmitError("Bạn chưa có bản ghi âm để xử lý.");
      return;
    }

    await createDraftFromAudio(recordedFile);
  };

  const confirmAiItems = () => {
    const matchedItems = aiDraftItems.flatMap((item): CartItem[] => {
      if (!item.matched || item.unitPrice === null) {
        return [];
      }

      const productId = Number(item.productId);
      const saleItemId = Number(item.saleItemId);
      const price = Number(item.unitPrice);
      const quantity = Number(item.quantity);

      if (
        !Number.isFinite(productId) ||
        productId <= 0 ||
        !Number.isFinite(saleItemId) ||
        saleItemId <= 0 ||
        !Number.isFinite(price) ||
        price < 0 ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return [];
      }

      return [
        {
          productId,
          saleItemId,
          name: item.productName,
          unit: item.unit,
          price,
          discount: 0,
          quantity: Math.max(1, Math.round(quantity)),
          stock: 9999,
          trackInventory: false,
        },
      ];
    });

    if (matchedItems.length === 0) {
      setSubmitError(
        "AI chưa match được sản phẩm hợp lệ. Vui lòng thêm sản phẩm ở phần Nhập Thủ Công.",
      );
      return;
    }

    setCart((previous) => mergeCartItems(previous, matchedItems));

    const unresolvedCount = aiDraftItems.length - matchedItems.length;
    if (unresolvedCount > 0) {
      setSubmitError(
        `AI chưa match ${unresolvedCount} sản phẩm. Bạn có thể bổ sung ở phần Nhập Thủ Công.`,
      );
    } else {
      setSubmitError("");
    }

    setShowAiResult(false);
    setActiveMethod(null);
  };

  // --- File Upload ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitError("");
    resetAIResult();
    setUploadedFile(file);
  };

  const processUploadedFile = async () => {
    if (!uploadedFile) return;
    setIsProcessingFile(true);
    try {
      await createDraftFromAudio(uploadedFile);
    } finally {
      setIsProcessingFile(false);
    }
  };

  // Timer Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);

      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Browser-level navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (cart.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [cart.length]);

  // Format recording time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // Filtered products (quick search)
  const { data: searchResults = [] } = useQuickSearchProducts(
    selectedLocationId ?? 0,
    productSearch,
    activeMethod === "manual",
  );

  const cartSubTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        return sum + item.price * item.quantity;
      }, 0),
    [cart],
  );

  const cartDiscountTotal = useMemo(
    () =>
      cart.reduce((sum, item) => {
        return sum + Math.max(0, item.discount);
      }, 0),
    [cart],
  );

  const cartTotal = useMemo(
    () => Math.max(0, cartSubTotal - cartDiscountTotal),
    [cartSubTotal, cartDiscountTotal],
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
    () =>
      availableDebtorOptions.find(
        (d) => d.debtorId === Number(selectedDebtorId),
      ),
    [availableDebtorOptions, selectedDebtorId],
  );

  // Cart operations
  const addToCart = useCallback(
    (product: QuickSearchProduct, saleItem: SaleItem) => {
      setSubmitError("");
      setCart((prev) => {
        const existing = prev.find(
          (item) => item.saleItemId === saleItem.saleItemId,
        );
        if (existing) {
          return prev.map((item) =>
            item.saleItemId === saleItem.saleItemId
              ? { ...item, quantity: item.quantity + 1 }
              : item,
          );
        }
        return [
          ...prev,
          {
            productId: product.productId,
            saleItemId: saleItem.saleItemId,
            name: product.name,
            unit: saleItem.unit,
            price: saleItem.price,
            discount: 0,
            quantity: 1,
            stock: 9999, // quick search doesn't return stock
            trackInventory: false,
          },
        ];
      });
    },
    [],
  );

  const updateQuantity = useCallback((saleItemId: number, delta: number) => {
    setSubmitError("");
    setCart((prev) =>
      prev
        .map((item) =>
          item.saleItemId === saleItemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }, []);

  const setQuantity = useCallback((saleItemId: number, qty: number) => {
    setSubmitError("");
    if (qty <= 0) {
      setCart((prev) => prev.filter((item) => item.saleItemId !== saleItemId));
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.saleItemId === saleItemId ? { ...item, quantity: qty } : item,
      ),
    );
  }, []);

  const removeFromCart = useCallback((saleItemId: number) => {
    setSubmitError("");
    setCart((prev) => prev.filter((item) => item.saleItemId !== saleItemId));
  }, []);

  const setItemDiscount = useCallback(
    (saleItemId: number, discount: number) => {
      setSubmitError("");
      setCart((prev) =>
        prev.map((item) => {
          if (item.saleItemId !== saleItemId) return item;
          const lineSubTotal = item.price * item.quantity;
          return {
            ...item,
            discount: Math.max(0, Math.min(discount, lineSubTotal)),
          };
        }),
      );
    },
    [],
  );

  const routeAfterCreate = useCallback(
    (orderId: number, payload: CreateOrderRequest) => {
      const isDebtOnly =
        payload.debtAmount > 0 &&
        payload.cashAmount === 0 &&
        payload.bankAmount === 0;

      if (isDebtOnly) {
        router.push(`/dashboard/orders/${orderId}`);
        return;
      }

      router.push(`/dashboard/orders/${orderId}/payment`);
    },
    [router],
  );

  const submitCreateOrder = useCallback(
    async (payload: CreateOrderRequest) => {
      setIsSubmitting(true);
      try {
        const result = await createOrderMutation.mutateAsync(payload);
        if (result.data.requiresConfirmation && !payload.confirmLowStock) {
          const warnings =
            (result.warnings && result.warnings.length > 0
              ? result.warnings
              : result.data.warnings) ?? [];

          setPendingOrderPayload(payload);
          setConfirmationWarnings(warnings);
          setShowLowStockDialog(true);
          return;
        }

        if (!result.data.order) {
          throw new Error(result.message || "Không nhận được dữ liệu đơn hàng");
        }

        setShowLowStockDialog(false);
        setPendingOrderPayload(null);
        setConfirmationWarnings([]);
        routeAfterCreate(result.data.order.orderId, payload);
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "Không thể tạo đơn hàng. Vui lòng thử lại.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [createOrderMutation, routeAfterCreate],
  );

  // Submit
  const handleSubmit = async () => {
    if (cart.length === 0) return;
    setSubmitError("");

    const cash = paymentType === "cash" ? cartTotal : Number(cashAmount) || 0;
    const bank = paymentType === "bank" ? cartTotal : Number(bankAmount) || 0;
    const debt =
      paymentType === "debt"
        ? cartTotal
        : paymentType === "mixed"
          ? Math.max(0, cartTotal - cash - bank)
          : 0;

    const paymentSum = cash + bank + debt;
    if (paymentSum !== cartTotal) {
      setSubmitError(
        "Tổng tiền mặt + chuyển khoản + ghi nợ phải bằng tổng tiền sau discount.",
      );
      return;
    }

    if (debt > 0 && !selectedDebtorId) {
      setSubmitError("Đơn có ghi nợ thì bắt buộc chọn khách nợ.");
      return;
    }

    const debtValue = debt > 0 ? debt : 0;

    await submitCreateOrder({
      businessLocationId: selectedLocationId ?? 0,
      cashAmount: cash,
      bankAmount: bank,
      debtAmount: debtValue,
      debtorId: selectedDebtorId ? Number(selectedDebtorId) : undefined,
      note,
      items: cart.map((item) => ({
        saleItemId: item.saleItemId,
        quantity: item.quantity,
        discount: item.discount,
      })),
    });
  };

  const handleConfirmLowStock = async () => {
    if (!pendingOrderPayload) return;

    setSubmitError("");
    await submitCreateOrder({
      ...pendingOrderPayload,
      confirmLowStock: true,
    });
  };

  // Save draft ("treo đơn")
  const handleSaveDraft = () => {
    if (cart.length === 0) return;
    const debtor = selectedDebtor;
    saveDraftOrder(
      cart.map((item) => ({
        productId: item.productId,
        saleItemId: item.saleItemId,
        name: item.name,
        unit: item.unit,
        price: item.price,
        discount: item.discount,
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

  const handleBack = () => {
    if (cart.length > 0) {
      setShowLeaveDialog(true);
    } else {
      router.push("/dashboard/orders");
    }
  };

  const hasStockWarning = cart.some(
    (item) => item.trackInventory && item.quantity > item.stock,
  );

  const isDebtPayment = paymentType === "debt" || paymentType === "mixed";
  const requiresDebtor =
    paymentType === "debt" || (paymentType === "mixed" && debtAmount > 0);

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
      </div>

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
                      onClick={() => void processUploadedFile()}
                      disabled={
                        isProcessingFile || createAIDraftMutation.isPending
                      }
                      className="w-full bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
                    >
                      {isProcessingFile || createAIDraftMutation.isPending ? (
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
                      aiItems={aiDraftItems}
                      confidence={aiConfidence}
                      formatCurrency={formatCurrency}
                      onConfirm={confirmAiItems}
                      onRetry={() => {
                        resetAIResult();
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
                              resetAIResult();
                              setRecordedFile(null);
                              setRecordingTime(0);
                            }}
                          >
                            <Mic className="w-4 h-4 mr-2" />
                            Ghi Lại
                          </Button>
                          <Button
                            className="flex-1 bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
                            onClick={() => void handleCreateFromVoice()}
                            disabled={
                              !recordedFile || createAIDraftMutation.isPending
                            }
                          >
                            {createAIDraftMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Đang tạo draft...
                              </>
                            ) : (
                              <>
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Tạo Đơn Hàng
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                  {showAiResult && activeMethod === "voice" && (
                    <AIResultPanel
                      transcribedText={transcribedText}
                      aiItems={aiDraftItems}
                      confidence={aiConfidence}
                      formatCurrency={formatCurrency}
                      onConfirm={confirmAiItems}
                      onRetry={() => {
                        resetAIResult();
                        setRecordedFile(null);
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
                    {searchResults.flatMap((product) =>
                      product.saleItems.map((saleItem) => {
                        const cartItem = cart.find(
                          (c) => c.saleItemId === saleItem.saleItemId,
                        );

                        return (
                          <div
                            key={saleItem.saleItemId}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                              cartItem
                                ? "border-[#23C4C1] bg-[#23C4C1]/5"
                                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            <div className="flex-1 min-w-0 flex items-center gap-3">
                              {product.imageUrl && (
                                <Image
                                  src={product.imageUrl}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover rounded-md border"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-900 truncate">
                                    {product.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                  {product.sku && (
                                    <>
                                      <span className="font-mono">
                                        {product.sku}
                                      </span>
                                      <span>·</span>
                                    </>
                                  )}
                                  <span>{saleItem.unit}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 ml-4">
                              <span className="font-semibold text-gray-800 whitespace-nowrap">
                                {formatCurrency(saleItem.price)}
                              </span>
                              {cartItem ? (
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() =>
                                      updateQuantity(saleItem.saleItemId, -1)
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
                                        saleItem.saleItemId,
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
                                      updateQuantity(saleItem.saleItemId, 1)
                                    }
                                  >
                                    <Plus className="w-3 h-3" />
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => addToCart(product, saleItem)}
                                  className="text-[#23C4C1] border-[#23C4C1] hover:bg-[#23C4C1]/10"
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Thêm
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      }),
                    )}
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
                          <div className="mt-1.5 flex items-center gap-2">
                            <span className="text-xs text-gray-500">Giảm:</span>
                            <Input
                              type="number"
                              min="0"
                              value={item.discount}
                              onChange={(e) =>
                                setItemDiscount(
                                  item.productId,
                                  Number(e.target.value) || 0,
                                )
                              }
                              className="h-7 w-28 text-xs [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                          </div>
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
                            {formatCurrency(
                              Math.max(
                                0,
                                item.price * item.quantity - item.discount,
                              ),
                            )}
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
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>Tổng trước giảm</span>
                          <span>{formatCurrency(cartSubTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm text-red-600">
                          <span>Giảm giá</span>
                          <span>-{formatCurrency(cartDiscountTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-200 pt-2">
                          <span className="text-base font-semibold text-gray-700">
                            Tổng cộng
                          </span>
                          <span className="text-xl font-bold text-[#23C4C1]">
                            {formatCurrency(cartTotal)}
                          </span>
                        </div>
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
                        {isLoadingDebtors && (
                          <SelectItem value="__loading__" disabled>
                            Đang tải khách hàng...
                          </SelectItem>
                        )}
                        {!isLoadingDebtors &&
                          availableDebtorOptions.length === 0 && (
                            <SelectItem value="__empty__" disabled>
                              Không có khách hàng đang hoạt động
                            </SelectItem>
                          )}
                        {availableDebtorOptions.map((debtor) => (
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

                    <p className="mt-2 text-xs text-gray-500">
                      Chỉ hiển thị khách hàng ở trạng thái hoạt động. Nếu không
                      thấy tên khách, vào tab Khách Hàng Thân Thiết để kích hoạt
                      lại.
                    </p>

                    {aiDetectedCustomerName ? (
                      <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs">
                        <p className="text-blue-700">
                          AI nhận diện khách:{" "}
                          <strong>{aiDetectedCustomerName}</strong>
                        </p>
                        {aiMappedDebtorName ? (
                          <p className="text-emerald-700 mt-1">
                            Đã tự chọn khách nợ:{" "}
                            <strong>{aiMappedDebtorName}</strong>
                          </p>
                        ) : (
                          <div className="mt-1 space-y-2">
                            <p className="text-amber-700">
                              Chưa tìm thấy khách nợ trùng tên, vui lòng chọn
                              thủ công hoặc tạo mới.
                            </p>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100"
                              onClick={() =>
                                void handleCreateDebtorFromAIName()
                              }
                              disabled={createDebtorMutation.isPending}
                            >
                              {createDebtorMutation.isPending ? (
                                <>
                                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                  Đang tạo khách nợ...
                                </>
                              ) : (
                                <>Tạo khách nợ từ tên AI</>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : null}

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
                      (requiresDebtor && !selectedDebtorId)
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

                {requiresDebtor && !selectedDebtorId && (
                  <p className="text-xs text-red-500 text-center">
                    Vui lòng chọn khách hàng ghi nợ
                  </p>
                )}

                {submitError && (
                  <p className="text-xs text-red-500 text-center">
                    {submitError}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <AlertDialog
        open={showLowStockDialog}
        onOpenChange={(open) => {
          setShowLowStockDialog(open);
          if (!open) {
            setPendingOrderPayload(null);
            setConfirmationWarnings([]);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Xác nhận tạo đơn khi thiếu tồn kho
            </AlertDialogTitle>
            <AlertDialogDescription>
              Hệ thống phát hiện một hoặc nhiều sản phẩm không đủ tồn kho. Bạn
              có muốn tiếp tục tạo đơn không?
            </AlertDialogDescription>
          </AlertDialogHeader>
          {confirmationWarnings.length > 0 && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 space-y-1">
              {confirmationWarnings.map((warning, index) => (
                <p key={`${warning}-${index}`}>- {warning}</p>
              ))}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
              onClick={() => {
                void handleConfirmLowStock();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo đơn...
                </>
              ) : (
                "Tiếp tục tạo đơn"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hủy bỏ tạo đơn hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang có {cart.length} sản phẩm trong giỏ hàng. Nếu bạn thoát,
              đơn hàng sẽ không được tạo. Bạn muốn lưu nháp (treo đơn) hay thoát
              luôn?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="mt-0">Tiếp tục tạo</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                setShowLeaveDialog(false);
                router.push("/dashboard/orders");
              }}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Thoát không lưu
            </Button>
            <Button
              onClick={() => {
                setShowLeaveDialog(false);
                handleSaveDraft();
              }}
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
            >
              Treo đơn & Thoát
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
