import Image from "next/image";

const reasons = [
  {
    title: "Thay thế sổ tay truyền thống",
    desc: "Tự động tạo sổ sách theo quy định của Bộ Tài chính",
    icon: "/pictures/landingPic/FIcon1.svg",
  },
  {
    title: "Đúng Luật Thuế",
    desc: "Giúp phân loại doanh thu đúng quy định, hạn chế rủi ro thuế",
    icon: "/pictures/landingPic/FIcon2.svg",
  },
  {
    title: "Hỗ trợ tư vấn",
    desc: "Cập nhật mẫu thuế nhanh chóng\nHỗ trợ bạn khi bạn cần",
    icon: "/pictures/landingPic/FIcon3.svg",
  },
];

export default function WhyChooseSection() {
  return (
    <section id="why" className="bg-slate-50 py-20 scroll-mt-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-[#1e3a5f] md:text-5xl">
            TẠI SAO CHỌN BIZFLOW?
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-2xl  p-8 text-center">
              <div className="flex justify-center mb-6">
                <div
                  className={` rounded-2xl p-6 inline-flex items-center justify-center`}
                >
                  <Image
                    src={r.icon}
                    alt={r.title}
                    width={64}
                    height={64}
                    className="w-16 h-16"
                  />
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1e3a5f] mb-4">
                {r.title}
              </h3>
              <p className="text-sm leading-relaxed text-slate-600 whitespace-pre-line">
                {r.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
