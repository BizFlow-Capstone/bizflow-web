import { Metadata } from "next";
import OrderDetailClient from "./OrderDetailClient";

export const metadata: Metadata = {
  title: "Chi tiết Đơn Hàng | BizFlow",
  description: "Xem chi tiết đơn hàng.",
};

export default function OrderDetailPage() {
  return <OrderDetailClient />;
}
