import type { Metadata } from "next";
import AdminAccountingClient from "@/app/admin/accounting/AdminAccountingClient";

export const metadata: Metadata = {
  title: "Quản Lý Mẫu Sổ | BizFlow Accountant",
  description:
    "Không gian quản lý template và mẫu sổ dành cho accountant BizFlow.",
};

export default function ConsultantAccountingPage() {
  return <AdminAccountingClient mode="consultant" />;
}
