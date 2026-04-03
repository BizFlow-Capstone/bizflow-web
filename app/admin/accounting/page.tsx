import { Metadata } from "next";
import AdminAccountingClient from "./AdminAccountingClient";

export const metadata: Metadata = {
  title: "Quản Lý Kế Toán | BizFlow Admin",
  description:
    "Không gian quản trị accounting cho admin: quản lý template version theo luồng clone draft, mappings, row definitions, formulas, entities và các công cụ compare/trace/reference/schema.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  openGraph: {
    title: "Quản Lý Kế Toán | BizFlow Admin",
    description:
      "Khu vực admin accounting với lifecycle template theo draft và bộ công cụ hỗ trợ kiểm thử logic.",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Quản Lý Kế Toán | BizFlow Admin",
    description:
      "Admin accounting workspace: template versions, mappings, rows, formulas, entities và support tools.",
  },
};

export default function AdminAccountingPage() {
  return <AdminAccountingClient />;
}
