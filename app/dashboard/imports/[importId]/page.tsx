import { Metadata } from "next";
import ImportDetailClient from "./ImportDetailClient";

export const metadata: Metadata = {
  title: "Chi tiết Phiếu Nhập Kho | BizFlow",
  description: "Xem chi tiết phiếu nhập kho.",
};

export default function ImportDetailPage() {
  return <ImportDetailClient />;
}
