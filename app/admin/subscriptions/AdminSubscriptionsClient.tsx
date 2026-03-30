"use client";

import {
  CheckCircle2,
  Star,
  Crown,
  Users,
  Pencil,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Mock Data ──────────────────────────────────────────────────────────────────

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period: string;
  features: string[];
  isPopular: boolean;
  activeUsers: number;
  color: string;
  icon: typeof Star;
}

const mockPlans: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Miễn Phí",
    price: 0,
    period: "Vĩnh viễn",
    features: [
      "1 địa điểm kinh doanh",
      "Tối đa 50 sản phẩm",
      "Báo cáo cơ bản",
      "Quản lý đơn hàng",
    ],
    isPopular: false,
    activeUsers: 892,
    color: "from-gray-400 to-gray-500",
    icon: CheckCircle2,
  },
  {
    id: "pro",
    name: "Pro",
    price: 99000,
    period: "/ tháng",
    features: [
      "3 địa điểm kinh doanh",
      "Không giới hạn sản phẩm",
      "Báo cáo nâng cao",
      "AI Voice Order",
      "Quản lý nhân viên",
      "Tự động ghi sổ kế toán",
    ],
    isPopular: true,
    activeUsers: 284,
    color: "from-teal-500 to-cyan-500",
    icon: Star,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299000,
    period: "/ tháng",
    features: [
      "Không giới hạn địa điểm",
      "Không giới hạn sản phẩm",
      "Báo cáo nâng cao + Dự báo AI",
      "AI Voice Order",
      "Quản lý nhân viên",
      "Tự động ghi sổ kế toán",
      "Hỗ trợ ưu tiên 24/7",
      "Export sổ kế toán TT152",
    ],
    isPopular: false,
    activeUsers: 72,
    color: "from-violet-500 to-purple-600",
    icon: Crown,
  },
];

interface MockSubscriber {
  name: string;
  plan: string;
  startDate: string;
  endDate: string;
  status: "active" | "expiring" | "expired";
}

const mockSubscribers: MockSubscriber[] = [
  {
    name: "Nguyễn Văn An",
    plan: "Pro",
    startDate: "01/02/2026",
    endDate: "01/05/2026",
    status: "active",
  },
  {
    name: "Hoàng Mai Linh",
    plan: "Enterprise",
    startDate: "15/01/2026",
    endDate: "15/04/2026",
    status: "active",
  },
  {
    name: "Trần Thị Bích",
    plan: "Pro",
    startDate: "01/12/2025",
    endDate: "01/03/2026",
    status: "expired",
  },
  {
    name: "Đặng Văn Tùng",
    plan: "Pro",
    startDate: "15/03/2026",
    endDate: "15/04/2026",
    status: "expiring",
  },
  {
    name: "Lê Thị Hoa",
    plan: "Enterprise",
    startDate: "01/03/2026",
    endDate: "01/06/2026",
    status: "active",
  },
];

function formatPrice(price: number) {
  if (price === 0) return "Miễn phí";
  return price.toLocaleString("vi-VN") + "đ";
}

// ────────────────────────────────────────────────────────────────────────────────

export default function AdminSubscriptionsClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Gói Đăng Ký
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý các gói pricing và theo dõi tình trạng đăng ký người dùng.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Tổng Subscribers",
            value: mockPlans.reduce((s, p) => s + p.activeUsers, 0),
            sub: "người dùng có gói",
            color: "text-blue-600",
          },
          {
            label: "Doanh Thu Tháng (est.)",
            value:
              formatPrice(
                mockPlans.reduce(
                  (s, p) => s + p.price * p.activeUsers,
                  0,
                ),
              ),
            sub: "ước tính",
            color: "text-emerald-600",
          },
          {
            label: "Sắp Hết Hạn",
            value: mockSubscribers.filter((s) => s.status === "expiring").length,
            sub: "cần gia hạn",
            color: "text-amber-600",
          },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
              <p className="text-xs text-gray-400">{s.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Plans */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Pricing Plans
          </h2>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="w-3.5 h-3.5" />
            Chỉnh sửa Plans
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {mockPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.id}
                className={`border-0 shadow-sm relative overflow-hidden ${plan.isPopular ? "ring-2 ring-teal-400" : ""}`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-l from-teal-500 to-cyan-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    PHỔ BIẾN
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-800">{plan.name}</p>
                      <p className="text-xs text-gray-400">{plan.period}</p>
                    </div>
                  </div>

                  <p className="text-3xl font-extrabold text-gray-900 mb-4">
                    {formatPrice(plan.price)}
                    {plan.price > 0 && (
                      <span className="text-sm font-normal text-gray-400">
                        {plan.period}
                      </span>
                    )}
                  </p>

                  <ul className="space-y-2 mb-5">
                    {plan.features.map((f) => (
                      <li
                        key={f}
                        className="flex items-start gap-2 text-sm text-gray-600"
                      >
                        <CheckCircle2 className="w-4 h-4 text-teal-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-500">
                      <strong className="text-gray-700">
                        {plan.activeUsers}
                      </strong>{" "}
                      người dùng
                    </span>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-500 ml-auto" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Subscribers Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">
            Subscribers Gần Đây
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Gói</TableHead>
                <TableHead>Ngày bắt đầu</TableHead>
                <TableHead>Ngày hết hạn</TableHead>
                <TableHead className="text-right">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockSubscribers.map((sub, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium text-gray-800">
                    {sub.name}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sub.plan}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {sub.startDate}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {sub.endDate}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="secondary"
                      className={
                        sub.status === "active"
                          ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                          : sub.status === "expiring"
                            ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                            : "bg-red-50 text-red-700 hover:bg-red-50"
                      }
                    >
                      {sub.status === "active"
                        ? "Hoạt động"
                        : sub.status === "expiring"
                          ? "Sắp hết hạn"
                          : "Đã hết hạn"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
