import { Metadata } from "next";
import AdminAnalyticsClient from "./AdminAnalyticsClient";

export const metadata: Metadata = {
  title: "Phân Tích Platform | BizFlow Admin",
  description: "Phân tích dữ liệu và thống kê toàn nền tảng BizFlow.",
};

export default function AdminAnalyticsPage() {
  return <AdminAnalyticsClient />;
}
