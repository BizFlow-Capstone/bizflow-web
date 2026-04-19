import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import {
  FileText,
  BookOpen,
  UserCheck,
  ShieldAlert,
  CreditCard,
  Ban,
  RefreshCw,
  Scale,
  Mail,
  CheckCircle2,
  DatabaseBackupIcon,
  Copyright,
  CloudOff,
  Link as LinkIcon,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Điều Khoản Dịch Vụ – BizFlow",
  description:
    "Điều khoản và điều kiện sử dụng nền tảng quản lý hộ kinh doanh BizFlow.",
};

const TEAL = "#23C4C1";

function BulletItem({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3 text-slate-700">
      <CheckCircle2
        className="mt-0.5 h-4 w-4 shrink-0"
        style={{ color: TEAL }}
      />
      <span>{text}</span>
    </li>
  );
}

function Callout({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div
      className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
      style={{ background: `${TEAL}14`, borderLeft: `3px solid ${TEAL}` }}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} />
      <div className="text-slate-700 leading-relaxed">{children}</div>
    </div>
  );
}

const sections = [
  {
    id: "acceptance",
    icon: BookOpen,
    title: "1. Chấp Nhận Điều Khoản",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          Bằng cách truy cập, đăng ký hoặc sử dụng nền tảng BizFlow (bao gồm ứng
          dụng di động và website), bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý
          bị ràng buộc bởi các Điều Khoản Dịch Vụ này.
        </p>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Nếu bạn không đồng ý với bất kỳ điều khoản nào, vui lòng ngừng sử dụng
          dịch vụ ngay lập tức. Việc tiếp tục sử dụng sau khi các điều khoản
          được cập nhật đồng nghĩa với việc bạn chấp nhận phiên bản mới nhất.
        </p>
        <Callout icon={FileText}>
          Điều khoản này áp dụng cho tất cả người dùng, bao gồm chủ hộ kinh
          doanh, nhân viên được cấp quyền và kế toán viên tư vấn.
        </Callout>
        <Callout icon={LinkIcon}>
          Việc thu thập và xử lý dữ liệu cá nhân được thực hiện theo{" "}
          <Link
            href="/policy/sms-authentication"
            className="font-semibold underline"
            style={{ color: TEAL }}
          >
            Chính Sách Xác Thực SMS
          </Link>{" "}
          của chúng tôi, phù hợp với Nghị định 13/2023/NĐ-CP về Bảo vệ dữ
          liệu cá nhân.
        </Callout>
      </>
    ),
  },
  {
    id: "service",
    icon: FileText,
    title: "2. Mô Tả Dịch Vụ",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          BizFlow cung cấp nền tảng quản lý hoạt động kinh doanh dành cho hộ
          kinh doanh cá thể, bao gồm nhưng không giới hạn ở:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Quản lý bán hàng, đặt hàng và thanh toán.",
            "Quản lý kho hàng, sản phẩm và tồn kho.",
            "Theo dõi công nợ khách hàng và nhà cung cấp.",
            "Lập báo cáo doanh thu, chi phí và sổ sách kế toán.",
            "Xác thực người dùng qua số điện thoại và email.",
            "Tích hợp thông báo và AI hỗ trợ nghiệp vụ.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <p className="mt-4 text-slate-600">
          BizFlow có quyền thay đổi, bổ sung hoặc ngừng cung cấp bất kỳ tính
          năng nào mà không cần thông báo trước, ngoại trừ các thay đổi ảnh
          hưởng đến dữ liệu người dùng.
        </p>
      </>
    ),
  },
  {
    id: "account",
    icon: UserCheck,
    title: "3. Tài Khoản Người Dùng",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          Để sử dụng đầy đủ tính năng, bạn cần đăng ký tài khoản và cung cấp
          thông tin chính xác. Bạn chịu trách nhiệm:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Bảo mật thông tin đăng nhập và không chia sẻ mật khẩu cho bên thứ ba.",
            "Tất cả hoạt động diễn ra dưới tài khoản của bạn.",
            "Thông báo ngay cho BizFlow nếu phát hiện truy cập trái phép.",
            "Cung cấp thông tin hợp lệ khi đăng ký (tên, số điện thoại, email).",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <Callout icon={ShieldAlert}>
          BizFlow có quyền tạm khoá hoặc chấm dứt tài khoản nếu phát hiện hành
          vi gian lận, vi phạm điều khoản hoặc gây hại cho hệ thống.
        </Callout>
      </>
    ),
  },
  {
    id: "obligations",
    icon: ShieldAlert,
    title: "4. Nghĩa Vụ & Hành Vi Bị Cấm",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          Khi sử dụng BizFlow, bạn cam kết{" "}
          <strong className="text-slate-800">không</strong> thực hiện các hành
          vi sau:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Sử dụng dịch vụ cho mục đích bất hợp pháp hoặc vi phạm pháp luật Việt Nam.",
            "Cố ý phá hoại, tấn công hoặc làm gián đoạn hệ thống (DoS, brute-force, SQL injection…).",
            "Giả mạo danh tính hoặc cung cấp thông tin gian lận.",
            "Sao chép, phân phối lại phần mềm BizFlow khi chưa được cho phép.",
            "Thu thập dữ liệu người dùng khác trái phép thông qua nền tảng.",
            "Chia sẻ tài khoản cho nhiều doanh nghiệp không liên quan.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "payment",
    icon: CreditCard,
    title: "5. Thanh Toán & Gói Dịch Vụ",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          BizFlow cung cấp gói miễn phí và các gói trả phí với tính năng mở
          rộng. Khi đăng ký gói trả phí:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Phí dịch vụ được tính theo chu kỳ (tháng hoặc năm) và không hoàn trả, ngoại trừ trường hợp lỗi hệ thống do BizFlow gây ra kéo dài trên 72 giờ mà không khắc phục được.",
            "BizFlow có quyền điều chỉnh giá sau khi thông báo trước ít nhất 30 ngày.",
            "Gói hết hạn mà không gia hạn sẽ tự động chuyển về gói miễn phí, dữ liệu được giữ trong 90 ngày.",
            "Thanh toán được xử lý qua các cổng thanh toán bên thứ ba, BizFlow không lưu trữ thông tin thẻ.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <Callout icon={CreditCard}>
          Mọi tranh chấp liên quan đến thanh toán cần được gửi đến email hỗ trợ
          trong vòng 30 ngày kể từ ngày phát sinh giao dịch.
        </Callout>
      </>
    ),
  },
  {
    id: "data",
    icon: DatabaseBackupIcon,
    title: "6. Dữ Liệu & Quyền Sở Hữu",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          Dữ liệu kinh doanh bạn nhập vào BizFlow (sản phẩm, đơn hàng, khách
          hàng…) thuộc sở hữu của bạn. BizFlow cam kết:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Không bán hoặc chia sẻ dữ liệu kinh doanh của bạn cho bên thứ ba vì mục đích thương mại.",
            "Cung cấp tính năng xuất dữ liệu (export) để bạn có thể sao lưu bất cứ lúc nào.",
            "Xoá toàn bộ dữ liệu trong vòng 90 ngày sau khi tài khoản bị đóng.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <p className="mt-4 text-slate-600 leading-relaxed">
          BizFlow có quyền sử dụng dữ liệu tổng hợp, ẩn danh hoá để cải thiện
          chất lượng dịch vụ và nghiên cứu thị trường mà không tiết lộ thông tin
          cá nhân.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    icon: Copyright,
    title: "7. Quyền Sở Hữu Trí Tuệ",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          Toàn bộ mã nguồn, giao diện, thiết kế, logo, nhãn hiệu và nội dung
          thuộc nền tảng BizFlow là tài sản trí tuệ của BizFlow và được bảo
          hộ bởi pháp luật Việt Nam và quốc tế về sở hữu trí tuệ.
        </p>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Người dùng được cấp quyền sử dụng cá nhân, không độc quyền, không
          chuyển nhượng. Người dùng{" "}
          <strong className="text-slate-800">không được phép</strong>:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Sao chép, phân phối hoặc tái xuất bản bất kỳ phần nào của nền tảng.",
            "Đảo ngược mã nguồn (reverse engineering), giải dịch hoặc tách rời phần mềm.",
            "Sử dụng logo hoặc nhãn hiệu BizFlow cho mục đích cá nhân hoặc thương mại khi chưa có sự đồng ý bằng văn bản.",
            "Tạo sản phẩm phái sinh từ nền tảng BizFlow.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "termination",
    icon: Ban,
    title: "8. Chấm Dứt Dịch Vụ",
    content: (
      <>
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: `${TEAL}18` }}>
                <th className="px-5 py-3 text-left font-semibold text-slate-700">
                  Tình huống
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-700">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                [
                  "Người dùng tự xoá tài khoản",
                  "Dữ liệu lưu 90 ngày rồi xoá vĩnh viễn",
                ],
                [
                  "Vi phạm điều khoản nghiêm trọng",
                  "Khoá tài khoản ngay, không hoàn phí",
                ],
                [
                  "Gói hết hạn không gia hạn",
                  "Chuyển về gói miễn phí, giữ dữ liệu 90 ngày",
                ],
                [
                  "BizFlow ngừng hoạt động",
                  "Thông báo trước 60 ngày, hỗ trợ xuất dữ liệu",
                ],
              ].map(([situation, action]) => (
                <tr
                  key={situation}
                  className="bg-white hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-slate-700 font-medium">
                    {situation}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: "updates",
    icon: RefreshCw,
    title: "9. Cập Nhật Điều Khoản",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          BizFlow có quyền sửa đổi Điều Khoản Dịch Vụ này vào bất kỳ thời điểm
          nào. Khi có thay đổi quan trọng:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Chúng tôi sẽ thông báo qua email hoặc thông báo trong ứng dụng.",
            "Phiên bản mới có hiệu lực sau 30 ngày kể từ ngày thông báo.",
            "Ngày cập nhật lần cuối luôn được hiển thị đầu trang.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Việc tiếp tục sử dụng dịch vụ sau ngày hiệu lực đồng nghĩa bạn chấp
          nhận điều khoản mới. Nếu không đồng ý, bạn có quyền chấm dứt tài khoản
          trước ngày có hiệu lực.
        </p>
      </>
    ),
  },
  {
    id: "law",
    icon: Scale,
    title: "10. Luật Áp Dụng & Giải Quyết Tranh Chấp",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          Điều khoản này được điều chỉnh bởi pháp luật nước Cộng hoà Xã hội Chủ
          nghĩa Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết theo trình
          tự:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Thương lượng trực tiếp giữa hai bên trong vòng 30 ngày.",
            "Hoà giải qua email hỗ trợ nếu thương lượng không thành.",
            "Khởi kiện tại Toà án nhân dân có thẩm quyền tại Việt Nam nếu hoà giải thất bại.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <Callout icon={Scale}>
          BizFlow không chịu trách nhiệm về thiệt hại gián tiếp, mất doanh thu
          hoặc mất dữ liệu do lỗi của bên thứ ba (Firebase, nhà cung cấp đám
          mây, mất điện…) nằm ngoài tầm kiểm soát của chúng tôi.
        </Callout>
        <Callout icon={CloudOff}>
          <strong>Điều khoản bất khả kháng (Force Majeure):</strong> BizFlow
          không chịu trách nhiệm nếu dịch vụ bị gián đoạn do các sự kiện
          nằm ngoài khả năng kiểm soát hợp lý, bao gồm nhưng không giới hạn
          ở: thiên tai, dịch bệnh, đứt cáp quang biển, sự cố hạ tầng internet
          quốc gia, hoặc các quyết định của cơ quan nhà nước.
        </Callout>
      </>
    ),
  },
  {
    id: "contact",
    icon: Mail,
    title: "11. Liên Hệ",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          Mọi câu hỏi hoặc yêu cầu liên quan đến Điều Khoản Dịch Vụ, vui lòng
          liên hệ:
        </p>
        <div
          className="mt-4 rounded-2xl p-5 space-y-3 text-sm"
          style={{ background: `${TEAL}0d`, border: `1px solid ${TEAL}30` }}
        >
          {[
            { label: "Tên tổ chức", value: "BizFlow" },
            {
              label: "Email hỗ trợ",
              value: (
                <a
                  href="mailto:support@bizflow.local"
                  className="font-semibold underline transition-opacity hover:opacity-70"
                  style={{ color: TEAL }}
                >
                  support@bizflow.local
                </a>
              ),
            },
            {
              label: "Thời gian phản hồi",
              value: "Trong vòng 3–5 ngày làm việc",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-start gap-2">
              <span
                className="rounded-full shrink-0"
                style={{
                  background: TEAL,
                  width: "6px",
                  height: "6px",
                  marginTop: "6px",
                }}
              />
              <p className="text-slate-700">
                <span className="font-semibold text-slate-800">{label}:</span>{" "}
                {value}
              </p>
            </div>
          ))}
        </div>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <>
      <PublicHeader />
      <main className="min-h-screen" style={{ background: "#f8fffe" }}>
        {/* ── Hero ── */}
        <div
          className="relative overflow-hidden py-20 text-white"
          style={{
            background: `linear-gradient(135deg, #0e8a88 0%, ${TEAL} 50%, #3dd6d3 100%)`,
          }}
        >
          <div
            className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full opacity-20"
            style={{ background: "white" }}
          />
          <div
            className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full opacity-10"
            style={{ background: "white" }}
          />

          <div className="relative mx-auto max-w-3xl px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-6 shadow-lg">
              <Scale className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold italic tracking-wide sm:text-[2.6rem] drop-shadow">
              Điều Khoản Dịch Vụ
            </h1>
            <p className="mt-4 text-white/85 text-base sm:text-lg max-w-xl mx-auto leading-[1.8] font-normal not-italic">
              Vui lòng đọc kỹ các điều khoản này trước khi sử dụng nền tảng
              BizFlow. Chúng quy định quyền và nghĩa vụ của cả hai bên.
            </p>
            <span className="mt-5 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur">
              Cập nhật lần cuối: 19 tháng 4 năm 2026
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="mx-auto max-w-5xl px-4 py-14 lg:grid lg:grid-cols-[240px_1fr] lg:gap-12 lg:items-start">
          {/* Sticky TOC */}
          <aside className="hidden lg:block sticky top-24">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 px-3">
              Nội dung
            </p>
            <nav className="space-y-0.5">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-slate-500 transition-all hover:bg-white hover:shadow-sm"
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${TEAL}18` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: TEAL }} />
                    </span>
                    <span className="leading-tight text-[13px] tracking-wide group-hover:text-slate-800">
                      {s.title}
                    </span>
                  </a>
                );
              })}
            </nav>
          </aside>

          {/* Section cards */}
          <div className="space-y-6">
            {sections.map((s, idx) => {
              const Icon = s.icon;
              return (
                <section
                  key={s.id}
                  id={s.id}
                  className="scroll-mt-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm"
                      style={{ background: `${TEAL}18` }}
                    >
                      <Icon className="h-5 w-5" style={{ color: TEAL }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: TEAL }}
                      >
                        Điều {idx + 1}
                      </p>
                      <h2 className="text-lg font-bold italic text-slate-800 leading-snug">
                        {s.title.replace(/^\d+\.\s*/, "")}
                      </h2>
                    </div>
                  </div>

                  <div
                    className="mb-5 h-px w-full rounded"
                    style={{ background: `${TEAL}20` }}
                  />

                  <div className="text-[15px] leading-[1.85] text-slate-700">
                    {s.content}
                  </div>
                </section>
              );
            })}

            <div
              className="flex items-center justify-center gap-2 rounded-xl py-4 px-5 text-xs"
              style={{ background: `${TEAL}0d`, color: "#0e8a88" }}
            >
              <Scale className="h-3.5 w-3.5 shrink-0" />
              <p>
                Điều khoản này có thể được cập nhật định kỳ. Mọi thay đổi sẽ
                được thông báo trên ứng dụng hoặc qua email trước khi có hiệu
                lực.
              </p>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
