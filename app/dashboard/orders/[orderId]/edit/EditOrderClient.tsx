"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Minus,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOrderDetail, useUpdateOrder } from "@/hooks/useOrders";
import type { OrderDetail, UpdateOrderRequest } from "@/lib/types/order";
import { formatVnd as formatCurrency } from "@/lib/format";

type EditableItem = Pick<
  OrderDetail,
  | "orderDetailId"
  | "saleItemId"
  | "productName"
  | "unit"
  | "unitPrice"
  | "quantity"
  | "discount"
>;

function normalizeMoney(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value));
}

export default function EditOrderClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.orderId);

  const { data: order, isLoading, error } = useOrderDetail(orderId);
  const updateOrderMutation = useUpdateOrder();

  const [items, setItems] = useState<EditableItem[]>([]);
  const [note, setNote] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!order) return;

    setItems(
      (order.items ?? []).map((item) => ({
        orderDetailId: item.orderDetailId,
        saleItemId: item.saleItemId,
        productName: item.productName,
        unit: item.unit,
        unitPrice: item.unitPrice,
        quantity: Math.max(1, item.quantity),
        discount: normalizeMoney(item.discount),
      })),
    );
    setNote(order.note ?? "");
  }, [order]);

  const subTotal = useMemo(
    () => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [items],
  );

  const discountTotal = useMemo(
    () => items.reduce((sum, item) => sum + normalizeMoney(item.discount), 0),
    [items],
  );

  const totalAmount = useMemo(
    () => Math.max(0, subTotal - discountTotal),
    [subTotal, discountTotal],
  );

  const isPendingOrder = order?.status === "pending";

  const updateQuantity = useCallback((orderDetailId: number, delta: number) => {
    setSubmitError("");
    setItems((prev) =>
      prev.map((item) =>
        item.orderDetailId === orderDetailId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((orderDetailId: number) => {
    setSubmitError("");
    setItems((prev) =>
      prev.filter((item) => item.orderDetailId !== orderDetailId),
    );
  }, []);

  const setItemDiscount = useCallback(
    (orderDetailId: number, nextDiscount: number) => {
      setSubmitError("");
      setItems((prev) =>
        prev.map((item) => {
          if (item.orderDetailId !== orderDetailId) return item;
          const lineSubTotal = item.unitPrice * item.quantity;
          return {
            ...item,
            discount: Math.min(
              normalizeMoney(nextDiscount),
              normalizeMoney(lineSubTotal),
            ),
          };
        }),
      );
    },
    [],
  );

  function derivePaymentSplit(nextTotal: number) {
    if (!order) {
      return { cashAmount: nextTotal, bankAmount: 0, debtAmount: 0 };
    }

    if (order.paymentType === "cash") {
      return { cashAmount: nextTotal, bankAmount: 0, debtAmount: 0 };
    }

    if (order.paymentType === "bank") {
      return { cashAmount: 0, bankAmount: nextTotal, debtAmount: 0 };
    }

    if (order.paymentType === "debt") {
      return { cashAmount: 0, bankAmount: 0, debtAmount: nextTotal };
    }

    const originalTotal = Math.max(order.totalAmount, 1);
    const cashRatio = order.cashAmount / originalTotal;
    const bankRatio = order.bankAmount / originalTotal;

    let cashAmount = normalizeMoney(nextTotal * cashRatio);
    let bankAmount = normalizeMoney(nextTotal * bankRatio);

    if (cashAmount + bankAmount > nextTotal) {
      const overflow = cashAmount + bankAmount - nextTotal;
      if (bankAmount >= overflow) {
        bankAmount -= overflow;
      } else {
        cashAmount = Math.max(0, cashAmount - (overflow - bankAmount));
        bankAmount = 0;
      }
    }

    const debtAmount = Math.max(0, nextTotal - cashAmount - bankAmount);

    return { cashAmount, bankAmount, debtAmount };
  }

  const handleSave = async () => {
    if (!order) return;

    setSubmitError("");

    if (!isPendingOrder) {
      setSubmitError("Chỉ có thể cập nhật đơn hàng ở trạng thái chờ xử lý.");
      return;
    }

    if (items.length === 0) {
      setSubmitError("Đơn hàng phải có ít nhất một sản phẩm.");
      return;
    }

    const split = derivePaymentSplit(totalAmount);

    if (split.debtAmount > 0 && !order.debtorId) {
      setSubmitError("Đơn có ghi nợ thì bắt buộc có khách nợ.");
      return;
    }

    const payload: UpdateOrderRequest = {
      businessLocationId: order.businessLocationId,
      cashAmount: split.cashAmount,
      bankAmount: split.bankAmount,
      debtAmount: split.debtAmount,
      debtorId: split.debtAmount > 0 ? order.debtorId : undefined,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      note: note.trim() || undefined,
      items: items.map((item) => ({
        saleItemId: item.saleItemId,
        quantity: item.quantity,
        discount: normalizeMoney(item.discount),
      })),
    };

    try {
      await updateOrderMutation.mutateAsync({ orderId, data: payload });
      router.push(`/dashboard/orders/${orderId}`);
    } catch (updateError) {
      setSubmitError(
        updateError instanceof Error
          ? updateError.message
          : "Không thể cập nhật đơn hàng.",
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">Đang tải dữ liệu đơn hàng...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
        <p className="text-gray-700">Không tìm thấy đơn hàng để cập nhật.</p>
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
      <div className="px-8 pt-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/dashboard/orders/${orderId}`)}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              Cập nhật đơn hàng
            </h1>
            <p className="text-sm text-gray-500">Mã đơn: {order.orderCode}</p>
          </div>
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {!isPendingOrder && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Đơn hàng không ở trạng thái chờ xử lý, không thể cập nhật.
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sản phẩm trong đơn</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
                    Chưa còn sản phẩm nào trong đơn. Vui lòng giữ ít nhất một
                    sản phẩm để lưu.
                  </div>
                ) : (
                  items.map((item) => (
                    <div
                      key={item.orderDetailId}
                      className="rounded-lg border border-gray-200 bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.unit} • {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:text-red-500"
                          onClick={() => removeItem(item.orderDetailId)}
                          disabled={!isPendingOrder}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-end gap-4">
                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            Số lượng
                          </Label>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.orderDetailId, -1)
                              }
                              disabled={!isPendingOrder}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = Number(e.target.value) || 1;
                                setItems((prev) =>
                                  prev.map((row) =>
                                    row.orderDetailId === item.orderDetailId
                                      ? { ...row, quantity: Math.max(1, qty) }
                                      : row,
                                  ),
                                );
                              }}
                              disabled={!isPendingOrder}
                              className="h-8 w-20 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() =>
                                updateQuantity(item.orderDetailId, 1)
                              }
                              disabled={!isPendingOrder}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <Label className="text-xs text-gray-600 mb-1 block">
                            Giảm giá
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) =>
                              setItemDiscount(
                                item.orderDetailId,
                                Number(e.target.value) || 0,
                              )
                            }
                            disabled={!isPendingOrder}
                            className="h-8 w-28 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                        </div>

                        <div className="ml-auto text-right">
                          <p className="text-xs text-gray-500">Thành tiền</p>
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(
                              Math.max(
                                0,
                                item.unitPrice * item.quantity - item.discount,
                              ),
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ghi chú</CardTitle>
              </CardHeader>
              <CardContent>
                <textarea
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm focus:border-[#23C4C1] focus:ring-2 focus:ring-[#23C4C1]/20 resize-none"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={!isPendingOrder}
                  placeholder="Ghi chú đơn hàng (tùy chọn)..."
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tổng kết cập nhật</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tổng trước giảm</span>
                  <span>{formatCurrency(subTotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-red-600">
                  <span>Giảm giá</span>
                  <span>-{formatCurrency(discountTotal)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 flex justify-between">
                  <span className="font-semibold text-gray-800">Tổng cộng</span>
                  <span className="text-xl font-bold text-[#23C4C1]">
                    {formatCurrency(totalAmount)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  onClick={handleSave}
                  disabled={
                    !isPendingOrder ||
                    items.length === 0 ||
                    updateOrderMutation.isPending
                  }
                  className="w-full bg-[#23C4C1] hover:bg-[#1da8a5] text-white h-11"
                >
                  {updateOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu thay đổi...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/orders/${orderId}`)}
                >
                  Hủy
                </Button>

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
    </div>
  );
}
