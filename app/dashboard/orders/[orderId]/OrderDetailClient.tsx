"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Loader2,
  ShoppingCart,
  PackageCheck,
  Clock,
  XCircle,
  Banknote,
  Landmark,
  CreditCard,
  CircleDollarSign,
  UserCheck,
  CheckCircle2,
  Trash2,
  FileText,
  Printer,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import {
  useOrderDetail,
  useCancelOrder,
  useConfirmOrder,
  useCompleteOrder,
} from "@/hooks/useOrders";
import type {
  OrderStatus,
  PaymentType,
  PaymentStatus,
} from "@/lib/types/order";

// --- Helpers ---

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(amount);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function getStatusConfig(status: OrderStatus) {
  switch (status) {
    case "pending":
      return {
        label: "Chờ xử lý",
        icon: Clock,
        color: "blue",
        bgClass: "bg-blue-50 text-blue-700 border-blue-200",
      };
    case "completed":
      return {
        label: "Hoàn thành",
        icon: PackageCheck,
        color: "green",
        bgClass: "bg-green-50 text-green-700 border-green-200",
      };
    case "cancelled":
      return {
        label: "Đã hủy",
        icon: XCircle,
        color: "red",
        bgClass: "bg-red-50 text-red-700 border-red-200",
      };
  }
}

function getPaymentTypeConfig(type: PaymentType) {
  switch (type) {
    case "cash":
      return {
        label: "Tiền mặt",
        icon: Banknote,
        colorClass: "text-emerald-600",
      };
    case "bank":
      return {
        label: "Chuyển khoản",
        icon: Landmark,
        colorClass: "text-indigo-600",
      };
    case "debt":
      return {
        label: "Ghi nợ",
        icon: CreditCard,
        colorClass: "text-orange-600",
      };
    case "mixed":
      return {
        label: "Hỗn hợp",
        icon: CircleDollarSign,
        colorClass: "text-purple-600",
      };
  }
}

function getPaymentStatusLabel(status: PaymentStatus) {
  switch (status) {
    case "PAID":
      return {
        label: "Đã thanh toán",
        colorClass: "text-green-600 bg-green-50",
      };
    case "PARTIAL":
      return {
        label: "Thanh toán một phần",
        colorClass: "text-amber-600 bg-amber-50",
      };
    case "UNPAID":
      return { label: "Chưa thanh toán", colorClass: "text-red-600 bg-red-50" };
  }
}

// --- Main Component ---

export default function OrderDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const backUrl = searchParams.get("backUrl");
  const orderId = Number(params.orderId);

  // Data
  const { data: order, isLoading, error } = useOrderDetail(orderId);

  // Dialog states
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [showConfirm, setShowConfirm] = useState(false);

  const [showComplete, setShowComplete] = useState(false);
  const [confirmLowStock, setConfirmLowStock] = useState(false);

  // Mutations
  const cancelMutation = useCancelOrder();
  const confirmMutation = useConfirmOrder();
  const completeMutation = useCompleteOrder();

  const handleCancel = async () => {
    await cancelMutation.mutateAsync({
      orderId,
      data: { cancelReason: cancelReason.trim() || undefined },
    });
    setShowCancel(false);
    setCancelReason("");
  };

  const handleConfirm = async () => {
    if (!order) return;
    await confirmMutation.mutateAsync({
      orderId,
      data: {
        paymentType: order.paymentType,
        debtorId: order.debtorId,
      },
    });
    setShowConfirm(false);
  };

  const handleComplete = async () => {
    await completeMutation.mutateAsync({
      orderId,
      data: { confirmLowStock },
    });
    setShowComplete(false);
    setConfirmLowStock(false);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">
          Đang tải chi tiết đơn hàng...
        </span>
      </div>
    );
  }

  // Error
  if (error || !order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center">
        <ShoppingCart className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">
          {error instanceof Error ? error.message : "Không tìm thấy đơn hàng"}
        </h3>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push(backUrl || "/dashboard/orders")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;
  const paymentConfig = getPaymentTypeConfig(order.paymentType);
  const PaymentIcon = paymentConfig.icon;
  const paymentStatusConfig = getPaymentStatusLabel(order.paymentStatus);
  const remainingAmount = order.totalAmount - order.paidAmount;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(backUrl || "/dashboard/orders")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Badge variant="outline" className={statusConfig.bgClass}>
              <StatusIcon className="w-3.5 h-3.5 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Actions (contextual based on status) */}
          <div className="flex items-center gap-2">
            {order.status === "pending" && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowCancel(true)}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Hủy đơn
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    router.push(`/dashboard/orders/${orderId}/payment`)
                  }
                  className="text-[#23C4C1] border-[#23C4C1]/30 hover:bg-[#23C4C1]/5"
                >
                  <Banknote className="w-4 h-4 mr-2" />
                  Thanh toán
                </Button>
                <Button
                  onClick={() => setShowComplete(true)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <PackageCheck className="w-4 h-4 mr-2" />
                  Hoàn thành
                </Button>
              </>
            )}
            {order.status === "completed" && (
              <Button variant="outline" className="gap-2">
                <Printer className="w-4 h-4" />
                In hóa đơn
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Order Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Note Banner */}
            {order.status === "pending" && order.note && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">
                    Đơn hàng chờ xử lý
                  </p>
                  <p className="text-sm text-blue-700 mt-1">{order.note}</p>
                </div>
              </div>
            )}

            {/* Order Items Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#23C4C1]" />
                  Chi tiết sản phẩm
                  <Badge variant="outline" className="ml-auto">
                    {order.items.length} sản phẩm
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="font-semibold text-gray-700">
                        #
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Sản phẩm
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700">
                        Đơn vị
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">
                        SL
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">
                        Đơn giá
                      </TableHead>
                      <TableHead className="font-semibold text-gray-700 text-right">
                        Thành tiền
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item, idx) => (
                      <TableRow key={item.orderDetailId}>
                        <TableCell className="text-gray-500">
                          {idx + 1}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900">
                            {item.productName}
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {item.unit}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right text-gray-600">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-gray-800">
                          {formatCurrency(item.totalPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Table Footer — Total */}
                <div className="border-t border-gray-200 px-6 py-4">
                  <div className="flex justify-end">
                    <div className="w-64 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Tổng tiền hàng:</span>
                        <span className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Đã thanh toán:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(order.paidAmount)}
                        </span>
                      </div>
                      {remainingAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Còn lại:</span>
                          <span className="font-medium text-red-600">
                            {formatCurrency(remainingAmount)}
                          </span>
                        </div>
                      )}
                      <div className="border-t border-gray-200 pt-2 flex justify-between">
                        <span className="text-base font-semibold text-gray-800">
                          Tổng cộng:
                        </span>
                        <span className="text-xl font-bold text-[#23C4C1]">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Note */}
            {order.note && order.status !== "pending" && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Ghi chú</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-700">{order.note}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column: Info Cards */}
          <div className="space-y-6">
            {/* Order Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trạng thái đơn hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Status Steps */}
                  {(
                    [
                      { status: "pending" as const, label: "Tạo đơn" },
                      { status: "completed" as const, label: "Hoàn thành" },
                    ] as const
                  ).map((step, idx) => {
                    const stepConfig = getStatusConfig(step.status);
                    const StepIcon = stepConfig.icon;
                    const isCurrent = order.status === step.status;
                    const isPast =
                      order.status === "cancelled"
                        ? false
                        : (["pending", "completed"] as const).indexOf(
                            order.status,
                          ) >
                          (["pending", "completed"] as const).indexOf(
                            step.status,
                          );

                    return (
                      <div key={step.status} className="flex items-start gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              isCurrent
                                ? `bg-${stepConfig.color}-100 text-${stepConfig.color}-600`
                                : isPast
                                  ? "bg-green-100 text-green-600"
                                  : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {isPast ? (
                              <CheckCircle2 className="w-4 h-4" />
                            ) : (
                              <StepIcon className="w-4 h-4" />
                            )}
                          </div>
                          {idx < 1 && (
                            <div
                              className={`w-0.5 h-6 mt-1 ${
                                isPast ? "bg-green-300" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                        <div>
                          <p
                            className={`text-sm font-medium ${
                              isCurrent
                                ? "text-gray-900"
                                : isPast
                                  ? "text-green-700"
                                  : "text-gray-400"
                            }`}
                          >
                            {step.label}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {order.status === "cancelled" && (
                    <div className="flex items-start gap-3 mt-2 pt-2 border-t border-gray-200">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                        <XCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-red-700">
                          Đã hủy
                        </p>
                        {order.updatedAt && (
                          <p className="text-xs text-gray-500">
                            {formatDate(order.updatedAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thanh toán</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Payment Type */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Hình thức:</span>
                  <div
                    className={`flex items-center gap-1.5 ${paymentConfig.colorClass}`}
                  >
                    <PaymentIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {paymentConfig.label}
                    </span>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trạng thái:</span>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${paymentStatusConfig.colorClass}`}
                  >
                    {paymentStatusConfig.label}
                  </span>
                </div>

                {/* Payment Splits */}
                {order.payments && order.payments.length > 0 && (
                  <div className="border-t border-gray-200 pt-3 mt-3 space-y-2">
                    {order.payments.map((payment, idx) => {
                      const pConfig = getPaymentTypeConfig(payment.method);
                      const PIcon = pConfig.icon;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2 text-gray-600">
                            <PIcon className="w-3.5 h-3.5" />
                            {pConfig.label}
                          </div>
                          <span className="font-medium text-gray-800">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Debtor Info */}
                {order.debtorName && (
                  <div className="border-t border-gray-200 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-gray-800">
                        {order.debtorName}
                      </span>
                    </div>
                    {remainingAmount > 0 && (
                      <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        Nợ đơn này: {formatCurrency(remainingAmount)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin đơn hàng</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn:</span>
                  <span className="font-mono font-semibold text-[#23C4C1]">
                    {order.orderCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Cửa hàng:</span>
                  <span className="font-medium text-gray-800">
                    {order.businessLocationName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Người tạo:</span>
                  <span className="font-medium text-gray-800">
                    {order.createdByUserName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ngày tạo:</span>
                  <div className="flex items-center gap-1 text-gray-800">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDate(order.createdAt)}
                  </div>
                </div>
                {order.updatedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cập nhật:</span>
                    <span className="text-gray-800">
                      {formatDate(order.updatedAt)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Cancel Dialog */}
      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đơn hàng?</DialogTitle>
            <DialogDescription>
              Đơn hàng <strong>{order.orderCode}</strong> sẽ bị hủy.
              {order.status === "pending" && (
                <> Tồn kho sẽ được hoàn lại nếu đã trừ.</>
              )}{" "}
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            <label className="text-sm font-medium text-gray-700">Lý do hủy (không bắt buộc)</label>
            <Input
              type="text"
              placeholder="Nhập lý do hủy..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancel(false)}>Đóng</Button>
            <Button
              onClick={handleCancel}
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Hủy đơn"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận đơn hàng nháp</DialogTitle>
            <DialogDescription>
              Xác nhận đơn <strong>{order.orderCode}</strong>? Đơn sẽ chuyển
              sang trạng thái &quot;Chờ xử lý&quot; và tồn kho sẽ được trừ.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Đóng
            </Button>
            <Button
              onClick={handleConfirm}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Dialog */}
      <Dialog open={showComplete} onOpenChange={setShowComplete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hoàn thành đơn hàng</DialogTitle>
            <DialogDescription>
              Xác nhận hoàn thành đơn <strong>{order.orderCode}</strong>? Tổng
              thanh toán: <strong>{formatCurrency(order.totalAmount)}</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center space-x-2 py-4">
            <input
              type="checkbox"
              id="confirmLowStock"
              checked={confirmLowStock}
              onChange={(e) => setConfirmLowStock(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-[#23C4C1] focus:ring-[#23C4C1]"
            />
            <label
              htmlFor="confirmLowStock"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Xác nhận hoàn thành kể cả khi tồn kho âm
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComplete(false)}>
              Đóng
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <PackageCheck className="w-4 h-4 mr-2" />
                  Hoàn thành
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
