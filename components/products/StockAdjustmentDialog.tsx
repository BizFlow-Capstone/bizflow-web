"use client";

import { useState } from "react";
import { Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Product, AdjustStockRequest } from "@/lib/types/product";

type StockAdjustmentDialogProps = {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (productId: number, data: AdjustStockRequest) => void;
  isPending?: boolean;
};

/** Inner form — mounted fresh each time via key in parent */
function StockAdjustmentForm({
  product,
  onOpenChange,
  onConfirm,
  isPending,
}: Omit<StockAdjustmentDialogProps, "open"> & { product: Product }) {
  const [newStock, setNewStock] = useState(String(product.stock));
  const [memo, setMemo] = useState("");
  const [costPrice, setCostPrice] = useState(
    product.costPrice ? String(product.costPrice) : "",
  );

  const parsedStock = parseInt(newStock, 10);
  const parsedCostPrice = parseFloat(costPrice);
  const delta = isNaN(parsedStock) ? 0 : parsedStock - product.stock;
  const isIncrease = delta > 0;
  const isDecrease = delta < 0;
  const isNoChange = delta === 0;
  const stockInvalid = isNaN(parsedStock) || parsedStock < 0;

  function handleSubmit() {
    if (stockInvalid || isNoChange) return;
    const payload: AdjustStockRequest = {
      stock: parsedStock,
      ...(memo.trim() && { memo: memo.trim() }),
      ...(isIncrease &&
        !isNaN(parsedCostPrice) &&
        parsedCostPrice >= 0 && { costPrice: parsedCostPrice }),
    };
    onConfirm(product.productId, payload);
  }

  return (
    <>
      <div className="space-y-4 py-2">
        {/* Current stock read-only */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
          <span className="text-sm text-gray-500">Tồn kho hiện tại</span>
          <span className="text-lg font-semibold text-gray-900">
            {product.stock}
          </span>
        </div>

        {/* New stock value */}
        <div className="space-y-1.5">
          <Label htmlFor="new-stock">Tồn kho mới</Label>
          <Input
            id="new-stock"
            type="number"
            min={0}
            value={newStock}
            onChange={(e) => setNewStock(e.target.value)}
            placeholder="Nhập số lượng mới"
            className={stockInvalid && newStock !== "" ? "border-red-400" : ""}
          />
          {!isNaN(parsedStock) && newStock !== "" && !isNoChange && (
            <p
              className={`text-xs flex items-center gap-1 ${
                isIncrease ? "text-green-600" : "text-red-600"
              }`}
            >
              {isIncrease ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {isIncrease ? "+" : ""}
              {delta} so với hiện tại
              {isIncrease && " — sẽ tạo phiếu nhập kho"}
              {isDecrease && " — sẽ tạo phiếu điều chỉnh"}
            </p>
          )}
        </div>

        {/* Cost price — only relevant for increases */}
        {isIncrease && (
          <div className="space-y-1.5">
            <Label htmlFor="cost-price">
              Giá nhập{" "}
              <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
            </Label>
            <Input
              id="cost-price"
              type="number"
              min={0}
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              placeholder="Nhập giá nhập hàng"
            />
          </div>
        )}

        {/* Memo */}
        <div className="space-y-1.5">
          <Label htmlFor="memo">
            Ghi chú{" "}
            <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
          </Label>
          <Input
            id="memo"
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="Lý do điều chỉnh..."
            maxLength={255}
          />
        </div>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Hủy
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isPending || stockInvalid || isNoChange}
          className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Đang lưu...
            </>
          ) : (
            "Xác nhận"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

export default function StockAdjustmentDialog({
  product,
  open,
  onOpenChange,
  onConfirm,
  isPending = false,
}: StockAdjustmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-110">
        <DialogHeader>
          <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
          {product && (
            <DialogDescription>
              <span className="font-medium text-gray-800">
                {product.name || product.productName}
              </span>
              {" · "}SKU:{" "}
              <span className="font-mono">{product.sku || "—"}</span>
            </DialogDescription>
          )}
        </DialogHeader>

        {product && (
          <StockAdjustmentForm
            key={product.productId}
            product={product}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            isPending={isPending}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
