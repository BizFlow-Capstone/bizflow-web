"use client";

import { useState } from "react";
import { motion } from "motion/react";
import {
  Loader2,
  Infinity as InfinityIcon,
  Zap,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Receipt,
  ShieldOff,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SpotlightCard from "@/components/reactbits/SpotlightCard";
import GradientText from "@/components/reactbits/GradientText";
import { useSubscriptionPlans } from "@/hooks/useSubscriptionPlans";
import {
  useCurrentSubscription,
  useSubscriptionTransactions,
} from "@/hooks/useSubscriptions";
import { useLocations } from "@/hooks/useLocations";
import {
  createCheckoutSession,
  getOwnedLocations,
} from "@/lib/subscription-api";
import type {
  PublicSubscriptionPlan,
  PublicPlanFeature,
  CurrentSubscription,
  SubscriptionTransaction,
} from "@/lib/types/subscription";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatVND(value: number) {
  if (value === 0) return "Miễn phí";
  return value.toLocaleString("vi-VN") + "đ";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function featureValue(feat: PublicPlanFeature): string {
  if (feat.usageLimit === -1) return "Không giới hạn";
  if (feat.usageLimit === 0) return "—";
  return feat.usageLimit.toLocaleString("vi-VN");
}

function featureIncluded(feat: PublicPlanFeature): boolean {
  return feat.usageLimit !== 0;
}

function getHighlightedIndex(plans: PublicSubscriptionPlan[]): number {
  if (plans.length <= 1) return 0;
  return Math.max(0, plans.length - 2);
}

function getTransactionStatusConfig(status: string) {
  switch (status) {
    case "Success":
      return {
        label: "Thành công",
        icon: CheckCircle2,
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "Failed":
      return {
        label: "Thất bại",
        icon: XCircle,
        className: "bg-red-50 text-red-700 border-red-200",
      };
    case "Active":
      return {
        label: "Đang xử lý",
        icon: Clock,
        className: "bg-amber-50 text-amber-700 border-amber-200",
      };
    case "Pending":
      return {
        label: "Chờ thanh toán",
        icon: Clock,
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
    default:
      return {
        label: status,
        icon: Clock,
        className: "bg-slate-100 text-slate-600 border-slate-200",
      };
  }
}

function getSubscriptionStatusConfig(status: string) {
  switch (status) {
    case "Active":
      return {
        label: "Đang hoạt động",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      };
    case "Expired":
      return {
        label: "Đã hết hạn",
        className: "bg-red-50 text-red-700 border-red-200",
      };
    case "Cancelled":
      return {
        label: "Đã huỷ",
        className: "bg-slate-100 text-slate-500 border-slate-200",
      };
    default:
      return {
        label: status,
        className: "bg-slate-100 text-slate-500 border-slate-200",
      };
  }
}

// ---------------------------------------------------------------------------
// Current Plan Card
// ---------------------------------------------------------------------------

function CurrentPlanCard({
  subscription,
}: {
  subscription: CurrentSubscription;
}) {
  const statusCfg = getSubscriptionStatusConfig(subscription.status);
  const plan = subscription.plan;
  const price = plan.currentPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-[#052659]/10 bg-[#052659] p-6 text-white shadow-xl shadow-[#052659]/10"
    >
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="w-4 h-4 text-[#23C4C1]" />
            <span className="text-xs font-medium text-white/60 uppercase tracking-wider">
              Gói hiện tại
            </span>
          </div>
          <h2 className="text-2xl font-bold">{plan.name}</h2>
          <p className="mt-1 text-sm text-white/60">{plan.description}</p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <span
            className={
              "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium " +
              statusCfg.className
            }
          >
            {statusCfg.label}
          </span>
          <p className="text-2xl font-bold">
            {formatVND(price.effectivePrice)}
            {plan.durationDays > 0 && (
              <span className="text-sm font-normal text-white/50">
                {" "}
                / {plan.durationDays} ngày
              </span>
            )}
          </p>
          {price.isDiscountActive && price.discountedPrice != null && (
            <p className="text-xs text-white/40 line-through">
              {formatVND(price.basePrice)}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-5">
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-[#23C4C1]" />
          <div>
            <p className="text-white/50 text-xs">Bắt đầu</p>
            <p className="font-medium">{formatDate(subscription.startDate)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CalendarDays className="w-4 h-4 text-[#23C4C1]" />
          <div>
            <p className="text-white/50 text-xs">Hết hạn</p>
            <p className="font-medium">{formatDate(subscription.endDate)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {plan.features.slice(0, 6).map((f, i) => (
          <span
            key={f.featureId || i}
            className={
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs " +
              (featureIncluded(f)
                ? "border-[#23C4C1]/30 bg-[#23C4C1]/10 text-[#23C4C1]"
                : "border-white/10 bg-white/5 text-white/30")
            }
          >
            {f.usageLimit === -1 ? <InfinityIcon className="w-3 h-3" /> : null}
            {f.featureName || f.featureDescription}
            {f.usageLimit > 0
              ? `: ${f.usageLimit.toLocaleString("vi-VN")}`
              : ""}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function NoPlanCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center"
    >
      <Zap className="w-10 h-10 text-slate-300 mx-auto mb-3" />
      <h3 className="text-base font-semibold text-slate-700">
        Chưa có gói đăng ký
      </h3>
      <p className="mt-1 text-sm text-slate-500">
        Chọn gói phù hợp ở tab &quot;Nâng cấp gói&quot; để mở khóa toàn bộ tính
        năng BizFlow.
      </p>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Pricing Card
// ---------------------------------------------------------------------------

function PricingCard({
  plan,
  index,
  isHighlighted,
  isCurrentPlan,
  onCheckout,
  isCheckingOut,
}: {
  plan: PublicSubscriptionPlan;
  index: number;
  isHighlighted: boolean;
  isCurrentPlan: boolean;
  onCheckout: (planId: number) => void;
  isCheckingOut: boolean;
}) {
  const price = plan.currentPrice;
  const hasDiscount = price.isDiscountActive && price.discountedPrice != null;
  const isFree = price.effectivePrice === 0;

  if (isHighlighted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
        className="md:-mt-4 md:-mb-4"
      >
        <SpotlightCard
          className="h-full border-[#23C4C1]/30 bg-[#052659] text-white shadow-2xl shadow-[#052659]/20"
          spotlightColor="rgba(35, 196, 193, 0.2)"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold">
              <GradientText
                colors={["#23C4C1", "#0ea5e9", "#CFE5FF", "#23C4C1"]}
                animationSpeed={4}
                showBorder={false}
                className="text-base font-semibold"
              >
                {plan.name}
              </GradientText>
            </h3>
            <span className="rounded-full bg-[#23C4C1]/20 px-3 py-1 text-xs font-medium text-[#23C4C1]">
              Phổ biến
            </span>
          </div>

          <p className="mt-2 text-sm text-white/70">{plan.description}</p>

          <div className="mt-6">
            {hasDiscount ? (
              <>
                <p className="text-4xl font-bold">
                  {formatVND(price.discountedPrice!)}
                </p>
                <p className="mt-0.5 text-sm text-white/50 line-through">
                  {formatVND(price.basePrice)}
                </p>
              </>
            ) : (
              <p className="text-4xl font-bold">
                {formatVND(price.effectivePrice)}
              </p>
            )}
            {plan.durationDays > 0 && (
              <p className="mt-1 text-xs text-white/60">
                / {plan.durationDays} ngày
              </p>
            )}
          </div>

          <ul className="mt-6 space-y-2.5 text-sm text-white/90">
            {plan.features.map((f, i) => (
              <li
                key={f.featureId || i}
                className="flex items-center justify-between gap-2"
              >
                <span className={featureIncluded(f) ? "" : "text-white/40"}>
                  {f.featureName || f.featureDescription}
                </span>
                <span
                  className={
                    "flex items-center gap-0.5 text-xs font-medium " +
                    (featureIncluded(f) ? "text-[#23C4C1]" : "text-white/30")
                  }
                >
                  {f.usageLimit === -1 ? (
                    <InfinityIcon className="w-3.5 h-3.5" />
                  ) : (
                    featureValue(f)
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8">
            {isFree || isCurrentPlan ? (
              <button
                disabled
                className="inline-flex w-full items-center justify-center rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium text-white/50 cursor-not-allowed"
              >
                {isCurrentPlan ? "Gói đang dùng" : "Gói miễn phí"}
              </button>
            ) : (
              <button
                onClick={() => onCheckout(plan.subscriptionPlanId)}
                disabled={isCheckingOut}
                className="group relative inline-flex w-full items-center justify-center overflow-hidden rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#052659] transition-all duration-300 hover:shadow-lg hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
              >
                <span className="absolute inset-0 bg-linear-to-r from-[#23C4C1]/0 via-[#23C4C1]/20 to-[#23C4C1]/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <span className="relative flex items-center gap-1.5">
                  {isCheckingOut ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className="w-4 h-4" />
                  )}
                  Nâng cấp ngay
                </span>
              </button>
            )}
          </div>
        </SpotlightCard>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 + index * 0.15 }}
    >
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300 }}
        className={
          "h-full rounded-3xl border bg-white p-8 shadow-sm hover:shadow-lg transition-shadow duration-300 " +
          (isCurrentPlan
            ? "border-[#23C4C1]/40 ring-1 ring-[#23C4C1]/20"
            : "border-slate-200")
        }
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-900">
            {plan.name}
          </h3>
          {isFree && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
              Miễn phí
            </span>
          )}
          {isCurrentPlan && !isFree && (
            <span className="rounded-full bg-[#23C4C1]/10 border border-[#23C4C1]/20 px-3 py-1 text-xs font-medium text-[#23C4C1]">
              Đang dùng
            </span>
          )}
        </div>

        <p className="mt-2 text-sm text-slate-500">{plan.description}</p>

        <div className="mt-6">
          {hasDiscount ? (
            <>
              <p className="text-3xl font-semibold text-slate-900">
                {formatVND(price.discountedPrice!)}
              </p>
              <p className="mt-0.5 text-sm text-slate-400 line-through">
                {formatVND(price.basePrice)}
              </p>
            </>
          ) : (
            <p className="text-3xl font-semibold text-slate-900">
              {formatVND(price.effectivePrice)}
            </p>
          )}
          {plan.durationDays > 0 && (
            <p className="mt-1 text-xs text-slate-400">
              / {plan.durationDays} ngày
            </p>
          )}
        </div>

        <ul className="mt-6 space-y-2.5 text-sm text-slate-600">
          {plan.features.map((f, i) => (
            <li
              key={f.featureId || i}
              className="flex items-center justify-between gap-2"
            >
              <span className={featureIncluded(f) ? "" : "text-slate-300"}>
                {f.featureName || f.featureDescription}
              </span>
              <span
                className={
                  "flex items-center gap-0.5 text-xs font-medium " +
                  (featureIncluded(f) ? "text-emerald-600" : "text-slate-300")
                }
              >
                {f.usageLimit === -1 ? (
                  <InfinityIcon className="w-3.5 h-3.5" />
                ) : (
                  featureValue(f)
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-8">
          {isFree || isCurrentPlan ? (
            <button
              disabled
              className="inline-flex w-full items-center justify-center rounded-lg bg-slate-100 px-4 py-2.5 text-sm font-medium text-slate-400 cursor-not-allowed"
            >
              {isCurrentPlan ? "Gói đang dùng" : "Gói miễn phí"}
            </button>
          ) : (
            <button
              onClick={() => onCheckout(plan.subscriptionPlanId)}
              disabled={isCheckingOut}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#052659] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#031c3f] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              Nâng cấp
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Transaction History
// ---------------------------------------------------------------------------

function TransactionRow({ tx }: { tx: SubscriptionTransaction }) {
  const cfg = getTransactionStatusConfig(tx.status);
  const Icon = cfg.icon;
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
      <td className="px-4 py-3.5">
        <p className="text-sm font-medium text-slate-900">{tx.planName}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {tx.transactionType === "PURCHASE" ? "Mua mới" : tx.transactionType}
        </p>
      </td>
      <td className="px-4 py-3.5 text-sm font-semibold text-slate-900">
        {formatVND(tx.finalAmount)}
        {tx.prorationCredit > 0 && (
          <p className="text-xs text-emerald-600 font-normal">
            -{formatVND(tx.prorationCredit)} hoàn tiền
          </p>
        )}
      </td>
      <td className="px-4 py-3.5">
        <span
          className={
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium " +
            cfg.className
          }
        >
          <Icon className="w-3 h-3" />
          {cfg.label}
        </span>
      </td>
      <td className="px-4 py-3.5 text-xs text-slate-500">
        {tx.paidAt ? formatDate(tx.paidAt) : formatDate(tx.createdAt)}
      </td>
    </tr>
  );
}

function TransactionHistorySection() {
  const {
    data: transactions,
    isLoading,
    error,
  } = useSubscriptionTransactions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-[#23C4C1]" />
      </div>
    );
  }

  if (error || !transactions) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-500">
        <AlertTriangle className="w-8 h-8 text-red-400" />
        <p className="text-sm">Không thể tải lịch sử giao dịch.</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-2 text-slate-400">
        <Receipt className="w-8 h-8" />
        <p className="text-sm">Chưa có giao dịch nào.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100">
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Gói đăng ký
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Số tiền
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ngày
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((tx) => (
            <TransactionRow key={tx.transactionId} tx={tx} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Employee Blocked View
// ---------------------------------------------------------------------------

function EmployeeBlockedView() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
        <ShieldOff className="w-8 h-8 text-slate-400" />
      </div>
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Không có quyền truy cập
        </h2>
        <p className="mt-2 text-sm text-slate-500 max-w-sm">
          Trang quản lý gói đăng ký chỉ dành cho chủ doanh nghiệp. Liên hệ chủ
          doanh nghiệp để được hỗ trợ nâng cấp gói.
        </p>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function SubscriptionClient() {
  const { data: locations, isLoading: isLocLoading } = useLocations();
  const { data: currentSub, isLoading: isSubLoading } =
    useCurrentSubscription();
  const { data: plans, isLoading: isPlansLoading } = useSubscriptionPlans();
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<number | null>(
    null,
  );

  // Pure employee: has locations but none are owned
  const isPureEmployee =
    !isLocLoading &&
    locations != null &&
    locations.length > 0 &&
    !locations.some((l) => l.isOwner);

  async function handleCheckout(planId: number) {
    if (checkingOutPlanId !== null) return;
    setCheckingOutPlanId(planId);
    try {
      const [checkout, locResult] = await Promise.allSettled([
        createCheckoutSession({
          subscriptionPlanId: planId,
          quantity: 1,
          platform: "web",
        }),
        getOwnedLocations(),
      ]);

      if (locResult.status === "fulfilled") {
        localStorage.setItem(
          "bizflow_owned_locations",
          JSON.stringify(locResult.value),
        );
      }

      if (checkout.status === "rejected") throw checkout.reason;

      window.location.href = checkout.value.sessionUrl;
    } catch (err) {
      setCheckingOutPlanId(null);
      toast.error(
        err instanceof Error
          ? err.message
          : "Không thể khởi tạo thanh toán. Vui lòng thử lại.",
      );
    }
  }

  if (isLocLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#23C4C1]" />
      </div>
    );
  }

  if (isPureEmployee) return <EmployeeBlockedView />;

  const activePlanId =
    currentSub?.status === "Active" ? currentSub.plan.subscriptionPlanId : null;
  const highlightedIndex = plans ? getHighlightedIndex(plans) : 0;

  return (
    <div className="px-4 sm:px-6 py-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Quản lý gói đăng ký
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Xem gói hiện tại, nâng cấp và theo dõi lịch sử thanh toán.
        </p>
      </div>

      <Tabs defaultValue="current" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-auto">
          <TabsTrigger
            value="current"
            className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Gói hiện tại
          </TabsTrigger>
          <TabsTrigger
            value="upgrade"
            className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Nâng cấp gói
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-lg px-4 py-2 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            Lịch sử giao dịch
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          {isSubLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-7 h-7 animate-spin text-[#23C4C1]" />
            </div>
          ) : currentSub && currentSub.status === "Active" ? (
            <CurrentPlanCard subscription={currentSub} />
          ) : (
            <NoPlanCard />
          )}
        </TabsContent>

        <TabsContent value="upgrade">
          {isPlansLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-7 h-7 animate-spin text-[#23C4C1]" />
            </div>
          ) : !plans || plans.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
              <AlertTriangle className="w-10 h-10 text-red-400" />
              <p className="text-sm">Không thể tải danh sách gói.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-sm text-slate-500 text-center">
                Minh bạch, dễ nâng cấp. Chọn gói phù hợp với quy mô kinh doanh
                của bạn.
              </p>
              <div
                className={
                  "grid gap-6 items-stretch " +
                  (plans.length === 2
                    ? "md:grid-cols-2 max-w-2xl mx-auto"
                    : plans.length === 3
                      ? "md:grid-cols-3"
                      : plans.length === 4
                        ? "md:grid-cols-4"
                        : "md:grid-cols-3")
                }
              >
                {plans.map((plan, index) => (
                  <PricingCard
                    key={plan.subscriptionPlanId}
                    plan={plan}
                    index={index}
                    isHighlighted={index === highlightedIndex}
                    isCurrentPlan={plan.subscriptionPlanId === activePlanId}
                    onCheckout={handleCheckout}
                    isCheckingOut={
                      checkingOutPlanId === plan.subscriptionPlanId
                    }
                  />
                ))}
              </div>
              <p className="text-center text-xs text-slate-400">
                Tất cả các gói đều bao gồm hỗ trợ qua email. Bạn có thể nâng/hạ
                cấp bất kỳ lúc nào.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <TransactionHistorySection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
