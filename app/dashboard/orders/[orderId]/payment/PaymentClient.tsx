"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  QrCode,
  Banknote,
  Copy,
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

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

// --- Mock bank info ---

const BANK_INFO = {
  bankName: "Vietcombank",
  accountNumber: "1017 2345 6789",
  accountHolder: "CONG TY TNHH MINH PHAT",
  branch: "Chi nhánh Gò Vấp, TP.HCM",
};

// --- Main Component ---

export default function PaymentClient() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.orderId);

  // Payment tab
  const [paymentTab, setPaymentTab] = useState<"qr" | "cash">("qr");

  // Cash payment
  const [cashReceived, setCashReceived] = useState("");

  // Copied state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Confirming payment
  const [isConfirming, setIsConfirming] = useState(false);

  // Data
  const { data: order, isLoading, error } = useOrderDetail(orderId);
  const completeMutation = useCompleteOrder();

  // Cash change calculation
  const cashChange = useMemo(() => {
    if (!order) return 0;
    const received = Number(cashReceived) || 0;
    return Math.max(0, received - order.totalAmount);
  }, [cashReceived, order]);

  // Copy to clipboard
  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Copy all bank info
  const handleCopyAll = async () => {
    if (!order) return;
    const text = [
      `Ngân hàng: ${BANK_INFO.bankName}`,
      `Số TK: ${BANK_INFO.accountNumber}`,
      `Chủ TK: ${BANK_INFO.accountHolder}`,
      `Nội dung: ${order.orderCode}`,
      `Số tiền: ${formatCurrency(order.totalAmount)}`,
    ].join("\n");
    await handleCopy(text, "all");
  };

  // Confirm payment
  const handleConfirmPayment = async () => {
    if (!order) return;
    setIsConfirming(true);
    try {
      await completeMutation.mutateAsync(orderId);
      router.push(`/dashboard/orders/${orderId}`);
    } catch {
      setIsConfirming(false);
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

  const remainingAmount = order.totalAmount - order.paidAmount;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/dashboard/orders/${orderId}`)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Thanh toán</h1>
              <p className="text-sm text-gray-600 mt-1">
                Đơn hàng {order.orderCode}
              </p>
            </div>
          </div>
          <Button variant="outline" className="gap-2">
            <Printer className="w-4 h-4" />
            In hóa đơn
          </Button>
        </div>
      </header>

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
                {formatCurrency(
                  remainingAmount > 0 ? remainingAmount : order.totalAmount,
                )}
              </p>
              {order.paidAmount > 0 && remainingAmount > 0 && (
                <p className="text-sm text-gray-500 mt-2">
                  Đã trả: {formatCurrency(order.paidAmount)} — Còn lại:{" "}
                  {formatCurrency(remainingAmount)}
                </p>
              )}
            </div>

            {/* Payment Tab Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-1.5 flex gap-1">
              <button
                type="button"
                onClick={() => setPaymentTab("qr")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all ${
                  paymentTab === "qr"
                    ? "bg-[#23C4C1] text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <QrCode className="w-5 h-5" />
                Mã QR
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

            {/* QR Code Tab */}
            {paymentTab === "qr" && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  {/* QR Code Image */}
                  <div className="flex justify-center">
                    <div className="bg-white border-2 border-gray-200 rounded-2xl p-4">
                      {/* Mock QR Code using SVG */}
                      <div className="w-52 h-52 bg-gray-100 rounded-xl flex items-center justify-center relative">
                        <svg
                          viewBox="0 0 200 200"
                          className="w-full h-full"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          {/* QR Code mock pattern */}
                          <rect width="200" height="200" fill="white" />
                          {/* Top-left finder */}
                          <rect
                            x="10"
                            y="10"
                            width="50"
                            height="50"
                            fill="#1a1a1a"
                          />
                          <rect
                            x="15"
                            y="15"
                            width="40"
                            height="40"
                            fill="white"
                          />
                          <rect
                            x="22"
                            y="22"
                            width="26"
                            height="26"
                            fill="#1a1a1a"
                          />
                          {/* Top-right finder */}
                          <rect
                            x="140"
                            y="10"
                            width="50"
                            height="50"
                            fill="#1a1a1a"
                          />
                          <rect
                            x="145"
                            y="15"
                            width="40"
                            height="40"
                            fill="white"
                          />
                          <rect
                            x="152"
                            y="22"
                            width="26"
                            height="26"
                            fill="#1a1a1a"
                          />
                          {/* Bottom-left finder */}
                          <rect
                            x="10"
                            y="140"
                            width="50"
                            height="50"
                            fill="#1a1a1a"
                          />
                          <rect
                            x="15"
                            y="145"
                            width="40"
                            height="40"
                            fill="white"
                          />
                          <rect
                            x="22"
                            y="152"
                            width="26"
                            height="26"
                            fill="#1a1a1a"
                          />
                          {/* Data modules (mock pattern) */}
                          {Array.from({ length: 12 }).map((_, row) =>
                            Array.from({ length: 12 }).map((_, col) => {
                              const x = 70 + col * 6;
                              const y = 70 + row * 6;
                              const show =
                                (row + col) % 3 !== 0 && (row * col) % 2 === 0;
                              return show ? (
                                <rect
                                  key={`${row}-${col}`}
                                  x={x}
                                  y={y}
                                  width="5"
                                  height="5"
                                  fill="#1a1a1a"
                                />
                              ) : null;
                            }),
                          )}
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Bank Transfer Details */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800">
                      Thông tin chuyển khoản
                    </h3>

                    <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                      {/* Bank Name */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Ngân hàng</p>
                          <p className="font-medium text-gray-800">
                            {BANK_INFO.bankName}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(BANK_INFO.bankName, "bank")}
                          className="text-gray-400 hover:text-[#23C4C1] transition-colors"
                        >
                          {copiedField === "bank" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="border-t border-gray-200" />

                      {/* Account Number */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Số tài khoản</p>
                          <p className="font-mono font-bold text-lg text-gray-900">
                            {BANK_INFO.accountNumber}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(
                              BANK_INFO.accountNumber.replace(/\s/g, ""),
                              "account",
                            )
                          }
                          className="text-gray-400 hover:text-[#23C4C1] transition-colors"
                        >
                          {copiedField === "account" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="border-t border-gray-200" />

                      {/* Account Holder */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">Chủ tài khoản</p>
                          <p className="font-medium text-gray-800">
                            {BANK_INFO.accountHolder}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopy(BANK_INFO.accountHolder, "holder")
                          }
                          className="text-gray-400 hover:text-[#23C4C1] transition-colors"
                        >
                          {copiedField === "holder" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="border-t border-gray-200" />

                      {/* Transfer Content */}
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500">
                            Nội dung chuyển khoản
                          </p>
                          <p className="font-mono font-semibold text-[#23C4C1]">
                            {order.orderCode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(order.orderCode, "content")}
                          className="text-gray-400 hover:text-[#23C4C1] transition-colors"
                        >
                          {copiedField === "content" ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Copy All Button */}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleCopyAll}
                    >
                      {copiedField === "all" ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                          Đã sao chép!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Sao chép thông tin chuyển khoản
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Confirm payment */}
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={isConfirming}
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
                        Xác nhận đã nhận thanh toán
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Cash Tab */}
            {paymentTab === "cash" && (
              <Card>
                <CardContent className="p-6 space-y-6">
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
                      order.totalAmount,
                      Math.ceil(order.totalAmount / 100000) * 100000,
                      Math.ceil(order.totalAmount / 500000) * 500000,
                    ]
                      .filter((v, i, a) => a.indexOf(v) === i)
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
                          {formatCurrency(order.totalAmount)}
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
                          Tiền thối:
                        </span>
                        <span
                          className={`text-xl font-bold ${
                            cashChange > 0 ? "text-green-600" : "text-gray-800"
                          }`}
                        >
                          {formatCurrency(cashChange)}
                        </span>
                      </div>
                      {Number(cashReceived) < order.totalAmount && (
                        <p className="text-xs text-red-500 text-center mt-1">
                          Số tiền chưa đủ
                        </p>
                      )}
                    </div>
                  )}

                  {/* Confirm */}
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={
                      isConfirming || Number(cashReceived) < order.totalAmount
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
                        Xác nhận thanh toán tiền mặt
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
                      {order.paidAmount > 0
                        ? `Đã trả ${formatCurrency(order.paidAmount)}`
                        : "Chưa nhận thanh toán"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
