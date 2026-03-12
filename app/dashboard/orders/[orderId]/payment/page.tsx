import type { Metadata } from "next";
import PaymentClient from "./PaymentClient";

export const metadata: Metadata = {
  title: "Thanh toán đơn hàng | BizFlow",
};

export default function PaymentPage() {
  return <PaymentClient />;
}
