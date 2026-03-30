import { Metadata } from "next";
import AdminNotificationsClient from "./AdminNotificationsClient";

export const metadata: Metadata = {
  title: "Quản Lý Thông Báo | BizFlow Admin",
  description:
    "Quản lý mẫu thông báo, tạo chiến dịch và theo dõi nhật ký gửi.",
};

export default function AdminNotificationsPage() {
  return <AdminNotificationsClient />;
}
