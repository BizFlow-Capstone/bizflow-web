const reasons = [
  {
    title: "Quên Sổ Tay đi",
    desc: "Tự động sinh các loại sổ sách theo TT88.",
    icon: "🤝",
  },
  {
    title: "Đúng Luật Thuế",
    desc: "Tách doanh thu bán lẻ và dịch vụ để tránh phạt.",
    icon: "💰",
  },
  {
    title: "Kiểm Kho Nhanh",
    desc: "Biết ngay hàng nào sắp hết để nhập kịp.",
    icon: "🎧",
  },
];

export default function WhyChooseSection() {
  return (
    <section id="why" className="bg-slate-50 py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-[#1e3a5f]">
            TẠI SAO CHỌN BIZFLOW?
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {reasons.map((r) => (
            <div
              key={r.title}
              className="rounded-lg bg-white p-8 text-center shadow-sm"
            >
              <div className="text-5xl">{r.icon}</div>
              <h3 className="mt-5 text-lg font-semibold text-slate-900">
                {r.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
