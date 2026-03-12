import { Metadata } from "next";
import OrdersClient from "./OrdersClient";

export const metadata: Metadata = {
  title: "Quản lý Đơn Hàng | BizFlow",
  description: "Quản lý đơn hàng bán hàng, theo dõi trạng thái và thanh toán.",
};

export default function OrdersPage() {
  return <OrdersClient />;
}
