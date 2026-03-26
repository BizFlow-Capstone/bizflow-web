"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  Phone,
  MapPin,
  Calendar,
  Banknote,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  UserCheck,
  FileText,
  Receipt,
  Package,
  AlertTriangle,
  CircleDollarSign,
} from "lucide-react";
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
import { useState } from "react";
import {
  useDebtorDetail,
  useDebtorPayments,
  useDeleteDebtor,
} from "@/hooks/useDebtors";
import { getBalanceStatus } from "@/lib/types/debtor";
import type { DebtorRecentOrder } from "@/lib/types/debtor";
import { Switch } from "@/components/ui/switch";

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
  }).format(new Date(dateStr));
}

function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

function orderStatusBadge(status: DebtorRecentOrder["status"]) {
  switch (status) {
    case "COMPLETED":
      return (
        <Badge
          variant="outline"
          className="bg-green-50 text-green-700 border-green-200 text-xs"
        >
          Hoàn thành
        </Badge>
      );
    case "PENDING":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs"
        >
          Chờ xử lý
        </Badge>
      );
    case "DRAFT":
      return (
        <Badge
          variant="outline"
          className="bg-gray-50 text-gray-600 border-gray-200 text-xs"
        >
          Nháp
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge
          variant="outline"
          className="bg-red-50 text-red-600 border-red-200 text-xs"
        >
          Đã huỷ
        </Badge>
      );
  }
}

// --- Main Component ---

export default function CustomerDetailClient() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const backUrl = searchParams.get("backUrl");
  const debtorId = Number(params.debtorId);

  const { data: debtor, isLoading, error } = useDebtorDetail(debtorId);
  const {
    data: paymentHistory,
    isLoading: isPaymentLoading,
    error: paymentError,
    refetch: refetchPayments,
    isRefetching: isRefetchingPayments,
  } = useDebtorPayments(debtorId);
  const deleteMutation = useDeleteDebtor();
  const [showDelete, setShowDelete] = useState(false);
  const [deleteForce, setDeleteForce] = useState(false);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        debtorId,
        options: { force: deleteForce },
      });
      router.push("/dashboard/customers");
    } catch {
      // handled by mutation
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">
          Đang tải thông tin khách hàng...
        </span>
      </div>
    );
  }

  // Error
  if (error || !debtor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-lg font-medium text-gray-900 mb-1">
          Không tìm thấy khách hàng
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Khách hàng này không tồn tại hoặc đã bị xóa.
        </p>
        <Button
          onClick={() => router.push(backUrl || "/dashboard/customers")}
          variant="outline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  const balanceStatus = getBalanceStatus(debtor.currentBalance);
  const payments = paymentHistory ?? [];

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="px-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(backUrl || "/dashboard/customers")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                {debtor.name}
              </p>
              <p className="text-sm text-gray-500">
                Mã KH: #{debtor.debtorId} · {debtor.businessLocationName}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/customers/${debtor.debtorId}/payment`}>
              <Button className="bg-green-600 hover:bg-green-700 text-white gap-2">
                <Banknote className="w-4 h-4" />
                Điều chỉnh công nợ
              </Button>
            </Link>
            <Link href={`/dashboard/customers/${debtor.debtorId}/edit`}>
              <Button variant="outline" className="gap-2">
                <Pencil className="w-4 h-4" />
                Chỉnh sửa
              </Button>
            </Link>
            <Button
              variant="outline"
              className="gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-700"
              onClick={() => setShowDelete(true)}
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </Button>
          </div>
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50 space-y-6">
        {/* Balance Card */}
        <div
          className={`rounded-xl border-2 p-6 ${
            balanceStatus === "DEBT"
              ? "border-red-200 bg-red-50/30"
              : balanceStatus === "CREDIT"
                ? "border-green-200 bg-green-50/30"
                : "border-gray-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                Số dư hiện tại
              </p>
              <p
                className={`text-3xl font-bold ${
                  balanceStatus === "DEBT"
                    ? "text-red-600"
                    : balanceStatus === "CREDIT"
                      ? "text-green-600"
                      : "text-gray-600"
                }`}
              >
                {balanceStatus === "DEBT"
                  ? `Nợ ${formatCurrency(debtor.outstandingDebt)}`
                  : balanceStatus === "CREDIT"
                    ? `Dư ${formatCurrency(debtor.currentBalance)}`
                    : "0 ₫"}
              </p>
            </div>
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${
                balanceStatus === "DEBT"
                  ? "bg-red-100"
                  : balanceStatus === "CREDIT"
                    ? "bg-green-100"
                    : "bg-gray-100"
              }`}
            >
              {balanceStatus === "DEBT" ? (
                <TrendingDown className="w-8 h-8 text-red-500" />
              ) : balanceStatus === "CREDIT" ? (
                <TrendingUp className="w-8 h-8 text-green-500" />
              ) : (
                <UserCheck className="w-8 h-8 text-gray-400" />
              )}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-5 pt-4 border-t border-gray-200/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500">Tổng đơn hàng</p>
              <p className="text-lg font-bold text-gray-800">
                {debtor.statistics.totalOrders}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Tổng mua hàng</p>
              <p className="text-lg font-bold text-gray-800">
                {formatCurrency(debtor.statistics.totalPurchaseAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Đã thanh toán</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(debtor.statistics.totalPaidAmount)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Giới hạn nợ</p>
              <p className="text-lg font-bold text-gray-800">
                {debtor.creditLimit != null
                  ? formatCurrency(debtor.creditLimit)
                  : "Không giới hạn"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#23C4C1]" />
              Thông tin khách hàng
            </h3>
            <div className="space-y-3.5">
              <InfoRow
                icon={<Phone className="w-4 h-4" />}
                label="Số điện thoại"
                value={debtor.phone || "Chưa có"}
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4" />}
                label="Địa chỉ"
                value={debtor.address || "Chưa có"}
              />
              <InfoRow
                icon={<MapPin className="w-4 h-4 text-[#23C4C1]" />}
                label="Địa điểm KD"
                value={debtor.businessLocationName || "—"}
              />
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="Ngày tạo"
                value={formatDate(debtor.createdAt)}
              />
              <InfoRow
                icon={<Calendar className="w-4 h-4" />}
                label="Mua gần nhất"
                value={formatDate(debtor.lastOrderDate)}
              />
              <InfoRow
                icon={<Banknote className="w-4 h-4" />}
                label="Trả nợ gần nhất"
                value={formatDate(debtor.lastPaymentDate)}
              />
              {debtor.notes && (
                <InfoRow
                  icon={<FileText className="w-4 h-4" />}
                  label="Ghi chú"
                  value={debtor.notes}
                />
              )}
            </div>
          </div>

          {/* Recent Orders */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#23C4C1]" />
              Đơn hàng gần đây
            </h3>
            {debtor.recentOrders.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">
                Chưa có đơn hàng nào.
              </p>
            ) : (
              <div className="space-y-2">
                {debtor.recentOrders.map((order) => (
                  <div
                    key={order.orderId}
                    className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#23C4C1]">
                          #{order.orderCode}
                        </span>
                        {orderStatusBadge(order.status)}
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatDate(order.orderDate)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        Tổng: {formatCurrency(order.totalAmount)}
                      </span>
                      <span className="text-gray-600">
                        Đã trả:{" "}
                        <span className="text-green-600 font-medium">
                          {formatCurrency(order.paidAmount)}
                        </span>
                        {order.debtAmount > 0 && (
                          <>
                            {" "}
                            · Nợ:{" "}
                            <span className="text-red-600 font-medium">
                              {formatCurrency(order.debtAmount)}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Payments */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="mb-4 flex items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#23C4C1]" />
                Lịch sử điều chỉnh công nợ
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Dữ liệu được tải trực tiếp từ API lịch sử giao dịch của khách
                hàng.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => refetchPayments()}
              disabled={isRefetchingPayments}
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefetchingPayments ? "animate-spin" : ""}`}
              />
              Tải lại
            </Button>
          </div>

          {isPaymentLoading ? (
            <div className="py-8 flex items-center justify-center text-sm text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Đang tải lịch sử điều chỉnh...
            </div>
          ) : paymentError ? (
            <div className="py-6 text-center">
              <p className="text-sm text-red-600 mb-3">
                Không tải được lịch sử điều chỉnh. Vui lòng thử lại.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchPayments()}
                disabled={isRefetchingPayments}
              >
                Thử lại
              </Button>
            </div>
          ) : payments.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              Chưa có giao dịch điều chỉnh nào.
            </p>
          ) : (
            <div className="space-y-2">
              {payments.map((tx) => (
                <div
                  key={tx.transactionId}
                  className="rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      {tx.paymentMethod === "cash" ? (
                        <Banknote className="w-4 h-4 text-green-600" />
                      ) : (
                        <CircleDollarSign className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {tx.amount >= 0 ? "+" : ""}
                        {formatCurrency(tx.amount)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateTime(tx.paidAt)}
                        {tx.createdByUserName
                          ? ` · ${tx.createdByUserName}`
                          : ""}
                        {tx.notes && ` · ${tx.notes}`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500">
                    <p>
                      Trước:{" "}
                      <span className="font-medium">
                        {formatCurrency(tx.balanceBefore)}
                      </span>
                    </p>
                    <p>
                      Sau:{" "}
                      <span
                        className={`font-medium ${
                          tx.balanceAfter < 0
                            ? "text-red-600"
                            : tx.balanceAfter > 0
                              ? "text-green-600"
                              : "text-gray-600"
                        }`}
                      >
                        {formatCurrency(tx.balanceAfter)}
                      </span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Delete Dialog */}
      <AlertDialog
        open={showDelete}
        onOpenChange={(open) => {
          setShowDelete(open);
          if (!open) setDeleteForce(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khách hàng?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa <strong>{debtor.name}</strong> khỏi danh sách khách hàng thân
              thiết?
              {debtor.currentBalance < 0 && (
                <span className="block mt-2 text-red-600 font-medium">
                  ⚠ Khách hàng này đang nợ{" "}
                  {formatCurrency(debtor.outstandingDebt)}. Bật &quot;Xóa cưỡng
                  bức&quot; nếu vẫn muốn xóa.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-lg border border-gray-200 px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Xóa cưỡng bức</p>
              <p className="text-xs text-gray-500">
                Dùng khi khách còn nợ nhưng vẫn cần xóa hồ sơ.
              </p>
            </div>
            <Switch checked={deleteForce} onCheckedChange={setDeleteForce} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Đóng</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Xóa"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// --- Small helper component ---

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5 text-gray-500">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-medium text-gray-800 wrap-break-word">
          {value}
        </p>
      </div>
    </div>
  );
}
