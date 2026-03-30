import { Metadata } from "next";
import AdminOverviewClient from "./AdminOverviewClient";

export const metadata: Metadata = {
  title: "Tổng Quan Admin | BizFlow",
  description: "Bảng điều khiển tổng quan cho quản trị viên BizFlow.",
};

export default function AdminOverviewPage() {
  return <AdminOverviewClient />;
}
