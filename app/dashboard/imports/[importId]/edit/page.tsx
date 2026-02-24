import { Metadata } from "next";
import EditImportClient from "./EditImportClient";

export const metadata: Metadata = {
  title: "Chỉnh sửa Phiếu Nhập Kho | BizFlow",
  description: "Chỉnh sửa phiếu nhập kho nháp.",
};

export default function EditImportPage() {
  return <EditImportClient />;
}
