import PublicHeader from "@/components/PublicHeader";
import PublicFooter from "@/components/PublicFooter";
import {
  Shield,
  Phone,
  Lock,
  Share2,
  Database,
  Trash2,
  UserCheck,
  Mail,
  CheckCircle2,
  Globe,
} from "lucide-react";

export const metadata = {
  title: "Chính Sách Xác Thực SMS – BizFlow",
  description:
    "Chính sách bảo mật và quyền riêng tư liên quan đến xác thực số điện thoại qua SMS OTP của BizFlow.",
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

const sections = [
  {
    id: "introduction",
    icon: Phone,
    title: "1. Giới Thiệu",
    content: (
      <>
        <p className="text-slate-600 leading-relaxed">
          BizFlow là nền tảng quản lý hộ kinh doanh giúp số hoá hoạt động bán
          hàng, kho bãi, công nợ và kế toán. Để bảo vệ tài khoản của bạn, ứng
          dụng sử dụng xác thực số điện thoại thông qua{" "}
          <strong className="text-slate-800">mã OTP (One-Time Password)</strong>{" "}
          được gửi bằng tin nhắn SMS.
        </p>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Chính sách này giải thích rõ cách chúng tôi thu thập, sử dụng và bảo
          vệ thông tin số điện thoại của bạn trong quá trình xác thực.
        </p>
        <p className="mt-3 text-slate-600 leading-relaxed">
          Chính sách này được xây dựng phù hợp với quy định của pháp luật Việt
          Nam về bảo vệ dữ liệu cá nhân, bao gồm{" "}
          <strong className="text-slate-800">
            Nghị định 13/2023/NĐ-CP về Bảo vệ dữ liệu cá nhân
          </strong>
          .
        </p>
      </>
    ),
  },
  {
    id: "collection",
    icon: Database,
    title: "2. Dữ Liệu Cá Nhân Được Xử Lý",
    content: (
      <>
        <p className="text-slate-600">
          Khi bạn sử dụng tính năng xác thực SMS, chúng tôi có thể thu thập:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Số điện thoại bạn cung cấp để nhận mã OTP.",
            "Thông tin nhà mạng (Telco) liên kết với số điện thoại, nhằm tối ưu hoá quá trình gửi tin nhắn OTP.",
            "Địa chỉ IP và thông tin thiết bị (do Firebase Authentication tự động ghi nhận nhằm phát hiện hành vi bất thường).",
            "Thời gian và số lần yêu cầu gửi OTP.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <div
          className="mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
          style={{ background: `${TEAL}14`, borderLeft: `3px solid ${TEAL}` }}
        >
          <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} />
          <p className="text-slate-700">
            Chúng tôi <strong>không</strong> thu thập hoặc lưu trữ nội dung mã
            OTP sau khi quá trình xác thực hoàn tất.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "usage",
    icon: Shield,
    title: "3. Mục Đích Sử Dụng Thông Tin",
    content: (
      <>
        <p className="text-slate-600">
          Số điện thoại của bạn chỉ được dùng cho các mục đích sau:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Xác thực danh tính khi đăng nhập hoặc đăng ký tài khoản.",
            "Bảo mật tài khoản và ngăn chặn truy cập trái phép.",
            "Phát hiện và ngăn chặn spam, lạm dụng dịch vụ.",
            "Khôi phục quyền truy cập tài khoản khi cần thiết.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <p className="mt-4 text-slate-600">
          Chúng tôi <strong className="text-slate-800">không</strong> sử dụng số
          điện thoại của bạn cho mục đích marketing, quảng cáo hoặc chia sẻ với
          bên thứ ba vì mục đích thương mại.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    icon: Share2,
    title: "4. Chia Sẻ Dữ Liệu",
    content: (
      <>
        <p className="text-slate-600">
          Để thực hiện xác thực OTP qua SMS, dữ liệu số điện thoại của bạn được
          xử lý bởi:
        </p>
        <div
          className="mt-4 rounded-2xl p-5"
          style={{ background: `${TEAL}10`, border: `1px solid ${TEAL}40` }}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-2 w-2 rounded-full"
              style={{ background: TEAL }}
            />
            <p className="font-semibold text-slate-800">
              Google Firebase Authentication
            </p>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Firebase Authentication (thuộc Google LLC) là bên thứ ba duy nhất
            nhận thông tin số điện thoại nhằm gửi mã OTP. Dữ liệu được xử lý
            theo{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline transition-opacity hover:opacity-70"
              style={{ color: TEAL }}
            >
              Chính Sách Quyền Riêng Tư của Google
            </a>
            .
          </p>
        </div>
        <div
          className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: `${TEAL}14`, borderLeft: `3px solid ${TEAL}` }}
        >
          <Globe className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} />
          <p className="text-slate-700 leading-relaxed">
            <strong>Chuyển dữ liệu ra nước ngoài:</strong> Bạn đồng ý rằng dữ
            liệu số điện thoại có thể được xử lý trên hạ tầng điện toán đám mây
            của Google đặt tại các trung tâm dữ liệu ngoài lãnh thổ Việt Nam
            (Singapore, Hoa Kỳ…) để phục vụ mục đích xác thực, phù hợp với quy
            định tại Nghị định 13/2023/NĐ-CP.
          </p>
        </div>
        <p className="mt-4 text-slate-600">
          Ngoài Firebase, chúng tôi{" "}
          <strong className="text-slate-800">không</strong> chia sẻ số điện
          thoại của bạn với bất kỳ tổ chức hay cá nhân nào khác, trừ trường hợp
          được pháp luật yêu cầu.
        </p>
      </>
    ),
  },
  {
    id: "security",
    icon: Lock,
    title: "5. Bảo Mật Dữ Liệu",
    content: (
      <>
        <p className="text-slate-600">
          Chúng tôi áp dụng các biện pháp sau để bảo vệ thông tin của bạn:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Mã OTP có thời hạn ngắn (thường 60–120 giây) và chỉ sử dụng được một lần.",
            "Không lưu trữ mã OTP trong hệ thống sau khi xác thực hoàn tất.",
            "Truyền dữ liệu qua kết nối mã hoá HTTPS/TLS.",
            "Hạn chế số lần gửi lại OTP để chống tấn công brute-force.",
            "Sử dụng hạ tầng bảo mật cấp doanh nghiệp của Firebase / Google Cloud.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <div
          className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: `${TEAL}14`, borderLeft: `3px solid ${TEAL}` }}
        >
          <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} />
          <p className="text-slate-700 leading-relaxed">
            Chúng tôi không can thiệp vào quy trình gửi mã của Firebase và không
            có quyền truy cập vào các khoá bảo mật riêng tư của tài khoản Google
            của bạn.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "retention",
    icon: Trash2,
    title: "6. Lưu Trữ & Xoá Dữ Liệu",
    content: (
      <>
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: `${TEAL}18` }}>
                <th className="px-5 py-3 text-left font-semibold text-slate-700">
                  Loại dữ liệu
                </th>
                <th className="px-5 py-3 text-left font-semibold text-slate-700">
                  Thời gian lưu trữ
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                [
                  "Số điện thoại (gắn với tài khoản)",
                  "Đến khi bạn xoá tài khoản",
                ],
                ["Mã OTP", "Không lưu (huỷ ngay sau xác thực)"],
                [
                  "Log yêu cầu OTP (IP, thời gian)",
                  "Tối đa 90 ngày (phục vụ truy vết bảo mật)",
                ],
                [
                  "Tài khoản không hoạt động",
                  "Dữ liệu số điện thoại được xoá sau 12 tháng không đăng nhập",
                ],
              ].map(([type, period]) => (
                <tr
                  key={type}
                  className="bg-white hover:bg-slate-50 transition-colors"
                >
                  <td className="px-5 py-3.5 text-slate-700 font-medium">
                    {type}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{period}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-slate-600">
          Bạn có thể yêu cầu xoá số điện thoại khỏi hệ thống bằng cách xoá tài
          khoản hoặc liên hệ với chúng tôi qua email hỗ trợ bên dưới.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    icon: UserCheck,
    title: "7. Quyền Của Bạn",
    content: (
      <>
        <p className="text-slate-600">
          Với tư cách là người dùng, bạn có các quyền sau:
        </p>
        <ul className="mt-4 space-y-2 list-none">
          {[
            "Truy cập và xem thông tin số điện thoại đang liên kết với tài khoản.",
            "Yêu cầu chỉnh sửa số điện thoại trong phần cài đặt tài khoản.",
            "Yêu cầu xoá toàn bộ dữ liệu cá nhân bằng cách xoá tài khoản.",
            "Rút lại sự đồng ý cho phép xử lý dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.",
            "Yêu cầu hạn chế xử lý dữ liệu số điện thoại của bạn.",
            "Liên hệ chúng tôi để được hỗ trợ các vấn đề liên quan đến dữ liệu.",
          ].map((item) => (
            <BulletItem key={item} text={item} />
          ))}
        </ul>
        <div
          className="mt-4 flex items-start gap-3 rounded-xl px-4 py-3 text-sm"
          style={{ background: `${TEAL}14`, borderLeft: `3px solid ${TEAL}` }}
        >
          <Shield className="mt-0.5 h-4 w-4 shrink-0" style={{ color: TEAL }} />
          <p className="text-slate-700 leading-relaxed">
            <strong>Lưu ý:</strong> Việc rút lại sự đồng ý sử dụng số điện thoại
            để gửi OTP đồng nghĩa với việc bạn sẽ không thể sử dụng các tính
            năng yêu cầu xác thực bảo mật trên hệ thống BizFlow.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "contact",
    icon: Mail,
    title: "8. Liên Hệ",
    content: (
      <>
        <p className="text-slate-600">
          Nếu bạn có bất kỳ câu hỏi hoặc yêu cầu nào liên quan đến chính sách
          này, vui lòng liên hệ:
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
                className="mt-0.5 h-1.5 w-1.5 rounded-full shrink-0"
                style={{ background: TEAL, marginTop: "6px" }}
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

export default function SmsAuthPolicyPage() {
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
          {/* decorative circles */}
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
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold italic tracking-wide sm:text-[2.6rem] drop-shadow">
              Chính Sách Xác Thực SMS
            </h1>
            <p className="mt-4 text-white/85 text-base sm:text-lg max-w-xl mx-auto leading-[1.8] font-normal not-italic">
              Cam kết minh bạch về cách BizFlow sử dụng số điện thoại của bạn
              trong quá trình xác thực OTP qua Firebase Authentication.
            </p>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="mx-auto max-w-7xl px-4 py-14 lg:grid lg:grid-cols-[240px_1fr] lg:gap-12 lg:items-start">
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
                    style={{ ["--hover-color" as string]: TEAL }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:text-white"
                      style={{
                        background: `${TEAL}18`,
                      }}
                    >
                      <Icon
                        className="h-3.5 w-3.5 transition-colors"
                        style={{ color: TEAL }}
                      />
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
                  {/* card header */}
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
                        Mục {idx + 1}
                      </p>
                      <h2 className="text-lg font-bold italic text-slate-800 leading-snug">
                        {s.title.replace(/^\d+\.\s*/, "")}
                      </h2>
                    </div>
                  </div>

                  {/* divider */}
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

            {/* bottom note */}
            <div
              className="flex items-center justify-center gap-2 rounded-xl py-4 px-5 text-xs"
              style={{ background: `${TEAL}0d`, color: "#0e8a88" }}
            >
              <Shield className="h-3.5 w-3.5 shrink-0" />
              <p>
                Chính sách này có thể được cập nhật định kỳ. Mọi thay đổi sẽ
                được thông báo trên ứng dụng hoặc qua email.
              </p>
            </div>
          </div>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}
