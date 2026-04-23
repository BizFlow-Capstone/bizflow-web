"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Banknote,
  CheckCircle2,
  Landmark,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useDebtorDetail, useRecordPayment } from "@/hooks/useDebtors";
import { getBalanceStatus } from "@/lib/types/debtor";
import type { RecordPaymentRequest } from "@/lib/types/debtor";
import { formatVnd as formatCurrency } from "@/lib/format";

export default function RecordPaymentClient() {
  const params = useParams();
  const router = useRouter();
  const debtorId = Number(params.debtorId);

  const { data: debtor, isLoading, error } = useDebtorDetail(debtorId);
  const paymentMutation = useRecordPayment();

  const [amount, setAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank">("cash");
  const [notes, setNotes] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const parsedAmount = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) ? value : 0;
  }, [amount]);

  const balanceAfter = useMemo(() => {
    if (!debtor) return 0;
    return debtor.currentBalance + parsedAmount;
  }, [debtor, parsedAmount]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!parsedAmount) {
      errs.amount =
        "Vui lòng nhập số điều chỉnh khác 0. Số dương giảm nợ/tăng dư, số âm tăng nợ.";
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload: RecordPaymentRequest = {
      amount: parsedAmount,
      paymentMethod,
      notes: notes.trim() || undefined,
    };

    try {
      await paymentMutation.mutateAsync({ debtorId, data: payload });
      setSuccess(true);
    } catch {
      // handled by mutation
    }
  };

  const quickAmounts = [
    -500_000, -200_000, -100_000, 100_000, 200_000, 500_000,
  ];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
        <span className="ml-3 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  if (error || !debtor) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50">
        <AlertTriangle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-lg font-medium text-gray-900">
          Không tìm thấy khách hàng
        </h2>
        <Button
          onClick={() => router.push("/dashboard/customers")}
          variant="outline"
          className="mt-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
      </div>
    );
  }

  const balanceStatus = getBalanceStatus(debtor.currentBalance);
  const balanceAfterStatus = getBalanceStatus(balanceAfter);

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center max-w-md w-full">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Điều chỉnh thành công!
          </h2>
          <p className="text-gray-600 mb-6">
            Đã ghi nhận điều chỉnh{" "}
            <strong
              className={
                parsedAmount > 0 ? "text-green-600" : "text-orange-600"
              }
            >
              {parsedAmount > 0 ? "+" : ""}
              {formatCurrency(parsedAmount)}
            </strong>{" "}
            cho <strong>{debtor.name}</strong>.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Số dư sau</span>
              <span
                className={`text-lg font-bold ${
                  balanceAfterStatus === "DEBT"
                    ? "text-red-600"
                    : balanceAfterStatus === "CREDIT"
                      ? "text-green-600"
                      : "text-gray-600"
                }`}
              >
                {balanceAfterStatus === "DEBT"
                  ? `Nợ ${formatCurrency(Math.abs(balanceAfter))}`
                  : balanceAfterStatus === "CREDIT"
                    ? `Dư ${formatCurrency(balanceAfter)}`
                    : "0 ₫"}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push(`/dashboard/customers/${debtorId}`)}
            >
              Xem chi tiết
            </Button>
            <Button
              className="flex-1 bg-[#23C4C1] hover:bg-[#1da8a5] text-white"
              onClick={() => router.push("/dashboard/customers")}
            >
              Danh sách
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="px-8 pt-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/dashboard/customers/${debtorId}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
        </div>
      </div>

      <main className="flex-1 p-8 bg-gray-50 flex justify-center">
        <div className="w-full max-w-xl space-y-6">
          <div
            className={`rounded-xl border-2 p-5 ${
              balanceStatus === "DEBT"
                ? "border-red-200 bg-red-50/30"
                : balanceStatus === "CREDIT"
                  ? "border-green-200 bg-green-50/30"
                  : "border-gray-200 bg-white"
            }`}
          >
            <p className="text-sm text-gray-500 mb-1">Số dư hiện tại</p>
            <p
              className={`text-2xl font-bold ${
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

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-[#23C4C1]" />
              Số tiền điều chỉnh
            </h2>

            <div className="space-y-1.5">
              <Label htmlFor="amount">
                Số điều chỉnh (VND) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder="Dương: giảm nợ/tăng dư, âm: tăng nợ"
                className={`text-lg font-semibold h-12 ${
                  formErrors.amount ? "border-red-400" : ""
                }`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {formErrors.amount && (
                <p className="text-xs text-red-500">{formErrors.amount}</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">Chọn nhanh:</p>
              <div className="grid grid-cols-3 gap-2">
                {quickAmounts.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      parsedAmount === q
                        ? "border-[#23C4C1] bg-[#23C4C1]/10 text-[#23C4C1]"
                        : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                    onClick={() => setAmount(String(q))}
                  >
                    {q > 0 ? "+" : ""}
                    {new Intl.NumberFormat("vi-VN", {
                      notation: "compact",
                      compactDisplay: "short",
                    }).format(q)}
                  </button>
                ))}
              </div>
            </div>

            {balanceStatus === "DEBT" && (
              <Button
                variant="outline"
                className="w-full gap-2 border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => setAmount(String(debtor.outstandingDebt))}
              >
                Giảm hết nợ (+{formatCurrency(debtor.outstandingDebt)})
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h2 className="font-semibold text-gray-800">
              Phương thức ghi nhận
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "cash"
                    ? "border-[#23C4C1] bg-[#23C4C1]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPaymentMethod("cash")}
              >
                <Banknote
                  className={`w-6 h-6 ${
                    paymentMethod === "cash"
                      ? "text-[#23C4C1]"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    paymentMethod === "cash"
                      ? "text-[#23C4C1]"
                      : "text-gray-600"
                  }`}
                >
                  Tiền mặt
                </span>
              </button>
              <button
                type="button"
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  paymentMethod === "bank"
                    ? "border-[#23C4C1] bg-[#23C4C1]/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setPaymentMethod("bank")}
              >
                <Landmark
                  className={`w-6 h-6 ${
                    paymentMethod === "bank"
                      ? "text-[#23C4C1]"
                      : "text-gray-400"
                  }`}
                />
                <span
                  className={`text-sm font-medium ${
                    paymentMethod === "bank"
                      ? "text-[#23C4C1]"
                      : "text-gray-600"
                  }`}
                >
                  Chuyển khoản
                </span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-3">
            <h2 className="font-semibold text-gray-800">Ghi chú</h2>
            <textarea
              className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-[#23C4C1]/30 focus:border-[#23C4C1]"
              rows={2}
              placeholder="Thêm ghi chú (tuỳ chọn)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {parsedAmount !== 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h2 className="font-semibold text-gray-800 mb-3">Xem trước</h2>
              <div className="flex items-center justify-between gap-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Trước</p>
                  <p className="text-lg font-bold text-gray-600">
                    {formatCurrency(debtor.currentBalance)}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-1 text-[#23C4C1]">
                  <ArrowRight className="w-5 h-5" />
                  <span className="text-xs font-medium">
                    {parsedAmount > 0 ? "+" : ""}
                    {formatCurrency(parsedAmount)}
                  </span>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Sau</p>
                  <p
                    className={`text-lg font-bold ${
                      balanceAfterStatus === "DEBT"
                        ? "text-red-600"
                        : balanceAfterStatus === "CREDIT"
                          ? "text-green-600"
                          : "text-gray-600"
                    }`}
                  >
                    {formatCurrency(balanceAfter)}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Button
            className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base font-medium"
            disabled={paymentMutation.isPending}
            onClick={handleSubmit}
          >
            {paymentMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Xác nhận điều chỉnh nợ
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
