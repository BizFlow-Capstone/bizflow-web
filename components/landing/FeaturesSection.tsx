const features = [
  {
    title: "Bán hàng tốc độ · Quản lý kho chính xác",
    items: [
      "Quét mã vạch (Barcode) tìm hàng trong 1 giây.",
      "Tự động trừ kho ngay khi xuất đơn.",
      "Cảnh báo hàng sắp hết (Low Stock) để nhập kịp thời.",
    ],
    illustration: "📦",
  },
  {
    title: "Quản lý Doanh Thu & Chi Phí Tức Thì",
    items: [
      "Số Doanh Thu: Tự động tổng hợp từ đơn hàng bán ra.",
      "Số Chi Phí: Ghi nhanh tiền nhập hàng, điện nước, mặt bằng.",
      "Báo cáo Lãi/Lỗ: Biết ngay lời lãi theo ngày/ tháng.",
    ],
    illustration: "💹",
  },
  {
    title: "Hỗ Trợ Kê Khai Thuế",
    items: [
      "Kết xuất dữ liệu chuẩn định dạng của Tổng Cục Thuế.",
      "Tự động tính toán theo phần mềm HTKK.",
      "Nộp thuế nhanh, không cần nhập tay liệu thủ công.",
    ],
    illustration: "📋",
  },
  {
    title: "Sổ Nợ Điện Tử Minh Bạch",
    items: [
      "Ghi nợ chi tiết từng khách hàng.",
      "Lưu trữ ảnh chuyển khoản/biên nhận.",
      "Nhắc nợ dễ dàng, tránh thất thoát dòng tiền.",
    ],
    illustration: "💳",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-4">
        <div className="text-center">
          <h2 className="text-4xl font-semibold tracking-tight text-[#1e3a5f]">
            Về Tính Năng
          </h2>
          <div className="mx-auto mt-3 h-1 w-24 bg-[#f59e0b]" />
        </div>

        <div className="mt-16 grid gap-12 md:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="flex gap-5">
              <div className="text-6xl">{f.illustration}</div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  {f.title}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {f.items.map((it) => (
                    <li key={it} className="flex gap-2 text-sm text-slate-700">
                      <span className="mt-0.5 text-emerald-600">✓</span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
