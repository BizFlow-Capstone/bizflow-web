import { Metadata } from "next";
import AdminSubscriptionsClient from "./AdminSubscriptionsClient";

export const metadata: Metadata = {
  title: "Gói Đăng Ký | BizFlow Admin",
  description: "Quản lý các gói đăng ký và pricing trên BizFlow.",
};

export default function AdminSubscriptionsPage() {
  return <AdminSubscriptionsClient />;
}
