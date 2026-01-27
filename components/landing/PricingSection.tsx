import Link from "next/link";

type Plan = {
  name: string;
  price: string;
  note: string;
  features: string[];
  highlighted?: boolean;
};

const plans: Plan[] = [
  {
    name: "Cơ bản",
    price: "0đ",
    note: "Bắt đầu nhanh",
    features: [
      "Ghi chép cơ bản",
      "Nhập/xuất báo cáo",
      "1 người dùng",
      "Xem thống kê đơn giản",
    ],
  },
  {
    name: "Gói phổ biến",
    price: "299.000đ",
    note: "Phù hợp cửa hàng nhỏ",
    highlighted: true,
    features: [
      "Bán hàng + kho",
      "Công nợ khách hàng",
      "Báo cáo lãi/lỗ",
      "Xuất dữ liệu kê khai thuế",
      "Hỗ trợ ưu tiên",
    ],
  },
  {
    name: "Gói nâng cao",
    price: "699.000đ",
    note: "Mở rộng nhiều chi nhánh",
    features: [
      "Tài khoản nhân viên",
      "Phân quyền",
      "Nhiều chi nhánh",
      "Tích hợp nâng cao",
      "Hỗ trợ SLA",
    ],
  },
];

export default function PricingSection() {
  return (
    <section id="pricing" className="bg-white scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Chọn gói của bạn
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Minh bạch, dễ nâng cấp. Bạn có thể bắt đầu với gói Free và lên gói
            phù hợp khi cần.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                p.highlighted
                  ? "rounded-2xl bg-[#052659] p-7 text-white shadow-lg"
                  : "rounded-2xl border border-slate-200 bg-white p-7 shadow-sm"
              }
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">{p.name}</h3>
                {p.highlighted ? (
                  <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-medium">
                    Khuyên dùng
                  </span>
                ) : null}
              </div>

              <p
                className={
                  p.highlighted
                    ? "mt-2 text-sm text-white/80"
                    : "mt-2 text-sm text-slate-600"
                }
              >
                {p.note}
              </p>

              <div className="mt-6">
                <p className="text-3xl font-semibold">{p.price}</p>
                <p
                  className={
                    p.highlighted
                      ? "mt-1 text-xs text-white/70"
                      : "mt-1 text-xs text-slate-500"
                  }
                >
                  / tháng
                </p>
              </div>

              <ul
                className={
                  p.highlighted
                    ? "mt-6 space-y-3 text-sm text-white/90"
                    : "mt-6 space-y-3 text-sm text-slate-600"
                }
              >
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span
                      className={
                        p.highlighted ? "text-emerald-300" : "text-emerald-600"
                      }
                    >
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Link
                  href="/auth/register"
                  className={
                    p.highlighted
                      ? "inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#052659] transition hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2 focus-visible:ring-offset-[#052659]"
                      : "inline-flex w-full items-center justify-center rounded-lg bg-[#052659] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#031c3f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0ea5e9] focus-visible:ring-offset-2"
                  }
                >
                  Dùng thử
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
