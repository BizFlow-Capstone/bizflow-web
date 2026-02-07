import { Metadata } from "next";
import ProductDetailClient from "./ProductDetailClient";

export const metadata: Metadata = {
  title: "Chi tiết Sản phẩm | BizFlow",
  description: "Xem thông tin chi tiết sản phẩm và bảng giá bán.",
};

/**
 * Product Detail - Server Component
 * Only handles metadata; data fetching via TanStack Query in Client Component
 */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id, productId } = await params;

  return <ProductDetailClient locationId={id} productId={productId} />;
}
