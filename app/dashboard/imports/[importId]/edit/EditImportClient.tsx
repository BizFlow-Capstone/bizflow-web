"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  Package,
  Save,
  Info,
  Camera,
  ScanLine,
  ImageIcon,
  X,
  FileText,
  Upload,
  CheckCircle2,
  ClipboardList,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useImportDetail, useUpdateImport } from "@/hooks/useImports";
import { useProducts } from "@/hooks/useProducts";
import type { ImportItemRequest, ImportType } from "@/lib/types/import";
import type { Product } from "@/lib/types/product";

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDateVN(date: Date): string {
  return `Ngày ${date.getDate().toString().padStart(2, "0")} tháng ${(date.getMonth() + 1).toString().padStart(2, "0")} năm ${date.getFullYear()}`;
}

// --- OCR Helpers ---

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNumberNear(
  text: string,
  startIdx: number,
  maxLookAhead: number = 80,
): number | null {
  const segment = text.substring(startIdx, startIdx + maxLookAhead);
  const match = segment.match(
    /(?:x\s*|sl[:\s]*|s\.l[:\s]*|số lượng[:\s]*)(\d+)/i,
  );
  if (match) return parseInt(match[1], 10);
  const numMatch = segment.match(/\b(\d{1,6})\b/);
  if (numMatch) {
    const n = parseInt(numMatch[1], 10);
    if (n > 0 && n < 100000) return n;
  }
  return null;
}

function extractPriceNear(
  text: string,
  startIdx: number,
  maxLookAhead: number = 120,
): number | null {
  const segment = text.substring(startIdx, startIdx + maxLookAhead);
  const match = segment.match(/(\d{1,3}(?:[.,]\d{3})+)\s*[đd]?/);
  if (match) {
    return parseInt(match[1].replace(/[.,]/g, ""), 10);
  }
  const numMatch = segment.match(/\b(\d{4,})\b/);
  if (numMatch) return parseInt(numMatch[1], 10);
  return null;
}

/**
 * Extract supplier info from raw OCR text.
 */
function extractSupplierFromText(text: string): {
  name?: string;
  address?: string;
  taxId?: string;
  phone?: string;
} {
  const result: {
    name?: string;
    address?: string;
    taxId?: string;
    phone?: string;
  } = {};

  const namePatterns = [
    /(?:nhà cung cấp|đơn vị bán|người bán|ncc|tên công ty|cty)[:\s]+([^\n]{3,80})/i,
    /(?:công ty|cty)\s+(?:tnhh|cp|cổ phần)?\s*[^\n]{3,80}/i,
  ];
  for (const pat of namePatterns) {
    const m = text.match(pat);
    if (m) {
      result.name = (m[1] || m[0]).trim().replace(/[.;,]+$/, "");
      break;
    }
  }

  const addrMatch = text.match(/(?:địa chỉ|đ\/c|dc)[:\s]+([^\n]{5,120})/i);
  if (addrMatch) {
    result.address = addrMatch[1].trim().replace(/[.;,]+$/, "");
  }

  const taxMatch = text.match(
    /(?:mã số thuế|mst|msdn|số cmnd|cccd|cmnd)[:\s]*(\d[\d\s-]{7,20})/i,
  );
  if (taxMatch) {
    result.taxId = taxMatch[1].replace(/\s/g, "").trim();
  }

  const phoneMatch = text.match(
    /(?:điện thoại|đt|sđt|tel|phone)[:\s]*((?:0|\+84)[\d\s.-]{8,15})/i,
  );
  if (phoneMatch) {
    result.phone = phoneMatch[1].replace(/[\s.-]/g, "").trim();
  }

  return result;
}

/**
 * Extract notes/remarks from raw OCR text.
 */
function extractNoteFromText(text: string): string | null {
  const notePatterns = [
    /(?:ghi chú|diễn giải|lý do|nội dung nhập|nội dung)[:\s]+([^\n]{3,200})/i,
  ];
  for (const pat of notePatterns) {
    const m = text.match(pat);
    if (m) {
      return m[1].trim().replace(/[.;,]+$/, "");
    }
  }
  return null;
}

// Extended item row with product name for display
interface ImportItemRow {
  productId: number;
  productName: string;
  quantity: number;
  costPrice: number;
}

// --- Main Component ---

export default function EditImportClient() {
  const params = useParams();
  const router = useRouter();
  const importId = Number(params.importId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: importDetail, isLoading, error } = useImportDetail(importId);
  const updateMutation = useUpdateImport();

  // Form state
  const [importType, setImportType] = useState<ImportType>("INVOICE");
  const [hasInvoice, setHasInvoice] = useState(true);
  const [supplier, setSupplier] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierIdNumber, setSupplierIdNumber] = useState("");
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ImportItemRow[]>([
    { productId: 0, productName: "", quantity: 1, costPrice: 0 },
  ]);
  const [initialized, setInitialized] = useState(false);

  // Invoice photo state
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [ocrText, setOcrText] = useState<string>("");
  const [ocrProgress, setOcrProgress] = useState(0);
  const [scanResult, setScanResult] = useState<string>("");

  // Fetch products for this location
  const locationId = importDetail?.businessLocationId ?? 0;
  const { data: productData, isLoading: isLoadingProducts } = useProducts({
    locationId,
    pageSize: 200,
  });
  const products: Product[] = useMemo(
    () => productData?.items ?? [],
    [productData],
  );

  // Initialize form with existing data
  useEffect(() => {
    if (importDetail && !initialized) {
      setImportType(importDetail.importType);
      setHasInvoice(importDetail.hasInvoice ?? true);
      setSupplier(importDetail.supplier || "");
      setNote(importDetail.note || "");
      if (importDetail.items && importDetail.items.length > 0) {
        setItems(
          importDetail.items.map((item) => ({
            productId: item.productId,
            productName: item.productName || `Sản phẩm #${item.productId}`,
            quantity: item.quantity,
            costPrice: item.costPrice,
          })),
        );
      }
      setInitialized(true);
    }
  }, [importDetail, initialized]);

  // Calculate total
  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity * item.costPrice, 0),
    [items],
  );

  // Item management
  const addItem = () => {
    setItems([
      ...items,
      { productId: 0, productName: "", quantity: 1, costPrice: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const selectProduct = (index: number, productId: string) => {
    const product = products.find((p) => p.productId === Number(productId));
    if (!product) return;
    const updated = [...items];
    updated[index] = {
      ...updated[index],
      productId: product.productId,
      productName: product.name,
    };
    setItems(updated);
  };

  const updateItemField = (
    index: number,
    field: "quantity" | "costPrice",
    value: number,
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Already selected product IDs (prevent duplicates)
  const selectedProductIds = useMemo(
    () => new Set(items.map((i) => i.productId).filter((id) => id > 0)),
    [items],
  );

  // --- Invoice Photo Handling ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInvoiceFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInvoiceImage(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    setOcrText("");
    setScanResult("");
  };

  const removeImage = () => {
    setInvoiceImage(null);
    setInvoiceFile(null);
    setOcrText("");
    setScanResult("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // --- OCR: Tesseract.js ---

  const handleOcrScan = useCallback(async () => {
    if (!invoiceFile) return;
    setIsScanning(true);
    setOcrProgress(10);
    setScanResult("");
    setOcrText("");

    try {
      setOcrProgress(20);
      const Tesseract = await import("tesseract.js");
      const tesseractResult = await Tesseract.recognize(
        invoiceFile,
        "vie+eng",
        {
          logger: (m: { status: string; progress: number }) => {
            if (m.status === "recognizing text") {
              setOcrProgress(20 + Math.round(m.progress * 60));
            }
          },
        },
      );

      const extractedText = tesseractResult.data.text;
      setOcrText(extractedText);
      setOcrProgress(85);

      // Auto-fill supplier info from OCR text
      const supplierInfo = extractSupplierFromText(extractedText);
      if (supplierInfo.name && !supplier) setSupplier(supplierInfo.name);
      if (supplierInfo.address && !supplierAddress)
        setSupplierAddress(supplierInfo.address);
      if (supplierInfo.taxId && !supplierIdNumber)
        setSupplierIdNumber(supplierInfo.taxId);

      // Auto-fill note from OCR text
      const extractedNote = extractNoteFromText(extractedText);
      if (extractedNote && !note) setNote(extractedNote);

      // Match products
      const normalizedOcr = normalizeText(extractedText);
      const matchedItems: ImportItemRow[] = [];
      let matchCount = 0;

      for (const product of products) {
        const normalizedName = normalizeText(product.name);
        let matchIdx = normalizedOcr.indexOf(normalizedName);

        if (matchIdx === -1) {
          const words = normalizedName.split(" ").filter((w) => w.length >= 3);
          for (const word of words) {
            const idx = normalizedOcr.indexOf(word);
            if (idx !== -1) {
              matchIdx = idx;
              break;
            }
          }
        }

        if (matchIdx !== -1) {
          const qty = extractNumberNear(normalizedOcr, matchIdx) ?? 1;
          const price = extractPriceNear(normalizedOcr, matchIdx) ?? 0;
          matchedItems.push({
            productId: product.productId,
            productName: product.name,
            quantity: qty,
            costPrice: price,
          });
          matchCount++;
        }
      }

      setOcrProgress(100);

      const infoParts: string[] = [];
      if (matchedItems.length > 0) {
        setItems(matchedItems);
        infoParts.push(`Nhận diện ${matchCount} sản phẩm`);
      }
      if (supplierInfo.name) infoParts.push(`NCC: ${supplierInfo.name}`);
      if (extractedNote) infoParts.push(`Ghi chú: "${extractedNote}"`);

      if (infoParts.length > 0) {
        setScanResult(`✅ ${infoParts.join(". ")}. Vui lòng kiểm tra lại.`);
      } else {
        setScanResult(
          "Không nhận diện được thông tin nào. Vui lòng nhập thủ công.",
        );
      }
    } catch (err) {
      console.error("OCR error:", err);
      setScanResult("Lỗi khi quét hóa đơn. Vui lòng nhập thủ công.");
    } finally {
      setIsScanning(false);
    }
  }, [
    invoiceFile,
    products,
    supplier,
    supplierAddress,
    supplierIdNumber,
    note,
  ]);

  // Reset items when switching type
  const handleTypeChange = (val: string) => {
    const newType = val as ImportType;
    setImportType(newType);
    // Re-initialize items from original data if available
    if (importDetail?.items && importDetail.items.length > 0) {
      setItems(
        importDetail.items.map((item) => ({
          productId: item.productId,
          productName: item.productName || `Sản phẩm #${item.productId}`,
          quantity: item.quantity,
          costPrice: item.costPrice,
        })),
      );
    } else {
      setItems([{ productId: 0, productName: "", quantity: 1, costPrice: 0 }]);
    }
    removeImage();
  };

  // Validation
  const isValid = useMemo(() => {
    if (items.length === 0) return false;
    return items.every(
      (item) => item.productId > 0 && item.quantity >= 1 && item.costPrice >= 0,
    );
  }, [items]);

  // Build request items (strip productName)
  const buildRequestItems = (): ImportItemRequest[] =>
    items.map(({ productId, quantity, costPrice }) => ({
      productId,
      quantity,
      costPrice,
    }));

  // Submit
  const handleSave = async () => {
    if (!isValid) return;
    try {
      const result = await updateMutation.mutateAsync({
        importId,
        data: {
          importType,
          hasInvoice,
          supplier: supplier || undefined,
          note: note || undefined,
          items: buildRequestItems(),
          image: invoiceFile || undefined,
        },
      });
      if (result.success) {
        router.push(`/dashboard/imports/${importId}`);
      }
    } catch (err) {
      console.error("Error updating import:", err);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">Đang tải phiếu...</span>
      </div>
    );
  }

  // Error
  if (error || !importDetail) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Không thể tải phiếu nhập kho
          </h3>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/imports")}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>
    );
  }

  if (importDetail.status !== "DRAFT") {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="mx-auto bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-amber-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Không thể chỉnh sửa
          </h3>
          <p className="text-gray-500 mt-1">
            Chỉ có thể chỉnh sửa phiếu ở trạng thái Nháp.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(`/dashboard/imports/${importId}`)}
            className="mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại chi tiết
          </Button>
        </div>
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
              onClick={() => router.push(`/dashboard/imports/${importId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Chỉnh sửa: {importDetail.importCode}
              </p>
              <p className="text-sm text-gray-600">
                Kho:{" "}
                <span className="font-semibold text-[#23C4C1]">
                  {importDetail.businessLocationName}
                </span>
              </p>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={!isValid || updateMutation.isPending}
            className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white gap-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Lưu thay đổi
          </Button>
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          {/* ===== Import Type Selector ===== */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6">
            <div className="px-8 py-5 space-y-4">
              <div className="flex items-center gap-4 flex-wrap">
                <Label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Mục đích nhập:
                </Label>
                <div className="flex gap-3">
                  {(
                    [
                      {
                        key: "INVOICE",
                        label: "Nhập hàng",
                        desc: "Nhập hàng từ nhà cung cấp",
                        icon: <Package className="w-5 h-5" />,
                      },
                      {
                        key: "INVENTORY_ADJUSTMENT",
                        label: "Điều chỉnh tồn kho",
                        desc: "Kiểm kê, hàng hư, thừa/thiếu",
                        icon: <ClipboardList className="w-5 h-5" />,
                      },
                      {
                        key: "RETURN",
                        label: "Trả hàng nhập lại",
                        desc: "Khách trả hàng → nhập lại kho",
                        icon: <RotateCcw className="w-5 h-5" />,
                      },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleTypeChange(opt.key)}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-lg border-2 transition-all ${
                        importType === opt.key
                          ? "border-[#23C4C1] bg-[#23C4C1]/5 text-[#23C4C1] shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {opt.icon}
                      <div className="text-left">
                        <p className="text-sm font-semibold">{opt.label}</p>
                        <p className="text-xs opacity-70">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-4 flex-wrap">
                <Label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Loại chứng từ:
                </Label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setHasInvoice(false);
                      removeImage();
                    }}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-lg border-2 transition-all ${
                      !hasInvoice
                        ? "border-[#23C4C1] bg-[#23C4C1]/5 text-[#23C4C1] shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-semibold">Không có hóa đơn</p>
                      <p className="text-xs opacity-70">
                        Nhập thủ công theo mẫu phiếu
                      </p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasInvoice(true)}
                    className={`flex items-center gap-2.5 px-5 py-3 rounded-lg border-2 transition-all ${
                      hasInvoice
                        ? "border-[#23C4C1] bg-[#23C4C1]/5 text-[#23C4C1] shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <Camera className="w-5 h-5" />
                    <div className="text-left">
                      <p className="text-sm font-semibold">Có hóa đơn</p>
                      <p className="text-xs opacity-70">
                        Chụp hình hóa đơn + nhập số lượng
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ============================================ */}
          {/* MODE: Has Invoice — Photo + Simplified Entry */}
          {/* ============================================ */}
          {hasInvoice && (
            <div className="space-y-6">
              {/* Photo Upload Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 py-5">
                  <p className="text-base font-semibold text-gray-800 mb-1">
                    Hóa đơn nhà cung cấp
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    Chụp hình hoặc tải lên ảnh hóa đơn. Hệ thống sẽ tự động nhận
                    diện tên sản phẩm, số lượng, đơn giá, thông tin nhà cung cấp
                    và ghi chú (nếu có).
                  </p>

                  {!invoiceImage ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-[#23C4C1] transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="invoice-upload-edit"
                      />
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                      <div className="flex justify-center gap-3">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          Tải ảnh lên
                        </Button>
                        <Button
                          onClick={() => {
                            if (fileInputRef.current) {
                              fileInputRef.current.setAttribute(
                                "capture",
                                "environment",
                              );
                              fileInputRef.current.click();
                            }
                          }}
                          className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Chụp hình
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-3">
                        Hỗ trợ JPG, PNG, HEIC — Tối đa 10MB
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                        <img
                          src={invoiceImage}
                          alt="Hóa đơn"
                          className="w-full max-h-[500px] object-contain"
                        />
                        <button
                          onClick={removeImage}
                          className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow-md transition"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        <Button
                          onClick={handleOcrScan}
                          disabled={isScanning}
                          className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white gap-2"
                        >
                          {isScanning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ScanLine className="w-4 h-4" />
                          )}
                          {isScanning
                            ? `Đang quét... ${ocrProgress}%`
                            : "Quét hóa đơn (AI)"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          className="gap-2"
                        >
                          <Camera className="w-4 h-4" />
                          Chụp lại
                        </Button>

                        {isScanning && (
                          <div className="flex-1 min-w-[200px]">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#23C4C1] transition-all duration-300 rounded-full"
                                style={{ width: `${ocrProgress}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {scanResult && (
                        <div
                          className={`px-4 py-3 rounded-lg text-sm ${
                            scanResult.includes("Đã nhận diện")
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {scanResult.includes("Đã nhận diện") ? (
                            <CheckCircle2 className="w-4 h-4 inline mr-2" />
                          ) : (
                            <Info className="w-4 h-4 inline mr-2" />
                          )}
                          {scanResult}
                        </div>
                      )}

                      {ocrText && (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                            Xem văn bản trích xuất từ hóa đơn
                          </summary>
                          <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 max-h-[200px] overflow-auto whitespace-pre-wrap font-mono">
                            {ocrText}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Supplier info (compact) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 py-5">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Thông tin nhà cung cấp & ghi chú
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">
                        Nhà cung cấp
                      </Label>
                      <Input
                        placeholder="Nhập tên NCC..."
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        maxLength={200}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">Ghi chú</Label>
                      <Input
                        placeholder="Nhập ghi chú..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-gray-500">
                        Số hóa đơn (nếu có)
                      </Label>
                      <Input
                        placeholder="VD: HD001234"
                        value={supplierIdNumber}
                        onChange={(e) => setSupplierIdNumber(e.target.value)}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Items Table (Invoice mode) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-8 pt-5 pb-2">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        Hàng hóa nhập kho
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Chọn sản phẩm và nhập số lượng, đơn giá theo hóa đơn
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addItem}
                      className="gap-1.5 h-8 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm dòng
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 border-y border-gray-300">
                      <TableHead className="font-bold text-gray-700 text-center text-xs w-14 border-r border-gray-200">
                        STT
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 text-xs border-r border-gray-200 min-w-[240px]">
                        Sản phẩm <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 text-center text-xs border-r border-gray-200 w-28">
                        Số lượng <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 text-right text-xs border-r border-gray-200 w-36">
                        Đơn giá <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead className="font-bold text-gray-700 text-right text-xs w-40">
                        Thành tiền
                      </TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow
                        key={index}
                        className="border-b border-gray-200"
                      >
                        <TableCell className="text-center text-sm text-gray-500 font-medium border-r border-gray-100">
                          {index + 1}
                        </TableCell>
                        <TableCell className="border-r border-gray-100 p-1.5">
                          <Select
                            value={
                              item.productId ? item.productId.toString() : ""
                            }
                            onValueChange={(val) => selectProduct(index, val)}
                          >
                            <SelectTrigger className="h-9 text-sm border-gray-200">
                              <SelectValue
                                placeholder={
                                  isLoadingProducts
                                    ? "Đang tải..."
                                    : "Chọn sản phẩm..."
                                }
                              />
                            </SelectTrigger>
                            <SelectContent>
                              {products
                                .filter(
                                  (p) =>
                                    !selectedProductIds.has(p.productId) ||
                                    p.productId === item.productId,
                                )
                                .map((p) => (
                                  <SelectItem
                                    key={p.productId}
                                    value={p.productId.toString()}
                                  >
                                    <span className="font-medium">
                                      {p.name}
                                    </span>
                                    <span className="ml-2 text-xs text-gray-400">
                                      (Tồn: {p.stock})
                                    </span>
                                  </SelectItem>
                                ))}
                              {products.length === 0 && !isLoadingProducts && (
                                <SelectItem value="none" disabled>
                                  Không có sản phẩm
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="border-r border-gray-100 p-1.5">
                          <Input
                            type="number"
                            min={1}
                            placeholder="0"
                            value={item.quantity || ""}
                            onChange={(e) =>
                              updateItemField(
                                index,
                                "quantity",
                                Number(e.target.value),
                              )
                            }
                            className="h-9 text-sm text-center"
                          />
                        </TableCell>
                        <TableCell className="border-r border-gray-100 p-1.5">
                          <Input
                            type="number"
                            min={0}
                            placeholder="0"
                            value={item.costPrice || ""}
                            onChange={(e) =>
                              updateItemField(
                                index,
                                "costPrice",
                                Number(e.target.value),
                              )
                            }
                            className="h-9 text-sm text-right"
                          />
                        </TableCell>
                        <TableCell className="text-right text-sm font-semibold text-gray-800 px-3">
                          {formatCurrency(item.quantity * item.costPrice)}
                        </TableCell>
                        <TableCell className="p-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(index)}
                            disabled={items.length <= 1}
                            className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 border-t-2 border-gray-300">
                      <TableCell
                        colSpan={4}
                        className="text-right text-sm font-bold text-gray-700 pr-4"
                      >
                        Tổng cộng:
                      </TableCell>
                      <TableCell className="text-right text-base font-bold text-[#23C4C1] px-3">
                        {formatCurrency(totalAmount)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* ============================================ */}
          {/* MODE: No Invoice — Mẫu 01/TNDN Template     */}
          {/* ============================================ */}
          {!hasInvoice && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Title Section */}
              <div className="px-8 pt-8 pb-4 text-center">
                <p className="text-xs text-gray-500 mb-1 italic">
                  Mẫu số: 01/TNDN — (Ban hành kèm theo Thông tư số
                  78/2014/TT-BTC của Bộ Tài chính)
                </p>
                <h2 className="text-xl font-bold text-gray-800 uppercase tracking-wide">
                  Bảng kê thu mua hàng hóa, dịch vụ
                </h2>
                <h3 className="text-lg font-bold text-gray-700 uppercase">
                  Chỉnh sửa phiếu — {importDetail.importCode}
                </h3>
                <p className="text-sm text-gray-500 mt-2 italic">
                  {formatDateVN(new Date())}
                </p>
              </div>

              <Separator />

              {/* Business Info */}
              <div className="px-8 py-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-gray-600 whitespace-nowrap w-44">
                        Tên doanh nghiệp:
                      </Label>
                      <span className="text-sm font-semibold text-gray-800">
                        {importDetail.businessLocationName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-gray-600 whitespace-nowrap w-44">
                        Nhà cung cấp:
                      </Label>
                      <Input
                        placeholder="Nhập tên nhà cung cấp..."
                        value={supplier}
                        onChange={(e) => setSupplier(e.target.value)}
                        className="h-8 text-sm max-w-[240px]"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-gray-600 whitespace-nowrap w-28">
                        Ghi chú:
                      </Label>
                      <Input
                        placeholder="Nhập ghi chú..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Seller Info */}
              {/* <div className="px-8 py-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Thông tin Người bán (Nhà cung cấp)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Tên người bán / NCC
                    </Label>
                    <Input
                      placeholder="Nhập tên nhà cung cấp..."
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      maxLength={200}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">Địa chỉ</Label>
                    <Input
                      placeholder="Nhập địa chỉ..."
                      value={supplierAddress}
                      onChange={(e) => setSupplierAddress(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-gray-500">
                      Số CMT / Mã số thuế
                    </Label>
                    <Input
                      placeholder="Nhập số..."
                      value={supplierIdNumber}
                      onChange={(e) => setSupplierIdNumber(e.target.value)}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
              </div> */}

              <Separator />

              {/* Items Table */}
              <div className="px-8 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-700">
                    Hàng hóa mua vào
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addItem}
                    className="gap-1.5 h-8 text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Thêm dòng
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 border-y border-gray-300">
                    <TableHead className="font-bold text-gray-700 text-center text-xs w-14 border-r border-gray-200">
                      STT
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-xs border-r border-gray-200 min-w-[240px]">
                      Tên mặt hàng <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-center text-xs border-r border-gray-200 w-24">
                      Số lượng <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-right text-xs border-r border-gray-200 w-36">
                      Đơn giá <span className="text-red-500">*</span>
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-right text-xs border-r border-gray-200 w-40">
                      Tổng giá thanh toán
                    </TableHead>
                    <TableHead className="font-bold text-gray-700 text-center text-xs w-24">
                      Ghi chú
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                  <TableRow className="bg-gray-50/50 border-b border-gray-300">
                    <TableHead className="text-center text-[10px] text-gray-400 border-r border-gray-200">
                      1
                    </TableHead>
                    <TableHead className="text-center text-[10px] text-gray-400 border-r border-gray-200">
                      5
                    </TableHead>
                    <TableHead className="text-center text-[10px] text-gray-400 border-r border-gray-200">
                      6
                    </TableHead>
                    <TableHead className="text-center text-[10px] text-gray-400 border-r border-gray-200">
                      7
                    </TableHead>
                    <TableHead className="text-center text-[10px] text-gray-400 border-r border-gray-200">
                      8
                    </TableHead>
                    <TableHead className="text-center text-[10px] text-gray-400">
                      9
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index} className="border-b border-gray-200">
                      <TableCell className="text-center text-sm text-gray-500 font-medium border-r border-gray-100">
                        {index + 1}
                      </TableCell>
                      <TableCell className="border-r border-gray-100 p-1.5">
                        <Select
                          value={
                            item.productId ? item.productId.toString() : ""
                          }
                          onValueChange={(val) => selectProduct(index, val)}
                        >
                          <SelectTrigger className="h-9 text-sm border-gray-200">
                            <SelectValue
                              placeholder={
                                isLoadingProducts
                                  ? "Đang tải..."
                                  : "Chọn sản phẩm..."
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {products
                              .filter(
                                (p) =>
                                  !selectedProductIds.has(p.productId) ||
                                  p.productId === item.productId,
                              )
                              .map((p) => (
                                <SelectItem
                                  key={p.productId}
                                  value={p.productId.toString()}
                                >
                                  <span className="font-medium">{p.name}</span>
                                  <span className="ml-2 text-xs text-gray-400">
                                    (Tồn: {p.stock})
                                  </span>
                                </SelectItem>
                              ))}
                            {products.length === 0 && !isLoadingProducts && (
                              <SelectItem value="none" disabled>
                                Không có sản phẩm
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="border-r border-gray-100 p-1.5">
                        <Input
                          type="number"
                          min={1}
                          placeholder="0"
                          value={item.quantity || ""}
                          onChange={(e) =>
                            updateItemField(
                              index,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="h-9 text-sm text-center"
                        />
                      </TableCell>
                      <TableCell className="border-r border-gray-100 p-1.5">
                        <Input
                          type="number"
                          min={0}
                          placeholder="0"
                          value={item.costPrice || ""}
                          onChange={(e) =>
                            updateItemField(
                              index,
                              "costPrice",
                              Number(e.target.value),
                            )
                          }
                          className="h-9 text-sm text-right"
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold text-gray-800 border-r border-gray-100 px-3">
                        {formatCurrency(item.quantity * item.costPrice)}
                      </TableCell>
                      <TableCell className="text-center text-xs text-gray-400 px-2">
                        —
                      </TableCell>
                      <TableCell className="p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(index)}
                          disabled={items.length <= 1}
                          className="text-red-400 hover:text-red-600 hover:bg-red-50 h-7 w-7"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {/* Total row */}
                  <TableRow className="bg-gray-50 border-t-2 border-gray-300">
                    <TableCell
                      colSpan={4}
                      className="text-right text-sm font-bold text-gray-700 pr-4"
                    >
                      Tổng giá trị hàng hóa mua vào:
                    </TableCell>
                    <TableCell className="text-right text-base font-bold text-[#23C4C1] px-3">
                      {formatCurrency(totalAmount)}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableBody>
              </Table>

              {/* Footer / Signature */}
              <div className="px-8 py-6">
                <Separator className="mb-6" />
                <div className="flex justify-between">
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-gray-700">
                      Người lập bảng kê
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      (Ký, ghi rõ họ tên)
                    </p>
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm text-gray-500 italic">
                      {formatDateVN(new Date())}
                    </p>
                    <p className="text-sm font-semibold text-gray-700">
                      Giám đốc doanh nghiệp
                    </p>
                    <p className="text-xs text-gray-500 italic">
                      (Ký tên, đóng dấu)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Validation hint */}
          {!isValid && items.some((i) => i.productId === 0) && (
            <p className="mt-4 text-sm text-amber-600 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
              <Info className="w-4 h-4 inline mr-2" />
              Vui lòng chọn sản phẩm, nhập số lượng (≥ 1) và đơn giá (≥ 0) cho
              tất cả các dòng.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
