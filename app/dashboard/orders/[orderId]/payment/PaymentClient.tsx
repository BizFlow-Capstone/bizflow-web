"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  Banknote,
  CheckCircle2,
  Loader2,
  ShoppingCart,
  FileText,
  Printer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrderDetail, useCompleteOrder } from "@/hooks/useOrders";
import { useDashboardLocation } from "@/lib/providers/DashboardLocationProvider";
import { useDebtors, useCreateDebtor } from "@/hooks/useDebtors";
import { recordPayment } from "@/services/debtorService";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { formatVnd as formatCurrency } from "@/lib/format";

// --- Main Component ---

export default function PaymentClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.orderId);

  // Payment tab
  const [paymentTab, setPaymentTab] = useState<"qr" | "cash">("qr");
  const [isTransferConfirmed, setIsTransferConfirmed] = useState(false);

  // Cash payment
  const [cashReceived, setCashReceived] = useState("");

  // Confirming payment
  const [isConfirming, setIsConfirming] = useState(false);

  // Data
  const { data: order, isLoading, error } = useOrderDetail(orderId);
  const completeMutation = useCompleteOrder();
  const { selectedLocationId } = useDashboardLocation();

  // Excess handling
  const [isSavingExcess, setIsSavingExcess] = useState(false);
  const [excessDebtorId, setExcessDebtorId] = useState<string>("");
  const [isCreatingDebtor, setIsCreatingDebtor] = useState(false);
  const [newDebtorName, setNewDebtorName] = useState("");
  const [newDebtorPhone, setNewDebtorPhone] = useState("");

  const { data: debtorsPage } = useDebtors({
    isActive: true,
    page: 1,
    pageSize: 100,
  });
  const debtors = debtorsPage?.items ?? [];
  const createDebtorMutation = useCreateDebtor();

  const effectivePaidAmount = useMemo(() => {
    if (!order) return 0;

    if (order.paymentStatus === "UNPAID") return 0;

    const settledFromChannels = Math.max(
      0,
      (order.cashAmount ?? 0) + (order.bankAmount ?? 0),
    );

    if (order.paymentStatus === "PARTIAL") {
      const fallbackPaid = Math.max(0, order.paidAmount ?? 0);
      return Math.min(
        order.totalAmount,
        settledFromChannels > 0 ? settledFromChannels : fallbackPaid,
      );
    }

    return Math.min(
      order.totalAmount,
      Math.max(settledFromChannels, Math.max(0, order.paidAmount ?? 0)),
    );
  }, [order]);

  const amountDue = useMemo(() => {
    if (!order) return 0;
    return Math.max(order.totalAmount - effectivePaidAmount, 0);
  }, [order, effectivePaidAmount]);

  // Cash change calculation based on remaining payable amount.
  const cashChange = useMemo(() => {
    const received = Number(cashReceived) || 0;
    return received - amountDue;
  }, [cashReceived, amountDue]);

  const isCashTab = paymentTab === "cash";

  useEffect(() => {
    if (!isCashTab) {
      setIsSavingExcess(false);
      setExcessDebtorId("");
      setIsCreatingDebtor(false);
    }
  }, [isCashTab]);

  // Confirm payment
  const handleConfirmPayment = async () => {
    if (!order) return;
    if (amountDue <= 0) return;

    setIsConfirming(true);
    try {
      // 1. Complete the order
      await completeMutation.mutateAsync({
        orderId,
        data: { confirmLowStock: true },
      });

      // 2. Handle excess payment if requested
      if (isSavingExcess && excessDebtorId && cashChange > 0) {
        await recordPayment(Number(excessDebtorId), {
          amount: cashChange,
          paymentMethod: paymentTab === "qr" ? "bank" : "cash",
          notes: `Tiền dư từ đơn hàng ${order.orderCode}`,
        });
      }

      router.push(`/dashboard/orders/${orderId}`);
    } catch (err) {
      console.error("Payment confirmation failed:", err);
      setIsConfirming(false);
    }
  };

  const handleCreateDebtor = async () => {
    if (!newDebtorName) return;
    if (!order) return;

    try {
      const result = await createDebtorMutation.mutateAsync({
        name: newDebtorName,
        phone: newDebtorPhone,
        businessLocationId: selectedLocationId || order.businessLocationId,
      });
      setExcessDebtorId(String(result.data.debtorId));
      setIsCreatingDebtor(false);
      setNewDebtorName("");
      setNewDebtorPhone("");
    } catch (err) {
      console.error("Failed to create debtor:", err);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">Đang tải thông tin...</span>
      </div>
    );
  }

  // Error
  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          Không tìm thấy đơn hàng
        </h3>
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

  const isExcessDebtorMissing =
    isCashTab && isSavingExcess && cashChange > 0 && !excessDebtorId;
  const isInsufficientPayment = isCashTab && Number(cashReceived) < amountDue;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/orders/${orderId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </div>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            In hóa đơn
          </Button>
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: Payment Methods */}
          <div className="lg:col-span-3 space-y-6">
            {/* Amount Display */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
              <p className="text-sm text-gray-500 mb-1">
                Số tiền cần thanh toán
              </p>
              <p className="text-4xl font-bold text-[#23C4C1]">
                {formatCurrency(amountDue)}
              </p>
              {effectivePaidAmount > 0 && amountDue > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Đã trả: {formatCurrency(effectivePaidAmount)} — Còn lại:{" "}
                  {formatCurrency(amountDue)}
                </p>
              )}
            </div>

            {/* Payment Tab Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setPaymentTab("qr");
                  setIsTransferConfirmed(false);
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  paymentTab === "qr"
                    ? "bg-[#23C4C1] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <QrCode className="w-5 h-5" />
                Chuyển Khoản
              </button>
              <button
                type="button"
                onClick={() => setPaymentTab("cash")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  paymentTab === "cash"
                    ? "bg-[#23C4C1] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Banknote className="w-5 h-5" />
                Tiền mặt
              </button>
            </div>

            {/* Payment Content */}
            {(paymentTab === "qr" || paymentTab === "cash") && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  {paymentTab === "qr" && (
                    <div className="space-y-4">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                        <p className="font-medium text-slate-800">
                          Xác nhận chuyển khoản
                        </p>
                        <p className="mt-1 text-slate-600">
                          Yêu cầu khách chuyển đúng số tiền cần thanh toán và
                          kiểm tra giao dịch đã vào tài khoản trước khi xác
                          nhận.
                        </p>
                        <p className="mt-2 text-slate-700">
                          Số tiền: <strong>{formatCurrency(amountDue)}</strong>
                        </p>
                        <p className="text-slate-700">
                          Nội dung chuyển khoản:{" "}
                          <strong>{order.orderCode}</strong>
                        </p>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="confirmTransfer"
                          checked={isTransferConfirmed}
                          onCheckedChange={(checked) =>
                            setIsTransferConfirmed(!!checked)
                          }
                        />
                        <label
                          htmlFor="confirmTransfer"
                          className="text-sm text-gray-700 cursor-pointer"
                        >
                          Tôi đã xác nhận nhận được tiền chuyển khoản.
                        </label>
                      </div>
                    </div>
                  )}

                  {paymentTab === "cash" && (
                    <>
                      <div>
                        <Label className="text-sm font-medium text-gray-700 mb-2 block">
                          Khách đưa
                        </Label>
                        <Input
                          type="number"
                          placeholder="Nhập số tiền khách đưa..."
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="h-14 text-xl font-semibold text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>

                      {/* Quick amount buttons */}
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          amountDue,
                          Math.ceil(amountDue / 100000) * 100000,
                          Math.ceil(amountDue / 500000) * 500000,
                        ]
                          .filter((v, i, a) => a.indexOf(v) === i)
                          .filter((v) => v > 0)
                          .map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              className="h-10 text-sm"
                              onClick={() => setCashReceived(String(amount))}
                            >
                              {formatCurrency(amount)}
                            </Button>
                          ))}
                      </div>

                      {/* Change */}
                      {Number(cashReceived) > 0 && (
                        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tổng tiền:</span>
                            <span className="font-medium">
                              {formatCurrency(amountDue)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Khách đưa:</span>
                            <span className="font-medium">
                              {formatCurrency(Number(cashReceived))}
                            </span>
                          </div>
                          <div className="border-t border-gray-200 pt-2 flex justify-between">
                            <span className="font-semibold text-gray-800">
                              {cashChange >= 0 ? "Tiền thối:" : "Còn thiếu:"}
                            </span>
                            <span
                              className={`text-xl font-bold ${
                                cashChange > 0
                                  ? "text-green-600"
                                  : cashChange < 0
                                    ? "text-red-600"
                                    : "text-gray-800"
                              }`}
                            >
                              {formatCurrency(Math.abs(cashChange))}
                            </span>
                          </div>

                          {cashChange > 0 && (
                            <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="saveExcess"
                                  checked={isSavingExcess}
                                  onCheckedChange={(checked) =>
                                    setIsSavingExcess(!!checked)
                                  }
                                />
                                <label
                                  htmlFor="saveExcess"
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 cursor-pointer"
                                >
                                  Khách không lấy tiền dư (Lưu vào sổ khách
                                  quen)
                                </label>
                              </div>

                              {isSavingExcess && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                  <div className="flex gap-2">
                                    <div className="flex-1">
                                      <Select
                                        value={excessDebtorId}
                                        onValueChange={setExcessDebtorId}
                                      >
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Chọn khách hàng..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {debtors.map((d) => (
                                            <SelectItem
                                              key={d.debtorId}
                                              value={String(d.debtorId)}
                                            >
                                              {d.name}{" "}
                                              {d.phone ? `(${d.phone})` : ""}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => setIsCreatingDebtor(true)}
                                      title="Thêm khách hàng mới"
                                    >
                                      <Plus className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {isInsufficientPayment && (
                            <p className="text-xs text-red-500 text-center mt-1">
                              Số tiền chưa đủ
                            </p>
                          )}
                          {isExcessDebtorMissing && (
                            <p className="text-xs text-amber-600 text-center mt-1">
                              Chọn khách hàng để lưu tiền dư.
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Confirm */}
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={
                      isConfirming ||
                      amountDue <= 0 ||
                      (paymentTab === "qr" && !isTransferConfirmed) ||
                      isInsufficientPayment ||
                      isExcessDebtorMissing
                    }
                    className="w-full bg-[#23C4C1] hover:bg-[#1da8a5] text-white h-12 text-base shadow-lg shadow-[#23C4C1]/20"
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Đang xác nhận...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        {paymentTab === "qr"
                          ? "Xác nhận thanh toán chuyển khoản"
                          : "Xác nhận thanh toán tiền mặt"}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#23C4C1]" />
                  Chi tiết đơn hàng
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã đơn:</span>
                  <span className="font-mono font-semibold text-[#23C4C1]">
                    {order.orderCode}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cửa hàng:</span>
                  <span className="font-medium text-gray-800">
                    {order.businessLocationName}
                  </span>
                </div>
                {order.debtorName && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Khách hàng:</span>
                    <span className="font-medium text-gray-800">
                      {order.debtorName}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Sản phẩm ({order.items.length})
                  </p>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <div
                        key={item.orderDetailId}
                        className="flex items-start justify-between text-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-gray-800 truncate">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} {item.unit} ×{" "}
                            {formatCurrency(item.unitPrice)}
                          </p>
                        </div>
                        <span className="font-medium text-gray-800 ml-2 whitespace-nowrap">
                          {formatCurrency(item.totalPrice)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800">
                      Tổng cộng
                    </span>
                    <span className="text-xl font-bold text-[#23C4C1]">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {order.note && (
                  <div className="bg-gray-50 rounded-lg p-3 mt-3">
                    <p className="text-xs text-gray-500 mb-1">Ghi chú</p>
                    <p className="text-sm text-gray-700">{order.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Status */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      order.paymentStatus === "PAID"
                        ? "bg-green-100"
                        : order.paymentStatus === "PARTIAL"
                          ? "bg-amber-100"
                          : "bg-red-100"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 ${
                        order.paymentStatus === "PAID"
                          ? "text-green-600"
                          : order.paymentStatus === "PARTIAL"
                            ? "text-amber-600"
                            : "text-red-600"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {order.paymentStatus === "PAID"
                        ? "Đã thanh toán"
                        : order.paymentStatus === "PARTIAL"
                          ? "Thanh toán một phần"
                          : "Chưa thanh toán"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {effectivePaidAmount > 0
                        ? `Đã trả ${formatCurrency(effectivePaidAmount)}`
                        : "Chưa nhận thanh toán"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* New Debtor Dialog */}
      <Dialog open={isCreatingDebtor} onOpenChange={setIsCreatingDebtor}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm khách hàng mới</DialogTitle>
            <DialogDescription>
              Tạo nhanh khách hàng để lưu tiền dư/ghi nợ.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ tên</Label>
              <Input
                id="name"
                placeholder="Nhập tên khách hàng..."
                value={newDebtorName}
                onChange={(e) => setNewDebtorName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                placeholder="Nhập số điện thoại..."
                value={newDebtorPhone}
                onChange={(e) => setNewDebtorPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreatingDebtor(false)}
            >
              Hủy
            </Button>
            <Button
              className="bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
              onClick={handleCreateDebtor}
              disabled={createDebtorMutation.isPending || !newDebtorName}
            >
              {createDebtorMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo khách hàng"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
