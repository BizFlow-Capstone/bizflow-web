import { Metadata } from "next";
import ImportsClient from "./ImportsClient";

export const metadata: Metadata = {
  title: "Quản lý Nhập Kho | BizFlow",
  description:
    "Quản lý phiếu nhập kho, theo dõi trạng thái và lịch sử nhập hàng.",
  openGraph: {
    title: "Quản lý Nhập Kho | BizFlow",
    description: "Quản lý phiếu nhập kho, theo dõi trạng thái nhập hàng.",
  },
};

export default function ImportsPage() {
  return <ImportsClient />;
}
