import { Metadata } from "next";
import ImportFormClient from "./ImportFormClient";

export const metadata: Metadata = {
  title: "Tạo Phiếu Nhập Kho | BizFlow",
  description: "Tạo phiếu nhập kho mới cho hệ thống quản lý.",
};

export default function CreateImportPage() {
  return <ImportFormClient />;
}
