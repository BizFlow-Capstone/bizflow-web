import Link from "next/link";

export default function CTASection() {
  return (
    <section id="contact" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#1e3a5f] to-[#0ea5e9] p-12 text-white shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Sẵn sàng chuyển đổi số cho cửa hàng?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/90">
              Bắt đầu dùng thử ngay hoặc đăng ký để nhận tư vấn triển khai trong
              24h.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-[#1e3a5f] transition hover:bg-white/90"
              >
                Đăng ký dùng thử
              </Link>
              <a
                href="mailto:support@bizflow.local"
                className="inline-flex items-center justify-center rounded-lg border-2 border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/15"
              >
                support@bizflow.local
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
