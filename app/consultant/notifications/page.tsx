import type { Metadata } from "next";
import AdminNotificationsClient from "@/app/admin/notifications/AdminNotificationsClient";

export const metadata: Metadata = {
  title: "Quản Lý Thông Báo | BizFlow Accountant",
  description: "Không gian quản lý thông báo dành cho accountant BizFlow.",
};

export default function ConsultantNotificationsPage() {
  return <AdminNotificationsClient mode="consultant" />;
}
