import { Metadata } from "next";
import AdminSystemClient from "./AdminSystemClient";

export const metadata: Metadata = {
  title: "Cấu Hình Hệ Thống | BizFlow Admin",
  description: "Cấu hình hệ thống, loại hình kinh doanh và thuế suất.",
};

export default function AdminSystemPage() {
  return <AdminSystemClient />;
}
