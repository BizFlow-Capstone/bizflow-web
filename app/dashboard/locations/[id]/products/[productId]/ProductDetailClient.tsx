"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  Info,
  Package,
  Loader2,
  Trash2,
  Pencil,
  ToggleRight,
  TrendingUp,
  BarChart3,
  Calendar,
  Box,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from "lucide-react";
import {
  Area,
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
  useProductDetail,
  useProductCostPriceHistory,
  useUpdateProductStatus,
  useDeleteProduct,
  useAdjustProductStock,
} from "@/hooks/useProducts";
import { useLocations } from "@/hooks/useLocations";
import type { ProductCostPriceHistoryItem } from "@/lib/types/product";
import StockAdjustmentDialog from "@/components/products/StockAdjustmentDialog";
import { formatVnd } from "@/lib/format";

function formatDateTime(value?: string): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

type TimeRange = "7D" | "1M" | "3M" | "6M" | "1Y" | "ALL";

const RANGE_CONFIG: Array<{ value: TimeRange; label: string; days?: number }> =
  [
    { value: "7D", label: "1 Tuần", days: 7 },
    { value: "1M", label: "1 Tháng", days: 30 },
    { value: "3M", label: "3 Tháng", days: 90 },
    { value: "6M", label: "6 Tháng", days: 180 },
    { value: "1Y", label: "1 Năm", days: 365 },
    { value: "ALL", label: "Toàn bộ" },
  ];

const MAX_CHART_POINTS = 120;

const MOCK_COST_HISTORY: ProductCostPriceHistoryItem[] = [
  {
    importId: 1001,
    importCode: "PNK-MOCK-001",
    costPrice: 182000,
    quantity: 35,
    totalPrice: 6370000,
    supplier: "NCC Satra Food",
    receivedAt: "2026-01-02T08:20:00",
    createdAt: "2026-01-02T08:20:00",
  },
  {
    importId: 1002,
    importCode: "PNK-MOCK-002",
    costPrice: 176500,
    quantity: 40,
    totalPrice: 7060000,
    supplier: "NCC Satra Food",
    receivedAt: "2026-01-10T09:12:00",
    createdAt: "2026-01-10T09:12:00",
  },
  {
    importId: 1003,
    importCode: "PNK-MOCK-003",
    costPrice: 188000,
    quantity: 28,
    totalPrice: 5264000,
    supplier: "An Phat Distribution",
    receivedAt: "2026-01-18T10:01:00",
    createdAt: "2026-01-18T10:01:00",
  },
  {
    importId: 1004,
    importCode: "PNK-MOCK-004",
    costPrice: 194000,
    quantity: 24,
    totalPrice: 4656000,
    supplier: "An Phat Distribution",
    receivedAt: "2026-01-26T15:32:00",
    createdAt: "2026-01-26T15:32:00",
  },
  {
    importId: 1005,
    importCode: "PNK-MOCK-005",
    costPrice: 189500,
    quantity: 52,
    totalPrice: 9854000,
    supplier: "Viet Fresh Wholesale",
    receivedAt: "2026-02-03T07:40:00",
    createdAt: "2026-02-03T07:40:00",
  },
  {
    importId: 1006,
    importCode: "PNK-MOCK-006",
    costPrice: 201000,
    quantity: 33,
    totalPrice: 6633000,
    supplier: "Viet Fresh Wholesale",
    receivedAt: "2026-02-11T11:18:00",
    createdAt: "2026-02-11T11:18:00",
  },
  {
    importId: 1007,
    importCode: "PNK-MOCK-007",
    costPrice: 197000,
    quantity: 46,
    totalPrice: 9062000,
    supplier: "NCC Kim Phat",
    receivedAt: "2026-02-19T13:05:00",
    createdAt: "2026-02-19T13:05:00",
  },
  {
    importId: 1008,
    importCode: "PNK-MOCK-008",
    costPrice: 208500,
    quantity: 22,
    totalPrice: 4587000,
    supplier: "NCC Kim Phat",
    receivedAt: "2026-02-27T08:48:00",
    createdAt: "2026-02-27T08:48:00",
  },
  {
    importId: 1009,
    importCode: "PNK-MOCK-009",
    costPrice: 203000,
    quantity: 39,
    totalPrice: 7917000,
    supplier: "NCC Kim Phat",
    receivedAt: "2026-03-06T09:34:00",
    createdAt: "2026-03-06T09:34:00",
  },
  {
    importId: 1010,
    importCode: "PNK-MOCK-010",
    costPrice: 211500,
    quantity: 27,
    totalPrice: 5710500,
    supplier: "Viet Fresh Wholesale",
    receivedAt: "2026-03-14T14:22:00",
    createdAt: "2026-03-14T14:22:00",
  },
];

function getPointTime(item: ProductCostPriceHistoryItem): number {
  const rawTime = item.receivedAt || item.createdAt;
  const timestamp = rawTime ? new Date(rawTime).getTime() : Number.NaN;
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function downsampleHistory(
  history: ProductCostPriceHistoryItem[],
  maxPoints: number,
): ProductCostPriceHistoryItem[] {
  if (history.length <= maxPoints) return history;

  const sampled: ProductCostPriceHistoryItem[] = [history[0]];
  const step = (history.length - 2) / (maxPoints - 2);

  for (let index = 1; index < maxPoints - 1; index += 1) {
    const sourceIndex = Math.round(1 + (index - 1) * step);
    sampled.push(history[Math.min(sourceIndex, history.length - 2)]);
  }

  sampled.push(history[history.length - 1]);
  return sampled;
}

function formatShortDate(value?: string): string {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
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
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "price">("overview");
  const [selectedRange, setSelectedRange] = useState<TimeRange>("ALL");
  const [useMockData, setUseMockData] = useState(false);
  const locationIdNum = Number(locationId);

  // Mutations
  const updateStatusMutation = useUpdateProductStatus();
  const deleteProductMutation = useDeleteProduct();
  const adjustStockMutation = useAdjustProductStock();

  // Data fetching
  const {
    data: product,
    isLoading: isLoadingProduct,
    error: productError,
  } = useProductDetail(productIdNum);
  const {
    data: costPriceHistory,
    isLoading: isLoadingCostPriceHistory,
    error: costPriceHistoryError,
  } = useProductCostPriceHistory(productIdNum);
  const { data: locations = [] } = useLocations();

  const canManageProduct = useMemo(() => {
    if (!Number.isFinite(locationIdNum)) {
      return false;
    }

    return locations.some(
      (location) => location.id === locationIdNum && location.isOwner === true,
    );
  }, [locationIdNum, locations]);

  const saleItems = product?.saleItems ?? [];

  const isLoading = isLoadingProduct;

  const historySource = useMemo(() => {
    if (useMockData) return MOCK_COST_HISTORY;
    return costPriceHistory?.history ?? [];
  }, [useMockData, costPriceHistory]);

  const sortedHistory = useMemo(() => {
    const history = historySource;
    return [...history].sort((a, b) => getPointTime(a) - getPointTime(b));
  }, [historySource]);

  const filteredHistory = useMemo(() => {
    if (selectedRange === "ALL") return sortedHistory;

    const range = RANGE_CONFIG.find((r) => r.value === selectedRange);
    const days = range?.days;
    if (!days || sortedHistory.length === 0) return sortedHistory;

    const latest = getPointTime(sortedHistory[sortedHistory.length - 1]);
    const from = latest - days * 24 * 60 * 60 * 1000;
    const result = sortedHistory.filter((item) => getPointTime(item) >= from);

    return result.length > 0 ? result : sortedHistory;
  }, [selectedRange, sortedHistory]);

  const priceStats = useMemo(() => {
    const source = filteredHistory.length > 0 ? filteredHistory : sortedHistory;
    if (source.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        last:
          historySource.at(-1)?.costPrice ??
          costPriceHistory?.currentCostPrice ??
          0,
        totalQuantity: 0,
      };
    }

    const prices = source.map((item) => item.costPrice);
    const total = prices.reduce((sum, value) => sum + value, 0);
    const totalQuantity = source.reduce((sum, item) => sum + item.quantity, 0);

    return {
      min: Math.min(...prices),
      max: Math.max(...prices),
      average: Math.round(total / prices.length),
      last: prices[prices.length - 1],
      totalQuantity,
    };
  }, [filteredHistory, sortedHistory, costPriceHistory, historySource]);

  const chartModel = useMemo(() => {
    const source = filteredHistory.length > 0 ? filteredHistory : sortedHistory;
    const chartSource = downsampleHistory(source, MAX_CHART_POINTS);

    const chartData = chartSource.map((item, index, array) => {
      const previousPrice = array[index - 1]?.costPrice;
      const trendDirection =
        previousPrice === undefined
          ? "flat"
          : item.costPrice > previousPrice
            ? "up"
            : item.costPrice < previousPrice
              ? "down"
              : "flat";

      return {
        ...item,
        timestamp: getPointTime(item),
        shortDate: formatShortDate(item.receivedAt || item.createdAt),
        trendDirection,
      };
    });

    const prices = chartSource.map((item) => item.costPrice);

    const lowIndex =
      prices.length > 0
        ? prices.reduce(
            (minIndex, value, index, array) =>
              value < array[minIndex] ? index : minIndex,
            0,
          )
        : -1;

    const highIndex =
      prices.length > 0
        ? prices.reduce(
            (maxIndex, value, index, array) =>
              value > array[maxIndex] ? index : maxIndex,
            0,
          )
        : -1;

    const firstPrice = prices[0] ?? 0;
    const lastPrice = prices[prices.length - 1] ?? 0;
    const delta = lastPrice - firstPrice;
    const deltaPct = firstPrice > 0 ? (delta / firstPrice) * 100 : 0;

    return {
      chartSource,
      chartData,
      prices,
      lowIndex,
      highIndex,
      delta,
      deltaPct,
    };
  }, [filteredHistory, sortedHistory]);

  const historyWithTrend = useMemo(() => {
    return [...chartModel.chartSource]
      .map((item, index, array) => {
        const previous = array[index - 1];
        const change = previous ? item.costPrice - previous.costPrice : 0;
        const changePct =
          previous && previous.costPrice > 0
            ? (change / previous.costPrice) * 100
            : 0;

        return { ...item, changePct };
      })
      .reverse();
  }, [chartModel.chartSource]);

  const insightText = useMemo(() => {
    if (priceStats.last === priceStats.max && priceStats.max > 0) {
      return "Giá vốn hiện ở vùng cao nhất theo dữ liệu đang chọn. Nên theo dõi lại nhịp nhập hàng để tối ưu biên lợi nhuận.";
    }
    if (priceStats.last === priceStats.min && priceStats.min > 0) {
      return "Giá vốn đang ở vùng thấp. Đây là thời điểm phù hợp để cân nhắc tăng lượng nhập nếu nhu cầu ổn định.";
    }
    if (chartModel.delta > 0) {
      return `Giá vốn có xu hướng tăng ${chartModel.deltaPct.toFixed(1)}% so với điểm đầu kỳ. Cần bám sát giá bán và tồn kho.`;
    }
    if (chartModel.delta < 0) {
      return `Giá vốn đang giảm ${Math.abs(chartModel.deltaPct).toFixed(1)}% so với điểm đầu kỳ. Biên lợi nhuận có thể cải thiện nếu giữ giá bán.`;
    }
    return "Giá vốn đang đi ngang, chưa có biến động bất thường trong giai đoạn này.";
  }, [priceStats, chartModel]);

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

            {canManageProduct ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={updateStatusMutation.isPending}
                  onClick={() =>
                    updateStatusMutation.mutate({
                      productId: productIdNum,
                      data: {
                        status:
                          product.status === "active" ? "inactive" : "active",
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
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full px-6 py-6">
        <div className="rounded-xl border bg-white">
          <div className="border-b px-6 pt-3">
            <div className="flex items-center gap-8">
              <button
                type="button"
                className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
                  activeTab === "overview"
                    ? "border-[#23C4C1] text-[#0c7f7d]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                Tổng quan
              </button>
              <button
                type="button"
                className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${
                  activeTab === "price"
                    ? "border-[#23C4C1] text-[#0c7f7d]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => setActiveTab("price")}
              >
                Biến động giá
              </button>
            </div>
          </div>

          {activeTab === "overview" ? (
            <div className="p-6">
              <div className="grid gap-8 lg:grid-cols-12">
                <div className="lg:col-span-7">
                  <div className="space-y-8">
                    <section>
                      <div className="text-sm font-semibold text-gray-900">
                        Chi tiết sản phẩm
                      </div>
                      <div className="mt-5 grid gap-y-5 sm:grid-cols-2 sm:gap-x-8">
                        <div>
                          <div className="text-xs text-gray-500">
                            Tên sản phẩm
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {product.name}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Mã SKU</div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {product.sku || `#${product.productId}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Đơn vị tính
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {product.unit || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Danh mục</div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {product.businessTypeName || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Nhà sản xuất
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {product.manufacturer || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Vị trí kho
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {product.businessLocationName || "—"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Theo dõi tồn kho
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {product.trackInventory ? "Có" : "Không"}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">
                            Trạng thái
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {product.status === "active"
                              ? "Đang bán"
                              : "Ngừng bán"}
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
                              className="rounded-lg border bg-gray-50 px-4 py-3"
                            >
                              <div className="text-sm font-medium text-gray-900">
                                1 {item.unit} = {item.quantity} {product.unit}
                              </div>
                              <div className="mt-1 text-xs text-gray-600">
                                Giá bán
                              </div>
                              <div className="text-xs font-semibold text-gray-900">
                                {formatVnd(item.price)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-lg border bg-gray-50 px-4 py-3 text-sm text-gray-500">
                            Chưa có dữ liệu quy đổi đơn vị
                          </div>
                        )}
                      </div>
                    </section>
                  </div>
                </div>

                <div className="lg:col-span-5">
                  <div className="space-y-6">
                    <div className="rounded-lg border bg-white p-4">
                      <div className="relative mx-auto aspect-square w-full max-w-60 overflow-hidden rounded-lg border bg-gray-50">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                            sizes="240px"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <Package className="h-14 w-14 text-gray-300" />
                          </div>
                        )}
                      </div>

                      <div className="mt-4 space-y-3 border-t pt-4 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            Tồn kho hiện tại
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {product.stock}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 px-2 text-xs text-[#23C4C1] border-[#23C4C1] hover:bg-[#23C4C1]/10"
                              onClick={() => setShowStockDialog(true)}
                            >
                              Điều chỉnh
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Giá vốn</span>
                          <span className="font-semibold text-gray-900">
                            {formatVnd(product.costPrice || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Giá bán</span>
                          <span className="font-semibold text-green-600">
                            {formatVnd(
                              product.sellingPrice || product.price || 0,
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <BarcodeVisual
                        value={product.sku || String(product.productId)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-6">
                <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-cyan-500 via-blue-500 to-emerald-500 p-[1.5px] shadow-sm">
                  <div className="rounded-2xl bg-white p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                        <Sparkles className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                          Phân tích tự động
                          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-indigo-700">
                            Insight
                          </span>
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {insightText}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="relative overflow-hidden rounded-2xl border border-teal-200 bg-linear-to-br from-teal-50 to-white p-5 shadow-sm ring-1 ring-teal-600/10">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-700">
                      <TrendingUp className="h-4 w-4" /> Giá vốn hiện tại
                    </div>
                    <div className="text-2xl font-bold text-teal-900">
                      {formatVnd(priceStats.last)}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                      <span
                        className={`inline-flex items-center gap-0.5 rounded border px-1.5 py-0.5 font-bold ${
                          chartModel.deltaPct > 0
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : chartModel.deltaPct < 0
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : "border-slate-200 bg-slate-50 text-slate-700"
                        }`}
                      >
                        {chartModel.deltaPct > 0 ? (
                          <ArrowUpRight className="h-3 w-3" />
                        ) : chartModel.deltaPct < 0 ? (
                          <ArrowDownRight className="h-3 w-3" />
                        ) : (
                          <Minus className="h-3 w-3" />
                        )}
                        {Math.abs(chartModel.deltaPct).toFixed(1)}%
                      </span>
                      <span>so với đầu kỳ</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <BarChart3 className="h-4 w-4 text-slate-400" /> Giá vốn
                      trung bình
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatVnd(priceStats.average)}
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                      <Info className="h-3.5 w-3.5" /> Bình quân theo kỳ dữ liệu
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Box className="h-4 w-4 text-slate-400" /> Biên độ giá
                    </div>
                    <div className="text-lg font-bold text-slate-900">
                      {formatVnd(priceStats.min)} - {formatVnd(priceStats.max)}
                    </div>
                    <div className="relative mt-3 h-1.5 w-full rounded-full bg-slate-100">
                      {priceStats.max > priceStats.min && (
                        <div
                          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-white bg-teal-600 shadow-sm"
                          style={{
                            left: `calc(${((priceStats.last - priceStats.min) / (priceStats.max - priceStats.min)) * 100}% - 6px)`,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ring-1 ring-slate-900/5">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                      <Package className="h-4 w-4 text-slate-400" /> Tổng SL
                      nhập
                    </div>
                    <div className="text-2xl font-bold text-slate-900">
                      {priceStats.totalQuantity.toLocaleString("vi-VN")}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5" />{" "}
                      {chartModel.chartSource.length} lần nhập
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm ring-1 ring-slate-900/5">
                  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Biểu đồ biến động giá vốn
                      </h3>
                      <p className="mt-0.5 text-sm text-slate-500">
                        Xu hướng giá theo từng lần nhập kho.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setUseMockData((prev) => !prev)}
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                          useMockData
                            ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {useMockData ? "Mock Data: ON" : "Mock Data"}
                      </button>

                      <div className="flex rounded-lg border border-slate-200/60 bg-slate-100 p-1 shadow-inner">
                        {RANGE_CONFIG.map((range) => (
                          <button
                            key={range.value}
                            type="button"
                            onClick={() => setSelectedRange(range.value)}
                            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                              selectedRange === range.value
                                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5"
                                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <AnimatePresence mode="wait" initial={false}>
                    {!useMockData && isLoadingCostPriceHistory ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex h-90 items-center justify-center rounded-lg bg-gray-50"
                      >
                        <Loader2 className="h-7 w-7 animate-spin text-[#23C4C1]" />
                      </motion.div>
                    ) : !useMockData && costPriceHistoryError ? (
                      <motion.div
                        key="error"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                      >
                        Không thể tải dữ liệu biến động giá.
                      </motion.div>
                    ) : chartModel.chartSource.length === 0 ? (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="flex h-90 flex-col items-center justify-center rounded-lg border border-dashed bg-gray-50 text-center"
                      >
                        <BarChart3 className="h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm font-semibold text-gray-700">
                          Chưa có dữ liệu giá vốn
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          Biểu đồ sẽ xuất hiện sau khi có phiếu nhập kho.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key={`chart-${selectedRange}-${chartModel.chartSource.length}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.24, ease: "easeOut" }}
                        className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50/50 p-4 pb-8"
                      >
                        <div className="h-80 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart
                              data={chartModel.chartData}
                              margin={{
                                top: 16,
                                right: 18,
                                left: 8,
                                bottom: 8,
                              }}
                            >
                              <defs>
                                <linearGradient
                                  id="chartAreaFill"
                                  x1="0"
                                  y1="0"
                                  x2="0"
                                  y2="1"
                                >
                                  <stop
                                    offset="0%"
                                    stopColor="#94a3b8"
                                    stopOpacity="0.24"
                                  />
                                  <stop
                                    offset="100%"
                                    stopColor="#94a3b8"
                                    stopOpacity="0.03"
                                  />
                                </linearGradient>
                              </defs>

                              <CartesianGrid
                                stroke="#e2e8f0"
                                strokeDasharray="4 4"
                              />
                              <XAxis
                                dataKey="timestamp"
                                type="number"
                                domain={["dataMin", "dataMax"]}
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                tickFormatter={(value) =>
                                  formatShortDate(new Date(value).toISOString())
                                }
                                minTickGap={28}
                                axisLine={false}
                                tickLine={false}
                              />
                              <YAxis
                                yAxisId="price"
                                tick={{ fontSize: 11, fill: "#64748b" }}
                                tickFormatter={(value) =>
                                  `${Math.round(value / 1000)}k`
                                }
                                domain={["dataMin - 2000", "dataMax + 2000"]}
                                axisLine={false}
                                tickLine={false}
                                width={52}
                              />
                              <YAxis yAxisId="qty" orientation="right" hide />

                              <Tooltip
                                cursor={{
                                  stroke: "#94a3b8",
                                  strokeDasharray: "4 4",
                                }}
                                content={({ active, payload }) => {
                                  if (
                                    !active ||
                                    !payload ||
                                    payload.length === 0
                                  )
                                    return null;
                                  const row = payload[0]?.payload as
                                    | (ProductCostPriceHistoryItem & {
                                        trendDirection: "up" | "down" | "flat";
                                      })
                                    | undefined;
                                  if (!row) return null;

                                  const trendClass =
                                    row.trendDirection === "up"
                                      ? "text-emerald-700"
                                      : row.trendDirection === "down"
                                        ? "text-rose-700"
                                        : "text-slate-700";

                                  return (
                                    <div className="min-w-52 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 text-xs shadow-lg backdrop-blur-sm">
                                      <div className="mb-2 flex items-center justify-between font-semibold text-slate-500">
                                        <span>
                                          {formatDateTime(
                                            row.receivedAt || row.createdAt,
                                          )}
                                        </span>
                                        <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[11px]">
                                          {row.importCode}
                                        </span>
                                      </div>
                                      <div
                                        className={`text-lg font-bold ${trendClass}`}
                                      >
                                        {formatVnd(row.costPrice)}
                                      </div>
                                      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-slate-600">
                                        <span>
                                          SL nhập:{" "}
                                          {row.quantity.toLocaleString("vi-VN")}
                                        </span>
                                        <span>
                                          Tổng: {formatVnd(row.totalPrice)}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                }}
                              />

                              <Area
                                yAxisId="price"
                                type="monotone"
                                dataKey="costPrice"
                                fill="url(#chartAreaFill)"
                                stroke="none"
                                isAnimationActive
                              />

                              {chartModel.chartData
                                .slice(1)
                                .map((item, index) => {
                                  const previous = chartModel.chartData[index];
                                  if (!previous) return null;
                                  const isUp =
                                    item.costPrice >= previous.costPrice;
                                  return (
                                    <ReferenceLine
                                      key={`seg-${item.importId}-${index}`}
                                      yAxisId="price"
                                      segment={[
                                        {
                                          x: previous.timestamp,
                                          y: previous.costPrice,
                                        },
                                        {
                                          x: item.timestamp,
                                          y: item.costPrice,
                                        },
                                      ]}
                                      stroke={isUp ? "#16a34a" : "#dc2626"}
                                      strokeWidth={2.8}
                                      ifOverflow="visible"
                                    />
                                  );
                                })}

                              <Line
                                yAxisId="price"
                                type="monotone"
                                dataKey="costPrice"
                                stroke="transparent"
                                dot={({ cx, cy, payload }) => {
                                  if (!cx || !cy || !payload) return null;
                                  const trendDirection =
                                    payload.trendDirection as
                                      | "up"
                                      | "down"
                                      | "flat";
                                  const color =
                                    trendDirection === "up"
                                      ? "#16a34a"
                                      : trendDirection === "down"
                                        ? "#dc2626"
                                        : "#64748b";
                                  return (
                                    <circle
                                      cx={cx}
                                      cy={cy}
                                      r={4}
                                      fill={color}
                                      stroke="#ffffff"
                                      strokeWidth={2}
                                    />
                                  );
                                }}
                                activeDot={{
                                  r: 6,
                                  strokeWidth: 3,
                                  stroke: "#1e293b",
                                  fill: "#ffffff",
                                }}
                              />

                              <Bar
                                yAxisId="qty"
                                dataKey="quantity"
                                barSize={8}
                                radius={[3, 3, 0, 0]}
                              >
                                {chartModel.chartData.map((item, index) => (
                                  <Cell
                                    key={`qty-${item.importId}-${index}`}
                                    fill={
                                      item.trendDirection === "up"
                                        ? "#86efac"
                                        : item.trendDirection === "down"
                                          ? "#fca5a5"
                                          : "#cbd5e1"
                                    }
                                    fillOpacity={0.7}
                                  />
                                ))}
                              </Bar>

                              {chartModel.highIndex >= 0 &&
                                chartModel.chartData[chartModel.highIndex] && (
                                  <ReferenceDot
                                    yAxisId="price"
                                    x={
                                      chartModel.chartData[chartModel.highIndex]
                                        .timestamp
                                    }
                                    y={
                                      chartModel.chartData[chartModel.highIndex]
                                        .costPrice
                                    }
                                    r={5}
                                    fill="#dc2626"
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                  />
                                )}

                              {chartModel.lowIndex >= 0 &&
                                chartModel.chartData[chartModel.lowIndex] && (
                                  <ReferenceDot
                                    yAxisId="price"
                                    x={
                                      chartModel.chartData[chartModel.lowIndex]
                                        .timestamp
                                    }
                                    y={
                                      chartModel.chartData[chartModel.lowIndex]
                                        .costPrice
                                    }
                                    r={5}
                                    fill="#16a34a"
                                    stroke="#ffffff"
                                    strokeWidth={2}
                                  />
                                )}
                            </ComposedChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                          <span>
                            Từ{" "}
                            {formatDateTime(
                              chartModel.chartSource[0]?.receivedAt ||
                                chartModel.chartSource[0]?.createdAt,
                            )}
                          </span>
                          <span>
                            Đến{" "}
                            {formatDateTime(
                              chartModel.chartSource.at(-1)?.receivedAt ||
                                chartModel.chartSource.at(-1)?.createdAt,
                            )}
                          </span>
                          <span>
                            {chartModel.chartSource.length} điểm dữ liệu
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Stock Adjustment Dialog */}
      <StockAdjustmentDialog
        product={product}
        open={showStockDialog}
        onOpenChange={setShowStockDialog}
        isPending={adjustStockMutation.isPending}
        onConfirm={(productId, data) => {
          adjustStockMutation.mutate(
            { productId, data },
            { onSuccess: () => setShowStockDialog(false) },
          );
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa sản phẩm</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa sản phẩm{" "}
              <span className="font-semibold">
                {product.productName || product.name}
              </span>
              ? Hành động này không thể hoàn tác.
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
