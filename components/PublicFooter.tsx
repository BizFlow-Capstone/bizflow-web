import Link from "next/link";
import Image from "next/image";
import { Shield, Scale } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src="/pictures/logo.png"
                alt="BizFlow"
                width={64}
                height={64}
              />
              <span className="text-lg font-semibold text-slate-900">
                BizFlow
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Giải pháp quản lý hộ kinh doanh chuẩn luật: bán hàng, kho, công
              nợ, doanh thu/chi phí và hỗ trợ kê khai thuế.
            </p>
            <p className="mt-4 text-sm text-slate-600">
              Email:{" "}
              <a
                className="font-medium text-slate-800 hover:text-[#052659]"
                href="mailto:support@bizflow.local"
              >
                support@bizflow.local
              </a>
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Sản phẩm</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  className="text-slate-600 hover:text-[#052659]"
                  href="#features"
                >
                  Tính năng
                </a>
              </li>
              <li>
                <a
                  className="text-slate-600 hover:text-[#052659]"
                  href="#pricing"
                >
                  Bảng giá
                </a>
              </li>
              <li>
                <a className="text-slate-600 hover:text-[#052659]" href="#why">
                  Vì sao BizFlow
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Tài khoản</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link
                  className="text-slate-600 hover:text-[#052659]"
                  href="/auth/login"
                >
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-600 hover:text-[#052659]"
                  href="/auth/register"
                >
                  Đăng ký
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-900">Liên hệ</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  className="text-slate-600 hover:text-[#052659]"
                  href="#contact"
                >
                  Tư vấn triển khai
                </a>
              </li>
              <li className="text-slate-600">Thời gian: 8:30 - 18:00</li>
              <li className="text-slate-600">Hỗ trợ: 7 ngày/tuần</li>
              <li>
                <Link
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-[#052659]"
                  href="/policy/sms-authentication"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Chính sách SMS
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex items-center gap-1 text-slate-600 hover:text-[#052659]"
                  href="/policy/terms-of-service"
                >
                  <Scale className="h-3.5 w-3.5" />
                  Điều khoản dịch vụ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-8 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <p className="text-sm text-slate-600">
            Copyright ©2026 BizFlow. All Rights Reserved
          </p>
          <Link
            href="/policy/sms-authentication"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#052659] transition-colors"
          >
            <Shield className="h-3 w-3" />
            Chính Sách Xác Thực SMS
          </Link>
          <Link
            href="/policy/terms-of-service"
            className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#052659] transition-colors"
          >
            <Scale className="h-3 w-3" />
            Điều Khoản Dịch Vụ
          </Link>
        </div>
      </div>
    </footer>
  );
}
