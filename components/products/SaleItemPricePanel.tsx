"use client";

import { useState } from "react";
import { Loader2, Tag, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useProductSaleItems,
  useAdjustSaleItemPrices,
} from "@/hooks/useProducts";

type SaleItemPricePanelProps = {
  productId: number;
};

/**
 * Inline panel (rendered inside an expanded table row) that:
 * - Lists all sale items (price tiers) for the product
 * - Allows selecting individual or all items
 * - Adjusts selling prices by a fixed delta (positive = increase, negative = decrease)
 * Owner only.
 */
export default function SaleItemPricePanel({
  productId,
}: SaleItemPricePanelProps) {
  const { data, isLoading, error, refetch } = useProductSaleItems(productId);

  const adjustMutation = useAdjustSaleItemPrices();

  const saleItems = data?.saleItems ?? [];

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [delta, setDelta] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  const allSelected =
    saleItems.length > 0 && selectedIds.size === saleItems.length;
  const someSelected = selectedIds.size > 0 && !allSelected;

  const parsedDelta = parseFloat(delta);
  const canSubmit =
    selectedIds.size > 0 &&
    !isNaN(parsedDelta) &&
    parsedDelta !== 0 &&
    !adjustMutation.isPending;

  function toggleAll(checked: boolean) {
    if (checked) setSelectedIds(new Set(saleItems.map((i) => i.saleItemId)));
    else setSelectedIds(new Set());
  }

  function toggleItem(id: number, checked: boolean) {
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    setSelectedIds(next);
  }

  function handleApply() {
    if (!canSubmit) return;
    setSucceeded(false);
    adjustMutation.mutate(
      { deltaAmount: parsedDelta, saleItemIds: [...selectedIds] },
      {
        onSuccess: () => {
          setDelta("");
          setSucceeded(true);
          refetch();
          setTimeout(() => setSucceeded(false), 3000);
        },
      },
    );
  }

  return (
    <div className="bg-indigo-50/30 border-t border-indigo-100 px-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5" />
          Bảng giá bán
        </span>
        <span className="text-xs text-gray-400">
          Chọn mức giá • nhập delta (+/-) • áp dụng
        </span>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tải...
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <p className="text-sm text-red-500 py-2">Không thể tải bảng giá.</p>
      )}

      {/* Empty */}
      {!isLoading && !error && saleItems.length === 0 && (
        <p className="text-sm text-gray-400 italic py-2">
          Chưa có mức giá nào.
        </p>
      )}

      {/* Sale items table + controls */}
      {!isLoading && !error && saleItems.length > 0 && (
        <>
          <div className="rounded-lg border border-indigo-100 bg-white overflow-hidden mb-3">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-3 py-2 w-8">
                    <Checkbox
                      checked={
                        allSelected
                          ? true
                          : someSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(c) => toggleAll(c === true)}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-medium">Đơn vị</th>
                  <th className="px-3 py-2 text-right font-medium">Quy đổi</th>
                  <th className="px-3 py-2 text-right font-medium">
                    Giá bán hiện tại
                  </th>
                </tr>
              </thead>
              <tbody>
                {saleItems.map((item) => (
                  <tr
                    key={item.saleItemId}
                    className={`border-t border-gray-100 transition-colors ${
                      selectedIds.has(item.saleItemId)
                        ? "bg-indigo-50/50"
                        : "hover:bg-gray-50/50"
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <Checkbox
                        checked={selectedIds.has(item.saleItemId)}
                        onCheckedChange={(c) =>
                          toggleItem(item.saleItemId, c === true)
                        }
                      />
                    </td>
                    <td className="px-3 py-2.5 font-medium text-gray-800">
                      {item.unit}
                    </td>
                    <td className="px-3 py-2.5 text-right text-gray-400">
                      ×{item.quantity}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-900">
                      {item.price.toLocaleString("vi-VN")}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delta controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 shrink-0">
              {selectedIds.size}/{saleItems.length} đã chọn · Điều chỉnh (±):
            </span>
            <Input
              type="number"
              value={delta}
              onChange={(e) => setDelta(e.target.value)}
              placeholder="vd: -1000 hoặc 5000"
              className="h-8 text-sm w-44"
            />
            <Button
              size="sm"
              className="h-8 bg-[#23C4C1] hover:bg-[#1da8a5] text-white shrink-0"
              disabled={!canSubmit}
              onClick={handleApply}
            >
              {adjustMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                "Áp dụng"
              )}
            </Button>
            {succeeded && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Đã cập nhật!
              </span>
            )}
            {adjustMutation.isError && (
              <span className="text-xs text-red-500">Cập nhật thất bại.</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
