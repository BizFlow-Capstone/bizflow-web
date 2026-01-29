import Image from "next/image";

const features = [
  {
    title: "Bán hàng tốc độ · Quản lý kho chính xác",
    items: [
      "Quét mã vạch (Barcode) tìm hàng trong 1 giây.",
      "Tự động trừ kho ngay khi xuất đơn.",
      "Cảnh báo hàng sắp hết (Low Stock) để nhập kịp thời.",
    ],
    image: "/pictures/landingPic/1.svg",
    // bgColor: "bg-gradient-to-br from-cyan-50 to-blue-50",
  },
  {
    title: "Quản lý Doanh Thu & Chi Phí Tức Thì",
    items: [
      "Số Doanh Thu: Tự động tổng hợp từ đơn hàng bán ra.",
      "Số Chi Phí: Ghi nhanh tiền nhập hàng, điện nước, mặt bằng.",
      "Báo cáo Lãi/Lỗ: Biết ngay lời lãi theo ngày/ tháng.",
    ],
    image: "/pictures/landingPic/2.svg",
    // bgColor: "bg-gradient-to-br from-emerald-50 to-teal-50",
  },
  {
    title: "Hỗ Trợ Kê Khai Thuế",
    items: [
      "Kết xuất dữ liệu chuẩn định dạng của Tổng Cục Thuế.",
      "Tự động tính toán theo phần mềm HTKK.",
      "Nộp thuế nhanh, không cần nhập tay liệu thủ công.",
    ],
    image: "/pictures/landingPic/3.svg",
    // bgColor: "bg-gradient-to-br from-amber-50 to-orange-50",
  },
  {
    title: "Sổ Nợ Điện Tử Minh Bạch",
    items: [
      "Ghi nợ chi tiết từng khách hàng.",
      "Lưu trữ ảnh chuyển khoản/biên nhận.",
      "Nhắc nợ dễ dàng, tránh thất thoát dòng tiền.",
    ],
    image: "/pictures/landingPic/4.svg",
    // bgColor: "bg-gradient-to-br from-purple-50 to-pink-50",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold tracking-tight text-[#1e3a5f] md:text-5xl inline-block">
            Về Tính Năng
            <Image
              src="/pictures/landingPic/line.svg"
              alt="Underline"
              width={300}
              height={60}
              className="  h-auto"
            />
          </h2>
        </div>

        <div className="space-y-24">
          {features.map((f, index) => {
            const isEven = index % 2 === 0;
            return (
              <div
                key={f.title}
                className={`flex flex-col gap-8 items-center ${
                  isEven ? "md:flex-row" : "md:flex-row-reverse"
                }`}
              >
                <div className="flex-1 flex justify-center">
                  <div
                    className={`rounded-3xl p-12  w-full max-w-md flex items-center justify-center`}
                  >
                    <div className="relative w-full h-64 transform hover:scale-110 transition-transform duration-300">
                      <Image
                        src={f.image}
                        alt={f.title}
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-6 w-full max-w-md">
                  <div>
                    <h3 className="text-2xl font-bold text-[#1e3a5f] md:text-3xl leading-tight">
                      {f.title}
                    </h3>
                    <div className="mt-3 h-1 w-auto rounded-full bg-[#23C4C1]" />
                  </div>

                  <ul className="space-y-4">
                    {f.items.map((item) => (
                      <li key={item} className="flex gap-3 group">
                        <span className="mt-1 flex-shrink-0 text-[#23C4C1] text-xl">
                          ✓
                        </span>
                        <span className="text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
