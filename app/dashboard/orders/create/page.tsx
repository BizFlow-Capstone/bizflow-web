import { Metadata } from "next";
import CreateOrderClient from "./CreateOrderClient";

export const metadata: Metadata = {
  title: "Tạo Đơn Hàng | BizFlow",
  description: "Tạo đơn hàng mới cho cửa hàng.",
};

export default function CreateOrderPage() {
  return <CreateOrderClient />;
}
