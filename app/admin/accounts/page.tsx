import { Metadata } from "next";
import AdminAccountsClient from "./AdminAccountsClient";

export const metadata: Metadata = {
  title: "Quản Lý Người Dùng | BizFlow Admin",
  description: "Quản lý tài khoản người dùng trên nền tảng BizFlow.",
};

export default function AdminAccountsPage() {
  return <AdminAccountsClient />;
}
