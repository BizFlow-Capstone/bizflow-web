import type { Metadata } from "next";
import EditOrderClient from "./EditOrderClient";

export const metadata: Metadata = {
  title: "Chỉnh sửa đơn hàng | BizFlow",
};

export default function EditOrderPage() {
  return <EditOrderClient />;
}
