import type { Metadata } from "next";
import SubscriptionClient from "./SubscriptionClient";

export const metadata: Metadata = {
  title: "Nâng cấp tài khoản | BizFlow",
};

export default function SubscriptionPage() {
  return <SubscriptionClient />;
}
